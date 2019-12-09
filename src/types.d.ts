declare namespace forms {
  export type Fields = { [name:string]: Field }
  export type Field = ArrayField | ValidationArray | BasicField | EmptyField

  export type ValuesOf<T extends Fields> = { [K in keyof T]: ValueOf<T[K]> }
  export type ValueOf<T> =
    T extends ArrayField ? Array<ValuesOf<T['fields']>> :
    T extends BasicField ? any :
    T extends ValidationArray ? any :
    T extends EmptyField ? any :
    never

  export type Choose<A, B, NoB, Both> =
    B extends IsAny<B> ? NoB :
    Both

  type IsAny<A> =
    unknown extends A ? (A extends unknown ? A : never) : never

  type Validate = ValidationArray | ValidationObject | ValidationFunction
  type ValidationFunction = (x: any) => ValidationResults
  type ValidationObject = { validate: ValidationFunction | undefined }
  type ValidationArray = Array<ValidationObject | ValidationFunction>
  type EmptyField = {}
  type BasicField = { type: 'basic', validate?: Validate }
  type ArrayField = { type: 'array', validate?: Validate, fields: Fields }

  type ValidationResults = { id: string, params: Array<any> }

  type PublicState<T> = {
    current: T,
    setSubmitted(boolean): void,
    subscribe(f: (state: T) => T): void,
  }
}