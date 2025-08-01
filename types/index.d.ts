import { ErrorFor, Validate, ValidationError } from '../src/validation'

export interface ValidationContext<Form = any> {
  form: Form
  parents: unknown[]
}

export type BasicField<T = any> =
  | null
  | Validate<T>
  | Validate<T>[]

export interface ObjectFieldDefinition<T> {
  type: 'object'
  fields: Fields<T>
  validate?: Validate<T>
}

export interface ArrayFieldDefinition<T extends any[]> {
  type: 'array'
  fields: Fields<T[number]> | ((initialValue: T[number]) => Fields<T[number]>)
  validate?: Validate<T>
}

export type FieldDefinition<T> =
  T extends any[] ? ArrayFieldDefinition<T> :
  T extends { [key: string]: any } ? ObjectFieldDefinition<T> :
  BasicField<T>

export type FromFields<TFields> = {
  [K in keyof TFields]: TFields[K] extends FieldDefinition<infer T> ? T : never
}

export type Fields<T> = {
  [K in keyof T]: FieldDefinition<T[K]>
}

export type ValueField<T> = {
  value: {
    get(): T
    subscribe(fn: (value: T, previousValue: T) => void): () => void
  }
}

export type FormFieldState<T> =
  | FormFieldStateError<T>
  | FormFieldStateWithoutError<T>

interface FormFieldStateBase<T> {
  value: T
  isSubmitted: boolean
  invalid: boolean
  isVisited: boolean
  hasFocus: boolean
}
interface FormFieldStateError<T> extends FormFieldStateBase<T> {
  error: ValidationError
  showError: boolean
}
interface FormFieldStateWithoutError<T> extends FormFieldStateBase<T> {
  error: false
  showError: false
}

export interface BaseFormField<T> extends ValueField<T> {
  name: string
  validate(context: ValidationContext): void
  setSubmitted(isSubmitted: boolean): void
  reset(): void
  state: {
    get(): FormFieldState<T>
    subscribe(fn: (next: FormFieldState<T>, prev: FormFieldState<T>) => void): () => void
  }
}

export interface BasicFormField<T> extends BaseFormField<T> {
  type: 'basic'
  eventHandlers: {
    onBlur(): void
    onFocus(): void
    onChange(e: Event | { target: { value: T } } | T): void
  }
}

export interface ObjectFormField<T> extends BaseFormField<T> {
  type: 'object'
  fields: {
    [K in keyof T]: FormField<T[K]>
  }
}

export interface ArrayFormField<T extends any[]> extends BaseFormField<T> {
  type: 'array'
  helpers: {
    add(initialValue: T[number]): void
    remove(entry: FormField<T[number]>): void
  }
}

export type FormField<T> =
  [T] extends [any[]] ? ArrayFormField<T> :
  [T] extends [object] ? ObjectFormField<T> :
  BasicFormField<T>

export interface Snapshot<T> {
  value: T
  error: ErrorFor<T>
  invalid: boolean
}

type FormValues<TFields, TInitialValues> = {
  [K in keyof TFields]: K extends keyof TInitialValues
    ? TInitialValues[K]
    : TFields[K] extends FieldDefinition<infer T> ? T : never
}

export interface UseFormOptions<TFields, TInitialValues> {
  initialValues?: TInitialValues
  fields: TFields & Fields<FormValues<TFields, TInitialValues>>
  validate?: Validate<FormValues<TFields, TInitialValues>>
  onSubmit: (snapshot: Snapshot<FormValues<TFields, TInitialValues>>) => void
  formId?: string
}

export function useForm<TFields, TInitialValues = {}>(options: UseFormOptions<TFields, TInitialValues>): {
  form: ObjectFormField<FormValues<TFields, TInitialValues>>
  submit: (e?: React.FormEvent) => void
  reset: () => void
}

export function useFormField<T>(field: BasicFormField<T>): {
  name: string
  state: FormFieldState<T>
  eventHandlers: BasicFormField<T>['eventHandlers']
}

export function useFormField<T>(field: FormField<T>): {
  name: string
  state: FormFieldState<T>
  eventHandlers?: never
}

export function useFormFieldValue<T>(field: FormField<T>): T
export function useNumberFormField<T>(field: FormField<T>): T
export function useBooleanFormField<T>(field: FormField<T>): T
export function useArrayFormField<T>(field: FormField<T>): T
export function useObjectFormField<T>(field: FormField<T>): T
export function useFormFieldsValues<T extends any[]>(fields: FormField<T[number]>[]): T
export function useFormFieldSnapshot<T>(field: FormField<T>): Snapshot<T>
