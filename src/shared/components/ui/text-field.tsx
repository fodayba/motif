import type { InputHTMLAttributes } from 'react'
import { forwardRef, useId } from 'react'
import './text-field.css'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  hint?: string
  error?: string
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ id, label, hint, error, className, ...rest }, ref) => {
    const reactId = useId()
    const inputId = id ?? reactId

    const classes = ['ui-text-field__input']
    if (error) {
      classes.push('ui-text-field__input--error')
    }
    if (className) {
      classes.push(className)
    }

    return (
      <label className="ui-text-field" htmlFor={inputId}>
        {label ? <span className="ui-text-field__label">{label}</span> : null}
        <input id={inputId} ref={ref} className={classes.join(' ')} {...rest} />
        {error ? (
          <span className="ui-text-field__message ui-text-field__message--error">
            {error}
          </span>
        ) : hint ? (
          <span className="ui-text-field__message">{hint}</span>
        ) : null}
      </label>
    )
  },
)

TextField.displayName = 'TextField'
