import isEqual from 'react-fast-compare'
import { createObjectFormField } from './fields'
import { normalize } from './normalize'
import * as snapshot from './snapshot'
import { asAny } from './type-helpers'
/** @import { Validate, NormalizedField, Field, InitialValue, FieldInput, State, Snapshot, Expand, MapTuple } from './types.ts' */

let formCounter = 0 // This will stop working when we need a number greater than 9007199254740991
function useFormId() { return React.useMemo(() => `form${++formCounter}`, []) }

/**
 * @template {FieldInput.Object} const A
 * @template {Validate<FieldInput.ObjectToValue<A>>} const C
 *
 * @arg {{
 *   fields: A,
 *   initialValues?: Expand<InitialValue<A>>,
 *   validate?: C,
 *   onSubmit: (snapshot: any) => void,
 *   formId?: string,
 * }} props
 */
// eslint-disable-next-line react-hooks/rules-of-hooks
export function useForm({ initialValues = undefined, fields, validate = undefined, onSubmit, formId = useFormId() }) {
  const initialValuesRef = React.useRef(/** @type {InitialValue<A> | undefined} */ (asAny(null)))
  const formRef = React.useRef(/** @type {Field.ObjectFromObjectInput<A>} */ (asAny(null)))

  if (!isEqual(initialValuesRef.current, initialValues)) {
    initialValuesRef.current = initialValues
    const form = createObjectFormField({
      name: formId,
      initialValue: initialValues,
      field: normalize({ type: 'object', fields, validate })
    })
    form.validate({ form: initialValues, parents: [] })
    form.value.subscribe(value => form.validate({ form: value, parents: [] }))
    formRef.current = form
  }

  const submit = React.useCallback(handleSubmit, [onSubmit])
  const reset = React.useCallback(handleReset, [])

  return { form: formRef.current, submit, reset }

  /** @arg {React.FormEvent<HTMLFormElement>} e */
  function handleSubmit(e) {
    if (e) e.preventDefault()
    formRef.current.setSubmitted(true)
    onSubmit(snapshot.get(formRef.current))
  }

  function handleReset() {
    formRef.current.reset()
  }
}

/**
 * @template {State.Readonly} T
 * @arg {T} state
 * @returns {T extends State.Readonly<infer X> ? X : never}
 */
function useFormFieldState(state) {
  const [formFieldState, setFormFieldState] = React.useState(state.get)

  React.useEffect(
    () => {
      setFormFieldState(state.get())
      return state.subscribe(setFormFieldState)
    },
    [state]
  )

  return formFieldState
}

/**
 * @template {[...State.Readonly[]]} const T
 * @arg {T} states
 */
function useFieldStates(states) {
  const [fieldStates, setFieldStates] = React.useState(getStates)

  React.useEffect(
    () => {
      setFieldStates(getStates())
      return states.reduce(
        (previous, x) => {
          const unsubscribe = x.subscribe(_ => setFieldStates(getStates()))
          return () => {
            previous()
            unsubscribe()
          }
        },
        () => {}
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    states // explanation below on why we supply the array directly
  )

  return fieldStates

  function getStates() {
    return /** @type {State.StateTupleToValueTuple<T>}*/ (states.map(x => x.get()))
  }
}

/**
 * @template {Field} T
 * @arg {T} field
 * @returns {Expand<Snapshot.FromField<T>>}
 */
export function useFormFieldSnapshot(field) {
  const state = React.useMemo(
    () => /** @satisfies {State.Readonly} */ ({
      get() { return snapshot.get(field) },
      subscribe(f) { return snapshot.subscribe(field, f) }
    }),
    [field]
  )
  return useFormFieldState(state)
}

/**
 * @template {Field} T
 * @arg {T} field
 * @returns {ReturnType<typeof useFormFieldState<T['value']>>}
 */
export function useFormFieldValue(field) {
  return useFormFieldState(field.value)
}

/**
 * @template {[...Field[]]} const T
 * @arg {T} fields
 */
export function useFormFieldsValues(fields) {
  return useFieldStates(/** @type {MapTuple<T, 'value'>} */ (fields.map(x => x.value)))
}

/**
 * @template T
 * @arg {Field.Basic<T>} field
 */
export function useFormField(field) {
  if (!field) throw new Error('No field was passed in')
  const { name, eventHandlers } = field
  const state = useFormFieldState(field.state)

  return { name, state, eventHandlers }
}

/**
 * @arg {Field.Basic<number | string>} field
 */
export function useNumberFormField(field) {
  const { name, state, eventHandlers: { onChange, ...originalEventHandlers } } = useFormField(field)
  const eventHandlers = { ...originalEventHandlers, onChange: handleChange }

  return { name, state, eventHandlers }

  /** @arg {React.ChangeEvent<HTMLInputElement>} e */
  function handleChange(e) {
    const userValue = e.target.value
    const value = Number(userValue)
    onChange(userValue === '' || Number.isNaN(value) ? userValue : value)
  }
}

/** @arg {Field.Basic<boolean>} field */
export function useBooleanFormField(field) {
  const { name, state, eventHandlers: { onChange, ...originalEventHandlers } } = useFormField(field)
  const eventHandlers = { ...originalEventHandlers, onChange: handleChange }

  return { name, state, eventHandlers }

  /** @arg {React.ChangeEvent<HTMLInputElement>} e */
  function handleChange(e) {
    onChange(e.target.checked)
  }
}

/**
 * @template {Field.ObjectFields} T
 * @arg {Field.Array<T>} field
 */
export function useArrayFormField(field) {
  const { name, helpers } = field
  const state = useFormFieldState(field.state)

  return { name, state, helpers }
}

/**
 * @template {Field.ObjectFields} T
 * @arg {Field.Object<T>} field
 */
export function useObjectFormField(field) {
  const { name, fields } = field
  const state = useFormFieldState(field.state)

  return { name, state, fields }
}

/*
  When a hook receives an array as argument, it usually is a good idea to pass it as a dependency
  array instead of putting it as a slot in a dependency array.

  React.useEffect(..., arrayArgument)   ✓ good
  React.useEffect(..., [arrayArgument]) x bad

  Why? Because it allows the users of your hook to simply pass an array without worrying about
  memoization to improve performance.
*/
