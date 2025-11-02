/** We need this because `never` matches all types (if we mistakenly infer an any or an infer type, we have problem) */
export function expectNotNever<T>(...expectNotNever: [T] & NotNever<T>) {}
type NotNever<T> = CheckNever<T, [T]>

type CheckNever<T, IfNotNever> =
  T extends Array<infer X> ? CheckNever<X, IfNotNever> :
  T extends Record<any, infer X> ? CheckNever<X, IfNotNever> :
  T extends never ? [] :
  IfNotNever

/** We need this because `any` matches all types (if we mistakenly infer an any or an infer type, we have problem) */
export function expectNotAny<Expected>(actual: NotAny<Expected>) {}
type NotAny<T> = 0 extends (1 & T) ? never : T

export function expectAssignable<const Expected, const Actual extends Expected & NoExtraKeys<Actual, Expected> & MarkedPrepared>() {}

// We want our `Expected` types to be precise and not miss any additional keys
type NoExtraKeys<T, U> = {
  [K in keyof T]: K extends keyof U ? T[K] : `Key '${K extends string ? K : '[unknown key]'}' was not expected`
}

// Needed to force `Prepared<typeof value>` instead of `typeof value` in `Actual` of `expectAssignable`
type MarkedPrepared = {
  __isPrepared: any
}

// Converting `any` into `unknown` helps to make sure `{ a: any }` does not match `{ a: { b: any } }`
export type Prepared<T> =
  MarkedPrepared & ReplaceAnyWithUnknown<T>

type ReplaceAnyWithUnknown<T> =
  0 extends (1 & T) ? unknown & Any :
  T extends ((...args: infer A) => infer R) ? ((...args: DeepPrepareTuple<A>) => ReplaceAnyWithUnknown<R>) :
  [T] extends [readonly (infer U)[]]
    ? { [K in keyof T]: ReplaceAnyWithUnknown<T[K]> }
    :
  T extends object
    ? { [K in keyof T]: ReplaceAnyWithUnknown<T[K]> }
    :
  T

// `any` matches with anything, so for better error reporting we replace it
type Any = { __any__: any }

type DeepPrepareTuple<T> = T extends [infer A, ...infer X]
  ? [ReplaceAnyWithUnknown<A>, ...DeepPrepareTuple<X>]
  : []
