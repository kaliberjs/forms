export function object(fieldsOrValidate, fields) {
  return { type: 'object', ...body(fieldsOrValidate, fields) }
}
export function array(fieldsOrValidate, fields) {
  return { type: 'array', ...body(fieldsOrValidate, fields) }
}

function body(fieldsOrValidate, fields) {
  return { fields: fields || fieldsOrValidate, validate: fields && fieldsOrValidate }
}
