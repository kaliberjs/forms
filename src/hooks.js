import isEqual from 'react-fast-compare'
import { createObjectFormField } from './fields'
import { normalize } from './normalize'

export function useForm({ fields, initialValues, onSubmit }) {
  const initialValuesRef = React.useRef(null)
  const fieldsRef = React.useRef(null)
  const formRef = React.useRef(null)

  if (!isEqual(initialValuesRef.current, initialValues) || !isEqual(fieldsRef.current, fields)
  ) {
    initialValuesRef.current = initialValues
    fieldsRef.current = fields
    formRef.current = createObjectFormField({
      initialValue: initialValues,
      field: normalize({ type: 'object', fields })
    })
  }

  const submit = React.useCallback(handleSubmit, [formRef.current, onSubmit])
  const reset = React.useCallback(handleReset, [formRef.current])

  return { form: formRef.current, submit, reset }

  function handleSubmit(e) {
    e.preventDefault()
    formRef.current.setSubmitted(true)
    onSubmit(formRef.current.value.current)
  }

  function handleReset() {
    formRef.current.reset()
  }
}

function useFieldState(state) {
  const [fieldState, setFieldState] = React.useState(() => state.current)

  React.useEffect(
    () => {
      setFieldState(state.current)
      return state.subscribe(setFieldState)
    },
    [state]
  )

  return fieldState
}

export function useFieldValue(field) {
  return useFieldState(field.value)
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
