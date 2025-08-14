import { object } from '@kaliber/forms'
import { useForm, useFormField } from '@kaliber/forms/src/hooks'
import { error, string } from '@kaliber/forms/src/validation'
import { required, email, optional } from '@kaliber/forms/validation'

const validationErrors = {
  required: 'This field is required',
  email: 'This is not a valid email',
}

/** @type {import('@kaliber/forms').Validate<string>} */
const customValidator = x => typeof x === 'string' && x && error('custom')

/** @type {import('@kaliber/forms').Validate<string>} */
const optionalString = () => optional()

export function Basic() {
  const { form: { fields }, submit } = useForm({
    // provide initial values to populate the form with
    initialValues: {
      name: '',
      email: '',
      nonValidatedValue: '',
      someObjectWithInitialValues: {
        value: '',
        isEnabled: true,
      },
    },

    // create the form structure, fields are essentially their validation functions
    fields: {
      name: required,
      email: [required, email],
      nonValidatedValue: null,
      fieldWithoutInitialValueAsAny: optional,
      fieldWithoutInitialValueAsOptionalString: optionalString,
      fieldWithoutInitialValueAsString: [optional, string],
      fieldWithCustomValidator: [optionalString, customValidator],
      fieldToBeValidatedAsString: [string],
      someObjectWithInitialValues: object({
        value: [required, string],
        isEnabled: optional,
      }),
      someObjectWithoutInitialValues: object({
        value: [required, string],
        isEnabled: optional,
      }),
    },

    // handle form submit
    onSubmit: snapshot => {
      if (!snapshot.invalid)
        console.log(snapshot)
    },
  })

  console.log({
    // This should be any
    fieldWithoutInitialValueAsAny: fields.fieldWithoutInitialValueAsAny.value.get(),

    // This should be a string
    fieldWithoutInitialValueAsString: fields.fieldWithoutInitialValueAsString.value.get(),

    // This should be a string
    nonValidatedValue: fields.nonValidatedValue.value.get(),

    // This should be a string
    fieldWithCustomValidator: fields.fieldWithCustomValidator.value.get(),

    // This should be a string
    fieldToBeValidatedAsString: fields.fieldToBeValidatedAsString.value.get(),

    // This should be an object with a value and isEnabled
    someObject: fields.someObjectWithInitialValues.value.get(),

    // This should be an object with a value and isEnabled
    someObjectWithoutInitialValues: fields.someObjectWithoutInitialValues.value.get(),
  })

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
