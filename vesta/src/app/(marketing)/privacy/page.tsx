import type { Metadata } from "next";

import { LegalPage, Todo } from "@/components/landing/legal-page";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Come VESTA tratta i tuoi dati personali.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Informativa privacy" updatedAt="21 settembre 2026">
      <section>
        <h2>Chi tratta i tuoi dati</h2>
        <p>
          Il titolare del trattamento è <Todo>[ragione sociale da inserire]</Todo>,
          con sede in <Todo>[indirizzo da inserire]</Todo>, partita IVA{" "}
          <Todo>[da inserire]</Todo>. Puoi scriverci a{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
        <p>
          <Todo>
            Se il team nomina un responsabile della protezione dei dati, i suoi
            contatti vanno qui.
          </Todo>
        </p>
      </section>

      <section>
        <h2>Quali dati raccogliamo</h2>
        <ul>
          <li>
            <strong>Lista d&apos;attesa:</strong> il tuo indirizzo email, il
            consenso che ci dai e la data in cui lo dai.
          </li>
          <li>
            <strong>Account:</strong> l&apos;email con cui accedi e la conferma
            di avere almeno 18 anni.
          </li>
          <li>
            <strong>I tuoi capi:</strong> le foto che carichi e le
            caratteristiche associate, come categoria, colori, stagione e stile.
          </li>
          <li>
            <strong>Outfit:</strong> le proposte che salvi e l&apos;occasione per
            cui le hai chieste.
          </li>
          <li>
            <strong>Posizione:</strong> se ce lo consenti dal browser, la usiamo
            per sapere che tempo fa. Ci serve la zona, non il punto esatto.
          </li>
          <li>
            <strong>Amicizie:</strong> chi hai aggiunto e chi ti ha aggiunto.
          </li>
          <li>
            <strong>Dati tecnici sulle elaborazioni:</strong> quante richieste
            fai ai modelli, quanto durano e quanto costano. Servono a noi per
            tenere i conti: non contengono le tue foto né i tuoi testi.
          </li>
        </ul>
      </section>

      <section>
        <h2>Perché li usiamo</h2>
        <ul>
          <li>
            Per farti accedere e tenere in piedi la tua sessione: senza, l&apos;app
            non funziona.
          </li>
          <li>
            Per generare gli outfit, che è il servizio che ci hai chiesto.
          </li>
          <li>
            Per avvisarti dell&apos;uscita, se sei in lista d&apos;attesa. Qui la
            base è il tuo consenso, e puoi ritirarlo quando vuoi.
          </li>
          <li>
            Per capire quanto ci costa il servizio e tenerlo sostenibile, usando
            dati aggregati.
          </li>
        </ul>
        <p>
          Le tue foto servono solo a questo. Non le usiamo per addestrare
          modelli, non le vendiamo e non le mostriamo a nessuno oltre agli amici
          che accetti tu.
        </p>
      </section>

      <section>
        <h2>Chi li tratta per noi</h2>
        <p>
          Per far funzionare VESTA ci appoggiamo a questi fornitori, che trattano
          i dati per nostro conto:
        </p>
        <ul>
          <li>
            <strong>Supabase</strong> — database, accesso e archiviazione delle
            foto. I dati stanno su server nell&apos;Unione Europea (Francoforte).
          </li>
          <li>
            <strong>Vercel</strong> — hosting dell&apos;applicazione, con
            esecuzione nella regione europea di Francoforte.
          </li>
          <li>
            <strong>Google</strong> — i modelli che riconoscono i capi e
            compongono gli outfit. Per fare il loro lavoro ricevono la foto del
            capo che carichi e l&apos;elenco delle caratteristiche dei tuoi capi.
            Questo può comportare un trasferimento di dati fuori
            dall&apos;Unione Europea.{" "}
            <Todo>
              Verificare con il fornitore la base giuridica del trasferimento e
              citarla qui.
            </Todo>
          </li>
        </ul>
        <p>
          Al modello mandiamo solo quello che gli serve: per le proposte di
          outfit inviamo le caratteristiche dei capi, non le fotografie.
        </p>
      </section>

      <section>
        <h2>Per quanto tempo li teniamo</h2>
        <ul>
          <li>
            <strong>Email in lista d&apos;attesa:</strong> fino al lancio, o
            finché non ci chiedi di cancellarla.
          </li>
          <li>
            <strong>Dati dell&apos;account, capi e outfit:</strong> finché tieni
            l&apos;account. Quando lo cancelli spariscono, foto comprese.
          </li>
          <li>
            <strong>Dati tecnici sulle elaborazioni:</strong>{" "}
            <Todo>[periodo da decidere, ad esempio 24 mesi]</Todo>.
          </li>
        </ul>
      </section>

      <section>
        <h2>I tuoi diritti</h2>
        <p>
          Puoi chiederci di accedere ai tuoi dati, correggerli, cancellarli,
          limitarne l&apos;uso, riceverli in un formato leggibile da una
          macchina, oppure opporti al trattamento. Dove ci basiamo sul consenso,
          puoi ritirarlo in qualsiasi momento: resta valido quello che abbiamo
          fatto prima.
        </p>
        <p>
          Due cose le fai da solo, senza chiedere niente a nessuno: da{" "}
          <strong>Impostazioni</strong> puoi scaricare tutti i tuoi dati in un
          file e puoi cancellare l&apos;account.
        </p>
        <p>
          Se pensi che stiamo sbagliando, puoi rivolgerti al Garante per la
          protezione dei dati personali (
          <a
            href="https://www.garanteprivacy.it"
            target="_blank"
            rel="noopener noreferrer"
          >
            garanteprivacy.it
          </a>
          ).
        </p>
      </section>

      <section>
        <h2>Età minima</h2>
        <p>
          VESTA è riservata a chi ha almeno 18 anni. Se scopriamo un account di
          un minorenne lo chiudiamo.
        </p>
      </section>
    </LegalPage>
  );
}
