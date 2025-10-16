import type { SVGAttributes } from 'react'
import './sparkline.css'

export type SparklineVariant = 'default' | 'positive' | 'negative' | 'warning' | 'info'

export type SparklineProps = {
  values: number[]
  ariaLabel?: string
  className?: string
  height?: number
  showPoints?: boolean
  variant?: SparklineVariant
  areaOpacity?: number
} & Pick<SVGAttributes<SVGSVGElement>, 'role'>

const buildLinePath = (values: number[], width: number, height: number) => {
  const points = buildPoints(values, width, height)

  if (points.length === 0) {
    return ''
  }

  return points
    .map(([x, y], index) => {
      const command = index === 0 ? 'M' : 'L'
      return `${command}${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')
}

const buildAreaPath = (values: number[], width: number, height: number) => {
  const points = buildPoints(values, width, height)

  if (points.length === 0) {
    return ''
  }

  const line = points
    .map(([x, y], index) => {
      const command = index === 0 ? 'M' : 'L'
      return `${command}${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')

  return `${line} L${width.toFixed(2)} ${height.toFixed(2)} L0 ${height.toFixed(2)} Z`
}

const buildPoints = (values: number[], width: number, height: number) => {
  if (values.length === 0) {
    return []
  }

  if (values.length === 1) {
    return [[width / 2, height / 2]]
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const step = width / (values.length - 1)

  return values.map((value, index) => {
    const x = step * index
    const y = height - ((value - min) / range) * height
    return [x, Number.isFinite(y) ? y : height / 2]
  })
}

export const Sparkline = ({
  values,
  ariaLabel,
  className,
  height = 48,
  showPoints = false,
  variant = 'default',
  areaOpacity = 0.1,
  role = 'img',
}: SparklineProps) => {
  if (!values || values.length === 0) {
    return null
  }

  const width = 100
  const points = buildPoints(values, width, height)
  const path = buildLinePath(values, width, height)
  const areaPath = buildAreaPath(values, width, height)
  const classes = ['sparkline', `sparkline--${variant}`]

  if (className) {
    classes.push(className)
  }

  const min = Math.min(...values)
  const max = Math.max(...values)

  return (
    <figure className={classes.join(' ')}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        aria-label={ariaLabel}
        role={role}
      >
        <g aria-hidden="true">
          <path className="sparkline__area" d={areaPath} style={{ opacity: areaOpacity }} />
          <path className="sparkline__line" d={path} vectorEffect="non-scaling-stroke" />
          {showPoints
            ? points.map(([x, y], index) => (
                <circle key={`pt-${index}`} className="sparkline__point" cx={x} cy={y} r={2.75} />
              ))
            : null}
        </g>
      </svg>
      <figcaption className="sparkline__caption" aria-hidden="true">
        <span>low {min.toLocaleString()}</span>
        <span>high {max.toLocaleString()}</span>
      </figcaption>
    </figure>
  )
}
