import { email, number, optional, required } from './validation'
import { array, object } from './schema'
import { asConst } from './type-helpers'
import type { InitialValue, Validate } from './types.ts'
import { expectAssignable, expectNotAny, expectNotNever, Prepared } from './type.test.helpers.ts'

const simpleObjectInput = asConst({
  noValidation: optional,
  singleValidation: email,
  multipleValidation: [required, number],
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
  multipleValidation: readonly [Validate<any>, Validate<number>],
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

function validate<T>(value: T) {
  return value === 'failure' && { id: 'error' }
}

function throwError(m: string): never { throw new Error(m) }
