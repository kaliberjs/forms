import { normalize } from './normalize'
import { createState, subscribeToAll } from './state'
import isEqual from 'react-fast-compare'

const constructors = {
  basic: createBasicFormField,
  array: createArrayFormField,
  object: createObjectFormField,
}

export function createObjectFormField({ name = '', initialValue = {}, field }) {

  const fields = createFormFields(initialValue, field.fields, name && `${name}.`)

  const initialState = deriveFieldState({
    fields,
    children: Object.values(fields),
  })
  const internalState = createState(initialState)
  const validate = bindValidate(field.validate, internalState)

  const value = {
    get() {
      const { fields } = internalState.get()
      return Object.entries(fields).reduce(
        (result, [name, child]) => ({ ...result, [name]: child.value.get() }),
        {}
      )
    },
    subscribe(f) {
      return subscribeToAll({
        state: internalState,
        childrenFromState: x => x.children,
        notify: _ => f(value.get()),
        subscribeToChild: (x, f) => x.value.subscribe(f),
        onlyNotifyOnChildChange: true,
      })
    },
  }

  return {
    type: 'object',
    name,
    fields,
    validate(formValue) {
      const { children } = validate
        ? validate(value.get(), formValue)
        : internalState.get()

      children.forEach(x => x.validate(formValue))
    },
    setSubmitted(isSubmitted) {
      const { children } = internalState.update(x => updateState(x, { isSubmitted }))
      children.forEach(x => x.setSubmitted(isSubmitted))
    },
    reset() {
      const { children } = internalState.update(x => updateState(x, initialState))
      children.forEach(x => x.reset())
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
    children: initialChildren,
  })
  const internalState = createState(initialState)
  const validate = bindValidate(field.validate, internalState)

  const value = {
    get() {
      const { children } = internalState.get()
      return children.map(child => child.value.get())
    },
    subscribe(f) {
      return subscribeToAll({
        state: internalState,
        childrenFromState: x => x.children,
        notify:_ => f(value.get()),
        subscribeToChild: (x, f) => x.value.subscribe(f),
        onlyNotifyOnChildChange: true,
      })
    },
  }

  return {
    type: 'array',
    name,
    validate(formValue) {
      const { children } = validate
        ? validate(value.get(), formValue)
        : internalState.get()

      children.forEach(x => x.validate(formValue))
    },
    setSubmitted(isSubmitted) {
      const { children } = internalState.update(x => updateState(x, { isSubmitted }))
      children.forEach(x => x.setSubmitted(isSubmitted))
    },
    reset() {
      const { children } = internalState.update(x => initialState)
      children.forEach(x => x.reset())
    },
    value,
    state: { get: internalState.get, subscribe: internalState.subscribe },
    helpers: {
      add(initialValue) {
        internalState.update(x => {
          const newChildren = [...x.children, createFormFieldsAt(initialValue, x.children.length)]
          return updateState(x, { children: newChildren })
        })
      },
      remove(entry) {
        internalState.update(x => {
          const newChildren = x.children.filter(x => x !== entry)
          return updateState(x, { children: newChildren })
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

  const initialFieldState = deriveFieldState({ value: initialValue })
  const internalState = createState(initialFieldState)
  const validate = bindValidate(field.validate, internalState)

  const value = {
    get() { return internalState.get().value },
    subscribe(f) {
      return internalState.subscribe(({ value: newValue }, { value: oldValue }) => {
        if (newValue === oldValue) return
        f(newValue, oldValue)
      })
    },
  }

  return {
    type: 'basic',
    name,
    validate(formValue) {
      if (validate) validate(value.get(), formValue)
    },
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

function bindValidate(f, state) {
  return f && (
    (...args) => {
      const error = f && f(...args)
      return state.update(x => isEqual(error, x.error) ? x : updateState(x, { error }))
    }
  )
}
