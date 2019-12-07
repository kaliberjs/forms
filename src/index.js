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

export function useFormState(fields) {
  const [formState, setFormState] = React.useState(() => getFormState(fields))

  React.useEffect(
    () => {
      return Object.entries(fields).reduce(
        (unsubscribePrevious, [name, field]) => {
          const unsubscribe = field.subscribe(({ error, value }) => {
            setFormState(({ values, errors }) => {
              const newFormState = {
                values: {
                  ...values,
                  [name]: value,
                },
                errors: {
                  ...errors,
                  [name]: error,
                }
              }

              return {
                ...newFormState,
                hasErrors: Object.values(newFormState.errors).some(Boolean)
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

export function useForm(form) {
  const fields = objectFromEntries(
    Object.entries(form.fields).map(
      ([name, [field, meta]]) => {
        const value = form.initialValues[name]
        const initialFieldState = {
          value,
          error: validate(value),
          isSubmitted: false,
          isVisited: false,
          hasFocus: false,
          showError: false,
        }
        const store = createStore(initialFieldState)
        const { subscribe, update } = store
        const fieldInfo = {
          id: name,
          name,
          subscribe,
          eventHandlers: {
            onBlur() {
              update(x => updateFieldState({ ...x, isVisited: true, hasFocus: false }))
            },
            onFocus() {
              update(x => updateFieldState({ ...x, hasFocus: true }))
            },
            onChange(eOrValue) {
              const value = eOrValue && eOrValue.target
                ? eOrValue.target.value
                : eOrValue

              update(x => updateFieldState({ ...x, value, error: validate(value) }))
            },
          },
          initialFieldState,
          meta,
          store,
        }

        return [name, fieldInfo]

        function validate(value) {
          return (
            field.required && !value ? 'required' :
            field.validate ? validate(value) :
            null
          )
        }
      }
    )
  )

  /** @type {[typeof fields, typeof handleSubmit, typeof reset]} */
  const result = [fields, handleSubmit, reset]
  return result

  function handleSubmit(e) {
    e.preventDefault()
    Object.values(fields).forEach(({ store }) => store.update(x => updateFieldState({ ...x, isSubmitted: true })))
    form.onSubmit(getFormState(fields))
  }

  function reset() {
    Object.values(fields).forEach(({ store }) => store.update(x => updateFieldState({ ...x, isSubmitted: false })))
  }
}

function updateFieldState(state) {
  const { error, isSubmitted, isVisited, hasFocus } = state

  return {
    ...state,
    showError: !!error && !hasFocus && (isVisited || isSubmitted)
  }
}

function getFormState(fields) {
  return Object.entries(fields).reduce(
    ({ hasErrors, values, errors }, [name, field]) => {
      const { value, error } = field.store.getValue()
      return {
        hasErrors: hasErrors || !!error,
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
      hasErrors: false,
      errors: {},
      values: {},
    }
  )
}

export function useFormField(field) {
  const { id, name, subscribe, initialFieldState, eventHandlers, meta } = field
  const [fieldState, setFieldState] = React.useState(initialFieldState)
  const { value, error, showError } = fieldState

  React.useEffect(
    () => { return subscribe(x => { setFieldState(x) })},
    [subscribe]
  )

  return [
    { id, name, value, error, showError, eventHandlers },
    meta,
  ]
}

function objectFromEntries(entries) {
  return entries.reduce(
    (result, [k, v]) => (result[k] = v, result),
    {}
  )
}