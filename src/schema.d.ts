export type Body<T, A, B> = Expand<{ type: T } & IfAny<B, { fields: A }, { fields: B, validate: A }>>

export declare function object<A>(fields: A): Body<'object', A, undefined>
export declare function object<A, B>(validate: A, fields: B): Body<'object', A, B>

export declare function array<A>(fields: A): Body<'array', A, undefined>
export declare function array<A, B>(validate: A, fields: B): Body<'array', A, B>

declare function body<T extends string, A, B>(type: T, fieldsOrValidate: A, fields: B): Body<T, A, B>

type IfAny<T, Y, N> = 0 extends (1 & T) ? Y : N
type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never
