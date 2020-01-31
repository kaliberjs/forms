import { useArrayFormField, useObjectFormField, useFormFieldValue, useFormFieldSnapshot } from './hooks'

export function FormFieldValue({ field, render }) {
  const value = useFormFieldValue(field)
  return render({ value }) || null
}

export function FormFieldValues({ fields, render }) {
  // TODO
  return null
}

export function FormFieldValid({ field, render }) {
  const { invalid } = useFormFieldSnapshot(field)
  return React.useMemo(() => render(!invalid) || null, [invalid])
}
