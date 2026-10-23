// Koondise ajaloo lehe staatiline sisu. Allikad ja vastuolud: KOONDIS-AJALUGU-REKORDID.md.
// Ametlike mängude rekordid tulevad API-st (/national-team/records), siin on ainult see,
// mis pärast mängu ei muutu. Sidekriipsud on tavalised "-", mitte pikad kriipsud.

export const FIRST_GAME = {
  home: 'Eesti',
  away: 'Läti',
  score: [16, 20],
  caption: 'Esimene maavõistlus, 29. aprill 1924, Tallinn',
}

// result: 'V' võit, 'K' kaotus. Skoor on alati Eesti oma enne.
export const CHAPTERS = [
  {
    id: 'algus',
    nav: 'Algus',
    years: '1924-1940',
    title: 'Algus',
    lead:
      '16 aastaga peeti 40 maavõistlust: 19 võitu, 20 kaotust ja üks viik. ' +
      'Eesti mängis olümpiamängude esimese korvpallimängu ja sai kahel EM-il viienda koha.',
    photo: {
      src: '/ajalugu/korvpall-1930ndad.webp', width: 1400, height: 879,
      alt: 'Soomusrongirügemendi ajateenijad mängivad õuesplatsil korvpalli',
      caption: 'Soomusrongirügemendi ajateenijad korvpalliplatsil, 1930. aastad',
    },
    milestones: [
      { year: 1924, score: [16, 20], opponent: 'Läti', result: 'K',
        text: 'Esimene maavõistlus Tallinnas NMKÜ võimlas.' },
      { year: 1936, score: [34, 29], opponent: 'Prantsusmaa', result: 'V',
        text: 'Berliini olümpiamängude korvpalliturniiri avamäng. Lõpuks jagatud 9. koht.' },
      { year: 1937, score: [41, 19], opponent: 'Läti', result: 'V',
        text: 'Esimese EM-i viimane mäng Riias. Lõppkoht 5., Heino Veskila valiti turniiri sümboolsesse viisikusse.' },
      { year: 1939, score: [91, 1], opponent: 'Soome', result: 'V',
        text: 'Kõigi aegade suurim võit, EM-il Kaunases. Soomet treenis eestlane Albert Suurna. Lõppkoht taas 5.',
        photo: {
          src: '/ajalugu/eurobasket-1939-avamine.webp', width: 600, height: 366,
          alt: 'EM 1939 avatseremoonia täis Kaunase spordihallis',
        } },
      { year: 1940, score: [40, 38], opponent: 'Leedu', result: 'V',
        text: 'Viimane maavõistlus enne okupatsiooni, 9. märtsil Kadrioru tennishallis.' },
    ],
    // photo: Spordimuuseumi fotod MuIS-i avaliku omandi märkega ja Niiler anonüümsest 1940. a
    // ajalehefotost (vt PHOTO_CREDITS). MuIS-i "CC0" kehtib ainult metaandmetele, mitte piltidele.
    // Pildita legend saab initsiaalid.
    legends: [
      { name: 'Heino Veskila', role: 'Ründaja', text: '17 maavõistlust, EM-i 1937 sümboolne viisik. Hukati 1941.',
        photo: { src: '/ajalugu/heino-veskila.webp', width: 320, height: 400 } },
      { name: 'Erich Altosaar', role: 'Kapten 1939', text: 'Olümpiamängude lipukandja. Suri 1941 vangilaagris.',
        photo: { src: '/ajalugu/erich-altosaar.webp', width: 320, height: 400 } },
      { name: 'Robert Keres', role: 'Kapten 1936-1937', text: '14 maavõistlust, kapten Berliinis ja Riias.',
        photo: { src: '/ajalugu/robert-keres.webp', width: 320, height: 400 } },
      { name: 'Herbert Niiler', role: 'Peatreener', text: 'Juhendas koondist kõigil tiitlivõistlustel, kirjutas esimese eestikeelse korvpalliõpiku.',
        photo: { src: '/ajalugu/herbert-niiler.webp', width: 320, height: 400 } },
    ],
  },
  {
    id: 'nsvl',
    nav: 'NSVL aeg',
    years: '1940-1991',
    title: 'Eestlased NSV Liidu koondises',
    lead:
      'Järgmine maavõistlus tuli alles 1992. aastal. Vahepeal võitsid eestlased NSV Liidu ' +
      'koondisega olümpia-, maailma- ja Euroopa meistritiitleid.',
    photo: {
      src: '/ajalugu/tiit-sokk-1988.webp', width: 1400, height: 926,
      alt: 'Tiit Sokk tõstab lahtises autos lilled üles, ümberringi rahvas',
      caption: 'Tiit Sokk olümpialaste vastuvõtul Tallinnas, oktoober 1988. Ta on ainus eestlasest korvpalli olümpiavõitja.',
      position: '55% 30%',
    },
    // m: [võistlus, medal, aasta]; medal 'kuld' | 'hõbe' | 'pronks'
    // photo: Spordimuuseumi portreed MuIS-i avaliku omandi märkega. Lõssov, Lepmets, Krikun,
    // Tammiste, Salumets, Enden ja Sokk on korvpall100.ee kuulsuste hallist: avatud litsentsi pole,
    // aga Korvpalliliidu pilt on madala riskiga (vt AUTORIOIGUS-RISKID.md). Nõude korral eemalda.
    medalists: [
      { name: 'Ilmar Kullam', photo: '/ajalugu/medalistid/ilmar-kullam.webp', medals: [['OM', 'hõbe', 1952], ['EM', 'kuld', 1947], ['EM', 'kuld', 1951], ['EM', 'kuld', 1953]] },
      { name: 'Joann Lõssov', photo: '/ajalugu/medalistid/joann-lossov.webp', medals: [['OM', 'hõbe', 1952], ['EM', 'kuld', 1947], ['EM', 'kuld', 1951]] },
      { name: 'Heino Kruus', photo: '/ajalugu/medalistid/heino-kruus.webp', medals: [['OM', 'hõbe', 1952], ['EM', 'kuld', 1951], ['EM', 'kuld', 1953]] },
      { name: 'Tõnno Lepmets', photo: '/ajalugu/medalistid/tonno-lepmets.webp', medals: [['EM', 'kuld', 1963], ['EM', 'kuld', 1967]] },
      { name: 'Jaak Lipso', photo: '/ajalugu/medalistid/jaak-lipso.webp', medals: [['OM', 'hõbe', 1964], ['OM', 'pronks', 1968], ['MM', 'kuld', 1967], ['EM', 'kuld', 1963], ['EM', 'kuld', 1965], ['EM', 'kuld', 1967]] },
      { name: 'Priit Tomson', photo: '/ajalugu/medalistid/priit-tomson.webp', medals: [['OM', 'pronks', 1968], ['MM', 'kuld', 1967], ['MM', 'kuld', 1974], ['EM', 'kuld', 1967], ['EM', 'kuld', 1969], ['EM', 'kuld', 1971]] },
      { name: 'Anatoli Krikun', photo: '/ajalugu/medalistid/anatoli-krikun.webp', medals: [['OM', 'pronks', 1968], ['MM', 'pronks', 1970], ['EM', 'kuld', 1967]] },
      { name: 'Aleksei Tammiste', photo: '/ajalugu/medalistid/aleksei-tammiste.webp', medals: [['EM', 'kuld', 1971]] },
      { name: 'Jaak Salumets', photo: '/ajalugu/medalistid/jaak-salumets.webp', medals: [['EM', 'pronks', 1973]] },
      { name: 'Heino Enden', photo: '/ajalugu/medalistid/heino-enden.webp', medals: [['MM', 'kuld', 1982], ['EM', 'pronks', 1983], ['EM', 'kuld', 1985], ['EM', 'hõbe', 1987]] },
      { name: 'Tiit Sokk', photo: '/ajalugu/medalistid/tiit-sokk.webp', medals: [['OM', 'kuld', 1988], ['MM', 'hõbe', 1986], ['MM', 'hõbe', 1990], ['EM', 'pronks', 1989]] },
    ],
    milestones: [
      { year: 1949, title: 'Tartu ÜSK', result: 'V',
        text: 'Tartu ülikooli meeskond tuli NSV Liidu meistriks.' },
      { year: 1991, score: [85, 77], opponent: 'Spartak', result: 'V',
        text: 'Tallinna Kalev alistas finaalis Leningradi Spartaki ja jäi NSV Liidu viimaseks meistriks.' },
    ],
  },
  {
    id: 'uus-aeg',
    nav: 'Uus aeg',
    years: '1992-2026',
    title: 'Taas oma koondisega',
    lead:
      'FIBA taastas Eesti liikmesuse 1991. aasta lõpus. Esimene mäng peeti 22. juunil 1992 ' +
      'ja aasta hiljem oli Eesti EM-il kuues.',
    milestones: [
      { year: 2012, score: [88, 81], opponent: 'Serbia', result: 'V',
        text: 'EM-valikmäng Tallinnas. Valiksarjas jäi edasipääsust puudu ainult omavaheliste mängude vahe.' },
      { year: 2021, score: [69, 66], opponent: 'Saksamaa', result: 'V',
        text: 'Võit Nürnbergis. Saksamaa tuli 2023. aastal maailmameistriks.' },
      { year: 2022, score: [94, 62], opponent: 'Suurbritannia', result: 'V',
        text: 'EM-il Milanos. 32 punkti vahe on taasiseseisvusaja suurim, sama vahega võideti 1992. aastal Hollandit.' },
      { year: 2024, score: [65, 59], opponent: 'Leedu', result: 'V',
        text: 'Esimene ametlik võit Leedu üle läbi aegade, Unibet Arenal.' },
    ],
    // Pildita portree (src puudub) saab initsiaalid
    portraits: [
      { name: 'Aivar Kuusmaa', text: 'EM-i 1993 staar: 40 punkti Bosnia ja Hertsegoviina vastu, turniiril keskmiselt 19,9.',
        src: '/ajalugu/aivar-kuusmaa.webp', width: 352, height: 440, alt: 'Aivar Kuusmaa Kalevi särgis karikaga' },
      { name: 'Gert Kullamäe', text: 'Ametlike mängude rekordiomanik: 82 mängu ja 909 punkti.',
        src: '/ajalugu/gert-kullamae.webp', width: 352, height: 440, alt: 'Gert Kullamäe korvpalliliiga tähtede mängus, 1995' },
      { name: 'Margus Metstak', text: 'Vanim koondislane, viimane mäng 41-aastasena.',
        src: '/ajalugu/margus-metstak-1999.webp', width: 902, height: 1200, year: 1999 },
      { name: 'Martin Müürsepp', text: 'Esimene eestlane NBA-s, 41 punkti Islandi vastu.',
        src: '/ajalugu/martin-muursepp-2004.webp', width: 470, height: 600, year: 2004 },
      { name: 'Valmo Kriisa', text: '148 mängu koondise särgis.',
        src: '/ajalugu/valmo-kriisa-2007.webp', width: 478, height: 717, year: 2007 },
      { name: 'Janar Talts', text: 'Enim mänge: 168, sõprusmängud kaasa arvatud.',
        src: '/ajalugu/janar-talts-2006.webp', width: 870, height: 1200, year: 2006 },
      { name: 'Kristjan Kangur', text: '164 mängu, mängude arvult teine läbi aegade.',
        src: '/ajalugu/kristjan-kangur-2006.webp', width: 800, height: 1200, year: 2006 },
      { name: 'Gregor Arbet', text: '160 mängu, EM-i 2015 resultatiivseim.',
        src: '/ajalugu/gregor-arbet-2006.webp', width: 800, height: 1200, year: 2006 },
    ],
    closingPhoto: {
      src: '/ajalugu/eesti-serbia-2025.webp', width: 1400, height: 1050,
      alt: 'Täis Riia areen EM-i mängul Eesti ja Serbia vahel, tribüünidel sinised särgid',
      caption: 'Eesti-Serbia EM-il Riias, 27. august 2025',
    },
  },
]

