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

export type ValidationError = { id: string, params?: any }

export interface ValidationContext<Form = any> {
  form: Form
  parents: unknown[]
}

export type Validate<T = any> = (value: T, context: ValidationContext) => false | ValidationError | void

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

export interface UseFormOptions<T> {
  initialValues: T
  fields: Fields<T>
  validate?: Validate<T>
  onSubmit: (snapshot: Snapshot<T>) => void
  formId?: string
}

export function useForm<T>(options: UseFormOptions<T>): {
  form: ObjectFormField<T>
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
