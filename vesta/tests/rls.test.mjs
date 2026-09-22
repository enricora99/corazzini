/**
 * Il test che presidia la promessa più importante di VESTA:
 * i tuoi capi li vedi tu, e li vedono i tuoi amici. Nessun altro.
 *
 *   npm test
 *
 * Non è un test di interfaccia: parla direttamente col database, con due
 * utenti veri e due sessioni vere. Se qualcuno allenta una policy, o toglie
 * `are_friends()` dalla condizione, questo test diventa rosso.
 *
 * Serve un progetto Supabase con la migration applicata e le chiavi in
 * .env.local. Senza, il test si salta dicendolo a voce alta: non vogliamo un
 * verde che non significa niente.
 */

import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { after, before, describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

// --- Ambiente ---------------------------------------------------------------

const radice = join(dirname(fileURLToPath(import.meta.url)), "..");

/** .env.local, letto a mano: niente dotenv, niente dipendenze in più. */
function caricaEnv() {
  try {
    const testo = readFileSync(join(radice, ".env.local"), "utf8");
    for (const riga of testo.split("\n")) {
      const trovato = riga.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!trovato) continue;
      const [, chiave, valore] = trovato;
      if (!process.env[chiave]) {
        process.env[chiave] = valore.replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // Nessun .env.local: le variabili possono arrivare dall'ambiente.
  }
}

caricaEnv();

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

const configurato = Boolean(URL && ANON && SERVICE);

if (!configurato) {
  console.warn(
    [
      "",
      "  ┌──────────────────────────────────────────────────────────────┐",
      "  │  TEST SUI PERMESSI NON ESEGUITO                              │",
      "  │                                                              │",
      "  │  Mancano le chiavi di Supabase in .env.local.                │",
      "  │  Questo non vuol dire che i permessi funzionano: vuol dire   │",
      "  │  che non li abbiamo verificati.                              │",
      "  └──────────────────────────────────────────────────────────────┘",
      "",
    ].join("\n")
  );
}

// --- Utenti di prova --------------------------------------------------------

const admin = configurato
  ? createClient(URL, SERVICE, { auth: { persistSession: false } })
  : null;

const marca = Date.now();
const UTENTI = {
  alice: { email: `test-alice-${marca}@vesta.test`, password: `Aa1!${marca}alice` },
  bruno: { email: `test-bruno-${marca}@vesta.test`, password: `Bb1!${marca}bruno` },
  carla: { email: `test-carla-${marca}@vesta.test`, password: `Cc1!${marca}carla` },
};

const ids = {};
const sessioni = {};
let capoDiAlice;

async function creaUtente(nome) {
  const { data, error } = await admin.auth.admin.createUser({
    email: UTENTI[nome].email,
    password: UTENTI[nome].password,
    email_confirm: true,
  });
  assert.equal(error, null, `creazione di ${nome}: ${error?.message}`);
  ids[nome] = data.user.id;

  const client = createClient(URL, ANON, { auth: { persistSession: false } });
  const { error: erroreAccesso } = await client.auth.signInWithPassword({
    email: UTENTI[nome].email,
    password: UTENTI[nome].password,
  });
  assert.equal(erroreAccesso, null, `accesso di ${nome}: ${erroreAccesso?.message}`);
  sessioni[nome] = client;
}

describe("Row Level Security sui capi", { skip: !configurato }, () => {
  before(async () => {
    await creaUtente("alice");
    await creaUtente("bruno");
    await creaUtente("carla");

    // Un capo di Alice, scritto dalla sua sessione: se la policy di
    // inserimento fosse sbagliata, fallirebbe già qui.
    const { data, error } = await sessioni.alice
      .from("items")
      .insert({
        user_id: ids.alice,
        photo_path: `${ids.alice}/prova.webp`,
        category: "top",
        colors: ["blu"],
        seasons: ["estate"],
      })
      .select("id")
      .single();

    assert.equal(error, null, `inserimento del capo: ${error?.message}`);
    capoDiAlice = data.id;
  });

  after(async () => {
    if (!admin) return;
    for (const nome of Object.keys(ids)) {
      await admin.auth.admin.deleteUser(ids[nome]).catch(() => {});
    }
  });

  it("chi non è amico NON vede i capi altrui", async () => {
    const { data, error } = await sessioni.bruno
      .from("items")
      .select("id")
      .eq("id", capoDiAlice);

    // La RLS non solleva un errore: filtra. Il risultato corretto è una
    // lista vuota, e va controllato proprio così — un `error` nullo da solo
    // non dimostra niente.
    assert.equal(error, null, `query di Bruno: ${error?.message}`);
    assert.deepEqual(data, [], "Bruno è riuscito a leggere un capo di Alice");
  });

  it("chi non è amico non vede nemmeno chiedendo tutto l'armadio", async () => {
    const { data } = await sessioni.bruno.from("items").select("id, user_id");
    const trapelati = (data ?? []).filter((r) => r.user_id !== ids.bruno);
    assert.deepEqual(trapelati, [], "sono trapelati capi di altri utenti");
  });

  it("il proprietario vede i propri capi", async () => {
    const { data, error } = await sessioni.alice
      .from("items")
      .select("id")
      .eq("id", capoDiAlice);

    assert.equal(error, null);
    assert.equal(data.length, 1, "Alice non vede il proprio capo");
  });

  it("un amico accettato vede i capi, ma non può modificarli", async () => {
    // Alice invita, Bruno accetta attraverso la funzione del database.
    const { data: invito, error: erroreInvito } = await sessioni.alice
      .from("friendships")
      .insert({ requester_id: ids.alice, status: "pending" })
      .select("invite_token")
      .single();
    assert.equal(erroreInvito, null, `invito: ${erroreInvito?.message}`);

    const { error: erroreAccetta } = await sessioni.bruno.rpc(
      "accept_friend_invite",
      { token: invito.invite_token }
    );
    assert.equal(erroreAccetta, null, `accettazione: ${erroreAccetta?.message}`);

    const { data: visti } = await sessioni.bruno
      .from("items")
      .select("id")
      .eq("id", capoDiAlice);
    assert.equal(visti.length, 1, "l'amico non vede i capi di Alice");

    // In sola lettura: le policy di scrittura non citano are_friends().
    const { data: modificati } = await sessioni.bruno
      .from("items")
      .update({ notes: "modificato da un amico" })
      .eq("id", capoDiAlice)
      .select("id");
    assert.deepEqual(
      modificati ?? [],
      [],
      "un amico è riuscito a MODIFICARE un capo altrui"
    );

    const { data: cancellati } = await sessioni.bruno
      .from("items")
      .delete()
      .eq("id", capoDiAlice)
      .select("id");
    assert.deepEqual(
      cancellati ?? [],
      [],
      "un amico è riuscito a CANCELLARE un capo altrui"
    );
  });

  it("l'amicizia non è transitiva", async () => {
    // Bruno è amico di Alice. Carla è amica di Bruno. Carla NON deve vedere
    // i capi di Alice: è l'errore classico di una policy scritta male.
    const { data: invito } = await sessioni.bruno
      .from("friendships")
      .insert({ requester_id: ids.bruno, status: "pending" })
      .select("invite_token")
      .single();

    await sessioni.carla.rpc("accept_friend_invite", {
      token: invito.invite_token,
    });

    const { data } = await sessioni.carla
      .from("items")
      .select("id")
      .eq("id", capoDiAlice);

    assert.deepEqual(
      data ?? [],
      [],
      "Carla vede i capi di Alice passando per Bruno: l'amicizia si sta propagando"
    );
  });

  it("dopo aver sciolto l'amicizia i capi tornano invisibili", async () => {
    const { data: amicizia } = await sessioni.bruno
      .from("friendships")
      .select("id")
      .eq("status", "accepted")
      .or(`requester_id.eq.${ids.alice},addressee_id.eq.${ids.alice}`)
      .limit(1)
      .maybeSingle();

    assert.ok(amicizia, "amicizia fra Alice e Bruno non trovata");

    await sessioni.bruno.from("friendships").delete().eq("id", amicizia.id);

    const { data } = await sessioni.bruno
      .from("items")
      .select("id")
      .eq("id", capoDiAlice);

    assert.deepEqual(
      data ?? [],
      [],
      "Bruno continua a vedere i capi dopo aver sciolto l'amicizia"
    );
  });

  it("nessuno può leggere la lista d'attesa", async () => {
    const { data } = await sessioni.alice.from("waitlist").select("email");
    assert.deepEqual(
      data ?? [],
      [],
      "la lista d'attesa è leggibile da un utente qualsiasi"
    );
  });

  it("nessuno può scriversi righe nel registro dei costi", async () => {
    const { error } = await sessioni.alice.from("ai_calls").insert({
      user_id: ids.alice,
      provider: "finto",
      model: "finto",
      kind: "image",
      cost_usd: 0,
    });
    assert.notEqual(
      error,
      null,
      "un utente è riuscito a scrivere in ai_calls: i costi sono falsificabili"
    );
  });
});
