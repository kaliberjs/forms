import { array, object } from './schema'
import { asConst } from './type-helpers.js'
import type { InitialValue, Validate } from './types.ts'

const simpleObjectInput = asConst({
  noValidation: null,
  singleValidation: validate<string>,
  multipleValidation: [validate<number>, validate<number>],
})
type ObjectSchema<Fields> = {
  type: 'object',
  fields: Fields,
}
type ArraySchema<Fields> = {
  type: 'array',
  fields: Fields,
}
type SimpleObjectSchema = ObjectSchema<SimpleObjectFields>
type SimpleObjectFields = {
  noValidation: Validate<unknown>,
  singleValidation: Validate<string>,
  multipleValidation: readonly [Validate<number>, Validate<number>],
}
type SimpleObjectValues = {
  noValidation: unknown,
  singleValidation: string,
  multipleValidation: number,
}

{
  const simpleObjectSchema = object(simpleObjectInput)
  expectNotAny(simpleObjectSchema)
  expectAssignable<SimpleObjectSchema, Prepared<typeof simpleObjectSchema>>()
}

{
  const simpleObjectWithValidationSchema = object(
    (value) => {
      expectNotNever(value)
      expectNotAny(value)
      expectAssignable<SimpleObjectValues, Prepared<typeof value>>()

      return validate(value)
    },
    simpleObjectInput
  )
  expectNotAny(simpleObjectWithValidationSchema)
  expectAssignable<
    SimpleObjectSchema & { validate: Validate<SimpleObjectValues> },
    Prepared<typeof simpleObjectWithValidationSchema>
  >
}

const nestedObjectInput = { nested: object(simpleObjectInput) }
type NestedObjectSchema = ObjectSchema<{ nested: SimpleObjectSchema }>
{
  const nestedObjectSchema = object(nestedObjectInput)
  expectNotAny(nestedObjectSchema)
  expectAssignable<NestedObjectSchema, Prepared<typeof nestedObjectSchema>>
}

{
  const nestedObjectWithValidationSchema = object(
    value => {
      expectNotAny(value)
      expectNotNever(value)
      expectAssignable<{ nested: SimpleObjectValues }, Prepared<typeof value>>

      return validate(value)
    },
    nestedObjectInput
  )
  expectNotAny(nestedObjectWithValidationSchema)
  expectAssignable<
    NestedObjectSchema & { validate: Validate<{ nested: SimpleObjectValues }> },
    Prepared<typeof nestedObjectWithValidationSchema>
  >
}

{
  const simpleArraySchema = array(simpleObjectInput)
  expectNotAny(simpleArraySchema)
  expectAssignable<ArraySchema<SimpleObjectFields>, Prepared<typeof simpleArraySchema>>
}

{
  const simpleArrayWithValidationSchema = array(
    value => {
      expectNotAny(value)
      expectNotNever(value)
      expectAssignable<SimpleObjectValues[], Prepared<typeof value>>

      return validate(value)
    },
    simpleObjectInput
  )
  expectNotAny(simpleArrayWithValidationSchema)
  expectAssignable<
    ArraySchema<SimpleObjectFields> & { validate: Validate<SimpleObjectValues[]> },
    Prepared<typeof simpleArrayWithValidationSchema>
  >
}

const inputA = asConst({ type: validate<'a'>, a: object(simpleObjectInput) })
const inputB = asConst({ type: validate<'b'>, b: object(simpleObjectInput) })
type HeterogeneousInitialValues = InitialValue<typeof inputA | typeof inputB>

{
  const inputA = asConst({ type: validate<'a'>, a: object(simpleObjectInput) })
  const inputB = asConst({ type: validate<'b'>, b: object(simpleObjectInput) })
  type InitialValues = InitialValue<typeof inputA | typeof inputB>

  const heterogeneousArraySchema = array(
    (initialValue: InitialValues) =>
      initialValue.type === 'a' ? inputA : inputB
  )
  expectNotAny(heterogeneousArraySchema)
  expectAssignable<
    ArraySchema<(initialValues: InitialValues) =>
      { type: Validate<'a'>, a: SimpleObjectSchema } |
      { type: Validate<'b'>, b: SimpleObjectSchema }
    >,
    Prepared<typeof heterogeneousArraySchema>
  >
}

{
  const heterogeneousArrayWithValidationSchema = array(
    value => {
      expectNotAny(value)
      expectNotNever(value)
      expectAssignable<
        ({ type: 'a', a: SimpleObjectValues } | { type: 'b', b: SimpleObjectValues })[],
        Prepared<typeof value>
      >

      return validate(value)
    },
    (initialValue: HeterogeneousInitialValues) =>
      initialValue.type === 'a' ? inputA :
      initialValue.type === 'b' ? inputB :
      throwError(`Unknown type: '${initialValue.type}'`)
  )
  expectNotAny(heterogeneousArrayWithValidationSchema)
  expectAssignable<
    ArraySchema<(initialValues: HeterogeneousInitialValues) =>
      { type: Validate<'a'>, a: SimpleObjectSchema } |
      { type: Validate<'b'>, b: SimpleObjectSchema }
    > & { validate: Validate<({ type: 'a', a: SimpleObjectValues } | { type: 'b', b: SimpleObjectValues })[]> },
    Prepared<typeof heterogeneousArrayWithValidationSchema>
  >
}

/** We need this because `never` matches all types (if we mistakenly infer an any or an infer type, we have problem) */
function expectNotNever<T>(...expectNotNever: [T] & NotNever<T>) {}
type NotNever<T> = CheckNever<T, [T]>

type CheckNever<T, IfNotNever> =
  T extends Array<infer X> ? CheckNever<X, IfNotNever> :
  T extends Record<any, infer X> ? CheckNever<X, IfNotNever> :
  T extends never ? [] :
  IfNotNever

/** We need this because `any` matches all types (if we mistakenly infer an any or an infer type, we have problem) */
function expectNotAny<Expected>(actual: NotAny<Expected>) {}
type NotAny<T> = 0 extends (1 & T) ? never : T

function expectAssignable<const Expected, const Actual extends Expected & NoExtraKeys<Actual, Expected> & MarkedPrepared>() {}

// We want our `Expected` types to be precise and not miss any additional keys
type NoExtraKeys<T, U> = {
  [K in keyof T]: K extends keyof U ? T[K] : `Key '${K extends string ? K : '[unknown key]'}' was not expected`
}

// Needed to force `Prepared<typeof value>` instead of `typeof value` in `Actual` of `expectAssignable`
type MarkedPrepared = {
  __isPrepared: any
}

// Converting `any` into `unknown` helps to make sure `{ a: any }` does not match `{ a: { b: any } }`
type Prepared<T> =
  MarkedPrepared & ReplaceAnyWithUnknown<T>

type ReplaceAnyWithUnknown<T> =
  0 extends (1 & T) ? unknown :
  T extends ((...args: infer A) => infer R) ? ((...args: DeepPrepareTuple<A>) => ReplaceAnyWithUnknown<R>) :
  [T] extends [readonly (infer U)[]]
    ? { [K in keyof T]: ReplaceAnyWithUnknown<T[K]> }
    :
  T extends object
    ? { [K in keyof T]: ReplaceAnyWithUnknown<T[K]> }
    :
  T

type DeepPrepareTuple<T> = T extends [infer A, ...infer X]
  ? [ReplaceAnyWithUnknown<A>, ...DeepPrepareTuple<X>]
  : []

function validate<T>(value: T) {
  return value === 'failure' && { id: 'error' }
}

function throwError(m: string): never { throw new Error(m) }
