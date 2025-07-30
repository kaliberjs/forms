import { ValidationContext } from '../index';

export type ValidationError = { id: string; params: unknown[] };
export type ValidationFunction<T> = (value: T, context: ValidationContext<T>) => ValidationError | false | void;
export type ValidationRule<T> = ValidationFunction<T> | (ValidationFunction<T> | ValidationError)[] | ValidationError;

export function error(id: string, ...params: unknown[]): ValidationError;

export function equalTo<T>(field: string, message?: string): ValidationRule<T>;
export function oneOf<T>(values: T[], message?: string): ValidationRule<T>;
export function someOf<T>(values: T[], message?: string): ValidationRule<T[]>;
export function required(message?: string): ValidationRule<string | number | boolean>;
export function pattern(regex: RegExp, message?: string): ValidationRule<string>;
export function minLength(length: number, message?: string): ValidationRule<string | any[]>;
export function maxLength(length: number, message?: string): ValidationRule<string | any[]>;
export function min(value: number, message?: string): ValidationRule<number>;
export function max(value: number, message?: string): ValidationRule<number>;
export function validate<T>(...rules: ValidationRule<T>[]): ValidationRule<T>;
export function validate<T>(form: T, ...rules: ValidationRule<T>[]): ValidationRule<T>;
