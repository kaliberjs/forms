import {
  useForm,
  required, minLength, number, min, object, array, optional, max,
  email, message,
} from '@kaliber/forms'
import { FormTextInput, FormNumberInput, FormArrayField, FormValues, FormObjectField, FormFieldValue } from './Form'

export default function App() {
  return (
    <MyForm />
  )
}

const formFields = {
  // other2,
  // test: { type: 'test '},
  other: {},
  name: [required, minLength(3)],
  email: [required, email],
  nickname: [],
  age: [number, min(18), max(21)],
  address: object({
    street: required,
    city: [required],
  }),
  friends: array([minLength(1), weird], {
    name: required,
    email,
    emailAgain: equalTo('email'),
  }),
  otherFriends: array({
    name: required,
  }),

  books: {
    type: 'array',
    fields: {
      name: required,
      author: optional,
    }
  }
}

function MyForm() {
  const { form, submit, reset } = useForm({
    initialValues: {
      name: 'Test',
      age: '',
      friends: [{ name: 'Fred' }],
      // test: '',
    },
    fields: formFields,
    onSubmit: y => {
      console.log('submit', y)
    }
  })

  const [count, setCount] = React.useState(0)
  React.useEffect(
    () => {
      const id = setInterval(() => { setCount(x => x + 1) }, 5000)
      return () => { clearInterval(id) }
    },
    []
  )

  console.log('MyForm render, is that ok?')

  const { fields } = form

  return (
    <>
      <form onSubmit={submit}>
        <FormTextInput label='Naam' field={fields.name} />
        <FormTextInput label='E-mail' field={fields.email} />
        <FormNumberInput label='Leeftijd' field={fields.age} />
        <FormObjectField field={fields.address} render={({ fields }) => (
          <>
            <FormTextInput label='Straat' field={fields.street} />
            <FormTextInput label='Stad' field={fields.city} />
          </>
        )} />
        <FormArrayField field={fields.friends} render={({ id, fields, remove, value }) => (
          <div key={id}>
            <FormFieldValue field={fields.name} render={({ value }) => <div>{value}</div>} />
            <FormTextInput label='Friend name' field={fields.name} />
            <FormTextInput label='Friend email' field={fields.email} />
            <FormTextInput label='Email-again' field={fields.emailAgain} />
            <button type='button' onClick={remove}><b>x</b></button>
          </div>
        )} />
        <button type='submit'> - submit - </button>
        <button type='button' onClick={reset}> - reset - </button>
        <FormValues {...{ form }} />
      </form>
    </>
  )
}

function weird(x, { form }) {
  return form.name === 'henk' && minLength(2)(x)
}

function equalTo(field) {
  return (x, { parents }) => {
    const [parent] = parents.slice(-1)
    return parent[field] !== x && message('equalTo', field)
  }
}
