import { useForm, useFormField } from '@kaliber/forms'
import { required, email, requiredT } from '@kaliber/forms/validation'
/** @import { Field } from '@kaliber/forms/types' */

const validationErrors = {
  required: 'This field is required',
  email: 'This is not a valid email',
}

export function Basic() {
  const { form: { fields }, submit } = useForm({
    // provide initial values to populate the form with
    initialValues: {
      name: '',
      email: '',
    },
    // create the form structure, fields are essentially their validation functions
    fields: {
      name: requiredT('string'),
      email: [required, email],
    },
    // handle form submit
    onSubmit: handleSubmit,
  })

  return (
    <form onSubmit={submit}>
      <TextInput label='Name' field={fields.name} />
      <TextInput label='Email' field={fields.email} />
      <button type='submit'>Submit</button>
    </form>
  )

  /** @arg {any} snapshot */
  function handleSubmit(snapshot) {
    // note that the snapshot can still be invalid
    console.log(snapshot)
  }
}

/** @arg {{ label: string, field: Field.Basic<string> }} props */
function TextInput({ label, field }) {
  const { name, state, eventHandlers } = useFormField(field)
  const { value = '', error, showError } = state
  return (
    <>
      <div>
        <label htmlFor={name}>{label}</label>
        <input id={name} type='text' {...{ name, value }} {...eventHandlers} />
      </div>
      {showError && <p>{hasKey(validationErrors, error.id) ? validationErrors[error.id] : 'unkown error'}</p>}
    </>
  )
}

/** @arg {object} o @arg {string} k @returns {k is keyof o} */
function hasKey(o, k) {
  return k in o
}
