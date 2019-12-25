import {
  useForm, useFormField, useNumberFormField, useArrayFormField, useFieldValue,
  required, minLength, number, min, object, array, optional,
  email, message,
} from '@kaliber/forms'

export default function App() {

  return (
    <MyForm />
  )
}

function MyForm() {
  const { form, submit } = useForm({
    initialValues: {
      name: 'Test',
      age: '',
      friends: [{ name: 'Fred' }],
      // test: '',
    },
    fields: {
      // other2,
      // test: { type: 'test '},
      other: {},
      name: [required, minLength(3)],
      email: [required, email],
      nickname: [],
      age: [number, min(18)],
      address: object({
        street: required,
        city: [required, (x, ...context) => console.log('city context', context)],
      }),
      friends: array([minLength(1), weird], {
        name: required,
        email,
        emailAgain: equalToEmail,
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
    },
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
        <TextInput field={fields.name} label='Name' />
        <TextInput field={fields.email} label='Email' />
        <NumberInput field={fields.age} label='Leeftijd' />
        <TextInput field={fields.address.fields.street} label='Street' />
        <TextInput field={fields.address.fields.city} label='City' />
        <ArrayField field={fields.friends} render={({ id, fields, remove }) => (
          <div key={id}>
            <TextInput field={fields.name} label='Friend name' />
            <TextInput field={fields.email} label='Friend email' />
            <TextInput field={fields.emailAgain} label='Email-again' />
            <button type='button' onClick={remove}>-</button>
          </div>
        )} />
        <button type='submit'>submit</button>
        <FormValues {...{ form }} />
      </form>
    </>
  )
}

function weird(x, { form }) {
  return form.name === 'henk' && minLength(2)(x)
}

function equalToEmail(x, { parents }) {
  console.log(parents)
  const [parent] = parents.slice(-1)
  return parent.email !== x && message('equal', 'email')
}

function ArrayField({ field, render }) {
  const { name, state: { children, error, showError }, helpers } = useArrayFormField(field)

  console.log(`[${name}] render array field`)

  return (
    <div>
      {children.map(field => render({
        id: field.name,
        fields: field.fields,
        remove: () => { helpers.remove(field) }
      }))}
      <button type='button' onClick={_ => helpers.add({})}>+</button>
      {showError && <p>{JSON.stringify(error)}</p>}
    </div>
  )
}

function FormValues({ form }) {
  const formState = useFieldValue(form)
  return <pre><code>{JSON.stringify(formState, null, 2)}</code></pre>
}

function TextInput({ field, label }) {
  const { name, state, eventHandlers } = useFormField(field)
  return <InputBase type='text' {...{ name, label, state, eventHandlers }} />
}

function NumberInput({ field, label }) {
  const { name, state, eventHandlers } = useNumberFormField(field)

  return <InputBase type='text' {...{ name, label, state, eventHandlers }} />
}

function InputBase({ type, name, label, state, eventHandlers }) {
  const { value, invalid, error, showError } = state
  console.log(`[${name}] render ${type} field`)
  return (
    <>
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        value={value === undefined ? '' : value}
        {...{ type }}
        {...eventHandlers}
      />{!invalid && '✓'}
      <br />
      {showError && <p>{JSON.stringify(error)}</p>}
    </>
  )
}
