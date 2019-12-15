export function normalize(field) {
  return (
    convertValidationArray(field) ||
    convertArrayField(field) ||
    convertObjectField(field) ||
    convertSimpleField(field)
  )

  function convertValidationArray(x) {
    return x instanceof Array && {
      type: 'basic',
      validate: toValidationFunction(x)
    }
  }
  function convertSimpleField(x) {
    return {
      type: 'basic',
      validate: toValidationFunction(x.validate)
    }
  }
  function convertArrayField(x) {
    return 'type' in x && x.type === 'array' && {
      type: 'array',
      validate: toValidationFunction(x.validate),
      fields: x.fields
    }
  }
  function convertObjectField(x) {
    return 'type' in x && x.type === 'object' && {
      type: 'object',
      validate: toValidationFunction(x.validate),
      fields: x.fields
    }
  }

  function toValidationFunction(x = []) {
    return [].concat(x).reduce(
      (previous, next) => x => previous(x) || ('validate' in next ? next.validate(x) : next(x)),
      _ => {}
    )
  }
}
