/**
 * @overload
 * @arg {'number'} type
 * @returns {((x: number) => never)}
 *
 * @overload
 * @arg {`number | string`} type
 * @returns {((x: number | string) => never)}
 *
 * @overload
 * @arg {'boolean'} type
 * @returns {((x: boolean) => never)}
 *
 * @overload
 * @arg {'string'} type
 * @returns {((x: string) => never)}
 *
 * @arg {any} type
 * @returns {null | ((x: any) => never)}
 */
export function optionalT(type) {
  return null
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
