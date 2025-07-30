import { ValidationRule } from './validation';

type IfAny<T, Y, N> = 0 extends (1 & T) ? Y : N;
type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

export type Schema<T> = T extends (infer E)[]
  ? { type: 'array', fields: Schema<E> | ((value: E) => Schema<E>) }
  : T extends object
  ? { type: 'object', fields: { [K in keyof T]: Schema<T[K]> } }
  : ValidationRule<T> | ValidationRule<T>[];

export type FieldsSchema<T> = { [K in keyof T]: Schema<T[K]> };

export function object<A, B>(fieldsOrValidate: A, fields?: B): Expand<{ type: 'object' } & IfAny<B, { fields: A }, { fields: B, validate: A }>>;
export function array<A, B>(fieldsOrValidate: A, fields?: B): Expand<{ type: 'array' } & IfAny<B, { fields: A }, { fields: B, validate: A }>>;


export function basic<T>(validate?: ValidationRule<T>): { type: 'basic', validate?: ValidationRule<T> };
export function string(validate?: ValidationRule<string>): { type: 'basic', validate?: ValidationRule<string> };
export function number(validate?: ValidationRule<number>): { type: 'basic', validate?: ValidationRule<number> };
export function boolean(validate?: ValidationRule<boolean>): { type: 'basic', validate?: ValidationRule<boolean> };
export function email(validate?: ValidationRule<string>): { type: 'basic', validate?: ValidationRule<string> };