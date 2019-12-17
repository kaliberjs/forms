export function object(fields) {
  return { type: 'object', fields }
}
export function array(fieldsOrValidate, fields) {
  return { type: 'array', fields: fields || fieldsOrValidate, validate: fields && fieldsOrValidate }
}

export const optional = null
export const required = x => !x && message('required')

export const number = x => Number(x) !== x && message('number')
export function min(min) { return x => x < min && message('min', min) }
export function max(max) { return x => x > max && message('max', max) }

export function minLength(min) { return x => x.length < min && message('min-length', min) }

export function message(id, ...params) {
  return { id, params }
}
