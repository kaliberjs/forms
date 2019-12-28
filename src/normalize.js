export function normalize(field, name) {
  return (
    convertValidationFunction(field, name) ||
    convertValidationArray(field, name) ||
    convertArrayField(field, name) ||
    convertObjectField(field, name) ||
    convertSimpleField(field, name)
  )
}

function convertValidationFunction(x, name) {
  return x instanceof Function &&
    { type: 'basic', validate: toValidationFunction(x, name) }
}
function convertValidationArray(x, name) {
  return x instanceof Array &&
    { type: 'basic', validate: toValidationFunction(x, name) }
}
function convertArrayField(x, name) {
  return x && 'type' in x && x.type === 'array' &&
    { type: 'array', validate: toValidationFunction(x.validate, name), fields: x.fields }
}
function convertObjectField(x, name) {
  return x && 'type' in x && x.type === 'object' &&
    { type: 'object', validate: toValidationFunction(x.validate, name), fields: x.fields }
}
function convertSimpleField(x, name) {
  return { type: 'basic', validate: toValidationFunction(x && x.validate, name) }
}

function toValidationFunction(x = [], name) {
  const result = [].concat(x).reduce(
    (previous, next) => {
      const combined = previous && next && ((...args) => previous(...args) || next(...args))
      return combined || next || previous
    },
    null
  )

  return result && withBetterError(result, name)
}

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
