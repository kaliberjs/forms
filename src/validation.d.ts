export const optional: null
export const required: ValidationFunction

export const number: ValidationFunction
export function min(min: number): ValidationFunction
export function max(max: number): ValidationFunction

export function minLength(min: number): ValidationFunction

export function message(id: string, ...params: Array<any>): ValidationResult
