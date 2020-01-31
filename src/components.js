import {
  useFormFieldValue, useFormFieldsValues,
  useFormFieldSnapshot
} from './hooks'

export function FormFieldValue({ field, render }) {
  const value = useFormFieldValue(field)
  return render(value) || null
}

export function FormFieldsValues({ fields, render }) {
  const values = useFormFieldsValues(fields)
  return render(values) || null
}

export function FormFieldValid({ field, render }) {
  const { invalid } = useFormFieldSnapshot(field)
  return React.useMemo(() => render(!invalid) || null, [invalid])
}
