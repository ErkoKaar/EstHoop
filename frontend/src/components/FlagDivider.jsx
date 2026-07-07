const BLUE = '#0072ce'

// Estonia flag stripe motif, echoes hero
export default function FlagDivider({ style }) {
  return (
    <div style={{ margin: '40px 0', ...style }}>
      <div style={{ height: 3, background: BLUE }} />
      <div style={{ height: 3, background: '#0a0a1a' }} />
      <div style={{ height: 3, background: '#e5e7eb' }} />
    </div>
  )
}
