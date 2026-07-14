import { useState } from 'react'

// SofaScore riiginimi → ISO2 kood (flagcdn.com jaoks); Euroopa korvpalliriigid
const FLAG_CODES = {
  Estonia: 'ee', Latvia: 'lv', Lithuania: 'lt', Finland: 'fi', Sweden: 'se',
  Norway: 'no', Denmark: 'dk', Iceland: 'is', Poland: 'pl', Germany: 'de',
  France: 'fr', Spain: 'es', Italy: 'it', Portugal: 'pt', Belgium: 'be',
  Netherlands: 'nl', 'Great Britain': 'gb', Ireland: 'ie', Ukraine: 'ua',
  'Czech Republic': 'cz', Czechia: 'cz', Slovakia: 'sk', Hungary: 'hu',
  Austria: 'at', Switzerland: 'ch', Slovenia: 'si', Croatia: 'hr',
  Serbia: 'rs', 'Bosnia and Herzegovina': 'ba', Montenegro: 'me',
  'North Macedonia': 'mk', Albania: 'al', Kosovo: 'xk', Greece: 'gr',
  Turkey: 'tr', 'Türkiye': 'tr', Bulgaria: 'bg', Romania: 'ro', Moldova: 'md',
  Georgia: 'ge', Armenia: 'am', Azerbaijan: 'az', Israel: 'il', Cyprus: 'cy',
  Luxembourg: 'lu', Belarus: 'by', Russia: 'ru',
}

// Riigilipp; tundmatu riik või laadimisviga → lippu ei kuvata
export default function TeamFlag({ name, size = 52, style }) {
  const [failed, setFailed] = useState(false)
  const code = FLAG_CODES[name]
  if (!code || failed) return null
  return (
    <img
      src={`https://flagcdn.com/w80/${code}.png`}
      srcSet={`https://flagcdn.com/w160/${code}.png 2x`}
      alt={name}
      onError={() => setFailed(true)}
      style={{ width: size, height: 'auto', borderRadius: size > 30 ? 6 : 3, ...style }}
    />
  )
}
