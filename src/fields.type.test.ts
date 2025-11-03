import { email, number, optional, required } from './validation'
import { normalize } from './normalize'
import { object, array } from './schema'
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
type SimpleObjectFieldsType = {
  noValidation: BasicFieldType<unknown>,
  singleValidation: BasicFieldType<string>,
  multipleValidation: BasicFieldType<number>,
}
const simpleObjectNormalizedField = normalize(object(simpleObjectInput))
const simpleObjectWithValidationNormalizedField = normalize(object(validate, simpleObjectInput))

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

type ObjectFieldType<Fields, Value> = {
  type: 'object',
  name: string,
  validate(context: ValidationContext): void,
  setSubmitted(isSubmitted: boolean): void,
  reset(): void,
  value: State.Readonly<Value>,
  state: State.Readonly<State.Object>,
  fields: Fields
}

type ArrayFieldType<Field, Value> = {
  type: 'array',
  name: string,
  validate(context: ValidationContext): void,
  setSubmitted(isSubmitted: boolean): void,
  reset(): void,
  value: State.Readonly<Value>,
  state: State.Readonly<State.Array<Field>>,
  helpers: {
    add(initialValue: Partial<Value extends Array<infer X> ? X : never>): void,
    remove(entry: Field): void,
  }
}

{
  const simpleObjectField = createObjectFormField({ field: simpleObjectNormalizedField })
  const simpleObjectWithValidationField = createObjectFormField({ field: simpleObjectWithValidationNormalizedField })
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
    ObjectFieldType<SimpleObjectFieldsType, SimpleObjectValueType>,
    Prepared<typeof simpleObjectField>
  >
  expectAssignable<
    ObjectFieldType<SimpleObjectFieldsType, SimpleObjectValueType>,
    Prepared<typeof simpleObjectWithValidationField>
  >
}

{
  const objectWithSubFields = createObjectFormField({
    field: normalize(object({
      object: simpleObjectNormalizedField,
      array: array(simpleObjectInput)
    }))
  })

  expectNotAny(objectWithSubFields)
  expectNotNever(objectWithSubFields)
  expectAssignable<
    ObjectFieldType<
    {
      object: ObjectFieldType<
        SimpleObjectFieldsType,
        SimpleObjectValueType
      >,
      array: ArrayFieldType<
        ObjectFieldType<
          SimpleObjectFieldsType,
          SimpleObjectValueType
        >,
        SimpleObjectValueType[]
      >,
    },
    { object: SimpleObjectValueType }
    >,
    Prepared<typeof objectWithSubFields>
  >
}

function validate<T>(value: T) {
  return value === 'failure' && { id: 'error' }
}
