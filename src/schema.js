/**
 * @template A, B
 * @param {A} fieldsOrValidate
 * @param {B} [fields]
 */
export function object(fieldsOrValidate, fields) {
  return body('object', fieldsOrValidate, fields)
}

/**
 * @template A, B
 * @param {A} fieldsOrValidate
 * @param {B} [fields]
 */
export function array(fieldsOrValidate, fields) {
  return body('array', fieldsOrValidate, fields)
}

/**
 * @template {string} T
 * @template A, B
 *
 * @param {T} type
 * @param {A} fieldsOrValidate
 * @param {B} [fields]
 *
 * @returns {Expand<{ type: T } & IfAny<B, { fields: A }, { fields: B, validate: A }>>}
 */
function body(type, fieldsOrValidate, fields) {
  // @ts-ignore - if you want to remove this @ts-ignore: good luck and please leave a comment afterwards *
  return { type, fields: fields || fieldsOrValidate, validate: fields && fieldsOrValidate }
}
