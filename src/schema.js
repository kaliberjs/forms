/// <reference path="./schema.d.ts" />

export function object(fieldsOrValidate, fields) {
  return body('object', fieldsOrValidate, fields)
}

export function array(fieldsOrValidate, fields) {
  return body('array', fieldsOrValidate, fields)
}

function body(type, fieldsOrValidate, fields) {
  return { type, fields: fields || fieldsOrValidate, validate: fields && fieldsOrValidate }
}
