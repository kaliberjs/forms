import { email, number, optional, required } from './validation'
import { normalize } from './normalize'
import { object } from './schema'
import { asConst } from './type-helpers'
import { createObjectFormField } from './fields'
import { expectAssignable, expectNotAny, expectNotNever, Prepared } from './type.test.helpers.ts'
import { Field, State, ValidationContext } from './types.ts'

const simpleObjectInput = asConst({
  noValidation: optional,
  singleValidation: email,
  multipleValidation: [required, number],
})
type SimpleObjectValueType = {
  noValidation: unknown,
  singleValidation: string,
  multipleValidation: number,
}
const simpleObjectNormalizedField = normalize(object(simpleObjectInput))

type BasicFieldType<T> = {
  type: 'basic',
  name: string,
  validate(context: ValidationContext): void,
  setSubmitted(isSubmitted: boolean): void,
  reset(): void,
  value: State.Readonly<T>,
  state: State.Readonly<State.Basic<T>>,
  eventHandlers: {
    onBlur(): void,
    onFocus(): void,
    onChange(eOrValue: Field.Event<T> | T): void,
  }
}

{
  const simpleObjectField = createObjectFormField({ field: simpleObjectNormalizedField })
  type SimpleObjectFields = (typeof simpleObjectField)['fields']

  type NoValidationFieldType = SimpleObjectFields['noValidation']
  expectAssignable<
  BasicFieldType<unknown>,
  Prepared<NoValidationFieldType>
  >

  type SingleValidationFieldType = SimpleObjectFields['singleValidation']
  expectAssignable<
  BasicFieldType<string>,
  Prepared<SingleValidationFieldType>
  >

  type MultipleValidationFieldType = SimpleObjectFields['multipleValidation']
  expectAssignable<
    BasicFieldType<number>,
    Prepared<MultipleValidationFieldType>
  >

  expectNotAny(simpleObjectField)
  expectNotNever(simpleObjectField)
  expectAssignable<
    {
      type: 'object',
      name: string,
      validate(context: ValidationContext): void,
      setSubmitted(isSubmitted: boolean): void,
      reset(): void,
      value: State.Readonly<SimpleObjectValueType>,
      state: State.Readonly<State.Object>,
      fields: {
        noValidation: BasicFieldType<unknown>,
        singleValidation: BasicFieldType<string>,
        multipleValidation: BasicFieldType<number>,
      },
    },
    Prepared<typeof simpleObjectField>
  >
}

function validate<T>(value: T) {
  return value === 'failure' && { id: 'error' }
}
