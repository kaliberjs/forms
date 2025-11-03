/**
 * While type declarations should be opaque, type hinting in visual studio still shows them, this
 * is used to make the types from this library, exposed to the developer more friendly.
 */
// TODO: we need to make this better (more recursive)
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

export type ValueFromValidationFunction<T> =
    T extends null ? unknown :
    T extends ValidationFunction<infer X> ? X :
    never

export type InitialValue<T extends FieldInput.Object> =
  Partial<FieldInput.ObjectToValue<T>>

export namespace FieldInput {

  export type ArrayToValue<T extends FieldInput.Array> =
    FieldSchema.ToValue<FieldSchema.Array<T>>

  export type ObjectToValue<T extends FieldInput.Object> =
    FieldSchema.ToValue<FieldSchema.Object<T>>

  export type Object = {
    [key: string]: Validate | FieldSchema.Object | FieldSchema.Array
  }

  export type Array = Object | HeterogeneousArrayInput
  export type HeterogeneousArrayInput = (initialValue: unknown) => Object
}

export type FieldSchema =
  Validate |
  FieldSchema.Object |
  FieldSchema.Array |
  { validate: Validate } |
  null
export namespace FieldSchema {

  export type ToValue<T extends FieldSchema> =
    T extends Object<infer X> ? ObjectFieldsToValues<X> :
    T extends Array<infer X> ? ArrayFieldsToValues<X> :
    T extends Validate<infer X> ? X :
    T extends { validate: Validate<infer X> } ? X :
    never

  export type ObjectFieldsToValues<O extends ObjectFields> =
    { [K in keyof O]: ToValue<O[K]> }

  export type ArrayFieldsToValues<O extends ArrayFields> =
    ObjectFieldsToValues<ExtractObjectFields<O>>[]

  export type Object<T extends ObjectFields = ObjectFields> = {
    type: 'object',
    fields: T,
    validate?: Validate,
  }
  export type ObjectFields = {
    [name: string]: FieldSchema
  }

  export type Array<T extends ArrayFields = ArrayFields> = {
    type: 'array',
    fields: T,
    validate?: Validate,
  }
  export type ArrayFields = FieldSchema.ObjectFields | ArrayFieldsConstructor
  export type ArrayFieldsConstructor = (initialValues: any) => FieldSchema.ObjectFields

  export type ExtractObjectFields<T extends ArrayFields> =
    T extends FieldSchema.ObjectFields ? T :
    T extends FieldSchema.ArrayFieldsConstructor ? ReturnType<T> :
    never
}

export type NormalizedField = NormalizedField.Basic | NormalizedField.Object | NormalizedField.Array
export namespace NormalizedField {
  export type ToValue<T extends NormalizedField> =
    T extends Object<infer X> ? FieldSchema.ObjectFieldsToValues<X> :
    T extends Array<infer X> ? FieldSchema.ObjectFieldsToValues<FieldSchema.ExtractObjectFields<X>>[] :
    T extends Basic<infer X> ? X :
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
        validate: T extends { validate: any } ? ValidateToValidationFunction<T['validate']> : null,
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

  export type Basic<T = unknown> = {
    type: 'basic',
    validate: null | ValidationFunction<T>,
  }

  export type Object<T extends FieldSchema.ObjectFields = FieldSchema.ObjectFields> = {
    type: 'object',
    validate: null | ValidationFunction,
    fields: T,
  }

  export type Array<T extends FieldSchema.ArrayFields = FieldSchema.ArrayFields> = {
    type: 'array',
    validate: null | ValidationFunction,
    fields: T,
  }
}

export type Field = Field.Basic | Field.Object | Field.Array
export namespace Field {
  export type ToValue<T extends Field> =
    T extends Object<infer X> ? ObjectFieldsToValues<X> :
    T extends Array<infer X> ? ObjectFieldsToValues<X>[] :
    T extends Basic<infer X> ? X :
    never

  export type ObjectFieldsToValues<T extends ObjectFields> =
    { [K in keyof T]: ToValue<T[K]> }

  export type FromNormalizedField<T extends NormalizedField> =
    T extends NormalizedField.Object ? Object<MapObjectFieldsToFields<T['fields']>> :
    T extends NormalizedField.Array ? Array<ArrayFieldsToObjectFields<T['fields']>> :
    T extends NormalizedField.Basic ? Basic<NormalizedField.ToValue<T>> :
    never

  export type MapObjectFieldsToFields<T extends FieldSchema.ObjectFields> =
    { [K in keyof T]: FromNormalizedField<NormalizedField.FromFieldSchema<T[K]>>}

  export type ArrayFieldsToObjectFields<T extends FieldSchema.ArrayFields> =
    FromNormalizedField<NormalizedField.FromFieldSchema<{
      type: 'object',
      fields:
        T extends FieldSchema.ArrayFieldsConstructor ? ReturnType<T> :
        T extends FieldSchema.ObjectFields ? T :
        never
    }>>['fields']

  export type FromArrayFields<T extends FieldSchema.ArrayFields> =
    FromNormalizedField<NormalizedField.FromFieldSchema<{
      type: 'object',
      fields:
        T extends FieldSchema.ArrayFieldsConstructor ? ReturnType<T> :
        T extends FieldSchema.ObjectFields ? T :
        never
    }>>

  export type BaseFieldProperties<T extends 'object' | 'array' | 'basic'> = {
    type: T,
    name: string,
    validate(context: ValidationContext): void,
    setSubmitted(isSubmitted: boolean): void,
    reset(): void,
  }

  export type Basic<T = any> =
    BaseFieldProperties<'basic'> &
    {
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

  export type Object<T extends ObjectFields = ObjectFields> =
    BaseFieldProperties<'object'> &
    {
      value: State.Readonly<ObjectValues<T>>,
      state: State.Readonly<State.Object>,
      fields: T,
    }

  export type Array<T extends ObjectFields = ObjectFields> =
    BaseFieldProperties<'array'> &
    {
      value: State.Readonly<ObjectValues<T>[]>,
      state: State.Readonly<State.Array<Object<T>>>,
      helpers: {
        add(initialValue: Partial<ObjectValues<T>>): void,
        remove(entry: Object<T>): void,
      }
    }

  export type ObjectFields = { [name: string]: Field }

  export type ObjectValues<T extends ObjectFields> =
    { [K in keyof T]: ToValue<T[K]> }
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

  export type Array<T = Field.Object> = Common & {
    children: T[]
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

