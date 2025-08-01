import { useForm, useFormField } from '@kaliber/forms'
import { required, email } from '@kaliber/forms/validation'

const validationErrors = {
  required: 'This field is required',
  email: 'This is not a valid email',
}

/**
 * @template T
 * @typedef {import('@kaliber/forms/types/index.d.ts').UseFormOptions<T>} UseFormOptions
 * */

const initialValues = {
  name: '',
  email: '',
}

export function Basic() {
  const { form: { fields }, submit } = useForm(/** @type {UseFormOptions<typeof initialValues>} */({
    // provide initial values to populate the form with
    initialValues,

    // create the form structure, fields are essentially their validation functions
    fields: {
      name: required,
      email: [required, email],
    },

    // handle form submit
    onSubmit: snapshot => {
      if (!snapshot.invalid)
        console.log(snapshot)
    },
  }))

  return (
    <form onSubmit={submit}>
      <TextInput label='Name' field={fields.name} />
      <TextInput label='Email' field={fields.email} />
      <button type='submit'>Submit</button>
    </form>
  )
}

function TextInput({ label, field }) {
  const { name, state, eventHandlers } = useFormField(field)
  const { value = '', error, showError } = state

  return (
    <>
      <div>
        <label htmlFor={name}>{label}</label>
        <input id={name} type='text' {...{ name, value }} {...eventHandlers} />
      </div>

      {showError && (
        <p>{validationErrors[error.id]}</p>
      )}
    </>
  )
}
