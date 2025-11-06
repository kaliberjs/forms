/** @import { FieldSchema, NormalizedField, Validate, ValidationFunction } from './types.ts' */

/**
 * @template {FieldSchema} T
 *
 * @arg {T} field
 * @arg {string} [name]
 */
export function normalize(field, name = '') {
  return /** @type {NormalizedField.FromFieldSchema<T>} */ (
    convertValidationFunction(field, name) ||
    convertValidationArray(field, name) ||
    convertArrayField(field, name) ||
    convertObjectField(field, name) ||
    convertSimpleField(field, name)
  )
}

/**
 * @arg {FieldSchema} field
 * @arg {string} name
 * @returns {false | NormalizedField.Basic}
 */
function convertValidationFunction(field, name) {
  return field instanceof Function &&
    { type: 'basic', validate: toValidationFunction(field, name) }
}

/**
 * @arg {FieldSchema} field
 * @arg {string} name
 * @returns {false | NormalizedField.Basic}
 */
function convertValidationArray(field, name) {
  return field instanceof Array &&
    { type: 'basic', validate: toValidationFunction(field, name) }
}

/**
 * @arg {FieldSchema} field
 * @arg {string} name
 * @returns {null | false | NormalizedField.Array}
 */
function convertArrayField(field, name) {
  return field && 'type' in field && field.type === 'array' &&
    { type: 'array', validate: toValidationFunction(field.validate, name), fields: field.fields }
}

/**
 * @arg {FieldSchema} field
 * @arg {string} name
 * @returns {null | false | NormalizedField.Object}
 */
function convertObjectField(field, name) {
  return field && 'type' in field && field.type === 'object' &&
    { type: 'object', validate: toValidationFunction(field.validate, name), fields: field.fields }
}

/**
 * @arg {FieldSchema} field
 * @arg {string} name
 * @returns {NormalizedField.Basic}
 */
function convertSimpleField(field, name) {
  return { type: 'basic', validate: toValidationFunction(field && 'validate' in field && field.validate, name) }
}

/**
 * @arg {false | undefined | Validate} fOrArrayOfF
 * @param {string} name
 * @returns {null | ValidationFunction}
 */
function toValidationFunction(fOrArrayOfF, name) {
  const result = /** @type {(false | undefined | null | ValidationFunction)[]} */ ([])
    .concat(fOrArrayOfF)
    .reduce(
      /** @arg {null | ValidationFunction} previous */
      (previous, next) => {
        const combined = previous && next && (
          /** @arg {[any, ...any]} args */
          (...args) => previous(...args) || next(...args)
        )
        return combined || next || previous
      },
      null
    )

  return result ? withBetterError(result, name) : null
}

/**
 * @arg {ValidationFunction} f
 * @arg {string} name
 * @returns {ValidationFunction}
 */
function withBetterError(f, name) {
  return (...args) => {
    try {
      return f(...args)
    } catch (e) {
      e.message = `Problem validating '${name}'\nCaused by:\nError: ${e.message}`
      throw e
    }
  }
}
