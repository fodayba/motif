import './trend-badge.css'

export type TrendDirection = 'up' | 'down' | 'flat'

export type TrendBadgeProps = {
  delta: number
  ariaLabel?: string
  className?: string
  precision?: number
  suffix?: string
  label?: string
  positiveIsGood?: boolean
  hideIcon?: boolean
}

const getDirection = (delta: number, positiveIsGood: boolean): TrendDirection => {
  if (delta === 0) {
    return 'flat'
  }

  const adjusted = positiveIsGood ? delta : delta * -1
  return adjusted > 0 ? 'up' : 'down'
}

const formatDelta = (delta: number, precision: number, suffix?: string) => {
  const formatted = delta.toLocaleString(undefined, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  })

  if (suffix) {
    return `${delta > 0 ? `+${formatted}` : formatted}${suffix}`
  }

  return delta > 0 ? `+${formatted}` : formatted
}

const getIcon = (direction: TrendDirection) => {
  switch (direction) {
    case 'up':
      return (
        <svg className="trend-badge__icon" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M6 2.25a.75.75 0 0 1 .53.22l3 3a.75.75 0 1 1-1.06 1.06L6.75 4.06v5.19a.75.75 0 0 1-1.5 0V4.06L3.53 6.53a.75.75 0 1 1-1.06-1.06l3-3A.75.75 0 0 1 6 2.25Z" />
        </svg>
      )
    case 'down':
      return (
        <svg className="trend-badge__icon" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M6 9.75a.75.75 0 0 1-.53-.22l-3-3A.75.75 0 0 1 3.53 5.47L5.25 7.19V2a.75.75 0 0 1 1.5 0v5.19l1.72-1.72a.75.75 0 0 1 1.06 1.06l-3 3A.75.75 0 0 1 6 9.75Z" />
        </svg>
      )
    case 'flat':
    default:
      return (
        <svg className="trend-badge__icon" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2.25 6c0-.414.336-.75.75-.75h6a.75.75 0 0 1 0 1.5h-6A.75.75 0 0 1 2.25 6Z" />
        </svg>
      )
  }
}

export const TrendBadge = ({
  delta,
  ariaLabel,
  className,
  precision = 1,
  suffix,
  label,
  positiveIsGood = true,
  hideIcon = false,
}: TrendBadgeProps) => {
  const direction = getDirection(delta, positiveIsGood)
  const formatted = formatDelta(delta, precision, suffix)
  const classes = ['trend-badge', `trend-badge--${direction}`]

  if (className) {
    classes.push(className)
  }

  return (
    <span
      className={classes.join(' ')}
      aria-label={ariaLabel ?? `${formatted}${label ? ` · ${label}` : ''}`}
    >
      {hideIcon ? null : getIcon(direction)}
      <span className="trend-badge__value">{formatted}</span>
      {label ? <span className="trend-badge__label">{label}</span> : null}
    </span>
  )
}
