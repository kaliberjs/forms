export const optional = null
export const required = x => !x && message('required')

export const number = x => Number(x) !== x && message('number')
export function min(min) { return x => x < min && message('min', min) }
export function max(max) { return x => x > max && message('max', max) }

export function minLength(min) { return x => x.length < min && message('minLength', min) }
export function maxLength(max) { return x => x.length > max && message('maxLength', max) }

const emailRegex = /.+@.+\..+/
export const email = x => x && !emailRegex.test(x) && message('email')

export function message(id, ...params) { return { id, params } }
