import { useFieldValue, useFormField, useNumberFormField, useArrayFormField } from '@kaliber/forms'

export function FormValues({ form }) {
  const formState = useFieldValue(form)
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

export function FormArrayField({ field, render }) {
  const { name, state: { children, error, showError }, helpers, value } = useArrayFormField(field)

  console.log(`[${name}] render array field`)

  return (
    <div>
      {children.map(field => render({
        id: field.name,
        fields: field.fields,
        remove: () => { helpers.remove(field) }
      }))}
      <button type='button' onClick={_ => helpers.add({})}><b>+</b></button>
      {showError && <FormError {...{ error }} />}
    </div>
  )
}

export function FormObjectField({ field, render }) {
  return render({ fields: field.fields })
}

export function FormFieldValue({ field, render }) {
  const { value } = useFieldValue(field)
  return render({ value })
}

function InputBase({ type, name, label, state, eventHandlers }) {
  const { value, invalid, error, showError, isVisited, isSubmitted } = state
  console.log(`[${name}] render ${type} field`)
  return (
    <>
      <div>
        <label htmlFor={name}>{label}</label>
        <input
          id={name}
          value={value === undefined ? '' : value}
          {...{ type }}
          {...eventHandlers}
        />{!invalid ? '✓' : (isVisited || isSubmitted) && 'x'}
      </div>
      {showError && <FormError {...{ error }} />}
    </>
  )
}

function FormError({ error }) {
  return <Code value={error} />
}

function Code({ value, indent = false }) {
  return <pre><code>{JSON.stringify(value, null, indent ? 2 : 0)}</code></pre>
}
