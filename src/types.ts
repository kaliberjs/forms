/**
 * While type declarations should be opaque, type hinting in visual studio still shows them, this
 * is used to make the types from this library, exposed to the developer more friendly.
 */
export type Expand<T> =
  T extends infer O ? { [K in keyof O]: O[K] } : never

/**
 * Typescript will (sometimes) forget the keys are strings when using `keyof T`, so this is
 * Partial for keys that we need to be strings.
 */
  export type PartialWithStringKey<T extends { [key: string]: any}> =
  {
    [K in keyof T & string]?:
      T[K] extends (infer U)[] ? (
        U extends object ? PartialWithStringKey<U>[] : T[K]
      ) :
      T[K] extends object ? (
        PartialWithStringKey<T[K]>
      ) :
      T[K]
  }

export type Falsy = false | '' | 0 | 0n | null | undefined | void

/** Equivalent of `array.map(x => x[prop])` for tuples */
export type MapTuple<T extends [...unknown[]], prop extends string> =
    T extends [infer X extends { [key in prop]: unknown }, ...infer Rest]
      ? [X[prop], ...MapTuple<Rest, prop>]
      : []

export type Validate<T = any> =
  readonly [ValidationFunction<T>, ...ValidationFunction<T>[]] |
  ValidationFunction<T> |
  readonly ValidationFunction<T>[] |
  null
export type ValidationFunction<T = any> = (value: T, context: ValidationContext) => ValidationResult
export type ValidationResult = Falsy | ValidationError
export type ValidationError = { id: string, params?: any[] }
export type ValidationContext = { form: any, parents: Field.Object[] }

export type InitialValue<T extends FieldInput.Object> =
  PartialWithStringKey<NormalizedField.ToValue<NormalizedInitialValue<T>>>

export type NormalizedInitialValue<T extends FieldInput.Object> =
  NormalizedField.FromFieldSchema<FieldSchema.Object<T>>

export namespace FieldInput {

  export type ArrayToValue<T extends FieldInput.Array> =
    FieldSchema.ToValue<FieldSchema.Array<T>>

  export type ObjectToValue<T extends FieldInput.Object> =
    FieldSchema.ToValue<FieldSchema.Object<T>>

  export type Object = FieldSchema.ObjectFields

  export type Array = Object | HeterogeneousArrayInput
  export type HeterogeneousArrayInput = (initialValue: unknown) => Object
}

export type FieldSchema =
  Validate |
  FieldSchema.Object |
  FieldSchema.Array |
  { validate: Validate }

export namespace FieldSchema {

  export type ToValue<T extends FieldSchema> =
    T extends Object<infer X> ? ObjectFieldsToValues<X> :
    T extends Array<infer X> ? ArrayFieldsToValues<X> :
    T extends Validate<infer X> ? X :
    T extends { validate: Validate<infer X> } ? X :
    never

  export type ObjectFieldsToValues<T extends ObjectFields> =
    T extends any ? { [K in keyof T & string]: ToValue<T[K]> } : never

  export type ArrayFieldsToValues<T extends ArrayFields> =
    ObjectFieldsToValues<ExtractObjectFields<T>>[]

  export type ExtractObjectFields<T extends ArrayFields> =
    T extends FieldSchema.ObjectFields ? T :
    T extends FieldSchema.ArrayFieldsConstructor ? ReturnType<T> :
    never

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
}

export type NormalizedField = NormalizedField.Basic | NormalizedField.Object | NormalizedField.Array

export namespace NormalizedField {
  export type ToValue<T extends NormalizedField> =
    T extends Object<infer X> ? FieldSchema.ObjectFieldsToValues<X> :
    T extends Array<infer X> ? FieldSchema.ArrayFieldsToValues<X> :
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
    T extends { validate: infer X, type?: Exclude<infer Y, 'object' | 'array'> } ? (
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
    validate: null | ValidationFunction<FieldSchema.ObjectFieldsToValues<T>>,
    fields: T,
  }

