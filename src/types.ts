/**
 * While type declarations should be opaque, type hinting in visual studio still shows them, this
 * is used to make the types from this library, exposed to the developer more friendly.
 */
export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never

export type Validate<T = any> =
  readonly [ValidationFunction<T>, ...ValidationFunction<T>[]] |
  ValidationFunction<T> |
  readonly ValidationFunction<T>[] |
  null
export type ValidationFunction<T = any> = (value: T, context?: ValidationContext) => ValidationResult
export type ValidationResult = Falsy | ValidationError
export type ValidationError = { id: string, params?: any[] }
export type ValidationContext = { form: any, parents: Field.Object[] }

export type FieldSchema =
  Validate |
  FieldSchema.Object |
  FieldSchema.Array |
  { validate: Validate } |
  null

export type InitialValue<T extends FieldSchema.ObjectInput | FieldSchema.ArrayInput> =
  Partial<FieldSchema.ToValue<T>>

export namespace FieldSchema {

  export type ToValue<T extends ObjectInput | FieldSchema | unknown> =
    T extends ObjectInput ? { [K in keyof T]: ToValue<T[K]> } :
    T extends Object ? { [K in keyof T['fields']]: ToValue<T['fields'][K]> } :
    T extends Array ? ToValue<{ type: 'object', fields: T['fields'], validate: T['validate'] }>[] :
    T extends Validate<infer X> ? X :
    T extends HeterogeneousArrayInput ? ToValue<ReturnType<T>> :
    never

  export type ObjectInput = {
    [key: string]: Validate | FieldSchema.Object | FieldSchema.Array
  }

  export type ArrayInput = ObjectInput | HeterogeneousArrayInput
  export type HeterogeneousArrayInput = (initialValue: unknown) => ObjectInput

  export type Object = {
    type: 'object',
    fields: ObjectFields,
    validate?: Validate,
  }
  export type ObjectFields = {
    [name: string]: FieldSchema
  }

  export type Array = {
    type: 'array',
    fields: ArrayFields,
    validate?: Validate,
  }
  export type ArrayFields = FieldSchema.ObjectFields | ArrayFieldsConstructor
  export type ArrayFieldsConstructor = (initialValues: any) => FieldSchema.ObjectFields
}

export type NormalizedField = NormalizedField.Basic | NormalizedField.Object | NormalizedField.Array
export namespace NormalizedField {
  export type ToValue<T extends NormalizedField> =
    T extends Object ? { [K in keyof T['fields']]: ToValue<NormalizedField.FromFieldSchema<T['fields'][K]>> } :
    T extends Array ? { TODO: true }[] :
    T extends Basic ? ValueFromValidationFunction<T['validate']> :
    never

  export type ValueFromValidationFunction<T> =
    T extends null ? unknown :
    T extends ValidationFunction<infer X> ? X :
    never

  export type FromFieldSchema<T extends FieldSchema> =
    T extends FieldSchema.Object ? (
      {
        type: 'object',
        validate: T extends { validate: any } ? ValidateToValidationFunction<T['validate']> : null,
        fields: T['fields']
      }
    ) :
    T extends FieldSchema.Array ? (
      {
        type: 'array',
        validate: ValidateToValidationFunction<T['validate']>,
        fields: T['fields']
      }
    ) :
    T extends null ? (
      {
        type: 'basic',
        validate: null
      }
    ) :
    T extends Validate<any> ? (
      {
        type: 'basic',
        validate: ValidateToValidationFunction<T>
      }
    ) :
    T extends { validate: infer X } ? (
      {
        type: 'basic',
        validate: ValidateToValidationFunction<X>
      }
    ) :
    never

  export type ValidateToValidationFunction<T> =
    T extends undefined ? null :
    T extends null ? null :
    T extends Validate<infer X> ? ValidationFunction<X> :
    never

  export type Basic = {
    type: 'basic',
    validate: null | ValidationFunction,
  }

  export type Object = {
    type: 'object',
    validate: null | ValidationFunction,
    fields: FieldSchema.ObjectFields,
  }

  export type Array = {
    type: 'array',
    validate: null | ValidationFunction,
    fields: FieldSchema.ArrayFields,
  }
}

export type Field = Field.Basic | Field.Object | Field.Array
export namespace Field {
  export type BaseFieldProperties<T extends 'object' | 'array' | 'basic'> = {
    type: T,
    name: string,
    validate(context: ValidationContext): void,
    setSubmitted(isSubmitted: boolean): void,
    reset(): void,
  }

  export type FromNormalizedField<T extends NormalizedField> =
    T extends NormalizedField.Object ? (
      BaseFieldProperties<'object'> & {
        value: State.Readonly<NormalizedField.ToValue<T>>,
        state: State.Readonly<State.Object>,
        fields: { [K in keyof T['fields']]: FromNormalizedField<NormalizedField.FromFieldSchema<T['fields'][K]>> },
      }
    ) :
    T extends NormalizedField.Array ? (
      BaseFieldProperties<'array'> & {
        TODO: true
      }
    ) :
    T extends NormalizedField.Basic ? (
      Basic<NormalizedField.ToValue<T>>
    ) :
    never

  export type Basic<T = any> = BaseFieldProperties<'basic'> & {
    value: State.Readonly<T>,
    state: State.Readonly<State.Basic<T>>,
    eventHandlers: {
      onBlur(): void,
      onFocus(): void,
      onChange(eOrValue: Event<T> | T): void,
    }
  }
  export type Event<T = any> = {
    target: {
      value?: T
    }
  }

  export type Object = BaseFieldProperties<'object'> & {
    value: State.Readonly<{ [name: string]: any }>,
    state: State.Readonly<State.Object>,
    fields: { [name: string]: Field },
  }

  export type Array = BaseFieldProperties<'array'> & {
    value: State.Readonly<Record<string, any>>,
    state: State.Readonly<State.Array>,
    helpers: {
      add(initialValue: any): void,
      remove(entry: Field.Object): void,
    }
  }
}

export type State = State.Basic | State.Object | State.Array
export namespace State {
  export type Common = {
    error: Falsy | ValidationError,
    isSubmitted: boolean,
    isVisited: boolean,
    hasFocus: boolean,
    invalid: boolean,
    showError: boolean,
  }

  export type Basic<T = any> = Common & {
    value: T
  }

  export type Object = Common

  export type Array = Common & {
    children: Field.Object[]
  }

  export type Readonly<T = any> = {
    get(): T,
    subscribe(f: (newValue: T, oldValue?: T) => void): Unsubscribe,
  }
  export type ReadWrite<T = any> = Readonly<T> & {
    update(f: (oldValue: T) => T): T
  }
  export type Unsubscribe = () => void
}


export type Falsy = false | '' | 0 | 0n | null | undefined
