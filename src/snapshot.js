import { subscribeToAll, subscribeToChildren } from './state'
/** @import { State, Expand, Falsy, Field, Snapshot, ValidationError } from './types.ts' */

/**
 * @template {Field} T
 * @param {T} field
 * @returns {Expand<Snapshot.FromField<T>>}
 */
export function get(field) {
  // @ts-expect-error
  return {
    'object': getForObject,
    'array': getForArray,
    'basic': getForBasic,
  }[field.type](field)
}

/**
 * @template {Field} T
 * @arg {T} field
 * @arg {(snapshot: ReturnType<typeof get<T>>) => void} f
 * @returns {State.Unsubscribe}
 */
export function subscribe(field, f) {
  return subscribeToFieldState(field, x => f(get(x)))
}

/**
 * @template {Field} T
 * @arg {T} field
 * @arg {(field: T) => void} f
 * @returns {State.Unsubscribe}
 */
export function subscribeToFieldState(field, f) {
  // @ts-expect-error
  return {
    'object': subscribeForObject,
    'array': subscribeForArray,
    'basic': subscribeForBasic,
  }[field.type](field, f)
}

/**
 * @template {Field.Object} T
 * @arg {T} field
 * @returns {Snapshot.FromField<T>}
 */
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

  return /** @type {Snapshot.FromField<T>} */ ({
    invalid: invalid || childrenInvalid,
    value: childValues,
    error: { self: error, children: childErrors },
  })
}

/**
 * @template {Field.Array} T
 * @arg {T} field
 * @returns {Snapshot.FromField<T>}
 */
function getForArray(field) {
  const { children, error, invalid } = field.state.get()
  const { childrenInvalid, childValues, childErrors } = children.reduce(
    /**
     * @arg {{ childrenInvalid: boolean, childValues: Record<string, any>[], childErrors: Snapshot.Object['error'][] }} result
     * @arg {Field.Object<Field.ObjectFields>} child
     */
    ({ childrenInvalid, childValues, childErrors }, child) => {
      const { value, error, invalid } = get(child)
      return {
        childrenInvalid: childrenInvalid || invalid,
        childValues: [...childValues, value],
        childErrors: [...childErrors, error],
      }
    },
    { childrenInvalid: false, childValues: [], childErrors: [] }
  )
  return /** @type {Snapshot.FromField<T>} */ ({
    invalid: invalid || childrenInvalid,
    value: childValues,
    error: { self: error, children: childErrors },
  })
}

/**
 * @template {Field.Basic} T
 * @arg {T} field
 * @returns {Snapshot.FromField<T>}
 */
function getForBasic(field) {
  const { value, error, invalid } = field.state.get()
  return /** @type {Snapshot.FromField<T>} */ ({ value, error, invalid })
}

/**
 * @template {Field.Object} T
 * @arg {T} field
 * @arg {(field: T) => void} f
 * @returns {State.Unsubscribe}
 */
function subscribeForObject(field, f) {
  return subscribeToChildren({
    children: Object.values(field.fields),
    /** @arg {ReturnType<typeof get<Field.ObjectFields[string]>>} _ */
    notify: _ => f(field),
    subscribeToChild: /** @type {typeof subscribe<Field.ObjectFields[string]>} */ (subscribe),
  })
}

/**
 * @template {Field.Array} T
 * @arg {T} field
 * @arg {(field: T) => void} f
 * @returns {State.Unsubscribe}
 */
function subscribeForArray(field, f) {
  return subscribeToAll({
    state: field.state,
    childrenFromState: x => x.children,
    notify: _ => f(field),
    subscribeToChild: subscribe,
  })
}

/**
 * @template {Field.Basic} T
 * @arg {T} field
 * @arg {(field: T) => void} f
 * @returns {State.Unsubscribe}
 */
function subscribeForBasic(field, f) {
  return field.state.subscribe(_ => f(field))
}
