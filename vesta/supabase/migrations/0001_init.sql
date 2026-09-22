-- ===========================================================================
-- VESTA — schema iniziale
--
-- Da eseguire nell'editor SQL di Supabase (Dashboard → SQL Editor → New query),
-- oppure con `supabase db push` se usi la CLI.
--
-- Filo conduttore: ogni tabella ha la Row Level Security attiva e ogni utente
-- vede solo i propri dati, più i capi degli amici in sola lettura. Il server
-- non si fida del client: i permessi li applica il database.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- 1. Profili
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id                  uuid primary key references auth.users (id) on delete cascade,
  email               text not null,
  display_name        text,
  -- Data in cui l'utente ha confermato di essere maggiorenne. Se è nulla,
  -- l'app lo manda al gate prima di farlo entrare.
  adult_confirmed_at  timestamptz,
  -- Ultima posizione nota, per il meteo. Volutamente approssimata a due
  -- decimali (~1 km): per sapere se piove non serve il numero civico.
  city                text,
  lat                 numeric(6, 2),
  lon                 numeric(6, 2),
  created_at          timestamptz not null default now()
);

comment on column public.profiles.lat is
  'Arrotondata a 2 decimali (~1 km): al meteo basta la zona.';


-- Alla registrazione Supabase scrive in auth.users. Questo trigger crea il
-- profilo corrispondente, così l'app non deve ricordarsi di farlo.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ---------------------------------------------------------------------------
-- 2. Amicizie
--
-- L'invito parte come riga con `addressee_id` nullo e un token nel link.
-- Chi apre il link diventa l'invitato accettando.
-- ---------------------------------------------------------------------------

create table if not exists public.friendships (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references public.profiles (id) on delete cascade,
  addressee_id  uuid references public.profiles (id) on delete cascade,
  status        text not null default 'pending'
                  check (status in ('pending', 'accepted', 'blocked')),
  invite_token  text not null unique default encode(gen_random_bytes(16), 'hex'),
  created_at    timestamptz not null default now(),
  accepted_at   timestamptz,

  -- Nessuno è amico di sé stesso.
  constraint friendship_non_riflessiva
    check (addressee_id is null or requester_id <> addressee_id)
);

-- Una coppia sola, a prescindere da chi ha invitato chi: senza questo,
-- A→B e B→A convivrebbero e l'armadio comparirebbe due volte.
create unique index if not exists friendships_coppia_unica
  on public.friendships (
    least(requester_id, addressee_id),
    greatest(requester_id, addressee_id)
  )
  where addressee_id is not null;

create index if not exists friendships_requester_idx on public.friendships (requester_id);
create index if not exists friendships_addressee_idx on public.friendships (addressee_id);


-- ---------------------------------------------------------------------------
-- 3. La funzione su cui regge tutta la visibilità tra amici
--
-- Serve `security definer`. Una policy su `items` che interrogasse
-- direttamente `friendships` scatenerebbe la policy di `friendships`, che a
-- sua volta rileggerebbe la tabella: Postgres va in ricorsione e la query
-- fallisce. Eseguendo con i privilegi del proprietario, la funzione legge
-- `friendships` senza riattivare la RLS e spezza il ciclo.
--
-- `search_path` fissato: senza, un utente potrebbe anteporre uno schema
-- suo e far eseguire alla funzione tabelle diverse da queste.
-- ---------------------------------------------------------------------------

create or replace function public.are_friends(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.friendships f
    where f.status = 'accepted'
      and (
        (f.requester_id = a and f.addressee_id = b) or
        (f.requester_id = b and f.addressee_id = a)
      )
  );
$$;

revoke all on function public.are_friends(uuid, uuid) from public;
grant execute on function public.are_friends(uuid, uuid) to authenticated;


-- ---------------------------------------------------------------------------
-- 4. Capi
-- ---------------------------------------------------------------------------

create table if not exists public.items (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles (id) on delete cascade,
  -- Percorso nell'archivio privato, non un URL: i collegamenti si firmano
  -- al momento e scadono.
  photo_path         text not null,
  category           text not null
                       check (category in ('top', 'pantaloni', 'gonna', 'vestito',
                                           'giacca', 'scarpe', 'accessorio')),
  subcategory        text,
  colors             text[] not null default '{}',
  seasons            text[] not null default '{}',
  style              text check (style in ('casual', 'formale', 'sportivo', 'elegante')),
  -- Quanto copre, da 1 (canotta) a 5 (piumino). Serve a incrociare i capi
  -- col meteo senza chiederlo ogni volta al modello.
  warmth             smallint check (warmth between 1 and 5),
  notes              text,
  ai_classified      boolean not null default false,
  corrected_by_user  boolean not null default false,
  created_at         timestamptz not null default now()
);

create index if not exists items_user_idx on public.items (user_id, created_at desc);
create index if not exists items_user_categoria_idx on public.items (user_id, category);


