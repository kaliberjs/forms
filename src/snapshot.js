import { subscribeToAll, subscribeToChildren } from './state'

export function get(field) {
  return {
    'object': getForObject,
    'array': getForArray,
    'basic': getForBasic,
  }[field.type](field)
}

export function subscribe(field, f) {
  return {
    'object': subscribeForObject,
    'array': subscribeForArray,
    'basic': subscribeForBasic,
  }[field.type](field, f)
}

function getForObject(field) {
  const { error, invalid } = field.state.get()
  const { childrenInvalid, childErrors, childValues } =  Object.entries(field.fields).reduce(
    ({ childrenInvalid, childValues, childErrors }, [name, child]) => {
      const { value, error, invalid } = get(child)
      return {
        childrenInvalid: childrenInvalid || invalid,
        childErrors: { ...childErrors, [name]: error },
        childValues: { ...childValues, [name]: value },
      }
    },
    { childrenInvalid: false, childErrors: {}, childValues: {} }
  )

  return {
    invalid: invalid || childrenInvalid,
    value: childValues,
    error: { self: error, children: childErrors },
  }
}

function getForArray(field) {
  const { children, error, invalid } = field.state.get()
  const { childrenInvalid, childValues, childErrors } = children.reduce(
    ({ childrenInvalid, childValues, childErrors }, child) => {
      const { value, error, invalid} = get(child)
      return {
        childrenInvalid: childrenInvalid || invalid,
        childValues: [...childValues, value],
        childErrors: [...childErrors, error],
      }
    },
    { childrenInvalid: false, childValues: [], childErrors: [] }
  )
  return {
    invalid: invalid || childrenInvalid,
    value: childValues,
    error: { self: error, children: childErrors },
  }
}

function getForBasic(field) {
  const { value, error, invalid } = field.state.get()
  return { value, error, invalid }
}

function subscribeForObject(field, f) {
  return subscribeToChildren({
    children: Object.values(field.fields),
    notify: _ => f(getForObject(field)),
    subscribeToChild: subscribe,
  })
}

function subscribeForArray(field, f) {
  return subscribeToAll({
    state: field.state,
    childrenFromState: x => x.children,
    notify: _ => f(getForArray(field)),
    subscribeToChild: subscribe,
  })
}

function subscribeForBasic(field, f) {
  return field.state.subscribe(({ value, error, invalid }) => f({ value, error, invalid }))
}
