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
 * @template {forms.Fields} X
 *  // initialValues: forms.ExpandRecursively<Partial<forms.ValuesOf<X>>>,
 * @param {{
 *  initialValues: Partial<forms.ValuesOf<X>>,
 *  fields: X,
 *  onSubmit: (formstate: forms.FormState<X>) => void
 * }} props
 */
export function useForm({ initialValues, fields, onSubmit }) {
  const initialValuesRef = React.useRef(/** @type {Partial<forms.ValuesOf<X>>} */ (null))
  const fieldsRef = React.useRef(/** @type {X} */ (null))
  const formFieldsRef = React.useRef(/** @type {forms.FormFieldsInfo<X>} */ (null))

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
      x => x.state.setSubmitted(true)
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

/** @param {forms.BasicFieldInfo} field */
export function useFormField(field) {
  const { name, state, eventHandlers } = field
  const [fieldState, setFieldState] = React.useState(state.initial)

  React.useEffect(
    () => {
      setFieldState(state.current)
      return state.subscribe(x => { setFieldState(x) })
    },
    [state]
  )

  return { name, state: fieldState, eventHandlers }
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
 * @template {forms.Fields} X
 * @param {Partial<forms.ValuesOf<X>>} initialValues
 * @param {X} fields
 */
function createFormFields(initialValues, fields, namePrefix = '') {
  return mapValues(fields, (field, name) => {
    return getFieldInfo(`${namePrefix}${name}`, normalize(field), initialValues[name])
  })
}

/**
 *
 * @param {string} name
 * @param {forms.NormalizedField} field
 * @param {any} initialValue
 */
function getFieldInfo(name, field, initialValue) {
  return (
    isArrayField(field) ? getArrayFieldInfo({ name, field, initialValue }) :
    isBasicField(field) ? getBasicFieldInfo({ name, field, initialValue }) :
    throwError(`Did you turn off typescript type checking?`)
  )

  /** @param {forms.NormalizedField} x @returns {x is forms.NormalizedArrayField} */
  function isArrayField(x) { return x.type === 'array' }
  /** @param {forms.NormalizedField} x @returns {x is forms.NormalizedBasicField} */
  function isBasicField(x) { return x.type === 'basic' }
}

/**
 * @param {object} props
 * @param {string} props.name
 * @param {Array<any>} [props.initialValue]
 * @param {forms.NormalizedArrayField} props.field
 */
function getArrayFieldInfo({ name, initialValue = [], field }) {
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

  const x = {
    id: name,
    name,
    // initialFieldState,
    get value() {

    },
    state: {
      setSubmitted(isSubmitted) {
        const { value } = state.update(x => updateState(x, { isSubmitted }))
        value.forEach(fields => {
          fields.forEach(x => x.setSubmitted(isSubmitted))
        })
      },
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
  return x

  function createFormFieldsAt(initialValue, i) {
    const namePrefix = `${name}[${i}].`
    return createFormFields(initialValue, field.fields, namePrefix)
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


/**
 * @param {object} props
 * @param {string} props.name
 * @param {any} props.initialValue
 * @param {forms.NormalizedBasicField} props.field
 */
function getBasicFieldInfo({ name, initialValue, field }) {
  const initialFieldState = deriveFieldState({
    value: initialValue,
    error: field.validate(initialValue),
  })
  const state = createState(initialFieldState)

  return {
    name,
    initialFieldState,
    get value() {
      return state.current
    },
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
 * @param {forms.Field} field
 *
 * @returns {forms.NormalizedField}
 */
function normalize(field) {

  return (
    isValidationArray(field) ? convertValidationArray(field) :
    isArrayField(field) ? convertArrayField(field) :
    convertSimpleField(field)
  )

  /** @param {forms.Field} x @returns {x is forms.ValidationArray} */
  function isValidationArray(x) { return x instanceof Array }
  /** @param {forms.ValidationArray} x @returns {forms.NormalizedBasicField} */
  function convertValidationArray(x) {
    return { type: 'basic', validate: toValidationFunction(x) }
  }

  /** @param {forms.Field} x @returns {x is forms.ArrayField } */
  function isArrayField(x) { return 'type' in x && x.type === 'array' }
  /** @param {forms.ArrayField} x @returns {forms.NormalizedArrayField} */
  function convertArrayField(x) {
    return { type: 'array', validate: toValidationFunction(x.validate), fields: x.fields }
  }

  /** @param {forms.SimpleField} x @returns {forms.NormalizedBasicField} */
  function convertSimpleField(x) {
    return { type: 'basic', validate: toValidationFunction(x.validate) }
  }

  /** @param {forms.Validate} x @returns {forms.ValidationFunction} */
  function toValidationFunction(x = []) {
    /** @type {forms.ValidationFunction} */
    const emptyValidationFunction = x => {}
    /** @type {forms.ValidationArray} */
    const emptyValidationArray = []

    return emptyValidationArray.concat(x).reduce(
      (previous, next) => x => previous(x) || (
        'validate' in next ? next.validate(x) : next(x)
      ),
      emptyValidationFunction
    )
  }
}

/**
 * @template T
 * @template {{ error: forms.ValidationResult, value: T } & Partial<forms.FieldState<T>>} S
 * @param {S} state
 *
 * @returns {S & forms.FieldState<T>}
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

/**
 * @template {forms.Fields} X
 * @param {forms.FormFieldsInfo<X>} fields
 */
function getFormState(fields) {
  /** @type {forms.FormState<X>} */
  const emptyFormState = {
    invalid: false,
    errors: /** @type {forms.FormState<X>['errors']} */ ({}),
    values: /** @type {forms.FormState<X>['values']} */ ({}),
  }
  return Object.entries(fields).reduce(
    ({ invalid, values, errors }, [name, field]) => {
      const { value, error, invalid: fieldInvalid } = field.value instanceof Array
        ? { value: field.value.map(x => x.values), error: field.value.map(x => x.errors), invalid: field.value.some(x => x.invalid) }
        : field.value
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
    emptyFormState
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

/** @returns {void} */
function throwError(e) { throw new Error(e) }
