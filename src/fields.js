import { normalize } from './normalize'
import { createState, subscribeToAll, subscribeToChildren } from './state'
import isEqual from 'react-fast-compare'

const constructors = {
  basic: createBasicFormField,
  array: createArrayFormField,
  object: createObjectFormField,
}

export function createObjectFormField({ name = '', initialValue = {}, field }) {

  const fields = createFormFields(initialValue, field.fields, name && `${name}.`)
  const children = Object.values(fields)

  const initialState = deriveFormFieldState({})
  const internalState = createState(initialState)
  const validate = bindValidate(field.validate, internalState)

  const value = {
    get() { return mapValues(fields, child => child.value.get()) },
    subscribe(f) {
      return subscribeToChildren({
        children,
        notify: _ => f(value.get()),
        subscribeToChild: (x, f) => x.value.subscribe(f),
      })
    },
  }

  return {
    type: 'object',
    name,
    validate(context) {
      const currentValue = value.get()
      if (validate) validate(currentValue, context)
      children.forEach(x => x.validate(addParent(context, currentValue)))
    },
    setSubmitted(isSubmitted) {
      internalState.update(x => updateState(x, { isSubmitted }))
      children.forEach(x => x.setSubmitted(isSubmitted))
    },
    reset() {
      internalState.update(x => updateState(x, initialState))
      children.forEach(x => x.reset())
    },
    value,
    state: { get: internalState.get, subscribe: internalState.subscribe },
    fields,
  }

  function createFormFields(initialValues, fields, namePrefix = '') {
    return mapValues(fields, (field, name) => {
      const fullName = `${namePrefix}${name}`
      const normalizedField = normalize(field, fullName)
      const constructor = constructors[normalizedField.type]
      return constructor({
        name: fullName,
        field: normalizedField,
        initialValue: initialValues[name]
      })
    })
  }
}

function createArrayFormField({ name, initialValue = [], field }) {

  let index = 0

  const initialChildren = initialValue.map(createFormField)
  const initialState = deriveFormFieldState({
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
    validate(context) {
      const currentValue = value.get()
      const { children } = validate ? validate(currentValue, context) : internalState.get()
      children.forEach(x => x.validate(addParent(context, currentValue)))
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
          const newChildren = [...x.children, createFormField(initialValue)]
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

  function createFormField(initialValue) {
    const fullName = `${name}[${index++}]`
    return createObjectFormField({
      name: fullName,
      initialValue,
      field: normalize({ type: 'object', fields: field.fields }, fullName),
    })
  }
}

function createBasicFormField({ name, initialValue, field }) {

  const initialFormFieldState = deriveFormFieldState({ value: initialValue })
  const internalState = createState(initialFormFieldState)
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
    validate(context) {
      if (validate) validate(value.get(), context)
    },
    setSubmitted(isSubmitted) {
      internalState.update(x => updateState(x, { isSubmitted }))
    },
    reset() {
      internalState.update(x => initialFormFieldState)
    },
    value,
    state: { get: internalState.get, subscribe: internalState.subscribe },
    eventHandlers: {
      onBlur() {
        internalState.update(x => updateState(x, { hasFocus: false, isVisited: true }))
      },
      onFocus() {
        internalState.update(x => updateState(x, { hasFocus: true }))
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

function updateState(formFieldState, update) {
  return deriveFormFieldState({ ...formFieldState, ...update })
}

function deriveFormFieldState({
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
      const error = (f && f(...args)) || false
      return state.update(x => isEqual(error, x.error) ? x : updateState(x, { error }))
    }
  )
}

function addParent(context, parent) {
  return { ...context, parents: [...context.parents, parent] }
}
