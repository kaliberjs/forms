import { useForm, useFormField, useFormState, useArrayFormField } from '@kaliber/forms'

export default function App() {

  return (
    <MyForm />
  )
}
function object(fields) { return { type: 'object', fields } }
// /**
//  * @template A
//  * @template B
//  *
//  * @type {(fieldsOrValidate: A, fields: B | undefined) => forms.IfAny<B, { type: 'array', fields: A, validate: undefined }> | forms.IfNotAny<B, { type: 'array', fields: B, validate: A }>}
//  */
/**
 * @typedef {[forms.Fields]} OptionA
 * @typedef {[forms.Validate, forms.Fields]} OptionB
 */
/**
 * @template {OptionA | OptionB} T
 * @param {T} args
 *
 * @returns {forms.If<T, OptionA, { type: 'array', fields: T[0], validate: undefined }> | forms.If<T, OptionB, { type: 'array', fields: T[1], validate: T[0] }>}
 */
function array(...[fieldsOrValidate, fields]) {
  return /** @type {forms.If<T, OptionA, { type: 'array', fields: T[0], validate: undefined }> | forms.If<T, OptionB, { type: 'array', fields: T[1], validate: T[0] }>}  */ (
    { type: 'array', fields: fields || fieldsOrValidate, validate: fields && fieldsOrValidate }
  )
}
function message(id, ...params) {
  return { id, params }
}
const required = { validate: x => !x && message('required') }
const optional = {}
function minLength(min) { return { validate: x => x.length < min && message('min-length', min) } }
const number = {
  validate: x => Number(x) !== x && message('not-a-number'),
}
function min(min) {
  return { validate: x => x < min && message('min', min) }
}

function MyForm() {
  const z1 = array(minLength(1), {
    name: required,
  })
  const z2 = array({
    name: required,
  })
  const other2 = {
    type: 'string'
  }
  const { fields, submit } = useForm({
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
      nickname: [],
      age: [number, min(18)],
      // address: object({
      //   street: required,
      //   city: required,
      // }),
      friends: array(minLength(1), {
        name: required,
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
    onSubmit: x => {
      const z = x.friends
      z.forEach(x => x.name)
      x.other
      x.nickname
    }
  })

  console.log('MyForm render, is that ok?')

  return (
    <>
      <form onSubmit={submit}>
        <TextInput field={fields.name} label='Name' />
        <NumberInput field={fields.age} label='Leeftijd' />
        <ArrayField field={fields.friends} render={({ id, fields }) => (
          <div key={id}>
            <TextInput key={fields.name.id} field={fields.name} label='Friend name' />
          </div>
        )} />
        <button type='submit'>submit</button>
        <FormValues {...{ fields }} />
      </form>
    </>
  )
}

function ArrayField({ field, render }) {
  const { id, state: { value, error, showError }, helpers } = useArrayFormField(field)

  console.log(`[${id}] render array field`)

  return (
    <div {...{ id }}>
      {value.map((fields, i) => render({ id: i, fields, helpers }))}
      <button type='button' onClick={_ => helpers.add({})}>+</button>
      {showError && <p>{JSON.stringify(error)}</p>}
    </div>
  )
}

function FormValues({ fields }) {
  const formState = useFormState(fields)
  return <pre><code>{JSON.stringify(formState, null, 2)}</code></pre>
}

function TextInput({ field, label }) {
  const { name, state, eventHandlers } = useFormField(field)
  return <InputBase {...{ name, label, state, eventHandlers }} />
}

function NumberInput({ field, label }) {
  const { name, state, eventHandlers: { onChange, ...originalEventHandlers } } = useFormField(field)
  const eventHandlers = { ...originalEventHandlers, onChange: handleChange }

  return <InputBase {...{ name, label, state, eventHandlers }} />

  function handleChange(e) {
    const userValue = e.target.value
    const value = Number(userValue)
    onChange(userValue === '' || Number.isNaN(value) ? userValue : value)
  }
}

function InputBase({ type = 'text', name, label, state, eventHandlers }) {
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
