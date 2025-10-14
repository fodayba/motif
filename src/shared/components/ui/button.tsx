import type { ButtonHTMLAttributes } from 'react'
import { forwardRef } from 'react'
import './button.css'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  block?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', block = false, className, type = 'button', ...rest },
    ref,
  ) => {
    const classes = ['ui-button', `ui-button--${variant}`]

    if (block) {
      classes.push('ui-button--block')
    }

    if (className) {
      classes.push(className)
    }

    return (
      <button
        ref={ref}
        className={classes.join(' ')}
        type={type}
        {...rest}
      />
    )
  },
)

Button.displayName = 'Button'
