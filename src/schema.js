export function object(fields) {
  return { type: 'object', fields }
}
export function array(fieldsOrValidate, fields) {
  return { type: 'array', fields: fields || fieldsOrValidate, validate: fields && fieldsOrValidate }
}
