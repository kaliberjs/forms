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
      if (state !== oldState) listeners.forEach(f => { f(state, oldState) })
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
  let unsubscribeChildren = subscribeToChildren({ children, notify, subscribeToChild })
  const unsubscribe = state.subscribe((newState, oldState) => {
    const [newChildren, oldChildren] = [childrenFromState(newState), childrenFromState(oldState)]
    const childrenChanged = newChildren !== oldChildren
    if (childrenChanged) {
      unsubscribeChildren()
      unsubscribeChildren = subscribeToChildren({ children: newChildren, notify, subscribeToChild })
    }
    if (onlyNotifyOnChildChange && !childrenChanged) return
    notify(newState, oldState)
  })

  return () => {
    unsubscribeChildren()
    unsubscribe()
  }
}

export function subscribeToChildren({ children, notify, subscribeToChild }) {
  return children.reduce(
    (unsubscribePrevious, x) => {
      const unsubscribe = subscribeToChild(x, notify)

      return () => {
        unsubscribePrevious(),
        unsubscribe()
      }
    },
    () => {}
  )
}
