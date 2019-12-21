import { normalize } from './normalize'
import { createState } from './state'

const constructors = {
  basic: createBasicFormField,
  array: createArrayFormField,
  object: createObjectFormField,
}

export function createObjectFormField({ name = '', initialValue = {}, field }) {

  const fields = createFormFields(initialValue, field.fields, name && `${name}.`)

  const initialState = deriveFieldState({
    value: fields,
    error: field.validate && field.validate(fields),
  })

  const internalState = createState(initialState)

  return {
    type: 'object',
    name,
    fields,
    setSubmitted(isSubmitted) {
      const { value: fields } = internalState.update(x => updateState(x, { isSubmitted }))
      Object.values(fields).forEach(x => x.setSubmitted(isSubmitted))
    },
    reset() {
      Object.values(fields).forEach(x => x.reset())
    },
    state: { get: internalState.get, subscribe: internalState.subscribe },
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
}

function createArrayFormField({ name, initialValue = [], field }) {
  const initialFields = initialValue.map(createFormFieldsAt)
  const initialState = deriveFieldState({
    value: initialFields,
    error: field.validate && field.validate(initialFields),
  })
  const internalState = createState(initialState)

  return {
    type: 'array',
    name,
    setSubmitted(isSubmitted) {
      const { value: fields } = internalState.update(x => updateState(x, { isSubmitted }))
      fields.forEach(field => { field.setSubmitted(isSubmitted) })
    },
    reset() {
      const { value: fields } = internalState.update(x => initialState)
      fields.forEach(field => { field.reset() })
    },
    state: { get: internalState.get, subscribe: internalState.subscribe },
    helpers: {
      add(initialValue) {
        internalState.update(x => {
          const fieldsValue = [...x.value, createFormFieldsAt(initialValue, x.value.length)]
          return deriveFieldState({
            ...x,
            value: fieldsValue,
            error: field.validate && field.validate(fieldsValue),
          })
        })
      },
      remove(entry) {
        internalState.update(x => {
          const fieldsValue = x.value.filter(x => x !== entry)
          return deriveFieldState({
            ...x,
            value: fieldsValue,
            error: field.validate && field.validate(fieldsValue)
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
}

function createBasicFormField({ name, initialValue, field }) {
  const initialFieldState = deriveFieldState({
    value: initialValue,
    error: field.validate && field.validate(initialValue),
  })
  const internalState = createState(initialFieldState)

  return {
    type: 'basic',
    name,
    setSubmitted(isSubmitted) {
      internalState.update(x => updateState(x, { isSubmitted }))
    },
    reset() {
      internalState.update(x => initialFieldState)
    },
    state: { get: internalState.get, subscribe: internalState.subscribe },
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

        internalState.update(x => updateState(x, { value, error: field.validate && field.validate(value) }))
      },
    },
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
