import { useForm, useFormFieldValue, useFormFieldsValues, useFormField, useNumberFormField, useBooleanFormField, useArrayFormField, useObjectFormField } from './hooks'
import { expectAssignable, expectNotAny, expectNotNever, Prepared } from './type.test.helpers.ts'
import { minLength, optionalT, requiredT } from './validation'
import { object, array } from './schema'
import { Falsy, Field, State, ValidationError } from './types.ts'
import * as snapshot from './snapshot'
import { asConst } from './type-helpers.js'

const { form } = useForm({
  fields: {
    a: optionalT('string'),
    b: optionalT('number'),
    c: object({
      a: optionalT('string'),
      b: optionalT('number'),
    }),
    d: array({
      a: optionalT('string'),
      b: optionalT('number'),
    }),
    e: array(
      (initialValue: { type: string }) => {
        return (
          initialValue.type === 'a' ? asConst({ type: requiredT('string'), a: optionalT('string') }) :
          initialValue.type === 'b' ? asConst({ type: requiredT('string'), b: optionalT('number') }) :
          throwError(`Unknown type: '${initialValue.type}'`)
        )
      }
    )
  },
  onSubmit() {}
})

{
  const result = snapshot.get(form.fields.a)
  expectNotAny(result)
  expectNotNever(result)
  expectAssignable<
    {
      invalid: boolean,
      value: string,
      error: Falsy | ValidationError
    },
    Prepared<typeof result>
  >
}
{
  const result = snapshot.get(form.fields.b)
  expectNotAny(result)
  expectNotNever(result)
  expectAssignable<
    {
      invalid: boolean,
      value: number,
      error: Falsy | ValidationError
    },
    Prepared<typeof result>
  >
}
{
  const result = snapshot.get(form.fields.c)
  expectNotAny(result)
  expectNotNever(result)
  expectAssignable<
    {
      invalid: boolean,
      value: {
        a: string,
        b: number,
      },
      error: {
        self: Falsy | ValidationError,
        children: {
          a: Falsy | ValidationError,
          b: Falsy | ValidationError,
        }
      }
    },
    Prepared<typeof result>
  >
}
{
  const result = snapshot.get(form.fields.d)
  expectNotAny(result)
  expectNotNever(result)
  expectAssignable<
    {
      invalid: boolean,
      value: {
        a: string,
        b: number,
      }[],
      error: {
        self: Falsy | ValidationError,
        children: {
          self: Falsy | ValidationError,
          children: {
            a: Falsy | ValidationError,
            b: Falsy | ValidationError,
          }
        }[]
      }
    },
    Prepared<typeof result>
  >
}
{
  const result = snapshot.get(form.fields.e)
  expectNotAny(result)
  expectNotNever(result)
  expectAssignable<
    {
      invalid: boolean,
      value: ({ type: string, a: string } | { type: string, b: number })[],
      error: {
        self: Falsy | ValidationError,
        children: (
          {
            self: Falsy | ValidationError,
            children:
              { type: Falsy | ValidationError, a: Falsy | ValidationError } |
              { type: Falsy | ValidationError, b: Falsy | ValidationError }
          }
        )[]
      }
    },
    Prepared<typeof result>
  >
}

{
  const result = snapshot.get(form)
}

function throwError(m: string): never { throw new Error(m) }
