import type { MapView } from '../models/types'

const cellW = 54
const cellH = 50

export function MazeMap({ view, journal }: { view: MapView; journal: { room: string; text: string }[] }) {
  const width = view.width * cellW
  const height = view.height * cellH
  const byId = new Map(view.rooms.map((room) => [room.id, room]))

  return (
    <aside className="map-panel">
      <h2>המבוך שגיליתם</h2>
      <div className="map-scroll">
        <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-label="מפת החדרים והמסדרונות שגיליתם">
          {view.corridors.map((corridor) => {
            const from = byId.get(corridor.a)
            const to = byId.get(corridor.b)
            if (!from || !to) return null
            const start = center(from.x, from.y, view.minX, view.minY)
            const end = center(to.x, to.y, view.minX, view.minY)
            const color = corridor.secret ? '#b9a6ff' : corridor.walked ? '#e2b340' : '#8d7d68'
            return (
              <line
                key={`${corridor.a}-${corridor.b}`}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={color}
                strokeWidth={corridor.walked ? 5 : 3}
                strokeDasharray={corridor.walked ? undefined : '4 5'}
              />
            )
          })}
          {view.rooms.map((room) => {
            const point = center(room.x, room.y, view.minX, view.minY)
            return (
              <g key={room.id}>
                <rect
                  x={point.x - 23}
                  y={point.y - 15}
                  width={46}
                  height={30}
                  rx={8}
                  fill={room.kind === 'here' ? '#ffe7a8' : room.kind === 'visited' ? '#fff7ea' : '#d9d0c4'}
                  stroke={room.kind === 'here' ? '#8a6112' : '#c7b498'}
                  strokeWidth={room.kind === 'here' ? 3 : 1.5}
                  strokeDasharray={room.kind === 'seen' ? '4 3' : undefined}
                />
                <text x={point.x} y={point.y + 4} textAnchor="middle" fontSize="11" fill="#2a2118">
                  {room.label}
                </text>
                {room.monster ? (
                  <text x={point.x + 20} y={point.y - 9} textAnchor="middle" fontSize="12">
                    {room.monster === 'alive' ? '⚔️' : '✅'}
                  </text>
                ) : null}
              </g>
            )
          })}
        </svg>
      </div>
      <p className="map-key">
        זהב: עברתם. מקווקו: עוד לא עברתם. סגול: דלת סודית. ⚔️ מפלצת שמחכה, ✅ מפלצת שניצחתם.
      </p>
      {journal.length > 0 ? (
        <section className="journal">
          <h2>יומן ההרפתקה</h2>
          <ul>
            {journal.map((entry, index) => (
              <li key={`${index}-${entry.text}`}>
                <b>{entry.room}:</b> {entry.text}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </aside>
  )
}

function center(x: number, y: number, minX: number, minY: number) {
  return {
    x: (x - minX) * cellW + cellW / 2,
    y: (y - minY) * cellH + cellH / 2,
  }
}
