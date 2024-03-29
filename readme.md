# Forms

A set of utilities to help you create forms in React.

- [Motivation](#motivation)
- [Installation](#installation)
- [Usage](#usage)
- [Reference](#reference)
  - [Hooks](#hooks)
  - [Schema](#schema)
  - [Validation](#validation)
  - [Components](#components)
- [Missing feature?](#missing-feature?)
- [Other libraries](#other-libraries)
- [Guiding principles](#guiding-principles)
- [Disclaimer](#disclaimer)

## Motivation

Creating ad-hoc forms using React hooks is quite easy, but there is one thing that is a bit hard to
do: preventing to render the complete form on each keystroke.

Another motivation is to make form handling within our applications more consistent.

## Installation

```
yarn add @kaliber/forms
```

## Usage

_Please look at the example for more advanced use-cases._

```jsx
import { useForm, useFormField } from '@kaliber/forms'
import { required, email } from '@kaliber/forms/validation'

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
```

![](https://media.giphy.com/media/c21EAVffi7zd6/giphy.gif)

## Reference

_See the example for use cases_

- [Hooks](#hooks)
  - [useForm](#useForm)
  - [useFormField](#useFormField)
  - [useNumberFormField](#useNumberFormField)
  - [useBooleanFormField](#useBooleanFormField)
  - [useArrayFormField](#useArrayFormField)
  - [useObjectFormField](#useObjectFormField)
  - [useFormFieldSnapshot](#useFormFieldSnapshot)
  - [useFormFieldValue](#useFormFieldValue)
  - [useFormFieldsValues](#useFormFieldsValues)
- [Schema](#schema)
  - [array](#array)
  - [object](#object)
- [Validation](#validation)
- [Components](#components)
  - [FormFieldValue](#FormFieldValue)
  - [FormFieldsValues](#FormFieldsValues)
  - [FormFieldValid](#FormFieldValid)


### Hooks

```js
import { ... } from '@kaliber/forms'
```

#### useForm

Defines a form.

```js
const {
  form, // 'object' field containing the form
  submit, // handler that can be used to submit the form
  reset, // handler that can be used to reset the form
} = useForm({
  fields, // form structure
  initialValues, // (optional) initial form values
  validate, // (optional) validation for the complete form
  onSubmit, // called when the form is submitted
  formId, // (optional) a custom id, can be useful when multiple forms are placed on the same page
})
```

| Input          |                                                                               |
|----------------|-------------------------------------------------------------------------------|
|`fields`        | An object with the shape: `{ [name: string]: FormField }`.|
|`initialValues` | An object with the shape: `{ [name: keyof fields]: ValueFor<fields[name]> }`|
|`validate`      | One of `Validate` or `Array<Validate>`|
|`onSubmit`      | A function that accepts a `Snapshot`|
|                |                                                                               |
|`FormField`     | One of `BasicField`, `ArrayField` or `ObjectField`|
|`BasicField`    | One of `null`, `Validate` or `Array<Validate>`|
|`ArrayField`    | Created with `array(fields)` or `array(validate, fields)`|
|`ObjectField`   | Created with `object(fields)` or `object(validate, fields)`|
|                |                                                                               |
|`Validate`      | A function with the following shape: `(x, { form, parents }) => falsy | { id, params }`|
|                |                                                                               |
|`ValueFor<BasicField>` | Value can be anything and depends on the value passed to `onChange`|
|`ValueFor<ArrayField>` | Value is an array with objects mirroring the `fields` of that array|
|`ValueFor<ObjectField>`| Value is an object mirroring the `fields` of that object|
|                |                                                                               |
|`Snapshot`| An object with the following shape: `{ invalid, value, error }`|

| Output         |                                                                               |
|----------------|-------------------------------------------------------------------------------|
|`form`          | An object with the shape: `{ fields: { [name: string]: FormField } }`. Note that `form` is an `ObjectField`|
|`submit`        | A function that can be used as `onSubmit` handler|
|`reset`         | A function that can be used to reset the form|
|                |                                                                               |
|`FormField`     | One of `BasicField`, `ArrayField` or `ObjectField`|
|`BasicField`    | Can be used with the [`useFormField`](#useFormField) hook|
|`ArrayField`    | Can be used with the [`useArrayFormField](#useArrayFormField) hook|
|`ObjectField`   | Can be used with the [`useObjectFormField](#useObjectFormField) hook|

#### useFormField

Subscribes to state changes in the form field and provides the event handlers for form elements.

```jsx
const {
  name, // the fully qualified name of the form field
  state, // 'object' that contains the form field state
  eventHandlers, // 'object' that contains handlers which can be used by form elements
} = useFormField(field)
```

| Output         |                                                                               |
|----------------|-------------------------------------------------------------------------------|
|`name`          | The fully qualified name of the form field|
|`state`         | An object|
|`- value`       | The value of the field|
|`- error`       | The validation error for the field|
|`- isSubmitted` | Indicates if the form was submitted|
|`- isVisited`   | Indicates if the field has been visited (had focus)|
|`- hasFocus`    | Indicates if the field currently has focus|
|`- invalid`     | The same as `!!error`|
|`- showError`   | Handy derived boolean to determine when to show an error|
|`eventHandlers` | An object|
|`- onBlur`      | Handler for `onBlur` events|
|`- onFocus`     | Handler for `onFocus` events|
|`- onChange`    | handler for `onChange` events, accepts DOM event or value|

#### useNumberFormField

Specialized version of [`useFormField`](#useFormField) that converts the value to a a number if possible.

#### useBooleanFormField

Specialized version of [`useFormField`](#useFormField) that uses the checked state of the event target as value.

#### useArrayFormField

Subscribes to state changes in the form field and provides helpers for the array field.

```jsx
const {
  name, // the fully qualified name of the form field
  state, // 'object' that contains the form field state
  helpers, // 'object' that contains handlers that can be used to manipulate the array field
} = useArrayFormField(field)
```

| Output         |                                                                               |
|----------------|-------------------------------------------------------------------------------|
|`name`          | The fully qualified name of the form field|
|`state`         | An object |
|`- children`    | The child fields (these are `object` type fields)|
|`- error`       | The validation error for the field|
|`- isSubmitted` | Indicates if the form was submitted|
|`- invalid`     | The same as `!!error`|
|`- showError`   | Handy derived boolean to determine when to show an error|
|`helpers`       | An object|
|`- add`         | Handler to add a field, accepts an `initialValue` for the child field|
|`- remove`      | Handler to remove a field, accepts the child field|

#### useObjectFormField

Subscribes to state changes in the form field and provides the fields of the object.

```jsx
const {
  name, // the fully qualified name of the form field
  state, // 'object' that contains the form field state
  fields, // 'object' containing the fields
} = useObjectFormField(field)
```

| Output         |                                                                               |
|----------------|-------------------------------------------------------------------------------|
|`name`          | The fully qualified name of the form field|
|`state`         | An object |
|`- error`       | The validation error for the field|
|`- isSubmitted` | Indicates if the form was submitted|
|`- invalid`     | The same as `!!error`|
|`- showError`   | Handy derived boolean to determine when to show an error|
|`fields`        | An object containing the fields|

#### useFormFieldSnapshot

Subscribes to the state of a field (or form).

```jsx
const snapshot = useFormFieldSnapshot(form)
```

| Output         |                                                                               |
|----------------|-------------------------------------------------------------------------------|
|`snapshot`      | An object |
|`- invalid`     | Boolean indicating whether the field is invalid|
|`- error`       | One of `BasicError`, `ObjectError` or `ArrayError`|
|`- value`       | The value of the field|
|                |                                                                               |
|`BasicError`    | The result of the validation function|
|`ObjectError`   | An object with the shape: `{ self, children }` where `self` is a `BasicError` and children an object with errors|
|`ArrayError`    | An object with the shape: `{ self, children }` where `self` is a `BasicError` and children an array with errors|

#### useFormFieldValue

Subscribes to the value of a field (or form).

```jsx
const value = useFormFieldValue(field)
```

| Output         |                                                                               |
|----------------|-------------------------------------------------------------------------------|
|`value`         | The value of the field. |

#### useFormFieldsValues

Subscribes to the values of multiple fields (or forms).

```jsx
const values = useFormFieldsValues(fields)
```

| Output         |                                                                               |
|----------------|-------------------------------------------------------------------------------|
|`values`        | An array with the values of the fields. |

### Schema

```js
import { ... } from '@kaliber/forms'
```

#### array

Used to create an array form field.

```jsx
array(validationOrFields, fields)
```

Has two signatures:
```js
array(validation, fields)
array(fields)
```

If you want to use heterogeneous arrays (different types) you can use a `function` instead of a `fields` object:

```js
array(initialValue => ({
  _type: required,
  ...(
    initialValue._type === 'content' ? { text: required } :
    initialValue._type === 'image' ? { image: required } :
    null
  )
}))
```

When rendering the `array` field you can render a different component based on the value of the field:

```jsx
const { state: { children }, helpers } = useArrayFormField(field)

return (
  <>
    {children.map(field => {
      const { _type } = field.value.get()
      return (
        _type === 'content' ? <ContentForm key={field.name} {...{ field }} /> :
        _type === 'image' ? <ImageForm key={field.name} {...{ field }} /> :
        null
      )
    })}
    <button type='button' onClick={_ => helpers.add({ _type: 'content' })}>Add content</button>
    <button type='button' onClick={_ => helpers.add({ _type: 'image' })}>Add image</button>
  </>
)
```

#### object

Used to create an object form field.

```jsx
object(validationOrFields, fields)
```

Has two signatures:
```js
object(validation, fields)
object(fields)
```

### Validation

Validation functions have this shape: `(value, { form, parents }) => falsy | { id, params }`

| Input          |                                                                               |
|----------------|-------------------------------------------------------------------------------|
|`value`         | The value of the form field |
|`form`          | The value of the complete form|
|`parents`       | An array with the values of the parents (when using object or array fields)|

| Output         |                                                                               |
|----------------|-------------------------------------------------------------------------------|
|`id`            | An identifier to translate the error into something for people |
|`params`        | Parameters useful for constructing the validation error |


We provide a few commonly used validation functions.

```js
import { ... } from '@kaliber/forms/validation'
```

|                            |                                                                   |
|----------------------------|-------------------------------------------------------------------|
|`required`                  | Reports when the value is 'falsy' and not `0` or `false`.|
|`optional`                  | An alias for `null`, it's there for consistency and readability.|
|`number`                    | Reports if the value can not be converted to a number.|
|`min` and `max`             | Reports if the value is outside of the given value.|
|`minLength` and `maxLength` | Reports if the `length` of the value is outside of the given value.|
|`email`                     | Reports if the value does not vaguely look like an email address.|
|`error`                     | Utility to create an error object.|

### Components

When you want to conditionally render or set some props based on your current form state, you should avoid the use of `useFormFieldSnapshot` or `useFormFieldValue` in your form root, since that will re-render your entire form with each change. Rather you should create a specialised component and make the values available through a render prop.

Because this is such a common usecase, we provide several of these components.

#### FormFieldValue

| Props   |                                                                                      |
|---------|--------------------------------------------------------------------------------------|
|`render` | A function with the following shape: `value => React.ReactNode | null`. Will render the return value, or `null` in case this value is `undefined`. |
|`field`  | The field whose value is used as the `value` argument when calling `render`.|

##### Example

```jsx
<FormFieldValue field={fields.subscribeToNewsletter} render={value => (
  value && <TextInput label='Email' field={fields.email} />
)}>
```

#### FormFieldsValues

| Props   |                                                                                      |
|---------|--------------------------------------------------------------------------------------|
|`render` | A function with the following shape: `values => React.ReactNode | null`, where `values` is an array. Will render the return value, or `null` in case this value is `undefined`. |
|`fields`  | The fields whose values are used as the `values` argument when calling `render`.|

##### Example

```jsx
<FormFieldValue field={[fields.firstName, fields.lastName]} render={([firstName, lastName]) => (
  firstName && lastName && <Greeting>{firstName} {lastName}</Greeting>
)}>
```

#### FormFieldValid

| Props   |                                                                                      |
|---------|--------------------------------------------------------------------------------------|
|`render` | A function with the following shape: `valid => React.ReactNode | null`. Will render the return value, or `null` in case this value is `undefined`. |
|`field`  | The field whose validity state is used as the `valid` argument when calling `render`.|

##### Example

```jsx
<FormFieldValid field={form} render={valid => (
  <Button type="submit" disabled={!valid}>Verstuur</Button>
)}>
```

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
