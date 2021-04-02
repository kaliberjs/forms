export const optional = null
export const required = x => !x && x !== false && x !== 0 && error('required')

export const number = x => Number(x) !== x && error('number')
/** @param {number} min */
export function min(min) { return x => x < min && error('min', min) }
/** @param {number} max */
export function max(max) { return x => x > max && error('max', max) }

/** @param {number} min */
export function minLength(min) { return x => x && x.length < min && error('minLength', min) }
/** @param {number} max */
export function maxLength(max) { return x => x && x.length > max && error('maxLength', max) }

/** @param {number} min */
export function arrayWithAtLeast(min) { 
  return x => x && x.length < min && error('arrayWithAtLeast', min) 
}

const emailRegex = /.+@.+\..+/
export const email = x => x && !emailRegex.test(x) && error('email')

/**
 * @template {string} T
 * @param {T} id
 */
export function error(id, ...params) { return { id, params } }
