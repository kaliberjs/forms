/** @import { ValidationFunction } from './types.ts' */

/**
 * @template {string} T
 * @typedef {(
 *   T extends 'string' ? string :
 *   T extends 'number' ? number :
 *   T extends 'number | string' ? number | string :
 *   T extends 'boolean' ? boolean :
 *   T extends `${infer X}[]` ? TypeLookup<X>[] :
 *   T
 * )} TypeLookup
 */

/**
 * @template {string} const T
 *
 * @overload
 * @arg {T} type
 * @returns {((x: TypeLookup<T>) => never)}
 *
 * @arg {any} type
 * @returns {null | ((x: any) => never)}
 */
export function optionalT(type) {
  return null
}

/**
 * @template {string} const T
 *
 * @arg {T} type
 * @returns {ValidationFunction<TypeLookup<T>>}
 */
export function requiredT(type) {
  return required
}

export const optional = null
export const required =
  /** @template T @arg {T} x */
  x => !x && x !== false && x !== 0 && error('required')

export const number =
  /** @arg {number} x */
  x => Number(x) !== x && error('number')

/** @arg {number} min */
export function min(min) {
  /** @arg {number} x */
  return x => (x || x === 0) && x < min && error('min', min)
}

/** @arg {number} max */
export function max(max) {
  /** @arg {number} x */
  return x => (x || x === 0) && x > max && error('max', max)
}

/** @arg {number} min */
export function minLength(min) {
  /** @arg {{ length: number }} x */
  return x => x && x.length < min && error('minLength', min)
}
/** @arg {number} max */
export function maxLength(max) {
  /** @arg {{ length: number }} x */
  return x => x && x.length > max && error('maxLength', max)
}

const emailRegex = /.+@.+\..+/
export const email =
  /** @arg {string} x */
  x => x && !emailRegex.test(x) && error('email')

/**
 * @template {string} T
 * @template {[...any]} P
 * @arg {T} id
 * @arg {P} params
 */
export function error(id, ...params) { return { id, params } }
