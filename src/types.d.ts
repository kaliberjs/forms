declare namespace forms {
  export type Fields = { [name:string]: Field }
  export type Field = ArrayField | BasicField | ValidationArray
  export type NormalizedField = NormalizedBasicField | NormalizedArrayField

  export type ValuesOf<T extends Fields> = { [K in keyof T]: ValueOf<T[K]> }
  export type ValueOf<T extends Field> =
    T extends ArrayField ? Array<ValuesOf<T['fields']>> :
    T extends BasicField ? any :
    T extends Validate ? any :
    never

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
  type ValidationFunction = (x: any) => ValidationResults
  type ValidationObject = { validate: ValidationFunction }
  type ValidationArray = Array<ValidationObject | ValidationFunction>
  export type BasicField = { validate?: Validate }
  export type ArrayField = { type: 'array', validate?: Validate, fields: Fields }

  type NormalizedBasicField = { type: 'basic', validation: ValidationFunction }
  type NormalizedArrayField = { type: 'array', validation: ValidationFunction, fields: NormalizedFields }

  type NormalizedFields = { [name: string]: NormalizedField }

  type ValidationResults = { id: string, params: Array<any> }

  type PublicState<T> = {
    current: T,
    setSubmitted(boolean): void,
    subscribe(f: (state: T) => T): void,
  }
}