// Kõik EM-i finaalturniirid. place: null = veel mängimata.
export const EUROBASKETS = [
  { year: 1937, host: 'Riia', place: 5, record: '3-2', note: 'Esimene EM' },
  { year: 1939, host: 'Kaunas', place: 5, record: '4-3', note: '91:1 Soome üle' },
  { year: 1993, host: 'Saksamaa', place: 6, record: '4-5', note: 'Parim pärast 1991' },
  { year: 2001, host: 'Antalya', place: 14, record: '0-3', note: 'Müürsepp 18,3 p' },
  { year: 2015, host: 'Riia', place: 20, record: '1-4', note: 'Võit Ukraina üle' },
  { year: 2022, host: 'Milano', place: 19, record: '1-4', note: 'Võit Suurbritannia üle' },
  { year: 2025, host: 'Riia', place: 19, record: '1-4', note: 'Võit Tšehhi üle' },
  { year: 2029, host: 'Tallinn', place: null, record: null, note: 'Eesti on kaaskorraldaja' },
]

export const FEATURE_1993 = {
  score: [113, 103],
  opponent: 'Saksamaa',
  date: '22. juuni 1993, Berliin',
  text:
    'EM-i avamängus võideti hilisemat Euroopa meistrit. Aivar Kuusmaa viskas 30 punkti ja ' +
    'turniiril keskmiselt 19,9. Eesti jäi kuuendaks, MM-ile pääses viis paremat.',
}

