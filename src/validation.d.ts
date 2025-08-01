import { ValidationContext } from '../types'

export type BasicError = ValidationError | false

export type ObjectError<T> = {
  self: BasicError
  children: {
    [K in keyof T]: ErrorFor<T[K]>
  }
}

export type ArrayError<T extends any[]> = {
  self: BasicError
  children: ErrorFor<T[number]>[]
}

export type ErrorFor<T> =
  T extends any[] ? ArrayError<T> :
  T extends object ? ObjectError<T> :
  BasicError

export type ValidationError<T = any> = 
  | ValidationErrorWithType<T>
  | ValidationErrorWithoutType

interface ValidationErrorWithType<T> {
  id: T
  params?: any[]
}
interface ValidationErrorWithoutType {
  id: string
  params?: any[]
}

export type Validate<T = any> = (value: T, context?: ValidationContext) => false | ValidationError | void

export const optional: Validate<undefined>;
export const required: Validate<any>;
export const number: Validate<number>;
export const string: Validate<string>;
export const email: Validate<string>;

export function min(min: number): Validate<number>;
export function max(max: number): Validate<number>;
export function minLength(min: number): Validate<any>;
export function maxLength(max: number): Validate<any>;

export function error<T extends string>(id: T, ...params: any[]): ValidationError
