import { useFieldSnapshot, useFieldValue, useFormField, useNumberFormField, useArrayFormField } from '@kaliber/forms'
import { Code } from './Code'

export function FormValues({ form }) {
  const formState = useFieldSnapshot(form)
  return <Code value={formState} indent />
}

export function FormTextInput({ field, label }) {
  const { name, state, eventHandlers } = useFormField(field)
  return <InputBase type='text' {...{ name, label, state, eventHandlers }} />
}

export function FormNumberInput({ field, label }) {
  const { name, state, eventHandlers } = useNumberFormField(field)
  return <InputBase type='text' {...{ name, label, state, eventHandlers }} />
}

export function FormCheckbox({ field, label }) {
  const { name, state, eventHandlers } = useBooleanFormField(field)
  const { value } = state
  console.log(`[${name}] render checkbox field`)
  return (
    <LabelAndError {...{ name, label, state }}>
      <input
        id={name}
        type='checkbox'
        checked={value || false}
        {...eventHandlers}
      />
    </LabelAndError>
  )
}

function useBooleanFormField(field) {
  const { name, state, eventHandlers: { onChange, ...originalEventHandlers } } = useFormField(field)
  const eventHandlers = { ...originalEventHandlers, onChange: e => onChange(e.target.checked) }
  return { name, state, eventHandlers }
}

export function FormArrayField({ field, render, initialValue }) {
  const { name, state: { children, error, showError }, helpers } = useArrayFormField(field)

  console.log(`[${name}] render array field`)

  return (
    <div>
      {children.map(field => (
        <React.Fragment key={field.name}>
          {render({
            name: field.name,
            fields: field.fields,
          })}
          <button type='button' onClick={_ => helpers.remove(field)}><b>x</b></button>
        </React.Fragment>
      ))}
      <button type='button' onClick={_ => helpers.add(initialValue)}><b>+</b></button>
      {showError && <FormError {...{ error }} />}
    </div>
  )
}

export function FormObjectField({ field, render }) {
  console.log(`[${field.name}] render object field`)
  return render({ fields: field.fields })
}

export function FormFieldValue({ field, render }) {
  console.log(`[${field.name}] render value field`)
  const value = useFieldValue(field)
  return render({ value }) || null
}

function InputBase({ type, name, label, state, eventHandlers }) {
  const { value } = state
  console.log(`[${name}] render ${type} field`)
  return (
    <LabelAndError {...{ name, label, state }}>
      <input
        id={name}
        value={value === undefined ? '' : value}
        {...{ type }}
        {...eventHandlers}
      />
    </LabelAndError>
  )
}

function LabelAndError({ name, label, children, state }) {
  const { showError, error, invalid, isVisited, isSubmitted, hasFocus } = state
  return (
    <>
      <div>
        <label htmlFor={name}>{label}</label>
        {children}
        {(
          (hasFocus || isVisited || isSubmitted) && !invalid ? '✓' :
          hasFocus ? '-' :
          (isVisited || isSubmitted) && invalid && 'x'
        )}
      </div>
      {showError && <FormError {...{ error }} />}
    </>
  )
}

function FormError({ error }) {
  return <Code value={error} />
}
