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
      return state
    },
    getValue() {
      return state
    },
  }
}

export function useForm({ initialValues, fields, onSubmit }) {
  const initialValuesRef = React.useRef(null)
  const fieldsRef = React.useRef(null)
  const formFieldsRef = React.useRef(null)

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
      ({ store, initialFieldState }) => store.update(_ => initialFieldState)
    )
  }
}

export function useFormState(fields) {
  const [formState, setFormState] = React.useState(() => getFormState(fields))

  React.useEffect(
    () => subscribeToAll(fields, setFormState),
    [fields]
  )

  return formState
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

function subscribeToAll(fields, update) {
  return Object.values(fields).reduce(
    (unsubscribePrevious, field) => {
      const unsubscribe = field.store.subscribe(_ => update(getFormState(fields)))
      return () => {
        unsubscribePrevious()
        unsubscribe()
      }
    },
    () => {}
  )
}

function createFormFields(initialValues, fields, namePrefix = '') {
  return mapValues(fields, (field, name) => {
    return getFieldInfo(`${namePrefix}${name}`, field, initialValues[name])
  })
}

function getFieldInfo(name, field, initialValue) {
  const { type, ...normalizedField } = normalize(field)

  return ({
    basic: getBasicFieldInfo,
    array: getArrayFieldInfo,
  }[type] || unknownType)({ name, initialValue, field: normalizedField })

  function unknownType() {
    console.error(`Unknown type '${type}'`)
  }
}

function getArrayFieldInfo({ name, initialValue = [], field }) {
  console.log(name, initialValue, field)
  function createFormFieldsAt(initialValue, i) {
    const namePrefix = `${name}[${i}].`
    return createFormFields(initialValue, field.fields, namePrefix) // rename .field to .form
  }
  const initialFieldsValue = initialValue.map(createFormFieldsAt)
  const initialFieldState = deriveFieldState({
    value: initialFieldsValue,
    error: field.validate(initialValue),
  })
  const arrayStore = createStore(initialFieldState)
  const store = {
    update(f) {
      return arrayStore.update(x => {
        const update = f(x)
        if (update.value !== x.value) throw new Error(`Forbidden value update of ${name}`)
        // propagate isSubmitted
        x.value.forEach(fields =>
          Object.values(fields).forEach(({ store }) =>
            store.update(x => deriveFieldState({ ...x, isSubmitted: update.isSubmitted }))
          )
        )
        return update
      })
    },
    getValue() {
      const { value: arrayStoreValue, ...x } = arrayStore.getValue()
      const { value, error, invalid } = arrayStoreValue.map(getFormState).reduce(
        ({ value, error, invalid }, formState) => ({
          value: [...value, formState.values],
          error: [...error, formState.errors],
          invalid: invalid || formState.invalid,
        }),
        { value: [], error: [], invalid: false }
      )
      return { ...x, value, error, invalid }
    },
    subscribe(f) {
      let unsubscribeFromChildren = subscribeToChildren()
      const unsubscribe = arrayStore.subscribe(_ => {
        // things have changed, resubscribe
        unsubscribeFromChildren()
        unsubscribeFromChildren = subscribeToChildren()
        f(store.getValue())
      })

      return () => {
        unsubscribeFromChildren()
        unsubscribe()
      }

      function subscribeToChildren() {
        return arrayStore.getValue().value.reduce(
          (unsubscribePrevious, fields) => {
            const unsubscribe = subscribeToAll(fields, _ => f(store.getValue()))
            return () => {
              unsubscribePrevious()
              unsubscribe()
            }
          },
          () => {}
        )
      }
    }
  }

  return {
    id: name,
    name,
    initialFieldState,
    store,
    arrayStore,
    helpers: {
      add(initialValue) {
        arrayStore.update(x =>
          deriveFieldState({
            ...x,
            value: [...x.value, createFormFieldsAt(initialValue, x.value.length)]
          })
        )
      }
    }
  }
}

export function useArrayFormField(field) {
  const { id, name, helpers, arrayStore, initialFieldState, eventHandlers } = field
  const [fieldState, setFieldState] = React.useState(initialFieldState)

  React.useEffect(
    () => {
      setFieldState(arrayStore.getValue())
      return arrayStore.subscribe(x => { setFieldState(x) })
    },
    [arrayStore]
  )

  return { id, name, state: fieldState, helpers }
}

function getBasicFieldInfo({ name, initialValue, field }) {
  const initialFieldState = deriveFieldState({
    value: initialValue,
    error: field.validate(initialValue),
  })
  const store = createStore(initialFieldState)

  return {
    id: name,
    name,
    initialFieldState,
    store,
    eventHandlers: {
      onBlur() {
        store.update(x => deriveFieldState({ ...x, hasFocus: false }))
      },
      onFocus() {
        store.update(x => deriveFieldState({ ...x, hasFocus: true, isVisited: true }))
      },
      onChange(eOrValue) {
        const value = eOrValue && eOrValue.target
          ? eOrValue.target.value
          : eOrValue

        store.update(x => deriveFieldState({ ...x, value, error: field.validate(value) }))
      },
    },
  }
}

function normalize(field) {
  const { validate = [], ...withType } = (
    Array.isArray(field) ? { type: 'basic', validate: field } :
    !field.type ? { ...field, type: 'basic' } :
    field
  )

  const withValidate = {
    ...withType,
    validate: [].concat(validate).reduce(
      (previous, next) => x => previous(x) || (
        next.validate ? next.validate(x) : next(x)
      ),
      () => {}
    )
  }

  return withValidate
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
      const { value, error, invalid: fieldInvalid } = field.store.getValue()
      return {
        invalid: invalid || fieldInvalid,
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

function mapValues(o, f) {
  return Object.entries(o).reduce(
    (result, [k, v]) => (result[k] = f(v, k), result),
    {}
  )
}
