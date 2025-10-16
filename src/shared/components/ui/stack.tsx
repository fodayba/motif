import type { PropsWithChildren } from 'react'
import './stack.css'

export type StackDirection = 'vertical' | 'horizontal'
export type StackAlign = 'start' | 'center' | 'end' | 'stretch'
export type StackJustify = 'start' | 'center' | 'end' | 'between' | 'around'
export type StackGap = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export type StackProps = PropsWithChildren<{
  direction?: StackDirection
  align?: StackAlign
  justify?: StackJustify
  gap?: StackGap
  wrap?: boolean
  responsive?: boolean // Switches to vertical on mobile
  className?: string
}>

export const Stack = ({
  children,
  direction = 'vertical',
  align = 'stretch',
  justify = 'start',
  gap = 'md',
  wrap = false,
  responsive = false,
  className,
}: StackProps) => {
  const classes = [
    'stack',
    `stack--${direction}`,
    `stack--align-${align}`,
    `stack--justify-${justify}`,
    `stack--gap-${gap}`,
  ]

  if (wrap) {
    classes.push('stack--wrap')
  }

  if (responsive) {
    classes.push('stack--responsive')
  }

  if (className) {
    classes.push(className)
  }

  return <div className={classes.join(' ')}>{children}</div>
}
