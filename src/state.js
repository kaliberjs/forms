export function createState(initialState) {
  let state = initialState
  let listeners = new Set()

  return {
    subscribe(f) {
      listeners.add(f)
      return () => { listeners.delete(f) }
    },
    update(f) {
      if (typeof f !== 'function') throw new Error('update requires a function to update the state')
      const oldState = state
      state = f(state)
      listeners.forEach(f => { f(state, oldState) })
      return state
    },
    get() {
      return state
    },
  }
}

export function subscribeToAll({
  state,
  childrenFromState,
  notify,
  subscribeToChild,
  onlyNotifyOnChildChange = false,
}) {
  const children = childrenFromState(state.get())
  let unsubscribeChildren = subscribeToChildren(children, notify, subscribeToChild)
  const unsubscribe = state.subscribe((newState, oldState) => {
    const [newChildren, oldChildren] = [childrenFromState(newState), childrenFromState(oldState)]
    const childrenChanged = newChildren !== oldChildren
    if (childrenChanged) {
      unsubscribeChildren()
      unsubscribeChildren = subscribeToChildren(newChildren, notify, subscribeToChild)
    }
    if (onlyNotifyOnChildChange && !childrenChanged) return
    notify(newState, oldState)
  })

  return () => {
    unsubscribeChildren()
    unsubscribe()
  }
}

function subscribeToChildren(array, f, subscribeToChild) {
  return array.reduce(
    (unsubscribePrevious, x) => {
      const unsubscribe = subscribeToChild(x, f)

      return () => {
        unsubscribePrevious(),
        unsubscribe()
      }
    },
    () => {}
  )
}
