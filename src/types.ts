// This file exists because you can not do conditional types in jsdoc

/**
 * If you have an optional parameter which is generic, it is inferred as any, the IfAny helps to
 * detect that.
 *
 * When T === any return Y else return N
 */
export type IfAny<T, Y, N> = 0 extends (1 & T) ? Y : N

export type TypeExtends<T, X> = T extends X ? T : never

/**
 * While type declarations should be opaque, type hinting in visual studio still shows them, this
 * is used to make the types from this library, exposed to the developer more friendly.
 */
export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never

export type Validate<T = any> =
  [Validate<T>, ...Validate<T>[]] |
  ValidationFunction<T> |
  readonly ValidationFunction<T>[] |
  null
export type ValidationFunction<T = any> = (value: T, context?: ValidationContext) => Falsy | ValidationError
export type ValidationContext = { form: any, parents: Field.Object[] }
export type ValidationError = { id: string, params?: any[] }

export type FieldSchema =
  Validate |
  FieldSchema.Object |
  FieldSchema.Array |
  { validate: Validate } |
  null

export namespace FieldSchema {

  export type ToValue<T extends ObjectInput | FieldSchema | unknown> =
    T extends ObjectInput ? { [K in keyof T]: ToValue<T[K]> } :
    T extends Object ? { [K in keyof T['fields']]: ToValue<T['fields'][K]> } :
    T extends Array ? ToValue<{ type: 'object', fields: T['fields'], validate: T['validate'] }>[] :
    T extends Validate ? T :
    never

  export type ObjectInput = {
    [key: string]: Validate | FieldSchema.Object | FieldSchema.Array
  }

  export type ArrayInput = ObjectInput | (<T extends ObjectInput>(initialValue: T) => ObjectInput)

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
  export type Basic = {
    type: 'basic',
    name: string,
    validate(context: ValidationContext): void,
    setSubmitted(isSubmitted: boolean): void,
    reset(): void,
    value: State.Readonly,
    state: State.Readonly<State.Basic>,
    eventHandlers: {
      onBlur(): void,
      onFocus(): void,
      onChange(eOrValue: Event | any): void,
    }
  }
  export type Event = {
    target: {
      value?: any
    }
  }

  export type Object = {
    type: 'object',
    name: string,
    validate(context: ValidationContext): void,
    setSubmitted(isSubmitted: boolean): void,
    reset(): void,
    value: State.Readonly<{ [name: string]: any }>,
    state: State.Readonly<State.Object>,
    fields: { [name: string]: Field },
  }

  export type Array = {
    type: 'array',
    name: string,
    validate(context: ValidationContext): void,
    setSubmitted(isSubmitted: boolean): void,
    reset(): void,
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

  export type Basic = Common & {
    value: any
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
