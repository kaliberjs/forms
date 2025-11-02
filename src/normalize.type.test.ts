import { optional, email, required, number } from './validation';
import { object, array } from './schema'
import { normalize } from './normalize';
import { ValidationFunction } from './types';
import { expectAssignable, expectNotAny, expectNotNever, Prepared } from './type.test.helpers';
import { asConst } from './type-helpers';

const noValidation = asConst(optional)
const singleValidation = asConst(email)
const multipleValidation = asConst([required, number])
const objectInput = {
  noValidation,
  singleValidation,
  multipleValidation,
}
const simpleObjectSchema = object(objectInput)
const simpleArraySchema = array(objectInput)
const simpleObjectWithValidationSchema = object(value => validate(value), objectInput)
const simpleArrayWithValidationSchema = array(value => validate(value), objectInput)
type BaseObjectNormalizedField = {
  type: 'object',
  fields: {
    noValidation: null,
    singleValidation: ValidationFunction<string>,
    multipleValidation: readonly [ValidationFunction, ValidationFunction<number>],
  }
}
type BaseArrayNormalizedField = {
  type: 'array',
  fields: {
    noValidation: null,
    singleValidation: ValidationFunction<string>,
    multipleValidation: readonly [ValidationFunction, ValidationFunction<number>],
  }
}
type BasicNormalizedField<T> = {
  type: 'basic',
  validate: T
}

{
  const noValidationNormalizedField = normalize(noValidation)
  expectNotAny(noValidationNormalizedField)
  expectNotNever(noValidationNormalizedField)
  expectAssignable<
    BasicNormalizedField<null>,
    Prepared<typeof noValidationNormalizedField>
  >
}

{
  const multipleValidationNormalizedField = normalize(multipleValidation)
  expectNotAny(multipleValidationNormalizedField)
  expectNotNever(multipleValidationNormalizedField)
  expectAssignable<
    BasicNormalizedField<ValidationFunction<number>>,
    Prepared<typeof multipleValidationNormalizedField>
  >
}

{
  const singleValidationNormalizedField = normalize(singleValidation)
  expectNotAny(singleValidationNormalizedField)
  expectNotNever(singleValidationNormalizedField)
  expectAssignable<
    BasicNormalizedField<ValidationFunction<string>>,
    Prepared<typeof singleValidationNormalizedField>
  >
}

{
  const simpleObjectNormalizedField = normalize(simpleObjectSchema)
  expectNotAny(simpleObjectNormalizedField)
  expectNotNever(simpleObjectNormalizedField)
  expectAssignable<
    BaseObjectNormalizedField & { validate: null },
    Prepared<typeof simpleObjectNormalizedField>
  >
}

{
  const simpleObjectWithValidationNormalizedField = normalize(simpleObjectWithValidationSchema)
  expectNotAny(simpleObjectWithValidationNormalizedField)
  expectNotNever(simpleObjectWithValidationNormalizedField)
  expectAssignable<
    BaseObjectNormalizedField & {
      validate: ValidationFunction<{
        noValidation: unknown,
        singleValidation: string,
        multipleValidation: number,
      }>
    },
    Prepared<typeof simpleObjectWithValidationNormalizedField>
  >
}

{
  const simpleArrayNormalizedField = normalize(simpleArraySchema)
  expectNotAny(simpleArrayNormalizedField)
  expectNotNever(simpleArrayNormalizedField)
  expectAssignable<
    BaseArrayNormalizedField & { validate: null },
    Prepared<typeof simpleArrayNormalizedField>
  >
}

{
  const simpleArrayWithValidationNormalizedField = normalize(simpleArrayWithValidationSchema)
  expectNotAny(simpleArrayWithValidationNormalizedField)
  expectNotNever(simpleArrayWithValidationNormalizedField)
  expectAssignable<
    BaseArrayNormalizedField & {
      validate: ValidationFunction<{
        noValidation: unknown,
        singleValidation: string,
        multipleValidation: number,
      }[]>
    },
    Prepared<typeof simpleArrayWithValidationNormalizedField>
  >
}

function validate<T>(value: T) {
  return value === 'failure' && { id: 'error' }
}
