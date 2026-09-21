/**
 * Stato condiviso dai form che usano `useActionState`.
 *
 * Sta qui e non accanto alle server action perché un file "use server" può
 * esportare soltanto funzioni async: un oggetto o una costante fanno fallire
 * il modulo a runtime.
 */

export type FormState<Campi extends string = string> = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Partial<Record<Campi, string>>;
  values?: Record<string, string | boolean | undefined>;
};

export const statoIniziale: FormState = { status: "idle" };
