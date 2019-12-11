declare namespace forms {
  export type Fields = { [name:string]: Field }
  export type Field = ArrayField | BasicField
  export type BasicField = SimpleField | ValidationArray
  export type ArrayField = { type: 'array', validate?: Validate, fields: Fields }

  export type NormalizedField = NormalizedBasicField | NormalizedArrayField

  export type ValuesOf<T extends Fields> = { [K in keyof T]: ValueOf<T[K]> }
  export type ValueOf<T extends Field> =
    T extends ArrayField ? Array<ValuesOf<T['fields']>> :
    T extends SimpleField ? unknown :
    T extends Validate ? unknown :
    never

  export type ErrorsOf<T extends Fields> = { [K in keyof T]: ErrorOf<T[K]> }
  export type ErrorOf<T extends Field> =
    T extends ArrayField ? { fields: Array<ErrorsOf<T['fields']>> } & ValidationResult :
    T extends SimpleField ? ValidationResult :
    T extends Validate ? ValidationResult :
    never

  export type FormState<T extends Fields> = {
    invalid: boolean,
    errors: ErrorsOf<T>,
    values: ValuesOf<T>,
  }

  export type If<X, Condition, Then> =
    X extends Condition ? Then : never

  export type IfAny<A, Then> =
    A extends IsAny<A> ? Then : never
  export type IfNotAny<A, Then> =
    A extends IsAny<A> ? never : Then

  export type ExpandRecursively<T> = T extends object
    ? (
      T extends infer O ? { [K in keyof O]: ExpandRecursively<O[K]> } : never
    )
    : (
      T extends infer O ? O : never
    )

  type IsAny<A> =
    unknown extends A ? (A extends unknown ? A : never) : never

  export type Validate = ValidationArray | ValidationObject | ValidationFunction
  type ValidationFunction = (x: unknown) => ValidationResult
  type ValidationObject = { validate: ValidationFunction }
  type ValidationArray = Array<ValidationObject | ValidationFunction>

  type SimpleField = { validate?: Validate }

  type NormalizedBasicField = { type: 'basic', validate: ValidationFunction }
  type NormalizedArrayField = { type: 'array', validate: ValidationFunction, fields: Fields }

  type NormalizedFields = { [name: string]: NormalizedField }

  export type ValidationResult = { id: string, params: Array<unknown> } | null | undefined | false

  type FormFieldsInfo<X extends Fields> = { [K in keyof X]: FieldInfo<X[K]> }

  type FieldInfo<X extends Field> =
  X extends ArrayField ? ArrayFieldInfo<X> :
    X extends BasicField ? BasicFieldInfo<X> :
    never

  type BasicFieldInfo<X extends BasicField> = {
    name: string,
    readonly value: FieldState<unknown>,
    state: PublicState<unknown>,
    eventHandlers: {
      onBlur(e?: any): void,
      onFocus(e?: any): void,
      onChange(e: { target: { value: unknown } } | unknown): void,
    },
  }

  type ArrayFieldInfo<X extends ArrayField> = {
    name: string,
    readonly value: Array<FormState<X['fields']>>,
    state: PublicState<Array<FormFieldsInfo<X['fields']>>>,
    helpers: {
      add(x: Partial<ValuesOf<X['fields']>>): void
    }
  }

  type PublicState<T> = {
    initial: FieldState<T>,
    readonly current: FieldState<T>,
    subscribe(f: (state: FieldState<T>) => FieldState<T>): void,
    setSubmitted(boolean): void,
    reset(): void,
  }

  type FieldState<T> = {
    value: T,
    error: ValidationResult,
    invalid: boolean,
    isSubmitted: boolean,
    isVisited: boolean,
    hasFocus: boolean,
    showError: boolean,
  }
}