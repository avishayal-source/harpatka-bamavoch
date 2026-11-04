const labels = ['דמות', 'מספרים', 'כלי נשק', 'יציאה']

export function StepBar({ step }: { step: number }) {
  return (
    <ol className="steps" aria-label="שלבי ההכנה">
      {labels.map((label, index) => (
        <li key={label} className={index === step ? 'on' : undefined}>
          {label}
        </li>
      ))}
    </ol>
  )
}
