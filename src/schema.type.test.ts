import { array, object } from './schema'
import { asConst } from './type-helpers.js'
import type { Validate } from './types.ts'

const simpleObjectInput = asConst({
  noValidation: null,
  singleValidation: validate,
  multipleValidation: [validate, validate],
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
  noValidation: Validate,
  singleValidation: Validate,
  multipleValidation: readonly [Validate, Validate],
}
type SimpleObjectValues = {
  noValidation: any,
  singleValidation: any,
  multipleValidation: any,
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
    SimpleObjectSchema & { validate: Validate },
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
    NestedObjectSchema & { validate: Validate },
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
    ArraySchema<SimpleObjectFields> & { validate: Validate },
    Prepared<typeof simpleArrayWithValidationSchema>
  >
}

/** We need this because `never` matches all types (if we mistakenly infer an any or an infer type, we have problem) */
function expectNotNever<T>(...expectNotNever: NotNever<T>) {}
type NotNever<T> = T extends [never] ? [] : [T]

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



function validate(value: any) {
  return value === 'failure' && { id: 'error' }
}
