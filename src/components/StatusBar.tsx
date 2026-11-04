export function StatusBar({
  hp,
  maxHp,
  magic,
  maxMagic,
  treasure,
  weaponName,
  secondChance,
}: {
  hp: number
  maxHp: number
  magic: number
  maxMagic: number
  treasure: number
  weaponName: string
  secondChance: boolean
}) {
  return (
    <div>
      <div className="hud">
        <div className="pill">
          <span>חיים</span>
          <b>
            <bdi>
              {hp} / {maxHp}
            </bdi>
          </b>
        </div>
        <div className="pill">
          <span>קסם</span>
          <b>
            <bdi>
              {magic} / {maxMagic}
            </bdi>
          </b>
        </div>
        <div className="pill">
          <span>אוצר</span>
          <b>
            <bdi>{treasure}</bdi>
          </b>
        </div>
      </div>
      <p className="weapon-line">{weaponName}</p>
      {secondChance ? (
        <p className="safety">יש לכם שיקוי חירום אחד, אם החיים ייגמרו.</p>
      ) : (
        <p className="safety">שיקוי החירום כבר נוצל.</p>
      )}
    </div>
  )
}
