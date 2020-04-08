import { useFormFieldSnapshot, useFormFieldValue, useFormField, useNumberFormField, useBooleanFormField, useArrayFormField, useObjectFormField } from '@kaliber/forms'
import { Code } from './Code'

export function FormValues({ form }) {
  const formState = useFormFieldSnapshot(form)
  return <Code value={formState} indent />
}

export function FormTextInput({ field, label }) {
  const { name, state, eventHandlers } = useFormField(field)
  return <InputBase type='text' {...{ name, label, state, eventHandlers }} />
}

export function FormNumberInput({ field, label }) {
  const { name, state, eventHandlers } = useNumberFormField(field)
  // We use type='text' to show `number` validation
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
        {...{ name }}
        {...eventHandlers}
      />
    </LabelAndError>
  )
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
  const { name, state: { error, showError }, fields } = useObjectFormField(field)

  console.log(`[${name}] render object field`)

  return (
    <div>
      {render({ fields })}
      {showError && <FormError {...{ error }} />}
    </div>
  )
}
export function FormFieldValue({ field, render }) {
  console.log(`[${field.name}] render value field`)
  const value = useFormFieldValue(field)
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
        {...{ name, type }}
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
