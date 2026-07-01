const FONT_HEADING = "'Bebas Neue', cursive"
const BLUE = '#0072ce'

export default function StatsTabToggle({ active, onChange }) {
  return (
    <div className="flex rounded-2xl p-1.5 gap-1.5 mb-6" style={{ background: '#e8eef5' }}>
      {[{ key: 'koondis', label: 'Koondis' }, { key: 'klubi', label: 'Klubi' }].map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`flex-1 py-3 rounded-xl tracking-widest uppercase cursor-pointer transition-all duration-200
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0072ce]
            ${active === key ? 'text-white shadow-lg' : 'text-gray-500 hover:text-[#08060d]'}`}
          style={{
            fontFamily: FONT_HEADING,
            fontSize: '1.25rem',
            minWidth: '140px',
            background: active === key ? BLUE : 'transparent',
            letterSpacing: '2px',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
