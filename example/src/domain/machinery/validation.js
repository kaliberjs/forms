import { error } from '@kaliber/forms/validation'

const dateRegex = /^\d\d?-\d\d?-\d\d\d\d$/
export const date = x => !dateRegex.test(x) && error('date')

export function ifFormHasValue(predicate, f) {
  return (x, { form }) => predicate(form) && f(x)
}

export function ifParentHasValue(predicate, f) {
  return (x, { parents }) => {
    const [parent] = parents.slice(-1)
    return predicate(parent) && f(x)
  }
}
