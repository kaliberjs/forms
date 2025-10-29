/** @import { Falsy, FieldSchema, NormalizedField, ValidationFunction } from './types' */

/**
 * @arg {FieldSchema} field
 * @arg {string} [name]
 * @returns {NormalizedField}
 */
export function normalize(field, name) {
  return (
    convertValidationFunction(field, name) ||
    convertValidationArray(field, name) ||
    convertArrayField(field, name) ||
    convertObjectField(field, name) ||
    convertSimpleField(field, name)
  )
}

/**
 * @arg {FieldSchema} x
 * @arg {string} name
 * @returns {NormalizedField.Basic}
 */
function convertValidationFunction(x, name) {
  return x instanceof Function &&
    { type: 'basic', validate: toValidationFunction(x, name) }
}
/**
 * @arg {FieldSchema} x
 * @arg {string} name
 * @returns {NormalizedField.Basic}
 */
function convertValidationArray(x, name) {
  return x instanceof Array &&
    { type: 'basic', validate: toValidationFunction(x, name) }
}
/**
 * @arg {FieldSchema} x
 * @arg {string} name
 * @returns {NormalizedField.Array}
 */
function convertArrayField(x, name) {
  return x && 'type' in x && x.type === 'array' &&
    { type: 'array', validate: toValidationFunction(x.validate, name), fields: x.fields }
}
/**
 * @arg {FieldSchema} x
 * @arg {string} name
 * @returns {NormalizedField.Object}
 */
function convertObjectField(x, name) {
  return x && 'type' in x && x.type === 'object' &&
    { type: 'object', validate: toValidationFunction(x.validate, name), fields: x.fields }
}
/**
 * @arg {FieldSchema} x
 * @arg {string} name
 * @returns {NormalizedField.Basic}
 */
function convertSimpleField(x, name) {
  return { type: 'basic', validate: toValidationFunction(x && 'validate' in x && x.validate, name) }
}

/**
 * @arg {ValidationFunction | ValidationFunction[]} fOrArrayOfF
 * @param {string} name
 * @returns {null | ValidationFunction}
 */
function toValidationFunction(fOrArrayOfF = [], name) {
  const result = [].concat(fOrArrayOfF).reduce(
    (previous, next) => {
      const combined = previous && next && ((...args) => previous(...args) || next(...args))
      return combined || next || previous
    },
    null
  )

  return result && withBetterError(result, name)
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
