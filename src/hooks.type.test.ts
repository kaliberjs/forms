import { useForm, useFormFieldValue, useFormFieldsValues, useFormField, useNumberFormField, useBooleanFormField, useArrayFormField, useObjectFormField } from './hooks'
import { expectAssignable, expectNotAny, expectNotNever, Prepared } from './type.test.helpers.ts'
import { optionalT } from './validation'
import { object, array } from './schema'
import { Field, State } from './types.ts'

const { form } = useForm({
  fields: {
    a: optionalT('string'),
    b: optionalT('number'),
    c: optionalT('boolean'),
    d: object({
      a: optionalT('string'),
      b: optionalT('number'),
      c: optionalT('boolean'),
    }),
    e: array({
      a: optionalT('string'),
      b: optionalT('number'),
      c: optionalT('boolean'),
    })
  },
  onSubmit() {}
})

expectNotAny(form)
expectNotNever(form)
expectAssignable<
  Field.Object<{
    a: Field.Basic<string>,
    b: Field.Basic<number>,
    c: Field.Basic<boolean>,
    d: Field.Object<{
      a: Field.Basic<string>,
      b: Field.Basic<number>,
      c: Field.Basic<boolean>,
    }>,
    e: Field.Array<{
      a: Field.Basic<string>,
      b: Field.Basic<number>,
      c: Field.Basic<boolean>,
    }>
  }>,
  Prepared<typeof form>
>

const formFieldValue = useFormFieldValue(form.fields.a)
expectAssignable<string, Prepared<typeof formFieldValue>>

const formFieldsValues = useFormFieldsValues([form.fields.a, form.fields.b])
expectAssignable<[string, number], Prepared<typeof formFieldsValues>>

const formField = useFormField(form.fields.a)
expectAssignable<
  {
    name: string
    state: State.Basic<string>
    eventHandlers: {
        onBlur(): void
        onFocus(): void
        onChange(eOrValue: string | Field.Event<string>): void
    }
  },
  Prepared<typeof formField>
>

const numberFormField = useNumberFormField(form.fields.b)
expectAssignable<
  {
    name: string
    state: State.Basic<string | number>
    eventHandlers: {
        onBlur(): void
        onFocus(): void
        onChange(e: { target: { value: string } }): void
    }
  },
  Prepared<typeof numberFormField>
>

const booleanFormField = useBooleanFormField(form.fields.c)
expectAssignable<
  {
    name: string
    state: State.Basic<boolean>
    eventHandlers: {
        onBlur(): void
        onFocus(): void
        onChange(e: { target: { checked: boolean } }): void
    }
  },
  Prepared<typeof booleanFormField>
>

const objectFormField = useObjectFormField(form.fields.d)
expectAssignable<
  {
    name: string
    state: State.Common
    fields: {
        a: Field.Basic<string>
        b: Field.Basic<number>
        c: Field.Basic<boolean>
    }
  },
  Prepared<typeof objectFormField>
>

const arrayFormField = useArrayFormField(form.fields.e)
expectAssignable<
  {
    name: string
    state: State.Array<Field.Object<{
        a: Field.Basic<string>
        b: Field.Basic<number>
        c: Field.Basic<boolean>
    }>>
    helpers: {
        add(initialValue: {
          a?: string
          b?: number
          c?: boolean
        }): void
        remove(entry: Field.Object<{
          a: Field.Basic<string>
          b: Field.Basic<number>
          c: Field.Basic<boolean>
        }>): void
    }
  },
  Prepared<typeof arrayFormField>
>
