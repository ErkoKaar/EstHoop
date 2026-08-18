import { Link } from 'react-router-dom'
import Seo from '../components/Seo'
import LegalLayout, { Section, P, Ul } from '../components/LegalLayout'

// TOIMETADA: kuupäev tuleb käsitsi uuendada, kui tingimuste sisu muutub.
const UPDATED = '18.08.2026'

export default function TingimusedPage() {
  return (
    <>
      <Seo
        title="Kasutajatingimused"
        description="EstHoopi kasutamise tingimused: mis leht on, kui täpne on statistika, kellele kuuluvad andmed ja mille eest me ei vastuta."
        path="/tingimused"
        breadcrumbs={[{ name: 'Kasutajatingimused' }]}
      />

      <LegalLayout
        title="Kasutajatingimused"
        intro="Veebilehte esthoop.ee kasutades nõustud alljärgnevate tingimustega."
        updated={UPDATED}
      >
        <Section title="Kes lehte haldab">
          <P>
            Veebilehte esthoop.ee haldab Severun OÜ (registrikood 17564409, Töökoja 1,
            e-post <a href="mailto:contact@severun.com" className="underline">contact@severun.com</a>).
          </P>
        </Section>

        <Section title="EstHoop on fännileht">
          <P>
            EstHoop on iseseisev fännide tehtud veebileht. See ei ole Eesti Korvpalliliidu,
            FIBA ega ühegi klubi ametlik veebileht ega ole nendega seotud. Ametlik info
            asub Eesti Korvpalliliidu lehel basket.ee.
          </P>
        </Section>

        <Section title="Andmete täpsus">
          <P>
            Mängijate profiilid, statistika ja mängude info kogutakse automaatselt avalikest
            allikatest (FIBA, ProBallers) ja neid uuendatakse umbes kord ööpäevas. See
            tähendab, et:
          </P>
          <Ul>
            <li>andmed ei ole reaalajas ja võivad olla kuni ööpäeva vanused</li>
            <li>allika viga või muudatus kandub üle ka siia</li>
            <li>osa mängijate kohta võib info olla puudulik või puududa</li>
          </Ul>
          <P>
            Anname endast parima, et info oleks õige, kuid me ei garanteeri selle täpsust,
            täielikkust ega ajakohasust. EstHoop ei ole ametlik statistikaallikas. Ära tugine
            siinsetele andmetele otsuste tegemisel, mille tagajärjed on sinu jaoks olulised.
            Severun OÜ ei vastuta kahju eest, mis tekib veebilehel oleva info kasutamisest.
          </P>
        </Section>

        <Section title="Piletid ja välised lingid">
          <P>
            Piletite leht sisaldab infot koondise kodumängude kohta ja linke Piletitasku
            keskkonda. EstHoop ei müü pileteid, ei ole piletimüügi vahendaja ega ole
            tehingu pooleks. Ostu tingimused, tasumine, tagastamine ja klienditugi käivad
            piletimüüja enda tingimuste järgi.
          </P>
          <P>
            Sama kehtib kõigi teiste väliste linkide kohta: me ei vastuta teiste
            veebilehtede sisu ega nende tingimuste eest.
          </P>
        </Section>

        <Section title="Sisu ja autoriõigus">
          <P>
            Statistika ja mängude andmed pärinevad FIBA ja ProBallersi avalikest allikatest
            ning õigused nendele kuuluvad vastavatele omanikele. Veebilehe kujundus, tekstid
            ja logo kuuluvad Severun OÜ-le. Mängijate fotode õigused kuuluvad nende
            omanikele.
          </P>
          <P>Veebilehte kasutades sa ei tohi:</P>
          <Ul>
            <li>kopeerida veebilehe sisu automaatselt suures mahus või seda edasi müüa</li>
            <li>koormata rakendusliidest viisil, mis häirib teenuse tööd</li>
            <li>esitada EstHoopi sisu enda omana või jätta muljet, et oled lehega seotud</li>
          </Ul>
          <P>
            Üksikute andmete jagamine ja viitamine on lubatud, kui lisad viite lehele
            esthoop.ee. Kui oled sisu õiguste omanik ja soovid selle eemaldamist, kirjuta
            aadressile <a href="mailto:contact@severun.com" className="underline">contact@severun.com</a> ja
            me tegeleme sellega.
          </P>
        </Section>

        <Section title="Teenuse kättesaadavus">
          <P>
            Veebileht on saadaval sellisena, nagu see on. Me ei luba katkematut tööd ning
            võime igal ajal muuta, peatada või lõpetada veebilehe või selle üksikute osade
            pakkumise ilma ette teatamata.
          </P>
        </Section>

        <Section title="Isikuandmed">
          <P>
            Isikuandmete töötlemist kirjeldab eraldi{' '}
            <Link to="/privaatsus" className="underline">privaatsuspoliitika</Link>.
          </P>
        </Section>

        <Section title="Tingimuste muutmine ja kohaldatav õigus">
          <P>
            Võime neid tingimusi muuta. Kehtiv versioon on alati sellel lehel koos
            uuendamise kuupäevaga. Tingimustele kohaldatakse Eesti Vabariigi õigust ja
            vaidlused lahendatakse Eesti kohtutes.
          </P>
        </Section>
      </LegalLayout>
    </>
  )
}
