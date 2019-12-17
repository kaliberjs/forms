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

export const optional: null
export const required: ValidationFunction

export const number: ValidationFunction
export function min(min: number): ValidationFunction
export function max(max: number): ValidationFunction

export function minLength(min: number): ValidationFunction

export function message(id: string, ...params: Array<any>): ValidationResult
