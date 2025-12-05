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
  const errorFields = findAllErrorFields(form)
  const sortedFields = errorFields.sort(byDomOrder)
  const firstErrorField = getFirstItem(sortedFields)

  firstErrorField?.ref.current.focus()
}

function findAllErrorFields(field) {
  const state = field.state.get()

  if (field.type === 'basic' && state.error && field.ref?.current) return [field]

  return [
    ...(field.fields ? Object.values(field.fields) : []),
    ...(state.children || [])
  ].flatMap(findAllErrorFields)
}

function byDomOrder(a, b) {
  const nodeA = a.ref.current
  const nodeB = b.ref.current
  if (!nodeA || !nodeB) return 0
  return nodeAPrecedesNodeB(nodeA, nodeB) ? -1 : 1
}

function nodeAPrecedesNodeB(nodeA, nodeB) {
  return nodeB.compareDocumentPosition(nodeA) & Node.DOCUMENT_POSITION_PRECEDING
}

function getFirstItem(array) {
  return array?.[0] ?? undefined
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
