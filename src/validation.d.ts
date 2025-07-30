import { ValidationContext } from '../index';

export type ValidationError = { id: string; params: unknown[] };
export type ValidationFunction<T, TForm = any> = (value: T, context: ValidationContext<TForm>) => ValidationError | false | void;
export type ValidationRule<T, TForm = any> = ValidationFunction<T, TForm> | (ValidationFunction<T, TForm> | ValidationError)[] | ValidationError;

export function error(id: string, ...params: unknown[]): ValidationError;

export const optional: null;
export const required: ValidationFunction<any>;
export const number: ValidationFunction<any>;
export const email: ValidationFunction<string>;
export function min<TForm>(min: number): (x: number) => ValidationRule<number, TForm>;
export function max<TForm>(max: number): (x: number) => ValidationRule<number, TForm>;
export function minLength<TForm>(length: number): (x: string | any[]) => ValidationRule<string | any[], TForm>;
export function maxLength<TForm>(max: number): (x: string | any[]) => ValidationRule<string | any[], TForm>;