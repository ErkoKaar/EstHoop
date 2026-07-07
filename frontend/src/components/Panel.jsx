const BLUE = '#0072ce'

// Scoreboard-bezel container shared by list sections
export default function Panel({ children }) {
  return (
    <div style={{ background: 'white', borderTop: `2px solid ${BLUE}`, borderBottom: '2px solid #0a0a1a' }}>
      {children}
    </div>
  )
}
