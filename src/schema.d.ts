export function array<X extends FormFields, Y extends Validation>(
  validate: Y, fields: X
): { type: 'array', fields: X, validate: Y }

export function array<Y extends FormFields>(
  fields: Y
): { type: 'array', fields: Y }

export function object<X extends FormFields, Y extends Validation>(
  validate: Y, fields: X
): { type: 'object', fields: X, validate: Y }

export function object<X extends FormFields>(
  fields: X
): { type: 'object', fields: X }
