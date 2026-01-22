import { useForm } from './hooks'
import { array, object } from './schema'
import * as snapshot from './snapshot'
import { asConst } from './type-helpers.js'
import { expectAssignable, expectNotAny, expectNotNever, Prepared } from './type.test.helpers.ts'
import { Falsy, ValidationError } from './types.ts'
import { optionalT, requiredT } from './validation'

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
      value: string | undefined,
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
      value: number | undefined,
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
        a: string | undefined,
        b: number | undefined,
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
        a: string | undefined,
        b: number | undefined,
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
      value: ({ type: string, a: string | undefined } | { type: string, b: number | undefined })[],
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
