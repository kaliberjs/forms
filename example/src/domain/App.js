import { useForm, useFormField, useFormState } from '@kaliber/forms'

export default function App() {

  return (
    <MyForm />
  )
}

function MyForm() {
  const [fields, handleSubmit] = useForm({
    initialValues: {
      name: 'Test',
    },
    fields: {
      name: [{ required: true }, { label: 'Name' }],
    }
  })

  console.log('MyForm render, is that ok?')

  return (
    <>
      <form onSubmit={handleSubmit}>
        <TextInput field={fields.name} />
        <FormValues {...{ fields }} />
      </form>
    </>
  )
}

function FormValues({ fields }) {
  const formState = useFormState(fields)
  return <pre><code>{JSON.stringify(formState, null, 2)}</code></pre>
}

function TextInput({ field }) {
  const [
    { id, name, value, error, showError, eventHandlers },
    { label }
  ] = useFormField(field)

  return (
    <>
      <label htmlFor={id}>{label}</label>
      <input type='text' {...{ id, name, value }} {...eventHandlers} />
      {showError && <p>{error}</p>}
    </>
  )
}
