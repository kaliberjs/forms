import isEqual from 'react-fast-compare'

/**
 * @template T
 * @param {T} initialValues
 */
function createState(initialValues) {
  let state = initialValues
  let listeners = new Set()

  return {
    /** @param {(state: T) => void} f */
    subscribe(f) {
      listeners.add(f)
      return () => { listeners.delete(f) }
    },
    /** @param {(state: T) => T} f */
    update(f) {
      if (typeof f !== 'function') throw new Error('update requires a function to update the state')
      state = f(state)
      listeners.forEach(f => { f(state) })
      return state
    },
    get current() {
      return state
    },
  }
}

/**
 * @template {Partial<forms.ValuesOf<X>>} Y
 * @template {forms.Fields} X
 * @param {{ initialValues: Y, fields: X, onSubmit: (formValues: forms.ValuesOf<X>) => void }} props
 */
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
    Object.values(formFieldsRef.current).forEach(
      ({ store }) => store.update(x => deriveFieldState({ ...x, isSubmitted: true }))
    )
    onSubmit(getFormState(formFieldsRef.current))
  }

  function handleReset() {
    Object.values(formFieldsRef.current).forEach(
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
  const { id, name, state, initialFieldState, eventHandlers } = field
  const [fieldState, setFieldState] = React.useState(initialFieldState)

  React.useEffect(
    () => {
      setFieldState(state.current)
      return state.subscribe(x => { setFieldState(x) })
    },
    [state]
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

/**
 * @param {*} initialValues
 * @param {{ [name: string]: Field }} fields
 * @param {*} namePrefix
 */
function createFormFields(initialValues, fields, namePrefix = '') {
  return mapValues(fields, (field, name) => {
    return getFieldInfo(`${namePrefix}${name}`, normalize(field), initialValues[name])
  })
}

function getFieldInfo(name, field, initialValue) {
  const { type, ...normalizedField } = field

  const constructors = {
    basic: getBasicFieldInfo,
    array: getArrayFieldInfo,
  }
  const constructor = constructors[/** @type {keyof typeof constructors} */ (type)]
  return (constructor || unknownType)({ name, initialValue, field: normalizedField })

  /** @returns {never} */
  function unknownType() {
    throw new Error(`Unknown type '${type}'`)
  }
}

function getArrayFieldInfo({ name, initialValue = [], field }) {
  function createFormFieldsAt(initialValue, i) {
    const namePrefix = `${name}[${i}].`
    return createFormFields(initialValue, field.fields, namePrefix)
  }
  const initialFieldsValue = initialValue.map(createFormFieldsAt)
  const initialFieldState = deriveFieldState({
    value: initialFieldsValue,
    error: field.validate(initialValue),
  })
  const state = createState(initialFieldState)
  const store = {
    getValue() {
      const { value: arrayStoreValue, ...x } = state.getValue()
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
      const unsubscribe = state.subscribe(_ => {
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
        return state.getValue().value.reduce(
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
    setSubmitted(isSubmitted) {
      const { value } = state.update(x => updateState(x, { isSubmitted }))
      value.forEach(fields => {
        fields.forEach(x => x.setSubmitted(isSubmitted))
      })
    },
    helpers: {
      add(initialValue) {
        state.update(x =>
          deriveFieldState({
            ...x,
            value: [...x.value, createFormFieldsAt(initialValue, x.value.length)]
          })
        )
      }
    }
  }
}

function updateState(fieldState, update) {
  return deriveFieldState({ ...fieldState, ...update })
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
  const state = createState(initialFieldState)

  return {
    id: name,
    name,
    initialFieldState,
    state: {
      get current() {
        return state.current
      },
      setSubmitted(isSubmitted) {
        state.update(x => updateState(x, { isSubmitted }))
      },
      subscribe: state.subscribe,
    },
    eventHandlers: {
      onBlur() {
        state.update(x => updateState(x, { hasFocus: false }))
      },
      onFocus() {
        state.update(x => updateState(x, { hasFocus: true, isVisited: true }))
      },
      onChange(eOrValue) {
        const value = eOrValue && eOrValue.target
          ? eOrValue.target.value
          : eOrValue

        state.update(x => updateState(x, { value, error: field.validate(value) }))
      },
    },
  }
}

/**
 * @param {*} field
 *
 * @returns {{ type: 'basic' | 'array', validate: () => {} }}
 */
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

/**
 * @template T
 * @template {{ value: T, error: any, isSubmitted?: boolean, isVisited?: boolean, hasFocus?: boolean }} S
 * @param {S} state
 *
 * @returns {S & { invalid: boolean, showError: boolean, isSubmitted: boolean, isVisited: boolean, hasFocus: boolean }}
 */
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
      const { value, error, invalid: fieldInvalid } = field.state.current
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

/**
 * @template O
 * @template {keyof O} S
 * @template T
 *
 * @param {O} o
 * @param {(v: O[S], k: S) => T} f
 *
 * @returns {{ [K in S]: T }}
 */
function mapValues(o, f) {
  return /** @type {[S, O[S]][]} */ (Object.entries(o)).reduce(
    (result, [k, v]) => (result[k] = f(v, k), result),
    /** @type {{ [K in keyof O]: T }} */ ({})
  )
}
