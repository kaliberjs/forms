export function array<X extends Validation, Y extends FormFields>(
  validation: X, fields: Y
): { type: 'array', validation: X, fields: Y }
export function array<Y extends FormFields>(
  fields: Y
): { type: 'array', fields: Y }
