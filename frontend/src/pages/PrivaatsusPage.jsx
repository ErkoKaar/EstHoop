import Seo from '../components/Seo'
import LegalLayout, { Section, P, Ul } from '../components/LegalLayout'

// TOIMETADA: kuupäev tuleb käsitsi uuendada, kui poliitika sisu muutub.
const UPDATED = '18.08.2026'

export default function PrivaatsusPage() {
  return (
    <>
      <Seo
        title="Privaatsuspoliitika"
        description="Kuidas EstHoop isikuandmeid töötleb: milliseid andmeid kogume, mis alusel, kellega jagame ja millised on sinu õigused."
        path="/privaatsus"
      />

      <LegalLayout
        title="Privaatsuspoliitika"
        intro="Siin on kirjas, milliseid isikuandmeid EstHoop töötleb, mis eesmärgil ja mis alusel."
        updated={UPDATED}
      >
        <Section title="Vastutav töötleja">
          <P>
            Veebilehte esthoop.ee haldab Severun OÜ (registrikood 17564409), mis on
            isikuandmete töötlemisel vastutav töötleja.
          </P>
          {/* TOIMETADA: kontrolli, et aadress on täielik (linn ja postiindeks puuduvad). */}
          <Ul>
            <li>Aadress: Töökoja 1</li>
            <li>E-post: <a href="mailto:contact@severun.com" className="underline">contact@severun.com</a></li>
          </Ul>
          <P>
            Andmekaitsespetsialisti määramise kohustust meil ei ole ja seda määratud ei ole.
            Kõigis andmekaitse küsimustes võta ühendust ülaltoodud e-posti aadressil.
          </P>
        </Section>

        <Section title="Milliseid andmeid töötleme">
          <P><strong>Korvpallurite andmed.</strong> Veebileht koondab Eesti korvpallikoondise
            ja koondislaste kohta avalikku infot: nimi, sünniaeg, pikkus, mängupositsioon,
            klubi, riik ning mängu- ja hooajastatistika. Tegemist on tuvastatavate
            füüsiliste isikute andmetega, seega kohaldub neile isikuandmete kaitse üldmäärus.
          </P>
          <P><strong>Veebilehe külastajate andmed.</strong> EstHoop ei nõua kontot ega
            registreerimist, ei kasuta küpsiseid ega veebianalüütikat ja ei salvesta
            külastaja seadmesse jälgimisandmeid. Külastamisel tekivad siiski tavapärased
            serverilogid, mis sisaldavad IP-aadressi, päringu aega, päritud aadressi ja
            brauseri tüüpi.
          </P>
        </Section>

        <Section title="Õiguslik alus ja eesmärk">
          <P>
            Korvpallurite andmeid töötleme õigustatud huvi alusel (isikuandmete kaitse
            üldmääruse artikkel 6 lõige 1 punkt f). Õigustatud huvi on pakkuda Eesti
            korvpallihuvilistele koondatud ülevaadet koondise ja koondislaste esitusest.
            Töötleme ainult ametialast, juba avalikustatud infot sportlase avaliku rolli
            kohta ega töötle eriliiki isikuandmeid ega eraelulisi andmeid.
          </P>
          <P>
            Serverilogisid töötleme samuti õigustatud huvi alusel: veebilehe töökindluse
            tagamiseks ja väärkasutuse tõkestamiseks.
          </P>
        </Section>

        <Section title="Kust andmed pärinevad">
          <P>
            Korvpallurite andmeid ei ole kogutud isikult endalt. Need pärinevad avalikest
            allikatest, peamiselt FIBA (fiba.basketball) ja ProBallers (proballers.com)
            avaldatud koosseisudest ja statistikast. Andmeid uuendatakse automaatselt
            umbes kord ööpäevas.
          </P>
          <P>
            See jaotis täidab ühtlasi üldmääruse artiklist 14 tulenevat teavitamiskohustust
            olukorras, kus andmeid ei ole saadud andmesubjektilt.
          </P>
        </Section>

        <Section title="Kellega andmeid jagame">
          <P>
            Me ei müü ega vaheta isikuandmeid. Andmed on tehniliselt kättesaadavad
            järgmistele teenusepakkujatele, kes tegutsevad meie volitatud töötlejatena:
          </P>
          <Ul>
            <li>Vercel Inc. (USA): veebilehe esiotsa majutus ja serverilogid</li>
            <li>Render Services, Inc. (USA): rakendusliidese majutus ja serverilogid</li>
            <li>Neon Inc. (USA): andmebaasi majutus. Andmebaas ise asub Euroopa Liidus (Frankfurt)</li>
          </Ul>
          <P>
            Kui teenusepakkuja töötleb andmeid väljaspool Euroopa Majanduspiirkonda,
            toimub see Euroopa Komisjoni tüüptingimuste alusel.
          </P>
          <P>
            Veebileht laadib kirjatüübid teenusest Google Fonts. Selle käigus edastatakse
            külastaja IP-aadress Google'ile (Google Ireland Limited / Google LLC). Kui sa
            seda ei soovi, saad brauseris blokeerida päringud aadressidele
            fonts.googleapis.com ja fonts.gstatic.com. Leht jääb ka siis kasutatavaks.
          </P>
        </Section>

        <Section title="Kui kaua andmeid säilitame">
          <P>
            Korvpallurite andmeid säilitame nii kaua, kuni need on veebilehe eesmärgi
            täitmiseks asjakohased, ehk üldjuhul seni, kuni mängija on koondise või Eesti
            korvpalli kontekstis aktuaalne. Serverilogisid säilitavad meie
            majutuspartnerid oma tavapärase tähtaja jooksul, mis on lühiajaline ja
            mõõdetav päevades kuni nädalates.
          </P>
        </Section>

        <Section title="Sinu õigused">
          <P>Isikuandmete kaitse üldmääruse alusel on sul õigus:</P>
          <Ul>
            <li>saada teada, kas ja milliseid sinu andmeid töötleme, ning saada neist koopia</li>
            <li>nõuda ebaõigete andmete parandamist</li>
            <li>nõuda andmete kustutamist</li>
            <li>nõuda töötlemise piiramist</li>
            <li>esitada töötlemisele vastuväide, kuna töötleme andmeid õigustatud huvi alusel</li>
          </Ul>
          <P>
            Taotluse esitamiseks kirjuta aadressile{' '}
            <a href="mailto:contact@severun.com" className="underline">contact@severun.com</a>.
            Vastame hiljemalt ühe kuu jooksul. Kui oled Eesti korvpallur ja soovid, et sinu
            profiil veebilehelt eemaldataks, piisab sellekohasest e-kirjast.
          </P>
          <P>
            Kui leiad, et rikume andmekaitsereegleid, on sul õigus pöörduda Andmekaitse
            Inspektsiooni poole (<a href="https://www.aki.ee" target="_blank" rel="noopener noreferrer" className="underline">www.aki.ee</a>).
          </P>
        </Section>

        <Section title="Muudatused">
          <P>
            Võime privaatsuspoliitikat aeg-ajalt täiendada, näiteks kui veebilehele lisandub
            uusi funktsioone. Kehtiv versioon on alati sellel lehel koos uuendamise kuupäevaga.
          </P>
        </Section>
      </LegalLayout>
    </>
  )
}
