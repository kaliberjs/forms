import { ValidationRule } from './validation';

type IfAny<T, Y, N> = 0 extends (1 & T) ? Y : N;
type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

export type Schema<T> = T extends (infer E)[]
  ? { type: 'array', fields: Schema<E> | ((value: E) => Schema<E>) }
  : T extends object
  ? { type: 'object', fields: { [K in keyof T]: Schema<T[K]> } }
  : ValidationRule<T> | ValidationRule<T>[];

export type FieldsSchema<T> = { [K in keyof T]: Schema<T[K]> };

export type TypeFromSchema<S> = S extends { type: 'array'; fields: infer F }
  ? F extends (value: any) => any
    ? TypeFromSchema<ReturnType<F>>[]
    : TypeFromSchema<F>[]
  : S extends { type: 'object'; fields: infer F }
  ? TypeFromFieldsSchema<F>
  : S extends (ValidationRule<infer T>)[]
  ? T
  : S extends ValidationRule<infer T>
  ? T
  : S extends FieldsSchema<any>
  ? TypeFromFieldsSchema<S>
  : any;

export type TypeFromFieldsSchema<T> = { [K in keyof T]: TypeFromSchema<T[K]> };

export function object<T>(fields: FieldsSchema<T>): { type: 'object', fields: FieldsSchema<T> };
export function object<T>(validate: ValidationRule<T>, fields: FieldsSchema<T>): { type: 'object', validate: ValidationRule<T>, fields: FieldsSchema<T> };
export function array<T>(fields: Schema<T>): { type: 'array', fields: Schema<T> };
export function array<T>(validate: ValidationRule<T[]>, fields: Schema<T>): { type: 'array', validate: ValidationRule<T[]>, fields: Schema<T> };


export function basic<T>(validate?: ValidationRule<T>): { type: 'basic', validate?: ValidationRule<T> };
export function string(validate?: ValidationRule<string>): { type: 'basic', validate?: ValidationRule<string> };
export function number(validate?: ValidationRule<number>): { type: 'basic', validate?: ValidationRule<number> };
export function boolean(validate?: ValidationRule<boolean>): { type: 'basic', validate?: ValidationRule<boolean> };
export function email(validate?: ValidationRule<string>): { type: 'basic', validate?: ValidationRule<string> };