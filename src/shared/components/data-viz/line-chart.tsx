import { useMemo } from 'react'
import './line-chart.css'

export type LineChartSeries = {
  id: string
  label: string
  data: number[]
  color?: string
}

export type LineChartProps = {
  series: LineChartSeries[]
  labels: string[]
  title?: string
  height?: number
  showPoints?: boolean
  showGrid?: boolean
  showLegend?: boolean
  className?: string
}

const buildPath = (
  data: number[],
  width: number,
  height: number,
  min: number,
  range: number,
) => {
  if (data.length === 0) {
    return ''
  }

  const stepX = width / Math.max(data.length - 1, 1)

  return data
    .map((value, index) => {
      const x = index * stepX
      const y = height - ((value - min) / range) * height
      const command = index === 0 ? 'M' : 'L'
      return `${command}${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')
}

export const LineChart = ({
  series,
  labels,
  title,
  height = 300,
  showPoints = false,
  showGrid = true,
  showLegend = true,
  className,
}: LineChartProps) => {
  const { min, range } = useMemo(() => {
    const allValues = series.flatMap((s) => s.data)
    if (allValues.length === 0) {
      return { min: 0, range: 100 }
    }
    const min = Math.min(...allValues)
    const max = Math.max(...allValues)
    const range = max - min || 1
    return { min, range }
  }, [series])

  const classes = ['line-chart']
  if (className) {
    classes.push(className)
  }

  if (series.length === 0 || labels.length === 0) {
    return (
      <div className={classes.join(' ')} style={{ height }}>
        <p className="line-chart__empty">No data available</p>
      </div>
    )
  }

  const chartWidth = 100
  const chartHeight = 100

  return (
    <figure className={classes.join(' ')}>
      {title ? <figcaption className="line-chart__title">{title}</figcaption> : null}
      <div className="line-chart__container" style={{ height }}>
        <svg
          className="line-chart__svg"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="none"
        >
          {showGrid ? (
            <g className="line-chart__grid" aria-hidden="true">
              {[0, 25, 50, 75, 100].map((percent) => (
                <line
                  key={percent}
                  x1="0"
                  y1={percent}
                  x2={chartWidth}
                  y2={percent}
                  className="line-chart__grid-line"
                />
              ))}
            </g>
          ) : null}
          {series.map((s, sIndex) => {
            const path = buildPath(s.data, chartWidth, chartHeight, min, range)
            const color = s.color || `hsl(${(sIndex * 360) / series.length}, 70%, 50%)`
            const stepX = chartWidth / Math.max(s.data.length - 1, 1)

            return (
              <g key={s.id}>
                <path
                  className="line-chart__line"
                  d={path}
                  style={{ stroke: color }}
                  vectorEffect="non-scaling-stroke"
                />
                {showPoints
                  ? s.data.map((value, index) => {
                      const x = index * stepX
                      const y = chartHeight - ((value - min) / range) * chartHeight
                      return (
                        <circle
                          key={`${s.id}-pt-${index}`}
                          className="line-chart__point"
                          cx={x}
                          cy={y}
                          r={3}
                          style={{ fill: color }}
                        />
                      )
                    })
                  : null}
              </g>
            )
          })}
        </svg>
        <div className="line-chart__x-axis">
          {labels.map((label, index) => (
            <span key={`label-${index}`} className="line-chart__x-label">
              {label}
            </span>
          ))}
        </div>
      </div>
      {showLegend && series.length > 1 ? (
        <div className="line-chart__legend">
          {series.map((s, index) => {
            const color = s.color || `hsl(${(index * 360) / series.length}, 70%, 50%)`
            return (
              <div key={s.id} className="line-chart__legend-item">
                <span
                  className="line-chart__legend-indicator"
                  style={{ backgroundColor: color }}
                />
                <span className="line-chart__legend-label">{s.label}</span>
              </div>
            )
          })}
        </div>
      ) : null}
    </figure>
  )
}
