export type ValidationError = { id: string; params: any[] };
export type ValidationFunction = (value: any, context: any) => ValidationError | false | void;
export type ValidationRule = ValidationFunction | ValidationFunction[];

export function error(id: string, ...params: any[]): ValidationError;

export const optional: null;
export const required: (x: any) => ValidationError | false;
export const number: (x: any) => ValidationError | false;
export function min(min: number): (x: any) => ValidationError | false;
export function max(max: number): (x: any) => ValidationError | false;
export function minLength(min: number): (x: any) => ValidationError | false;
export function maxLength(max: number): (x: any) => ValidationError | false;
export const email: (x: any) => ValidationError | false;
