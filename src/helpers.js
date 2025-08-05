export function objectWithValidation({ fields, validators }) {
  return Object.assign(validators, {
    type: 'object',
    fields
  })
}
