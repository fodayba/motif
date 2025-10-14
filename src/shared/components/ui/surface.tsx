import type { HTMLAttributes } from 'react'
import './surface.css'

type SurfaceVariant = 'default' | 'muted'

type SurfaceProps = HTMLAttributes<HTMLDivElement> & {
  variant?: SurfaceVariant
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingMap: Record<NonNullable<SurfaceProps['padding']>, string> = {
  none: 'ui-surface--padding-none',
  sm: 'ui-surface--padding-sm',
  md: 'ui-surface--padding-md',
  lg: 'ui-surface--padding-lg',
}

export const Surface = ({
  variant = 'default',
  padding = 'md',
  className,
  ...rest
}: SurfaceProps) => {
  const classes = ['ui-surface', `ui-surface--${variant}`, paddingMap[padding]]

  if (className) {
    classes.push(className)
  }

  return <div className={classes.join(' ')} {...rest} />
}
