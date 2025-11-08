import { error } from '@kaliber/forms/validation'
/** @import { Validate, ValidationFunction } from '@kaliber/forms/types' */

const dateRegex = /^\d\d?-\d\d?-\d\d\d\d$/
export const date = /** @arg {string} x */ x => !dateRegex.test(x) && error('date')

/**
 * @template T
 * @template {ValidationFunction<T>} F
 * @arg {(parent: any) => boolean} predicate
 * @arg {F} f
 *
 * @returns {ValidationFunction<T>}
 */
export function ifFormHasValue(predicate, f) {
  return (x, context) => {
    const { form } = context
    return predicate(form) && f(x, context)
  }
}

/**
 * @template T
 * @template {ValidationFunction<T>} F
 * @arg {(parent: any) => boolean} predicate
 * @arg {F} f
 *
 * @returns {ValidationFunction<T>}
 */
export function ifParentHasValue(predicate, f) {
  return (x, context) => {
    const { parents } = context
    const [parent] = parents.slice(-1)
    return predicate(parent) && f(x, context)
  }
}
