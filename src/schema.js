export function object(fields) {
  return { type: 'object', fields }
}
export function array(fieldsOrValidate, fields) {
  return { type: 'array', fields: fields || fieldsOrValidate, validate: fields && fieldsOrValidate }
}

export function validate(f) { return { validate: f } }

export const optional = {}
export const required = validate(x => !x && message('required'))

export const number = validate(x => Number(x) !== x && message('number'))
export function min(min) { return validate(x => x < min && message('min', min)) }
export function max(max) { return validate(x => x > max && message('max', max)) }

export function minLength(min) { return validate(x => x.length < min && message('min-length', min)) }

export function message(id, ...params) {
  return { id, params }
}
