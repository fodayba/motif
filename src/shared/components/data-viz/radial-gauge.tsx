import './radial-gauge.css'

export type RadialGaugeTone = 'default' | 'success' | 'warning' | 'danger' | 'info'

export type RadialGaugeProps = {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  label?: string
  caption?: string
  tone?: RadialGaugeTone
  className?: string
}

const clampValue = (value: number, max: number) => {
  if (Number.isNaN(value)) {
    return 0
  }

  if (value < 0) {
    return 0
  }

  if (value > max) {
    return max
  }

  return value
}

export const RadialGauge = ({
  value,
  max = 100,
  size = 120,
  strokeWidth = 12,
  label,
  caption,
  tone = 'default',
  className,
}: RadialGaugeProps) => {
  const safeMax = max <= 0 ? 100 : max
  const safeValue = clampValue(value, safeMax)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - safeValue / safeMax)
  const classes = ['radial-gauge', `radial-gauge--${tone}`]

  if (className) {
    classes.push(className)
  }

  const percentage = ((safeValue / safeMax) * 100).toFixed(0)

  return (
    <figure className={classes.join(' ')} style={{ width: size, height: size }}>
      <svg
        className="radial-gauge__svg"
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={label ? `${label}: ${percentage}%` : `${percentage}%`}
      >
        <circle
          className="radial-gauge__track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className="radial-gauge__progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="radial-gauge__content">
        <span className="radial-gauge__value">{percentage}%</span>
        {label ? <span className="radial-gauge__label">{label}</span> : null}
        {caption ? <span className="radial-gauge__caption">{caption}</span> : null}
      </div>
    </figure>
  )
}