// Ei uuene automaatselt: allikas on sport24.ee seisuga 30.08.2026 ja FIBA protokoll
export const STATIC_RECORDS = [
  { label: 'Enim mänge kokku', value: '168', who: 'Janar Talts', detail: 'Sõprusmängud kaasa arvatud, 2002-2019' },
  { label: 'Noorim debütant', value: '17 a', who: 'Heino Veskila', detail: '17 aastat 238 päeva. Pärast 1992: Henri Veesaar, 17 a 242 p' },
  { label: 'Vanim mängija', value: '41 a', who: 'Margus Metstak', detail: '41 aastat 223 päeva, Eesti-Ungari 2003' },
]

export const ATTENDANCE = {
  value: '8000',
  text: 'pealtvaatajat, Eesti-Läti 79:86, 23. jaanuar 2002, Saku Suurhall',
  photo: {
    src: '/ajalugu/eesti-fannid-2013.webp', width: 1400, height: 934,
    alt: 'Eesti korvpallifännid tribüünil sinimustvalgete lippudega',
  },
}

export const HERO_PHOTO = {
  src: '/ajalugu/eurobasket-1937-leedu-eesti.webp', width: 706, height: 470,
}

// url: allika leht. licenseUrl: litsentsi tekst (CC BY ja BY-SA nõuavad viidet litsentsile).
// note: muudatus, mis tuleb litsentsi järgi ära märkida.
const CC_BY_SA_4 = 'https://creativecommons.org/licenses/by-sa/4.0/deed.et'
const CC_BY_SA_3 = 'https://creativecommons.org/licenses/by-sa/3.0/deed.et'
const NAGI_BY_SA = 'https://commons.wikimedia.org/wiki/Template:Nagi_Attribution_Share_Alike'
const ESM = 'Eesti Spordi- ja Olümpiamuuseum'

