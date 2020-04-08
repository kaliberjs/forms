import {
  useFormFieldValue, useFormFieldsValues,
  useFormFieldSnapshot
} from './hooks'

export function FormFieldValue({ field, render }) {
  const value = useFormFieldValue(field)
  return valueOrNull(render(value))
}

export function FormFieldsValues({ fields, render }) {
  const values = useFormFieldsValues(fields)
  return valueOrNull(render(values))
}

export function FormFieldValid({ field, render }) {
  const { invalid } = useFormFieldSnapshot(field)
  return valueOrNull(render(!invalid))
}

function valueOrNull(value) {
  return typeof value === 'undefined' ? null : value
}