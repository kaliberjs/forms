import {
  useArrayFormField,
  useBooleanFormField,
  useForm,
  useFormField,
  useFormFieldSnapshot,
  useFormFieldsValues,
  useFormFieldValue,
  useNumberFormField,
  useObjectFormField
} from './hooks'
import { array, object } from './schema'
import { expectAssignable, expectNotAny, expectNotNever, Prepared } from './type.test.helpers.ts'
import { Field, Snapshot, State } from './types.ts'
import { optionalT } from './validation'

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
    a: Field.Basic<string | undefined>,
    b: Field.Basic<number | undefined>,
    c: Field.Basic<boolean | undefined>,
    d: Field.Object<{
      a: Field.Basic<string | undefined>,
      b: Field.Basic<number | undefined>,
      c: Field.Basic<boolean | undefined>,
    }>,
    e: Field.Array<{
      a: Field.Basic<string | undefined>,
      b: Field.Basic<number | undefined>,
      c: Field.Basic<boolean | undefined>,
    }>
  }>,
  Prepared<typeof form>
>

const formFieldValue = useFormFieldValue(form.fields.a)
expectAssignable<string, Prepared<typeof formFieldValue>>

const formFieldsValues = useFormFieldsValues([form.fields.a, form.fields.b])
expectAssignable<[string | undefined, number | undefined], Prepared<typeof formFieldsValues>>

const formField = useFormField(form.fields.a)
expectAssignable<
  {
    name: string
    state: State.Basic<string | undefined>
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
    state: State.Basic<string | number | undefined>
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
    state: State.Basic<boolean | undefined>
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
        a: Field.Basic<string | undefined>
        b: Field.Basic<number | undefined>
        c: Field.Basic<boolean | undefined>
    }
  },
  Prepared<typeof objectFormField>
>

const arrayFormField = useArrayFormField(form.fields.e)
expectAssignable<
  {
    name: string
    state: State.Array<Field.Object<{
        a: Field.Basic<string | undefined>
        b: Field.Basic<number | undefined>
        c: Field.Basic<boolean | undefined>
    }>>
    helpers: {
        add(initialValue: {
          a?: string
          b?: number
          c?: boolean
        }): void
        remove(entry: Field.Object<{
          a: Field.Basic<string | undefined>
          b: Field.Basic<number | undefined>
          c: Field.Basic<boolean | undefined>
        }>): void
    }
  },
  Prepared<typeof arrayFormField>
>

const formFieldSnapshot = useFormFieldSnapshot(form)
expectNotAny(formFieldSnapshot)
expectNotNever(formFieldSnapshot)
expectAssignable<
  Snapshot.Object<{
    a: Field.Basic<string | undefined>,
    b: Field.Basic<number | undefined>,
    c: Field.Basic<boolean | undefined>,
    d: Field.Object<{
      a: Field.Basic<string | undefined>,
      b: Field.Basic<number | undefined>,
      c: Field.Basic<boolean | undefined>,
    }>,
    e: Field.Array<{
      a: Field.Basic<string | undefined>,
      b: Field.Basic<number | undefined>,
      c: Field.Basic<boolean | undefined>,
    }>
  }>,
  Prepared<typeof formFieldSnapshot>
>
