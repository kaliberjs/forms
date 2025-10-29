/** @import { Expand, FieldSchema, Validate } from './types.ts' */

/**
 * @template {FieldSchema.ObjectInput | Validate<FieldSchema.ToValue<B>>} const A
 * @template {FieldSchema.ObjectInput} [const B = {}]
 * @arg {A} fieldsOrValidate
 * @arg {B} [fields]
 */
export function object(fieldsOrValidate, fields) {
  return body('object', fieldsOrValidate, fields)
}

/**
 * @template A, B
 * @arg {A} fieldsOrValidate
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
 * @returns {Expand<{ type: T } & (
 *   {} extends B ? { fields: A } :
 *   B extends infer X ? { fields: X, validate: A } :
 *   never
 * )>}
 */
function body(type, fieldsOrValidate, fields) {
  // @ts-expect-error - if you want to remove this @ts-ignore: good luck and please leave a comment afterwards *
  return { type, fields: fields || fieldsOrValidate, validate: fields && fieldsOrValidate }
}
