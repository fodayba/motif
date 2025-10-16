import './placeholder-chart.css'

export type PlaceholderChartProps = {
  title: string
  meta?: string
  className?: string
  children?: React.ReactNode
}

export const PlaceholderChart = ({ title, meta, className, children }: PlaceholderChartProps) => {
  const classes = ['placeholder-chart']

  if (className) {
    classes.push(className)
  }

  return (
    <div className={classes.join(' ')}>
      <header className="placeholder-chart__header">
        <span className="placeholder-chart__title">{title}</span>
        {meta ? <span className="placeholder-chart__meta">{meta}</span> : null}
      </header>
      <div className="placeholder-chart__canvas">{children}</div>
    </div>
  )
}
