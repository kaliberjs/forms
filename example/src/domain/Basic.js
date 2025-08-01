import { useForm, useFormField } from '@kaliber/forms'
import { string } from '@kaliber/forms/src/validation'
import { required, email, optional } from '@kaliber/forms/validation'

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
      nonValidatedValue: ''
    },

    // create the form structure, fields are essentially their validation functions
    fields: {
      name: required,
      email: [required, email],
      nonValidatedValue: null,
      fieldWithoutInitialValue: optional,
      fieldToBeValidatedAsString: [string]
    },

    // handle form submit
    onSubmit: snapshot => {
      if (!snapshot.invalid)
        console.log(snapshot)
    },
  })

  // Gemini: why is this still value of any while we know it is exclusively a string?
  fields.name.value.get()
  fields.fieldWithoutInitialValue.value.get()
  fields.nonValidatedValue.value.get()
  fields.fieldToBeValidatedAsString.value.get()

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
