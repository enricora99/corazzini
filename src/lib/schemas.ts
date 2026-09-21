import { z } from "zod";

/** Messaggi in italiano: finiscono sotto i campi, li legge l'utente. */

export const waitlistSchema = z.object({
  email: z
    .email({ error: "Controlla l'indirizzo: manca qualcosa." })
    .trim()
    .toLowerCase()
    .max(254, { error: "Questo indirizzo è troppo lungo." }),
  consent: z.literal(true, {
    error: "Senza il tuo consenso non possiamo tenere l'email.",
  }),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;

/** Le occasioni previste dall'MVP. Le usa anche il prompt degli outfit. */
export const OCCASIONS = [
  "lavoro",
  "universita",
  "sera",
  "sport",
  "cerimonia",
] as const;

export const occasionSchema = z.enum(OCCASIONS);
export type Occasion = z.infer<typeof occasionSchema>;

export const OCCASION_LABELS: Record<Occasion, string> = {
  lavoro: "Lavoro",
  universita: "Università",
  sera: "Sera",
  sport: "Sport",
  cerimonia: "Cerimonia",
};
