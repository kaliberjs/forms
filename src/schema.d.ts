type IfAny<T, Y, N> = 0 extends (1 & T) ? Y : N
type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never

export type Fields<T> = { [K in keyof T]: Field<T[K]> }
type Field<T> =
  | null
  | undefined
  | { type: 'object'; fields: Fields<T> }
  | { type: 'array'; fields: Fields<T> }

export declare function object<T>(fields: Fields<T>): Expand<{ type: 'object'; fields: Fields<T> }>
export declare function object<A>(fieldsOrValidate: A): Expand<{ type: 'object'; fields: A }>
export declare function object<A, B>(fieldsOrValidate: A, fields: B): Expand<{ type: 'object'; fields: B; validate: A }>

export declare function array<T>(fields: Fields<T>): Expand<{ type: 'array'; fields: Fields<T> }>
export declare function array<A>(fieldsOrValidate: A): Expand<{ type: 'array'; fields: A }>
export declare function array<A, B>(fieldsOrValidate: A, fields: B): Expand<{ type: 'array'; fields: B; validate: A }>

type SchemaBody<T extends string, A, B> = Expand<
  { type: T } & IfAny<B, { fields: A }, { fields: B; validate: A }>
>

type Schema<T extends string = string> = {
  type: T
  fields?: unknown
  validate?: unknown
}

type ObjectSchema<Fields, Validate> = Schema<'object'> & {
  fields: Fields
} & (Validate extends undefined ? {} : { validate: Validate })

type ArraySchema<Fields, Validate> = Schema<'array'> & {
  fields: Fields
} & (Validate extends undefined ? {} : { validate: Validate })
