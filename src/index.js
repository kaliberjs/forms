import isEqual from 'react-fast-compare'

function createStore(initialValues) {
  let state = initialValues
  let listeners = new Set()

  return {
    subscribe(f) {
      listeners.add(f)
      return () => { listeners.delete(f) }
    },
    update(f) {
      if (typeof f !== 'function') throw new Error('update requires a function to update the state')
      state = f(state)
      listeners.forEach(f => { f(state) })
    },
    getValue() {
      return state
    },
  }
}

export function useForm({ initialValues, fields, onSubmit }) {
  const initialValuesRef = React.useRef()
  const fieldsRef = React.useRef()
  const formFieldsRef = React.useRef()

  if (!isEqual(initialValuesRef.current, initialValues) || !isEqual(fieldsRef.current, fields)
  ) {
    initialValuesRef.current = initialValues
    fieldsRef.current = fields
    formFieldsRef.current = createFormFields(initialValues, fields)
  }

  const submit = React.useCallback(handleSubmit, [formFieldsRef.current, onSubmit])
  const reset = React.useCallback(handleReset, [formFieldsRef.current])

  return { fields: formFieldsRef.current, submit, reset }

  function handleSubmit(e) {
    e.preventDefault()
    Object.values(formFieldsRef).forEach(
      ({ store }) => store.update(x => deriveFieldState({ ...x, isSubmitted: true }))
    )
    onSubmit(getFormState(formFieldsRef))
  }

  function handleReset() {
    Object.values(formFieldsRef).forEach(
      ({ store, initialFieldState }) => store.update(
        x => deriveFieldState(initialFieldState)
      )
    )
  }
}

export function useFormField(field) {
  const { id, name, store, initialFieldState, eventHandlers } = field
  const [fieldState, setFieldState] = React.useState(initialFieldState)

  React.useEffect(
    () => {
      setFieldState(store.getValue())
      return store.subscribe(x => { setFieldState(x) })
    },
    [store]
  )

  return { id, name, state: fieldState, eventHandlers }
}

export function useFormState(fields) {
  const [formState, setFormState] = React.useState(() => getFormState(fields))

  React.useEffect(
    () => {
      return Object.entries(fields).reduce(
        (unsubscribePrevious, [name, field]) => {
          const unsubscribe = field.store.subscribe(({ error, value }) => {
            setFormState(({ values, errors }) => {
              const newFormState = {
                values: { ...values, [name]: value },
                errors: { ...errors, [name]: error }
              }

              return {
                ...newFormState,
                invalid: Object.values(newFormState.errors).some(Boolean)
              }
            })
          })
          return () => {
            unsubscribePrevious()
            unsubscribe()
          }
        },
        () => {}
      )
    },
    [fields]
  )

  return formState
}

function createFormFields(initialValues, fields) {
  return objectFromEntries(
    Object.entries(fields).map(
      ([name, field]) => {
        const initialValue = initialValues[name]
        if (initialValue === undefined) console.warn(`Field ${name} has no initial value, this might cause a react error about controlled/uncontrolled components`)

        const validate = createValidate(field)
        const initialFieldState = deriveFieldState({
          value: initialValue,
          error: validate(initialValue),
        })
        const store = createStore(initialFieldState)
        const fieldInfo = {
          id: name,
          name,
          eventHandlers: {
            onBlur() {
              store.update(x => deriveFieldState({ ...x, isVisited: true, hasFocus: false }))
            },
            onFocus() {
              store.update(x => deriveFieldState({ ...x, hasFocus: true }))
            },
            onChange(eOrValue) {
              const value = eOrValue && eOrValue.target
                ? eOrValue.target.value
                : eOrValue

              store.update(x => deriveFieldState({ ...x, value, error: validate(value) }))
            },
          },
          initialFieldState,
          store,
        }

        return [name, fieldInfo]
      }
    )
  )
}

function createValidate(field) {
  const validate = (Array.isArray(field) ? field : [field.validate])
    .filter(Boolean)
    .map(x => x.validate || x)
  return [].concat(validate).reduce(
    (result, f) => value => result(value) || f(value),
    () => {}
  )
}

function deriveFieldState(state) {
  const {
    error,
    isSubmitted = false,
    isVisited = false,
    hasFocus = false
  } = state

  return {
    ...state,
    isSubmitted,
    isVisited,
    hasFocus,
    invalid: !!error,
    showError: !!error && !hasFocus && (isVisited || isSubmitted)
  }
}

function getFormState(fields) {
  return Object.entries(fields).reduce(
    ({ invalid, values, errors }, [name, field]) => {
      const { value, error } = field.store.getValue()
      return {
        invalid: invalid || !!error,
        errors: {
          ...errors,
          [name]: error,
        },
        values: {
          ...values,
          [name]: value,
        },
      }
    },
    {
      invalid: false,
      errors: {},
      values: {},
    }
  )
}

function objectFromEntries(entries) {
  return entries.reduce(
    (result, [k, v]) => (result[k] = v, result),
    {}
  )
}