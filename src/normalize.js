export function normalize(field) {
  return (
    convertValidationFunction(field) ||
    convertValidationArray(field) ||
    convertArrayField(field) ||
    convertObjectField(field) ||
    convertSimpleField(field)
  )

  function convertValidationFunction(x) {
    return x instanceof Function &&
      { type: 'basic', validate: x }
  }
  function convertValidationArray(x) {
    return x instanceof Array &&
      { type: 'basic', validate: toValidationFunction(x) }
  }
  function convertArrayField(x) {
    return x && 'type' in x && x.type === 'array' &&
      { type: 'array', validate: toValidationFunction(x.validate), fields: x.fields }
  }
  function convertObjectField(x) {
    return x && 'type' in x && x.type === 'object' &&
      { type: 'object', validate: toValidationFunction(x.validate), fields: x.fields }
  }
  function convertSimpleField(x) {
    return { type: 'basic', validate: toValidationFunction(x && x.validate) }
  }

  function toValidationFunction(x = []) {
    return [].concat(x).reduce(
      (previous, next) => {
        const combined = previous && next && ((...args) => previous(...args) || next(...args))
        return combined || next || previous
      },
      null
    )
  }
}
