/* eslint-disable @kaliber/naming-policy */
import {
  useFormFieldValue, useFormFieldsValues,
  useFormFieldSnapshot
} from './hooks'
/** @import { Field } from './types.ts' */

/**
 * @template {Field} T
 * @template {(value: ReturnType<typeof useFormFieldValue<T>>) => any} R
 * @arg {{ field: T, render: R }} props
 * @returns {null | ReturnType<R>}
 */
export function FormFieldValue({ field, render }) {
  const value = useFormFieldValue(field)
  return valueOrNull(render(value))
}

/**
 * @template {[...Field[]]} const T
 * @template {(values: ReturnType<typeof useFormFieldsValues<T>>) => any} R
 * @arg {{ fields: T, render: R }} props
 * @returns {null | ReturnType<R>}
 */
export function FormFieldsValues({ fields, render }) {
  const values = useFormFieldsValues(fields)
  return valueOrNull(render(values))
}

/**
 * @template {Field} T
 * @template {(valid: boolean) => any} R
 * @arg {{ field: T, render: R }} props
 * @returns {null | ReturnType<R>}
 */
export function FormFieldValid({ field, render }) {
  const { invalid } = useFormFieldSnapshot(field)
  return valueOrNull(render(!invalid))
}

/** @template T @arg {T} value @returns {T | null} */
function valueOrNull(value) {
  return typeof value === 'undefined' ? null : value
}
