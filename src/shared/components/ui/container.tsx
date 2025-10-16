import type { PropsWithChildren } from 'react'
import './container.css'

export type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

export type ContainerProps = PropsWithChildren<{
  size?: ContainerSize
  padded?: boolean
  className?: string
}>

export const Container = ({
  children,
  size = 'lg',
  padded = true,
  className,
}: ContainerProps) => {
  const classes = ['container', `container--${size}`]

  if (padded) {
    classes.push('container--padded')
  }

  if (className) {
    classes.push(className)
  }

  return <div className={classes.join(' ')}>{children}</div>
}
