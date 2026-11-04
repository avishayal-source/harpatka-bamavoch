import type { MapView } from '../models/types'

const cellW = 78
const cellH = 66

export function MazeMap({ view }: { view: MapView }) {
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
            return (
              <line
                key={`${corridor.a}-${corridor.b}`}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={corridor.walked ? '#e2b340' : '#8d7d68'}
                strokeWidth={corridor.walked ? 6 : 3}
                strokeDasharray={corridor.walked ? undefined : '5 6'}
              />
            )
          })}
          {view.rooms.map((room) => {
            const point = center(room.x, room.y, view.minX, view.minY)
            return (
              <g key={room.id}>
                <rect
                  x={point.x - 30}
                  y={point.y - 20}
                  width={60}
                  height={40}
                  rx={10}
                  fill={room.kind === 'here' ? '#ffe7a8' : room.kind === 'visited' ? '#fff7ea' : '#d9d0c4'}
                  stroke={room.kind === 'here' ? '#8a6112' : '#c7b498'}
                  strokeWidth={room.kind === 'here' ? 3 : 1.5}
                  strokeDasharray={room.kind === 'seen' ? '4 3' : undefined}
                />
                <text x={point.x} y={point.y + 5} textAnchor="middle" fontSize="13" fill="#2a2118">
                  {room.label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
      <p className="map-key">זהב: עברתם. קו מקווקו: דלת שראיתם ועוד לא עברתם.</p>
    </aside>
  )
}

function center(x: number, y: number, minX: number, minY: number) {
  return {
    x: (x - minX) * cellW + cellW / 2,
    y: (y - minY) * cellH + cellH / 2,
  }
}
