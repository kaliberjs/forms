import { ValidationRule } from './validation';

export type Schema<T> = T extends (infer E)[]
  ? { type: 'array', fields: Schema<E> | ((value: E) => Schema<E>) }
  : T extends object
  ? { type: 'object', fields: { [K in keyof T]: Schema<T[K]> } }
  : ValidationRule<T> | ValidationRule<T>[];

export type FieldsSchema<T> = { [K in keyof T]: Schema<T[K]> };

export type InferValue<S> = S extends { type: 'array'; fields: infer F }
  ? F extends (value: any) => any
    ? InferValue<ReturnType<F>>[]
    : InferValue<F>[]
  : S extends { type: 'object'; fields: infer F }
  ? { [K in keyof F]: InferValue<F[K]> }
  : S extends (ValidationRule<infer T>)[]
  ? T
  : S extends ValidationRule<infer T>
  ? T
  : S extends FieldsSchema<infer T>
  ? { [K in keyof T]: InferValue<T[K]> }
  : any;

export function object<T>(fields: FieldsSchema<T>): { type: 'object', fields: FieldsSchema<T> };
export function object<T>(validate: ValidationRule<T>, fields: FieldsSchema<T>): { type: 'object', validate: ValidationRule<T>, fields: FieldsSchema<T> };
export function array<T>(fields: Schema<T>): { type: 'array', fields: Schema<T> };
export function array<T>(validate: ValidationRule<T[]>, fields: Schema<T>): { type: 'array', validate: ValidationRule<T[]>, fields: Schema<T> };

 