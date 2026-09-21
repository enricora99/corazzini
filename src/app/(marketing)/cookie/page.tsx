import type { Metadata } from "next";

import { LegalPage } from "@/components/landing/legal-page";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cookie",
  description: "Quali cookie usa VESTA e perché non ti chiediamo il consenso.",
};

export default function CookiePage() {
  return (
    <LegalPage title="Cookie" updatedAt="21 settembre 2026">
      <section>
        <h2>La versione corta</h2>
        <p>
          Non ti mostriamo nessun banner perché non abbiamo niente da chiederti.
          VESTA non usa cookie di profilazione, non ha pubblicità e non carica
          strumenti di terze parti che ti seguono da un sito all&apos;altro.
        </p>
      </section>

      <section>
        <h2>Cosa salviamo davvero</h2>
        <ul>
          <li>
            <strong>Cookie di sessione.</strong> Quando accedi, il tuo browser
            tiene un cookie che dice che sei tu. Serve a farti restare dentro
            passando da una pagina all&apos;altra. Senza, dovresti rifare
            l&apos;accesso ogni volta. Scade quando esci o dopo un periodo di
            inattività.
          </li>
          <li>
            <strong>Nient&apos;altro.</strong> Sulla landing, dove non hai
            ancora fatto l&apos;accesso, non viene scritto nessun cookie.
          </li>
        </ul>
        <p>
          I cookie tecnici come quello di sessione non richiedono il consenso,
          perché senza di loro il servizio che hai chiesto non può funzionare.
        </p>
      </section>

      <section>
        <h2>Statistiche</h2>
        <p>
          Se un giorno vorremo sapere quante persone visitano il sito, useremo
          un sistema che non installa cookie e non costruisce un profilo di chi
          sei. Questa pagina verrà aggiornata prima che succeda.
        </p>
      </section>

      <section>
        <h2>Come cancellarli</h2>
        <p>
          Da <strong>Impostazioni</strong> puoi uscire dall&apos;account, e il
          cookie di sessione sparisce. Puoi anche cancellare i dati del sito
          dalle impostazioni del tuo browser: perderai solo l&apos;accesso, non
          i tuoi capi.
        </p>
      </section>

      <section>
        <h2>Domande</h2>
        <p>
          Scrivi a <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </section>
    </LegalPage>
  );
}
