import { object } from './schema'
import type { Validate } from './types.ts'

{
  const simpleObject = object({
    noValidation: null,
    singleValidation: validate,
    multipleValidation: [validate, validate],
  })

  expectNotAny(simpleObject)
  expectAssignable<{
    type: 'object',
    fields: {
      noValidation: Validate,
      singleValidation: Validate,
      multipleValidation: [Validate, Validate],
    }
  }, Prepared<typeof simpleObject>>()

}

{
  const simpleObjectWithValidation = object(
    (value) => {
      expectNotNever(value)
      expectNotAny(value)
      expectAssignable<{
        noValidation: any,
        singleValidation: any,
        multipleValidation: any,
      }, Prepared<typeof value>>()
      return validate(value)
    },
    {
      noValidation: null,
      singleValidation: validate,
      multipleValidation: [validate, validate],
    }
  )
  expectNotAny(simpleObjectWithValidation)
  expectAssignable<{
    type: 'object',
    fields: {
      noValidation: Validate,
      singleValidation: Validate,
      multipleValidation: readonly [Validate, Validate],
    },
    validate: Validate,
  }, Prepared<typeof simpleObjectWithValidation>>()
}

{
  const nestedObject = object(
    {
      nested: object({
        noValidation: null,
        singleValidation: validate,
        multipleValidation: [validate, validate],
      })
    }
  )
  expectNotAny(nestedObject)
  expectAssignable<{
    type: 'object',
    fields: {
      nested: {
        type: 'object',
        fields: {
          noValidation: Validate,
          singleValidation: Validate,
          multipleValidation: readonly [Validate, Validate],
        }
      }
    }
  }, Prepared<typeof nestedObject>>()
}

{
  const nestedObjectWithValidation = object(
    value => {
      expectNotAny(value)
      expectNotNever(value)
      expectAssignable<
        {
          nested: {
            noValidation: any,
            singleValidation: any,
            multipleValidation: any,
          }
        },
        Prepared<typeof value>
      >()

      return validate(value)
    },
    {
      nested: object({
        noValidation: null,
        singleValidation: validate,
        multipleValidation: [validate, validate],
      })
    }
  )
  expectNotAny(nestedObjectWithValidation)
  expectAssignable<{
    type: 'object',
    fields: {
      nested: {
        type: 'object',
        fields: {
          // noValidation: Validate, // TODO: NoExtraKeys is not recursive
          singleValidation: Validate,
          multipleValidation: readonly [Validate, Validate],
        }
      }
    },
    validate: Validate,
  }, Prepared<typeof nestedObjectWithValidation>>()
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
