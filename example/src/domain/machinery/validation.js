import { required, message } from '@kaliber/forms'

const dateRegex = /^\d\d?-\d\d?-\d\d\d\d$/
export const date = x => !dateRegex.test(x) && message('date')
export function requiredWhenInForm(predicate) {
  return (x, { form }) => predicate(form) && required(x)
}
export function requiredWhenInParent(predicate) {
  return (x, { parents }) => {
    const [parent] = parents.slice(-1)
    return predicate(parent) && required(x)
  }
}
