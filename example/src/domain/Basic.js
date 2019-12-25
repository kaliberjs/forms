import { useForm, useFormField, required, email } from '@kaliber/forms'

const validationErrors = {
  required: 'This field is required',
  email: 'This is not a valid e-mail',
}

export function Basic() {
  const { form: { fields }, submit } = useForm({
    initialValues: {
      name: '',
      email: '',
    },
    fields: {
      name: required,
      email: [required, email],
    },
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
    console.log(snapshot)
  }
}

function TextInput({ label, field }) {
  const { name, state, eventHandlers } = useFormField(field)
  const { value, error, showError } = state
  return (
    <>
      <div>
        <label htmlFor={name}>{label}</label>
        <input
          id={name}
          type='text'
          value={value === undefined ? '' : value}
          {...eventHandlers}
        />
      </div>
      {showError && <p>{validationErrors[error.id]}</p>}
    </>
  )
}
