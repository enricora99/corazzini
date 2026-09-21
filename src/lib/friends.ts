import "server-only";

import { createClient } from "@/lib/supabase/server";

export type Amico = {
  friendshipId: string;
  userId: string;
  nome: string;
};

export type InvitoInSospeso = {
  friendshipId: string;
  token: string;
  creatoIl: string;
};

type ProfiloRidotto = { id: string; display_name: string | null; email: string };

type RigaAmicizia = {
  id: string;
  status: string;
  invite_token: string;
  created_at: string;
  requester: ProfiloRidotto | null;
  addressee: ProfiloRidotto | null;
};

function nomeDi(profilo: ProfiloRidotto | null): string {
  if (!profilo) return "un amico";
  return profilo.display_name?.trim() || profilo.email.split("@")[0];
}

/**
 * Amicizie accettate e inviti ancora in sospeso.
 *
 * Una query sola: la policy di lettura restituisce già soltanto le righe in
 * cui compare l'utente, quindi non serve filtrare due volte.
 */
export async function getAmicizie(userId: string): Promise<{
  amici: Amico[];
  inviti: InvitoInSospeso[];
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("friendships")
    .select(
      `id, status, invite_token, created_at,
       requester:profiles!friendships_requester_id_fkey (id, display_name, email),
       addressee:profiles!friendships_addressee_id_fkey (id, display_name, email)`
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[amici] lettura fallita:", error.message);
    return { amici: [], inviti: [] };
  }

  const righe = (data ?? []) as unknown as RigaAmicizia[];

  const amici: Amico[] = [];
  const inviti: InvitoInSospeso[] = [];

  for (const riga of righe) {
    if (riga.status === "accepted") {
      // L'altro dei due, chiunque dei due abbia invitato.
      const altro =
        riga.requester?.id === userId ? riga.addressee : riga.requester;
      if (!altro) continue;
      amici.push({
        friendshipId: riga.id,
        userId: altro.id,
        nome: nomeDi(altro),
      });
    } else if (riga.status === "pending" && riga.requester?.id === userId) {
      inviti.push({
        friendshipId: riga.id,
        token: riga.invite_token,
        creatoIl: riga.created_at,
      });
    }
  }

  return { amici, inviti };
}
