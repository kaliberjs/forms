// This file exists because you can not do conditional types in jsdoc

/**
 * If you have an optional parameter which is generic, it is inferred as any, the IfAny helps to
 * detect that.
 *
 * When T === any return Y else return N
 */
type IfAny<T, Y, N> = 0 extends (1 & T) ? Y : N

/**
 * While type declarations should be opaque, type hinting in visual studio still shows them, this
 * is used to make the types from this library, exposed to the developer more friendly.
 */
type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never
