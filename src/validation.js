export const optional = null
export const required = x => !x && x !== false && x !== 0 && message('required')

export const number = x => Number(x) !== x && message('number')
/** @param {number} min */
export function min(min) { return x => x < min && message('min', min) }
/** @param {number} max */
export function max(max) { return x => x > max && message('max', max) }

/** @param {number} min */
export function minLength(min) { return x => x && x.length < min && message('minLength', min) }
/** @param {number} max */
export function maxLength(max) { return x => x && x.length > max && message('maxLength', max) }

const emailRegex = /.+@.+\..+/
export const email = x => x && !emailRegex.test(x) && message('email')

/**
 * @template {string} T
 * @param {T} id
 */
export function message(id, ...params) { return { id, params } }