  export type Array<T extends FieldSchema.ArrayFields = FieldSchema.ArrayFields> = {
    type: 'array',
    validate: null | ValidationFunction<FieldSchema.ArrayFieldsToValues<T>>,
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
    T extends any ? { [K in keyof T & string]: ToValue<T[K]> } : never

  export type ObjectFromObjectInput<T extends FieldInput.Object> =
    FromNormalizedField<NormalizedField.FromFieldSchema<FieldSchema.Object<T>>>

  export type FromNormalizedField<T extends NormalizedField> =
    T extends NormalizedField.Object<infer X> ? Object<ObjectFieldsToFields<X>> :
    T extends NormalizedField.Array<infer X> ? Array<ArrayFieldsToObjectFields<X>> :
    T extends NormalizedField.Basic<infer X> ? Basic<X> :
    never

  export type ObjectFieldsToFields<T extends FieldSchema.ObjectFields> =
    T extends any
      ? { [K in keyof T & string]: FromNormalizedField<NormalizedField.FromFieldSchema<T[K]>>}
      : never

  export type ArrayFieldsToObjectFields<T extends FieldSchema.ArrayFields> =
    FromNormalizedField<
      NormalizedField.FromFieldSchema<
        FieldSchema.Object<FieldSchema.ExtractObjectFields<T>>
      >
    >['fields']

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
      value: State.ReadonlyWithHistory<T>,
      state: State.ReadonlyWithHistory<State.Basic<T>>,
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
      value: State.Readonly<ObjectFieldsToValues<T>>,
      state: State.ReadonlyWithHistory<State.Object>,
      fields: T,
    }

  export type Array<T extends ObjectFields = ObjectFields> =
    BaseFieldProperties<'array'> &
    {
      value: State.Readonly<ObjectFieldsToValues<T>[]>,
      state: State.ReadonlyWithHistory<State.Array<Object<T>>>,
      helpers: {
        add(initialValue: PartialWithStringKey<ObjectFieldsToValues<T>>): void,
        remove(entry: Object<T>): void,
      }
    }

  export type ObjectFields = { [name: string]: Field }
}

export type State = State.Basic | State.Object | State.Array

export namespace State {
  export type Common = {
    isSubmitted: boolean,
    isVisited: boolean,
    hasFocus: boolean,
  } & (Valid | Invalid)

  export type Valid = {
    error: Falsy,
    invalid: false,
    showError: false,
  }

  export type Invalid = {
    error: ValidationError,
    invalid: true,
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
    subscribe(f: Subscription<T>): Unsubscribe,
  }
  export type ReadonlyWithHistory<T = any> = {
    get(): T,
    subscribe(f: SubscriptionWithHistory<T>): Unsubscribe,
  }
  export type ReadWrite<T = any> = ReadonlyWithHistory<T> & {
    update(f: (oldValue: T) => T): T
  }
  export type Subscription<T> = (newValue: T) => void
  export type SubscriptionWithHistory<T> = (newValue: T, oldValue: T) => void
  export type Unsubscribe = () => void

  export type StateTupleToValueTuple<T extends [...unknown[]]> =
    T extends [State.Readonly<infer X>, ...infer Rest]
      ? [X, ...StateTupleToValueTuple<Rest>]
      : []
}

export type Snapshot = Snapshot.Basic | Snapshot.Object | Snapshot.Array

export namespace Snapshot {
  export type FromField<T extends Field> =
    T extends Field.Object<infer X> ? Object<X> :
    T extends Field.Array<infer X> ? Array<X> :
    T extends Field.Basic<infer X> ? Basic<X> :
    never

  export type FromObjectFields<T extends FieldSchema.ObjectFields> =
    Snapshot.Object<Field.ObjectFieldsToFields<T>>

  export type Basic<T = any> =
    Pick<State.Basic<T>, 'value' | 'invalid' | 'error'>

  export type Object<T extends Field.ObjectFields = Field.ObjectFields> =
    {
      invalid: boolean,
      value: MapToValues<T>,
      error: {
        self: Falsy | ValidationError,
        children: MapToErrors<T>,
      }
    }

  export type Array<T extends Field.ObjectFields = Field.ObjectFields> =
    {
      invalid: boolean,
      value: MapToValues<T>[],
      error: {
        self: Falsy | ValidationError,
        children: Object<T>['error'][],
      }
    }

  export type MapToValues<T extends Field.ObjectFields> =
    T extends any ? { [K in keyof T & string]: FromField<T[K]>['value'] } : never

  export type MapToErrors<T extends Field.ObjectFields> =
    T extends any ? { [K in keyof T & string]: FromField<T[K]>['error'] } : never
}
