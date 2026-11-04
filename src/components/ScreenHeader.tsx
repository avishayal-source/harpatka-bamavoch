import { StepBar } from './StepBar'

export function ScreenHeader({
  title,
  subtitle,
  step,
}: {
  title: string
  subtitle?: string
  step?: number
}) {
  return (
    <header className="screen-header">
      {step !== undefined ? <StepBar step={step} /> : null}
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
    </header>
  )
}
