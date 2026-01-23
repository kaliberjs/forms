import { useFormFieldSnapshot, useFormField, useNumberFormField, useBooleanFormField, useArrayFormField, useObjectFormField } from '@kaliber/forms'
import { Code } from './Code'
import React from 'react'
/** @import { Field, InitialValue, PartialWithStringKey, Snapshot, State, ValidationError } from '@kaliber/forms/types' */

/**
 * @arg {{ form: Field.Object }} field
 */
export function FormValues({ form }) {
  const formState = useFormFieldSnapshot(form)
  return <Code value={formState} indent />
}

/**
 * @arg {{ label: string, field: Field.Basic<string | undefined> }} props
 */
export function FormTextInput({ field, label }) {
  const { name, state, eventHandlers } = useFormField(field)
  return <InputBase type='text' {...{ name, label, state, eventHandlers }} />
}

/**
 * @arg {{ label: string, field: Field.Basic<number | string> }} props
 */
export function FormNumberInput({ field, label }) {
  const { name, state, eventHandlers } = useNumberFormField(field)
  // We use type='text' to show `number` validation
  return <InputBase type='text' {...{ name, label, state, eventHandlers }} />
}

/**
 * @arg {{ label: string, field: Field.Basic<boolean | undefined> }} props
 */
export function FormCheckbox({ field, label }) {
  const { name, state, eventHandlers } = useBooleanFormField(field)
  const { value } = state
  console.log(`[${name}] render checkbox field`)
  return (
    <LabelAndError {...{ name, label, state }}>
      <input
        id={name}
        type='checkbox'
        checked={value || false}
        {...{ name }}
        {...eventHandlers}
      />
    </LabelAndError>
  )
}

/**
 * @arg {{
 *   label: string,
 *   field: Field.Basic<string[]>,
 *   options: { label: string, value: string }[]
 * }} props
 */
export function FormCheckboxGroupField({ field, options, label }) {
  const { name, state, eventHandlers: { onChange, ...eventHandlers } } = useFormField(field)
  const { value } = state

  console.log(`[${name}] render checkbox group field`)

  return (
    <FieldsetAndError {...{ label, state }}>
      {options.map((option, i) => {
        const id = `${name}__${i}`
        return (
          <div key={id}>
            <label htmlFor={id}>{option.label}</label>
            <input
              type='checkbox'
              value={option.value}
              checked={Array.isArray(value) && value.includes(option.value)}
              onChange={handleChangeFor(option.value)}
              {...eventHandlers}
              {...{ name, id }}
            />
          </div>
        )
      })}
    </FieldsetAndError>
  )

  /** @arg {string} changedValue */
  function handleChangeFor(changedValue) {
    /** @arg {React.ChangeEvent<HTMLInputElement>} e */
    return e => {
      const newValue =
        !Array.isArray(value) ? [changedValue] :
        value.includes(changedValue) ? value.filter(x => x !== changedValue) :
        value.concat(changedValue)

      onChange(newValue)
    }
  }
}

/**
 * @template {Field.ObjectFields} T
 * @template {React.ReactNode} R
 * @arg {{
 *   field: Field.Array<T>,
 *   render: (props: { name: string, fields: T }) => R,
 *   initialValue: PartialWithStringKey<Field.ObjectFieldsToValues<T>>
 * }} props
 */
export function FormArrayField({ field, render, initialValue }) {
  const { name, state: { children, error, showError }, helpers } = useArrayFormField(field)

  console.log(`[${name}] render array field`)

  return (
    <div>
      {children.map(field => (
        <React.Fragment key={field.name}>
          {render({
            name: field.name,
            fields: field.fields,
          })}
          <button type='button' onClick={_ => helpers.remove(field)}><b>x</b></button>
        </React.Fragment>
      ))}
      <button type='button' onClick={_ => helpers.add(initialValue)}><b>+</b></button>
      {showError && <FormError {...{ error }} />}
    </div>
  )
}

/**
 * @template {Field.ObjectFields} T
 * @template {React.ReactNode} R
 * @arg {{
*   field: Field.Array<T>,
*   render: (props: { name: string, fields: T, value: Field.ObjectFieldsToValues<T> }) => R,
*   types: { name: string, initialValue: PartialWithStringKey<Field.ObjectFieldsToValues<T>> }[]
* }} props
*/
export function FormHeterogeneousArrayField({ field, render, types }) {
  const { name, state: { children, error, showError }, helpers } = useArrayFormField(field)

  console.log(`[${name}] render heterogeneous array field`)

  return (
    <div>
      {children.map(field => (
        <React.Fragment key={field.name}>
          {render({
            name: field.name,
            fields: field.fields,
            value: field.value.get(),
          })}
          <button type='button' onClick={_ => helpers.remove(field)}><b>x</b></button>
        </React.Fragment>
      ))}
      {types.map(type =>
        <button key={type.name} type='button' onClick={_ => helpers.add(type.initialValue)}><b>+ {type.name}</b></button>
      )}
      {showError && <FormError {...{ error }} />}
    </div>
  )
}

/**
 * @template {Field.ObjectFields} T
 * @template {React.ReactNode} R
 * @arg {{ field: Field.Object<T>, render: (props: { fields: T }) => R }} props
 */
export function FormObjectField({ field, render }) {
  const { name, state: { error, showError }, fields } = useObjectFormField(field)

  console.log(`[${name}] render object field`)

  return (
    <div>
      {render({ fields })}
      {showError && <FormError {...{ error }} />}
    </div>
  )
}

/**
 * @arg {{
 *   type: string,
 *   name: string,
 *   label: string,
 *   state: State.Basic<string | number | undefined>,
 *   eventHandlers: Field.Basic<string>['eventHandlers'],
 * }} props
 */
function InputBase({ type, name, label, state, eventHandlers }) {
  const { value } = state
  console.log(`[${name}] render ${type} field`)
  return (
    <LabelAndError {...{ name, label, state }}>
      <input
        id={name}
        value={value === undefined ? '' : value}
        {...{ name, type }}
        {...eventHandlers}
      />
    </LabelAndError>
  )
}

/**
 * @arg {{
 *   name: string,
 *   label: string,
 *   children: React.ReactNode,
 *   state: State.Common,
 * }} props
 */
function LabelAndError({ name, label, children, state }) {
  const { showError, error } = state
  return (
    <>
      <div>
        <label htmlFor={name}>{label}</label>
        {children}
        {determineIndicator(state)}
      </div>
      {showError && <FormError {...{ error }} />}
    </>
  )
}

/**
 * @arg {{
 *   label: string,
 *   children: React.ReactNode,
 *   state: State.Common,
 * }} props
 */
function FieldsetAndError({ label, children, state }) {
  const { showError, error } = state
  return (
    <fieldset>
      <legend>{label}</legend>
      {children}
      {determineIndicator(state)}
      {showError && <FormError {...{ error }} />}
    </fieldset>
  )
}

/**
 * @arg {{ error: ValidationError }} props
 */
function FormError({ error }) {
  return <Code value={error} />
}

/**
 * @arg {State.Common} state
 */
function determineIndicator(state) {
  const { invalid, isVisited, isSubmitted, hasFocus } = state

  return (
    (hasFocus || isVisited || isSubmitted) && !invalid ? '✓' :
    hasFocus ? '-' :
    (isVisited || isSubmitted) && invalid && 'x'
  )
}
