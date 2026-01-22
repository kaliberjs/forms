/** @import { Expand, FieldInput, Validate } from './types.ts' */

/**
 * @template {Validate<FieldInput.ObjectToValue<B>>} const A
 * @template {FieldInput.Object} const B
 *
 * @overload
 * @arg {A} fieldsOrValidate
 * @arg {B} fields
 * @returns {ReturnType<typeof body<'object', A, B>>}
 *
 * @overload
 * @arg {B} fieldsOrValidate
 * @returns {ReturnType<typeof body<'object', B, undefined>>}
 *
 * @arg {A | B} fieldsOrValidate
 * @arg {B} [fields]
 */
export function object(fieldsOrValidate, fields) {
  return body('object', fieldsOrValidate, fields)
}

/**
 * @template {Validate<Expand<FieldInput.ArrayToValue<B>>>} const A
 * @template {FieldInput.Array} const B
 *
 * @overload
 * @arg {A} fieldsOrValidate
 * @arg {B} fields
 * @returns {ReturnType<typeof body<'array', A, B>>}
 *
 * @overload
 * @arg {B} fieldsOrValidate
 * @returns {ReturnType<typeof body<'array', B, undefined>>}
 *
 * @arg {A | B} fieldsOrValidate
 * @arg {B} [fields]
 */
export function array(fieldsOrValidate, fields) {
  return body('array', fieldsOrValidate, fields)
}

/**
 * @template {string} T
 * @template A, B
 *
 * @arg {T} type
 * @arg {A} fieldsOrValidate
 * @arg {B} [fields]
 *
 * @returns {{ type: T } & (
 *   B extends undefined ? { fields: A } :
 *   B extends infer X ? { fields: X, validate: A } :
 *   never
 * )}
 */
function body(type, fieldsOrValidate, fields) {
  // @ts-expect-error - if you want to remove this @ts-ignore: good luck and please leave a comment afterwards *
  return { type, fields: fields || fieldsOrValidate, validate: fields && fieldsOrValidate }
}
