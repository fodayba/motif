import { useMemo } from 'react'
import './bar-chart.css'

export type BarChartDataPoint = {
  label: string
  value: number
  color?: string
}

export type BarChartProps = {
  data: BarChartDataPoint[]
  title?: string
  height?: number
  showValues?: boolean
  showGrid?: boolean
  orientation?: 'vertical' | 'horizontal'
  className?: string
}

export const BarChart = ({
  data,
  title,
  height = 300,
  showValues = true,
  showGrid = true,
  orientation = 'vertical',
  className,
}: BarChartProps) => {
  const maxValue = useMemo(() => {
    if (data.length === 0) {
      return 100
    }
    return Math.max(...data.map((d) => d.value))
  }, [data])

  const classes = ['bar-chart', `bar-chart--${orientation}`]
  if (className) {
    classes.push(className)
  }

  if (data.length === 0) {
    return (
      <div className={classes.join(' ')} style={{ height }}>
        <p className="bar-chart__empty">No data available</p>
      </div>
    )
  }

  return (
    <figure className={classes.join(' ')} style={{ height }}>
      {title ? <figcaption className="bar-chart__title">{title}</figcaption> : null}
      <div className="bar-chart__container">
        {showGrid ? (
          <div className="bar-chart__grid" aria-hidden="true">
            {[0, 25, 50, 75, 100].map((percent) => (
              <div key={percent} className="bar-chart__grid-line" />
            ))}
          </div>
        ) : null}
        <div className="bar-chart__bars">
          {data.map((item, index) => {
            const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0
            const barStyle: React.CSSProperties =
              orientation === 'vertical'
                ? { height: `${percentage}%` }
                : { width: `${percentage}%` }

            if (item.color) {
              barStyle.backgroundColor = item.color
            }

            return (
              <div key={`bar-${index}`} className="bar-chart__bar-wrapper">
                <div
                  className="bar-chart__bar"
                  style={barStyle}
                  role="img"
                  aria-label={`${item.label}: ${item.value}`}
                >
                  {showValues ? (
                    <span className="bar-chart__value">{item.value.toLocaleString()}</span>
                  ) : null}
                </div>
                <span className="bar-chart__label">{item.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </figure>
  )
}
