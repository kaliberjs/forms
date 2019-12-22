import { normalize } from './normalize'
import { createState, subscribeToAll } from './state'

const constructors = {
  basic: createBasicFormField,
  array: createArrayFormField,
  object: createObjectFormField,
}

export function createObjectFormField({ name = '', initialValue = {}, field }) {

  const fields = createFormFields(initialValue, field.fields, name && `${name}.`)

  const initialState = deriveFieldState({
    value: fields,
    error: field.validate && field.validate(initialValue),
  })

  const internalState = createState(initialState)

  const value = {
    get() {
      const fields = internalState.get().value
      return Object.entries(fields).reduce(
        (result, [name, child]) => ({ ...result, [name]: child.value.get() }),
        {}
      )
    },
    subscribe(f) {
      return subscribeToAll({
        state: internalState,
        childrenFromState: x => Object.values(x.value),
        notify: _ => f(value.get()),
        subscribeToChild: (x, f) => x.value.subscribe(f),
        onlyNotifyOnChildChange: true,
      })
    },
  }

  if (field.validate) {
    value.subscribe(value => {
      internalState.update(x => updateState(x, { error: field.validate(value) }))
    })
  }

  return {
    type: 'object',
    name,
    fields,
    setSubmitted(isSubmitted) {
      const { value: fields } = internalState.update(x => updateState(x, { isSubmitted }))
      Object.values(fields).forEach(x => x.setSubmitted(isSubmitted))
    },
    reset() {
      const { value: fields } = internalState.update(x => updateState(x, initialState))
      Object.values(fields).forEach(x => x.reset())
    },
    value,
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
  const initialChildren = initialValue.map(createFormFieldsAt)
  const initialState = deriveFieldState({
    value: initialChildren,
    error: field.validate && field.validate(initialValue),
  })
  const internalState = createState(initialState)

  const value = {
    get() {
      const children = internalState.get().value
      return children.map(child => child.value.get())
    },
    subscribe(f) {
      return subscribeToAll({
        state: internalState,
        childrenFromState: x => x.value,
        notify:_ => f(value.get()),
        subscribeToChild: (x, f) => x.value.subscribe(f),
        onlyNotifyOnChildChange: true,
      })
    },
  }

  if (field.validate) {
    value.subscribe(value => {
      internalState.update(x => updateState(x, { error: field.validate(value) }))
    })
  }

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
    value,
    state: { get: internalState.get, subscribe: internalState.subscribe },
    helpers: {
      add(initialValue) {
        internalState.update(x => {
          const children = x.value
          const newChildren = [...children, createFormFieldsAt(initialValue, children.length)]
          return updateState(x, { value: newChildren })
        })
      },
      remove(entry) {
        internalState.update(x => {
          const children = x.value
          const newChildren = children.filter(x => x !== entry)
          return updateState(x, { value: newChildren })
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

  const value = {
    get() { return internalState.get().value },
    subscribe(f) {
      return internalState.subscribe(({ value: newValue }, { value: oldValue }) => {
        if (newValue === oldValue) return
        f(newValue, oldValue)
      })
    },
  }

  if (field.validate) {
    value.subscribe(value => {
      internalState.update(x => updateState(x, { error: field.validate(value) }))
    })
  }

  return {
    type: 'basic',
    name,
    setSubmitted(isSubmitted) {
      internalState.update(x => updateState(x, { isSubmitted }))
    },
    reset() {
      internalState.update(x => initialFieldState)
    },
    value,
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

        internalState.update(x => updateState(x, { value }))
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
