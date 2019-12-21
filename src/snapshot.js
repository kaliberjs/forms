export function get(field) {
  return {
    'object': getForObject,
    'array': getForArray,
    'basic': getForBasic,
  }[field.type](field)
}

export function subscribe(field, f) {
  return {
    'object': subscribeForObject,
    'array': subscribeForArray,
    'basic': subscribeForBasic,
  }[field.type](field, f)
}

function getForObject(field) {
  const { error, invalid } = field.state.get()
  const { fieldsInvalid, fieldErrors, fieldValues } =  Object.entries(field.fields).reduce(
    ({ fieldsInvalid, fieldValues, fieldErrors }, [name, field]) => {
      const { value, error, invalid } = get(field)
      return {
        fieldsInvalid: fieldsInvalid || invalid,
        fieldErrors: { ...fieldErrors, [name]: error },
        fieldValues: { ...fieldValues, [name]: value },
      }
    },
    { fieldsInvalid: false, fieldErrors: {}, fieldValues: {} }
  )

  return {
    invalid: invalid || fieldsInvalid,
    value: fieldValues,
    error: { field: error, fields: fieldErrors },
  }
}

function getForArray(field) {
  const { value: arrayFields, error, invalid } = field.state.get()
  const { fieldValues, fieldErrors, fieldsInvalid } = arrayFields.reduce(
    ({ fieldValues, fieldErrors, fieldsInvalid }, field) => {
      const { value, error, invalid} = get(field)
      return {
        fieldValues: [...fieldValues, value],
        fieldErrors: [...fieldErrors, error],
        fieldsInvalid: fieldsInvalid || invalid,
      }
    },
    { fieldValues: [], fieldErrors: [], fieldsInvalid: false }
  )
  return {
    value: fieldValues,
    error: { field: error, fields: fieldErrors },
    invalid: invalid || fieldsInvalid
  }
}

function getForBasic(field) {
  const { value, error, invalid } = field.state.get()
  return { value, error, invalid }
}

function subscribeForObject(field, f) {
  const unsubscribe = field.state.subscribe(_ => f(getForObject(field)))
  const unsubscribeForChildren = Object.values(field.fields).reduce(
    (unsubscribePrevious, child) => {
      const unsubscribe = subscribe(child, _ => f(getForObject(field)))
      return () => {
        unsubscribePrevious()
        unsubscribe()
      }
    },
    () => {}
  )
  return () => {
    unsubscribe()
    unsubscribeForChildren()
  }
}

function subscribeForArray(field, f) {
  const { value: children } = field.state.get()
  let unsubscribeForChildren = subscribeToChildren(children, f)
  const unsubscribe = field.state.subscribe(({ value: children }) => {
    unsubscribeForChildren()
    f(getForArray(field))
    unsubscribeForChildren = subscribeToChildren(children, f)
  })
  return () => {
    unsubscribeForChildren()
    unsubscribe()
  }

  function subscribeToChildren(children, f) {
    return children.reduce(
      (unsubscribePrevious, child) => {
        const unsubscribe = subscribe(child, _ => f(getForArray(field)))
        return () => {
          unsubscribePrevious()
          unsubscribe()
        }
      },
      () => {}
    )
  }
}

function subscribeForBasic(field, f) {
  return field.state.subscribe(({ value, error, invalid }) => f({ value, error, invalid }))
}