-- ---------------------------------------------------------------------------
-- 5. Outfit
-- ---------------------------------------------------------------------------

create table if not exists public.outfits (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  occasion       text not null
                   check (occasion in ('lavoro', 'universita', 'sera', 'sport', 'cerimonia')),
  item_ids       uuid[] not null,
  -- { "<id capo>": "<id amico proprietario>" } per i capi in prestito.
  borrowed_from  jsonb not null default '{}'::jsonb,
  rationale      text,
  -- Fotografia del meteo al momento della proposta: se domani cambia, la
  -- spiegazione salvata resta comprensibile.
  weather        jsonb,
  image_path     text,
  saved          boolean not null default false,
  -- Il giorno per cui l'outfit è pianificato, che non è quello in cui l'hai
  -- salvato: la promessa del prodotto è decidere domenica sera cosa mettere
  -- giovedì, e senza questa colonna il calendario mostrerebbe solo quando
  -- hai premuto «salva».
  planned_for    date,
  created_at     timestamptz not null default now()
);

create index if not exists outfits_user_idx on public.outfits (user_id, created_at desc);
create index if not exists outfits_salvati_idx on public.outfits (user_id) where saved;
create index if not exists outfits_pianificati_idx
  on public.outfits (user_id, planned_for)
  where planned_for is not null;


-- ---------------------------------------------------------------------------
-- 6. Cache delle immagini generate
--
-- Tabella a sé e non una colonna su `outfits`: la stessa combinazione di capi
-- e occasione può ricorrere in proposte diverse, e va riusata anche quando
-- l'utente non salva l'outfit. Altrimenti si rigenera, e si paga due volte.
-- ---------------------------------------------------------------------------

create table if not exists public.outfit_images (
  cache_key     text primary key,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  storage_path  text not null,
  provider      text not null,
  model         text not null,
  created_at    timestamptz not null default now()
);

create index if not exists outfit_images_user_idx on public.outfit_images (user_id);


-- ---------------------------------------------------------------------------
-- 7. Registro delle chiamate ai modelli
--
-- Ci scrive solo il server. Non contiene foto né testi: soltanto quanto è
-- costata ogni chiamata, per i conti del business plan.
-- ---------------------------------------------------------------------------

create table if not exists public.ai_calls (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles (id) on delete set null,
  provider     text not null,
  model        text not null,
  kind         text not null check (kind in ('classification', 'suggestion', 'image')),
  cost_usd     numeric(10, 6) not null default 0,
  duration_ms  integer,
  tokens_in    integer,
  tokens_out   integer,
  success      boolean not null default true,
  error        text,
  created_at   timestamptz not null default now()
);

create index if not exists ai_calls_user_data_idx on public.ai_calls (user_id, created_at desc);
create index if not exists ai_calls_data_idx on public.ai_calls (created_at desc);
-- Usato dal controllo del tetto giornaliero di immagini per utente.
create index if not exists ai_calls_quota_idx
  on public.ai_calls (user_id, kind, created_at desc)
  where kind = 'image' and success;


-- ---------------------------------------------------------------------------
-- 8. Lista d'attesa
--
-- Ci scrive solo il server, tramite la server action della landing.
-- ---------------------------------------------------------------------------

create table if not exists public.waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  consent     boolean not null default false,
  consent_at  timestamptz,
  source      text,
  created_at  timestamptz not null default now()
);


-- ===========================================================================
-- Row Level Security
--
-- Attiva ovunque. Dove non c'è nessuna policy, come su `waitlist`, la tabella
-- resta inaccessibile a chiunque non sia il ruolo di servizio: è voluto.
-- ===========================================================================

alter table public.profiles      enable row level security;
alter table public.friendships   enable row level security;
alter table public.items         enable row level security;
alter table public.outfits       enable row level security;
alter table public.outfit_images enable row level security;
alter table public.ai_calls      enable row level security;
alter table public.waitlist      enable row level security;


-- --- Profili: sé stessi, più gli amici accettati --------------------------

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.are_friends((select auth.uid()), id));

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));


-- --- Capi: i propri in scrittura, quelli degli amici in sola lettura ------

drop policy if exists items_select on public.items;
create policy items_select on public.items
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.are_friends((select auth.uid()), user_id)
  );

-- Nota: le policy di scrittura NON citano are_friends. Un amico può guardare
-- il tuo armadio, non modificarlo.
drop policy if exists items_insert on public.items;
create policy items_insert on public.items
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists items_update on public.items;
create policy items_update on public.items
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists items_delete on public.items;
create policy items_delete on public.items
  for delete to authenticated
  using (user_id = (select auth.uid()));


-- --- Amicizie -------------------------------------------------------------

drop policy if exists friendships_select on public.friendships;
create policy friendships_select on public.friendships
  for select to authenticated
  using (
    requester_id = (select auth.uid())
    or addressee_id = (select auth.uid())
  );

