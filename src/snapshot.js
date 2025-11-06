import { unsubscribe } from 'diagnostics_channel'
import { subscribeToAll, subscribeToChildren } from './state'
import { asAny, asConst } from './type-helpers'
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
    /**
     * @type {{
     *   childrenInvalid: boolean,
     *   childErrors: { [K in keyof T['fields']]: Falsy | ValidationError }
     *   childValues: { [K in keyof T['fields']]: any }
     * }}
     */
    ({ childrenInvalid: false, childErrors: {}, childValues: {} })
  )

  return asAny(/** @satisfies {Snapshot.Object} */ ({
    invalid: invalid || childrenInvalid,
    value: childValues,
    error: { self: error, children: childErrors },
  }))
}

/**
 * @template {Field.Array} T
 * @arg {T} field
 * @returns {Snapshot.FromField<T>}
 */
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
    /**
     * @type {{
    *   childrenInvalid: boolean
    *   childValues: Snapshot.Object['value'][]
    *   childErrors: Snapshot.Object['error'][]
    * }}
    */
    ({ childrenInvalid: false, childValues: [], childErrors: [] })
  )
  return asAny(/** @satisfies {Snapshot.Array} */ ({
    invalid: invalid || childrenInvalid,
    value: childValues,
    error: { self: error, children: childErrors },
  }))
}

/**
 * @template {Field.Basic} T
 * @arg {T} field
 * @returns {Snapshot.FromField<T>}
 */
function getForBasic(field) {
  const { value, error, invalid } = field.state.get()
  return asAny(/** @satisfies {Snapshot.Basic} */ ({ value, error, invalid }))
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
    /** @arg {ReturnType<typeof get<T>>} _ */
    notify: _ => f(field),
    subscribeToChild: subscribe,
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
