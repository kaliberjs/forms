import isEqual from 'react-fast-compare'
import { createObjectFormField } from './fields'
import { normalize } from './normalize'
import * as snapshot from './snapshot'

// TODO: refactor this
//
// it has a flaw that will be exposed when 'form1' is unmounted and then mounted again
const formCounter = new Set()

function useFormId() {
  const idRef = React.useRef(Symbol('form'))
  const id = React.useMemo(
    () => {
      formCounter.add(idRef.current)
      return `form${formCounter.size}`
    },
    []
  )
  React.useEffect(
    () => () => formCounter.delete(idRef.current),
    []
  )
  return id
}

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

function useFieldState(state) {
  const [fieldState, setFieldState] = React.useState(state.get)

  React.useEffect(
    () => {
      setFieldState(state.get())
      return state.subscribe(setFieldState)
    },
    [state]
  )

  return fieldState
}

export function useFieldSnapshot(field) {
  const state = React.useMemo(
    () => ({
      get() { return snapshot.get(field) },
      subscribe(f) { return snapshot.subscribe(field, f) }
    }),
    [field]
  )
  return useFieldState(state)
}

export function useFieldValue(field) {
  return useFieldState(field.value)
}

export function useFormField(field) {
  if (!field) throw new Error('No field was passed in')
  const { name, eventHandlers } = field
  const state = useFieldState(field.state)

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

export function useArrayFormField(field) {
  const { name, helpers } = field
  const state = useFieldState(field.state)

  return { name, state, helpers }
}