drop policy if exists friendships_insert on public.friendships;
create policy friendships_insert on public.friendships
  for insert to authenticated
  with check (requester_id = (select auth.uid()));

-- Chi ha invitato può revocare o bloccare; l'invitato può sciogliere
-- l'amicizia. L'accettazione passa invece dalla funzione più sotto, perché
-- prima di accettare la riga non è ancora visibile a chi la deve accettare.
drop policy if exists friendships_update on public.friendships;
create policy friendships_update on public.friendships
  for update to authenticated
  using (
    requester_id = (select auth.uid())
    or addressee_id = (select auth.uid())
  );

drop policy if exists friendships_delete on public.friendships;
create policy friendships_delete on public.friendships
  for delete to authenticated
  using (
    requester_id = (select auth.uid())
    or addressee_id = (select auth.uid())
  );


-- --- Outfit e immagini in cache: solo i propri ----------------------------

drop policy if exists outfits_all on public.outfits;
create policy outfits_all on public.outfits
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists outfit_images_all on public.outfit_images;
create policy outfit_images_all on public.outfit_images
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));


-- --- Registro delle chiamate: lettura dei propri, scrittura solo dal server -

drop policy if exists ai_calls_select on public.ai_calls;
create policy ai_calls_select on public.ai_calls
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Nessuna policy di insert: ci scrive solo il ruolo di servizio, che scavalca
-- la RLS. Un client non può gonfiarsi o azzerarsi i costi.


-- ===========================================================================
-- Accettazione di un invito
--
-- `security definer` perché finché `addressee_id` è nullo la riga non passa
-- la policy di lettura dell'invitato: senza questa funzione non potrebbe
-- nemmeno trovarla per accettarla.
-- ===========================================================================

create or replace function public.accept_friend_invite(token text)
returns public.friendships
language plpgsql
security definer
set search_path = public
as $$
declare
  invito public.friendships;
  me     uuid := auth.uid();
begin
  if me is null then
    raise exception 'Devi aver effettuato l''accesso.' using errcode = '42501';
  end if;

  select * into invito
  from public.friendships f
  where f.invite_token = token
  for update;

  if not found then
    raise exception 'Invito non valido.' using errcode = 'P0002';
  end if;

  if invito.requester_id = me then
    raise exception 'Non puoi accettare il tuo stesso invito.' using errcode = '22023';
  end if;

  if invito.status = 'accepted' then
    -- Già accettato da questa stessa persona: non è un errore, è un doppio clic.
    if invito.addressee_id = me then
      return invito;
    end if;
    raise exception 'Questo invito è già stato usato.' using errcode = '22023';
  end if;

  if public.are_friends(me, invito.requester_id) then
    raise exception 'Siete già amici.' using errcode = '22023';
  end if;

  update public.friendships
     set addressee_id = me,
         status = 'accepted',
         accepted_at = now()
   where id = invito.id
  returning * into invito;

  return invito;
end;
$$;

revoke all on function public.accept_friend_invite(text) from public;
grant execute on function public.accept_friend_invite(text) to authenticated;


-- ===========================================================================
-- Archivio delle foto
--
-- Bucket privato: nessun file è raggiungibile da un URL pubblico. L'app
-- genera collegamenti firmati a scadenza dopo aver verificato chi chiede.
--
-- I file stanno in <id utente>/<id capo>.webp: la prima cartella è
-- l'identità del proprietario, ed è su quella che si regolano i permessi.
-- ===========================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'items',
  'items',
  false,
  5 * 1024 * 1024,
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;


drop policy if exists "items storage: lettura propria e degli amici" on storage.objects;
create policy "items storage: lettura propria e degli amici" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'items'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.are_friends(
           (select auth.uid()),
           ((storage.foldername(name))[1])::uuid
         )
    )
  );

drop policy if exists "items storage: scrittura solo nella propria cartella" on storage.objects;
create policy "items storage: scrittura solo nella propria cartella" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'items'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "items storage: modifica solo dei propri file" on storage.objects;
create policy "items storage: modifica solo dei propri file" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'items'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "items storage: cancellazione solo dei propri file" on storage.objects;
create policy "items storage: cancellazione solo dei propri file" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'items'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );


-- ---------------------------------------------------------------------------
-- Immagini degli outfit generate dai modelli.
--
-- Bucket separato e non una cartella dentro `items`: là dentro gli amici
-- hanno accesso in lettura, e il permesso è pensato per i capi. Un outfit
-- generato non è un capo di nessuno, quindi lo vede soltanto chi l'ha
-- chiesto.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'outfits',
  'outfits',
  false,
  8 * 1024 * 1024,
  array['image/png', 'image/webp', 'image/jpeg']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "outfits storage: solo il proprietario" on storage.objects;
create policy "outfits storage: solo il proprietario" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'outfits'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'outfits'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
