export function StatMeter({ label, icon, value }: { label: string; icon: string; value: number }) {
  return (
    <div className="meter">
      <div className="meter-label">
        <span>
          {icon} {label}
        </span>
        <bdi>{value}</bdi>
      </div>
      <div className="meter-track" aria-hidden="true">
        {Array.from({ length: 10 }, (_, index) => (
          <span key={index} className={index < value ? 'pip on' : 'pip'} />
        ))}
      </div>
    </div>
  )
}
