import isEqual from 'react-fast-compare'
import { createObjectFormField } from './fields'
import { normalize } from './normalize'
import * as snapshot from './snapshot'

export function useForm({ initialValues = undefined, fields, validate = undefined, onSubmit }) {
  const initialValuesRef = React.useRef(null)
  const fieldsRef = React.useRef(null)
  const formRef = React.useRef(null)

  if (!isEqual(initialValuesRef.current, initialValues) || !isEqual(fieldsRef.current, fields)
  ) {
    initialValuesRef.current = initialValues
    fieldsRef.current = fields
    formRef.current = createObjectFormField({
      initialValue: initialValues,
      field: normalize({ type: 'object', fields, validate })
    })
  }

  const submit = React.useCallback(handleSubmit, [formRef.current, onSubmit])
  const reset = React.useCallback(handleReset, [formRef.current])

  return { form: formRef.current, submit, reset }

  function handleSubmit(e) {
    e.preventDefault()
    formRef.current.setSubmitted(true)
    onSubmit(snapshot.get(formRef.current))
  }

  function handleReset() {
    formRef.current.reset()
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

export function useFieldValue(field) {
  const state = React.useMemo(
    () => ({
      get() { return snapshot.get(field) },
      subscribe(f) { return snapshot.subscribe(field, f) }
    }),
    [field]
  )
  return useFieldState(state)
}

export function useFormField(field) {
  const { name, eventHandlers } = field
  const state = useFieldState(field.state)

  return { name, state, eventHandlers }
}

export function useArrayFormField(field) {
  const { name, helpers } = field
  const state = useFieldState(field.state)

  return { name, state, helpers }
}
