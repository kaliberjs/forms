import isEqual from 'react-fast-compare'
import { createObjectFormField } from './fields'
import { normalize } from './normalize'
import * as snapshot from './snapshot'

let formCounter = 0 // This will stop working when we need a number greater than 9007199254740991
function useFormId() { return React.useMemo(() => `form${++formCounter}`, []) }


export function useForm({ initialValues = undefined, fields, validate = undefined, onSubmit }) {
  const initialValuesRef = React.useRef(null)
  const formRef = React.useRef(null)
  const formId = useFormId()

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

  function handleSubmit(e) {
    if (e) e.preventDefault()
    formRef.current.setSubmitted(true)
    onSubmit(snapshot.get(formRef.current))
  }

  function handleReset() {
    formRef.current.reset()
    formRef.current.validate({ form: initialValues, parents: [] })
  }
}

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

export function useFormFieldSnapshot(field) {
  const state = React.useMemo(
    () => ({
      get() { return snapshot.get(field) },
      subscribe(f) { return snapshot.subscribe(field, f) }
    }),
    [field]
  )
  return useFormFieldState(state)
}

export function useFormFieldValue(field) {
  return useFormFieldState(field.value)
}

export function useFormField(field) {
  if (!field) throw new Error('No field was passed in')
  const { name, eventHandlers } = field
  const state = useFormFieldState(field.state)

  return { name, state, eventHandlers }
}

export function useNumberFormField(field) {
  const { name, state, eventHandlers: { onChange, ...originalEventHandlers } } = useFormField(field)
  const eventHandlers = { ...originalEventHandlers, onChange: handleChange }

  return { name, state, eventHandlers }

  function handleChange(e) {
    const userValue = e.target.value
    const value = Number(userValue)
    onChange(userValue === '' || Number.isNaN(value) ? userValue : value)
  }
}

export function useBooleanFormField(field) {
  const { name, state, eventHandlers: { onChange, ...originalEventHandlers } } = useFormField(field)
  const eventHandlers = { ...originalEventHandlers, onChange: handleChange }

  return { name, state, eventHandlers }

  function handleChange(e) {
    onChange(e.target.checked)
  }
}

export function useArrayFormField(field) {
  const { name, helpers } = field
  const state = useFormFieldState(field.state)

  return { name, state, helpers }
}

export function useObjectFormField(field) {
  const { name, fields } = field
  const state = useFormFieldState(field.state)

  return { name, state, fields }
}
