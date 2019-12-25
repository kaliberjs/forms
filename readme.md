# Forms

A set of utilities to help you create forms in React.

## Motivation

Creating ad-hoc forms using React hooks is quite easy, but there is one thing that is a bit hard to
do: preventing to render the complete form on each keystroke.

Another motivation is to make form handling within our applications more consistent.

## Installation

```
yarn add @kaliber/forms
```

## Usage

Please look at the example for more advanced use-cases.

```jsx
import { useForm, useFormField, required, email } from '@kaliber/forms'

const validationErrors = {
  required: 'This field is required',
  email: 'This is not a valid e-mail',
}

export function Simple() {
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
```
![](https://media.giphy.com/media/c21EAVffi7zd6/giphy.gif)

## Missing feature?

If the library has a constraint that prevents you from implementing a specific feature (outside of the library) start a conversation.

If you think a feature should be added to the library because it solves a specific use case, discuss it to determine if the complexity of introducing it is worth it.

## Other libraries

Existing libraries have one or more of the following problems:

- Too big / too complex
- Not following the React philosophy
- Too much boilerplate for simple forms
- Validation results are
  - hard to translate
  - difficult to use in combination with accessibility principles
- Different guiding principles and trade-offs

## Guiding principles

- Static form structure
- No visual components
- Clean DSL for creating the form structure
- No async validation
- Minimal / small
- Translatable validation results
- Conscious complexity / usefulness / commonality trade-offs

## Disclaimer

This library is intended for internal use, we provide no support, use at your own risk. It does not import React, but expects it to be provided, which [@kaliber/build](https://kaliberjs.github.io/build/) can handle for you.

This library is not transpiled.
