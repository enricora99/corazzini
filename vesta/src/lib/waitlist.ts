/**
 * Tipo e stato iniziale del form della lista d'attesa.
 *
 * Stanno qui e non accanto alla server action perché un file marcato
 * "use server" può esportare soltanto funzioni async: esportare da lì anche
 * un oggetto fa fallire il modulo a runtime.
 */

export type WaitlistState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: { email?: string; consent?: string };
  /**
   * Quello che l'utente aveva scritto. React azzera i campi non controllati
   * quando la server action ritorna: senza rimandarli indietro, chi sbaglia
   * qualcosa si ritrova il form vuoto e deve riscrivere tutto.
   */
  values?: { email?: string; consent?: boolean };
};

export const initialWaitlistState: WaitlistState = { status: "idle" };
