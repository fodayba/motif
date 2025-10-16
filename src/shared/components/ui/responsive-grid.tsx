import type { PropsWithChildren } from 'react'
import './responsive-grid.css'

export type ResponsiveGridProps = PropsWithChildren<{
  columns?: {
    mobile?: number
    tablet?: number
    desktop?: number
    wide?: number
  }
  gap?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}>

export const ResponsiveGrid = ({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 3, wide: 4 },
  gap = 'md',
  className,
}: ResponsiveGridProps) => {
  const classes = ['responsive-grid', `responsive-grid--gap-${gap}`]

  if (className) {
    classes.push(className)
  }

  const style = {
    '--grid-cols-mobile': columns.mobile ?? 1,
    '--grid-cols-tablet': columns.tablet ?? 2,
    '--grid-cols-desktop': columns.desktop ?? 3,
    '--grid-cols-wide': columns.wide ?? 4,
  } as React.CSSProperties

  return (
    <div className={classes.join(' ')} style={style}>
      {children}
    </div>
  )
}
