import { useForm, useFormField } from '@kaliber/forms'
import { required, email } from '@kaliber/forms/validation'

const validationErrors = {
  required: 'This field is required',
  email: 'This is not a valid e-mail',
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
      name: required,
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

  function handleSubmit(snapshot) {
    // note that the snapshot can still be invalid
    console.log(snapshot)
  }
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
      {showError && <p>{validationErrors[error.id]}</p>}
    </>
  )
}