export const PHOTO_CREDITS = [
  { what: 'Leedu-Eesti, EM 1937', author: 'Autor teadmata', license: 'Avalik omand', url: 'https://commons.wikimedia.org/wiki/File:EuroBasket_1937._Lithuania_versus_Estonia.jpg' },
  { what: 'Korvpall Soomusrongirügemendis, 1930. aastad', author: 'Autor teadmata', license: 'Avalik omand', url: 'https://commons.wikimedia.org/wiki/File:Soomusrongir%C3%BCgemendi_korvpalli.jpg' },
  { what: 'EM 1939 avatseremoonia', author: 'Autor teadmata', license: 'Avalik omand', url: 'https://commons.wikimedia.org/wiki/File:EuroBasket_1939_opening_ceremony.jpg' },
  { what: 'Heino Veskila, Berliin 1936', author: `Autor teadmata, ${ESM}`, license: 'Avalik omand', url: 'https://www.muis.ee/museaalView/24966', note: 'kärbitud' },
  { what: 'Erich Altosaar, 1930', author: `Aleksander Teppor, ${ESM}`, license: 'Avalik omand', url: 'https://www.muis.ee/museaalView/23874', note: 'kärbitud' },
  { what: 'Robert Keres, Berliin 1938', author: `Autor teadmata, ${ESM}`, license: 'Avalik omand', url: 'https://www.muis.ee/museaalView/24944', note: 'kärbitud' },
  { what: 'Herbert Niiler, Uus Eesti 19.02.1940', author: 'Autor teadmata', license: 'Avalik omand', url: 'https://dea.digar.ee/article/uuseesti/1940/02/19/15', note: 'kärbitud' },
  { what: 'Tiit Sokk, 1988', author: 'Jaan Künnap', license: 'CC BY-SA 4.0', licenseUrl: CC_BY_SA_4, url: 'https://commons.wikimedia.org/wiki/File:Tiit_Sokk,_Ol%C3%BCmpialaste_vastuv%C3%B5tt_Raekoja_platsil_88_(1).jpg', note: 'medalistide portree sellest kärbitud' },
  { what: 'Ilmar Kullam', author: ESM, license: 'Avalik omand', url: 'https://www.muis.ee/museaalView/47416', note: 'kärbitud' },
  { what: 'Heino Kruus', author: ESM, license: 'Avalik omand', url: 'https://www.muis.ee/museaalView/47414', note: 'kärbitud' },
  { what: 'Jaak Lipso', author: ESM, license: 'Avalik omand', url: 'https://www.muis.ee/museaalView/47462', note: 'kärbitud' },
  { what: 'Priit Tomson', author: ESM, license: 'Avalik omand', url: 'https://www.muis.ee/museaalView/47578', note: 'kärbitud' },
  { what: 'Lõssov, Lepmets, Krikun, Tammiste, Salumets, Enden, Sokk (portree) ja Kuusmaa', author: 'Eesti Korvpalliliit, korvpall100.ee', license: 'Õigused autoril', url: 'https://korvpall100.ee/et/kuulsuste-hall', note: 'kärbitud' },
  { what: 'Gert Kullamäe, tähtede mäng 20.01.1995', author: `Gunnar Vaidla, ${ESM}, ESM F 462:62`, license: 'Muuseumi kogu, viitega', url: 'https://www.muis.ee/museaalView/1325677', note: 'kärbitud' },
  { what: 'Margus Metstak, 1999', author: 'Jaan Künnap', license: 'CC BY-SA 4.0', licenseUrl: CC_BY_SA_4, url: 'https://commons.wikimedia.org/wiki/File:Margus_Metstak_korvpallur_99.jpg' },
  { what: 'Martin Müürsepp, 2004', author: 'Stanislav Popov', license: 'CC BY-SA 3.0', licenseUrl: CC_BY_SA_3, url: 'https://commons.wikimedia.org/wiki/File:Martin_Muursepp.jpg' },
  { what: 'Valmo Kriisa, 2007', author: 'Mait Heidelberg', license: 'Autori nimega', url: 'https://commons.wikimedia.org/wiki/File:Valmo_Kriisa,_2007.jpg' },
  { what: 'Janar Talts, 2006', author: 'Jüri Kaljundi', license: 'Nagi BY SA', licenseUrl: NAGI_BY_SA, url: 'https://commons.wikimedia.org/wiki/File:Janar_Talts,_Estonia-Latvia,_2006.jpg' },
  { what: 'Kristjan Kangur, 2006', author: 'Jüri Kaljundi', license: 'Nagi BY SA', licenseUrl: NAGI_BY_SA, url: 'https://commons.wikimedia.org/wiki/File:Kristjan_Kangur,_Estonia-Latvia,_2006.jpg' },
  { what: 'Gregor Arbet, 2006', author: 'Jüri Kaljundi', license: 'Nagi BY SA', licenseUrl: NAGI_BY_SA, url: 'https://commons.wikimedia.org/wiki/File:Gregor_Arbet,_Estonia-Latvia,_2006.jpg' },
  { what: 'Eesti fännid, 2013', author: 'Jüri Kaljundi', license: 'Nagi BY SA', licenseUrl: NAGI_BY_SA, url: 'https://commons.wikimedia.org/wiki/File:Estonia_basketball_fans.jpeg' },
  { what: 'Eesti-Serbia, EM 2025', author: 'Squad0273', license: 'CC0', url: 'https://commons.wikimedia.org/wiki/File:Estonia_vs_Serbia_Eurobasket_2025.jpg' },
]

export const SOURCES = [
  { name: 'sport24.ee koondise andmebaas', url: 'https://www.sport24.ee/korvpall/mangud?fi=1&koondis=M' },
  { name: 'Eesti Korvpalliliit', url: 'https://www.basket.ee/et/koss95' },
  { name: 'Korvpall 100: kuulsuste hall', url: 'https://korvpall100.ee/et/kuulsuste-hall' },
  { name: 'FIBA ajalugu', url: 'https://www.fiba.basketball/en/history/208-fiba-eurobasket/1839/games' },
  { name: 'Olympedia, Berliin 1936', url: 'https://www.olympedia.org/results/31800' },
  { name: 'DIGAR, Kaja 2. mai 1924', url: 'https://dea.digar.ee/article/kaja/1924/05/02/1/14' },
]
