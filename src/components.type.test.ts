import { FormFieldsValues, FormFieldValid, FormFieldValue } from './components'
import { useForm } from './hooks'
import { array, object } from './schema'
import { expectAssignable, expectNotAny, expectNotNever, Prepared } from './type.test.helpers.ts'
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

FormFieldValue({
  field: form,
  render(value) {
    expectNotAny(value)
    expectNotNever(value)
    expectAssignable<
      {
        a: string
        b: number
        c: boolean
        d: {
            a: string
            b: number
            c: boolean
        }
        e: {
            a: string
            b: number
            c: boolean
        }[]
      },
      Prepared<typeof value>
    >
  }
})

FormFieldsValues({
  fields: [form.fields.a, form.fields.b],
  render(value) {
    expectNotAny(value)
    expectNotNever(value)
    expectAssignable<
      [string, number],
      Prepared<typeof value>
    >
  }
})

FormFieldValid({
  field: form.fields.a,
  render(value) {
    expectNotAny(value)
    expectNotNever(value)
    expectAssignable<
      boolean,
      Prepared<typeof value>
    >
  }
})
