// FIBA annab riikide nimed inglise keeles. Sama tabel on backendis (records.py OPPONENT_ET).
const TEAM_ET = {
  Estonia: 'Eesti', Latvia: 'Läti', Lithuania: 'Leedu', Finland: 'Soome', Sweden: 'Rootsi',
  Norway: 'Norra', Denmark: 'Taani', Iceland: 'Island', Poland: 'Poola', Germany: 'Saksamaa',
  France: 'Prantsusmaa', Spain: 'Hispaania', Italy: 'Itaalia', Portugal: 'Portugal',
  Belgium: 'Belgia', Netherlands: 'Holland', 'Great Britain': 'Suurbritannia', Ireland: 'Iirimaa',
  Ukraine: 'Ukraina', 'Czech Republic': 'Tšehhi', Czechia: 'Tšehhi', Slovakia: 'Slovakkia',
  Hungary: 'Ungari', Austria: 'Austria', Switzerland: 'Šveits', Slovenia: 'Sloveenia',
  Croatia: 'Horvaatia', Serbia: 'Serbia', 'Bosnia and Herzegovina': 'Bosnia ja Hertsegoviina',
  Montenegro: 'Montenegro', 'North Macedonia': 'Põhja-Makedoonia', Albania: 'Albaania',
  Kosovo: 'Kosovo', Greece: 'Kreeka', Turkey: 'Türgi', 'Türkiye': 'Türgi', Bulgaria: 'Bulgaaria',
  Romania: 'Rumeenia', Moldova: 'Moldova', Georgia: 'Gruusia', Armenia: 'Armeenia',
  Azerbaijan: 'Aserbaidžaan', Israel: 'Iisrael', Cyprus: 'Küpros', Luxembourg: 'Luksemburg',
  Belarus: 'Valgevene', Russia: 'Venemaa',
  // Ülejäänud FIBA Euroopa liikmed ja FIBA nimekujude variandid
  Andorra: 'Andorra', Gibraltar: 'Gibraltar', Malta: 'Malta', 'San Marino': 'San Marino',
  Monaco: 'Monaco', 'Faroe Islands': 'Fääri saared', 'Bosnia & Herzegovina': 'Bosnia ja Hertsegoviina',
  'Republic of North Macedonia': 'Põhja-Makedoonia', England: 'Inglismaa', Scotland: 'Šotimaa',
  Wales: 'Wales',
}

// Tundmatu nimi jääb ingliskeelseks, mitte tühjaks
export function teamNameEt(name) {
  return TEAM_ET[name] ?? name
}
