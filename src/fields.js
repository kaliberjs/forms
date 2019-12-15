import { normalize } from './normalize'
import { createState } from './state'

const constructors = {
  basic: createBasicFormField,
  array: createArrayFormField,
  object: createObjectFormField,
}

export function createObjectFormField({ name = '', initialValue = {}, field }) {
  const fields = createFormFields(initialValue, field.fields, name && `${name}.`)

  const internalState = deriveFieldState({
    value: fields,
    error: field.validate(fields),
  })

  return {
    name,
    fields,
    setSubmitted(isSubmitted) {
      Object.values(fields).forEach(x => x.setSubmitted(isSubmitted))
    },
    reset() {
      Object.values(fields).forEach(x => x.reset())
    },
    value: {
      get current() { return getValueState() },
      subscribe(f) {
        return Object.values(fields).reduce(
          (unsubscribePrevious, field) => {
            const unsubscribe = field.value.subscribe(_ => f(getValueState()))
            return () => {
              unsubscribePrevious()
              unsubscribe()
            }
          },
          () => {}
        )
      },
    },
    state: {
      get current() { return internalState },
      subscribe(f) { /* there will be no changes */ },
    },
  }

  function createFormFields(initialValues, fields, namePrefix = '') {
    return mapValues(fields, (field, name) => {
      const normalizedField = normalize(field)
      const constructor = constructors[normalizedField.type]
      return constructor({
        name: `${namePrefix}${name}`,
        field: normalizedField,
        initialValue: initialValues[name]
      })
    })
  }

  function getValueState() {
    const { error, invalid } = internalState
    const { fieldsInvalid, fieldErrors, fieldValues } =  Object.entries(fields).reduce(
      ({ fieldsInvalid, fieldValues, fieldErrors }, [name, field]) => {
        const { value, error, invalid } = field.value.current
        return {
          fieldsInvalid: fieldsInvalid || invalid,
          fieldErrors: {
            ...fieldErrors,
            [name]: error,
          },
          fieldValues: {
            ...fieldValues,
            [name]: value,
          },
        }
      },
      {
        fieldsInvalid: false,
        fieldErrors: {},
        fieldValues: {},
      }
    )

    return {
      invalid: invalid || fieldsInvalid,
      value: fieldValues,
      error: {
        field: error,
        fields: fieldErrors,
      },
    }
  }
}

function createBasicFormField({ name, initialValue, field }) {
  const initialFieldState = deriveFieldState({
    value: initialValue,
    error: field.validate(initialValue),
  })
  const internalState = createState(initialFieldState)

  return {
    name,
    setSubmitted(isSubmitted) {
      internalState.update(x => updateState(x, { isSubmitted }))
    },
    reset() {
      internalState.update(x => initialFieldState)
    },
    value: {
      get current() {
        const { value, error, invalid } = internalState.current
        return { value, error, invalid }
      },
      subscribe(f) {
        return internalState.subscribe(({ value, error, invalid }) => f({ value, error, invalid }))
      },
    },
    state: {
      get current() { return internalState.current },
      subscribe: internalState.subscribe,
    },
    eventHandlers: {
      onBlur() {
        internalState.update(x => updateState(x, { hasFocus: false }))
      },
      onFocus() {
        internalState.update(x => updateState(x, { hasFocus: true, isVisited: true }))
      },
      onChange(eOrValue) {
        const value = eOrValue && eOrValue.target
          ? eOrValue.target.value
          : eOrValue

        internalState.update(x => updateState(x, { value, error: field.validate(value) }))
      },
    },
  }
}

function createArrayFormField({ name, initialValue = [], field }) {
  const initialFields = initialValue.map(createFormFieldsAt)
  const initialState = deriveFieldState({
    value: initialFields,
    error: field.validate(initialFields),
  })
  const internalState = createState(initialState)

  return {
    name,
    setSubmitted(isSubmitted) {
      const { value: values } = internalState.update(x => updateState(x, { isSubmitted }))
      values.forEach(fields => { fields.setSubmitted(isSubmitted) })
    },
    reset() {
      const { value: values } = internalState.update(x => initialState)
      values.forEach(fields => { fields.reset() })
    },
    value: {
      get current() { return getValueState() },
      subscribe(f) {
        let unsubscribeForValues = subscribeToValues(internalState.current.value, f)
        const unsubscribeForFields = internalState.subscribe(x => {
          unsubscribeForValues()
          f(getValueState())
          unsubscribeForValues = subscribeToValues(x.value, f)
        })
        return () => {
          unsubscribeForValues()
          unsubscribeForFields()
        }
      }
    },
    state: {
      get current() { return internalState.current },
      subscribe: internalState.subscribe,
    },
    helpers: {
      add(initialValue) {
        internalState.update(x => {
          const fieldsValue = [...x.value, createFormFieldsAt(initialValue, x.value.length)]
          return deriveFieldState({
            ...x,
            value: fieldsValue,
            error: field.validate(fieldsValue),
          })
        })
      },
      remove(entry) {
        internalState.update(x => {
          const fieldsValue = x.value.filter(x => x !== entry)
          return deriveFieldState({
            ...x,
            value: fieldsValue,
            error: field.validate(fieldsValue)
          })
        })
      }
    }
  }

  function createFormFieldsAt(initialValue, index) {
    return createObjectFormField({
      name: `${name}[${index}]`,
      initialValue,
      field: normalize({ type: 'object', fields: field.fields }),
    })
  }

  function getValueState() {
    const { value: arrayFields, error, invalid } = internalState.current
    const { fieldValues, fieldErrors, fieldsInvalid } = arrayFields.reduce(
      ({ fieldValues, fieldErrors, fieldsInvalid }, fields) => {
        const { value, error, invalid} = fields.value.current
        return {
          fieldValues: [...fieldValues, value],
          fieldErrors: [...fieldErrors, error],
          fieldsInvalid: fieldsInvalid || invalid,
        }
      },
      { fieldValues: [], fieldErrors: [], fieldsInvalid: false }
    )
    return {
      value: fieldValues,
      error: {
        field: error,
        fields: fieldErrors,
      },
      invalid: invalid || fieldsInvalid
    }
  }

  function subscribeToValues(entries, f) {
    return entries.reduce(
      (unsubscribePrevious, field) => {
        const unsubscribe = field.value.subscribe(_ => f(getValueState()))
        return () => {
          unsubscribePrevious()
          unsubscribe()
        }
      },
      () => {}
    )
  }
}

function updateState(fieldState, update) {
  return deriveFieldState({ ...fieldState, ...update })
}

function deriveFieldState({
  error = false,
  isSubmitted = false,
  isVisited = false,
  hasFocus = false,
  ...rest
}) {
  return {
    ...rest,
    error,
    isSubmitted,
    isVisited,
    hasFocus,
    invalid: !!error,
    showError: !!error && !hasFocus && (isVisited || isSubmitted)
  }
}

function mapValues(o, f) {
  return Object.entries(o).reduce(
    (result, [k, v]) => (result[k] = f(v, k), result),
    {}
  )
}
