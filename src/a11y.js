import { useFormFieldSnapshot } from './hooks'

/**
 * A visually hidden live region that announces form errors to screen readers.
 */
export function FormErrorRegion({ form, renderError = defaultRenderError }) {
  const snapshot = useFormFieldSnapshot(form)
  const errors = flattenErrors(snapshot.error)

  return (
    <div style={visuallyHiddenStyle}>
      <div aria-live="polite" role="status">
        {errors.map((error, i) => renderError(error, i))}
      </div>
    </div>
  )
}

/**
 * Focus the first invalid field in the form.
 * @param {object} form - The form object returned by useForm
 */
export function focusFirstError(form) {
  const firstErrorField = findFirstErrorField(form)

  if (firstErrorField && firstErrorField.ref?.current?.focus) {
    firstErrorField.ref.current.focus()
  }
}

function findFirstErrorField(field) {
  const state = field.state.get()

  if (!state.invalid) return null

  // If this is a basic field with an error, return it
  if (field.type === 'basic' && state.error && field.ref) {
    return field
  }

  // Traverse object field children
  if (field.fields) {
    for (const childField of Object.values(field.fields)) {
      const errorField = findFirstErrorField(childField)
      if (errorField) return errorField
    }
  }

  // Traverse array field children (stored in state)
  if (state.children) {
    for (const childField of state.children) {
      const errorField = findFirstErrorField(childField)
      if (errorField) return errorField
    }
  }

  return null
}

function flattenErrors(errorTree) {
  if (!errorTree) return []
  if (typeof errorTree !== 'object' || (!errorTree.self && !errorTree.children)) {
    return errorTree ? [errorTree] : []
  }

  const selfErrors = errorTree.self ? [errorTree.self] : []
  const childErrors = errorTree.children
    ? Object.values(errorTree.children).flatMap(flattenErrors)
    : []

  return [...selfErrors, ...childErrors]
}

function defaultRenderError(error, key) {
  return <div key={key}>{error.message || error.id || String(error)}</div>
}

const visuallyHiddenStyle = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: '0'
}
