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

export function subscribeToAll(array, f, subscribe = (x, f) => x.subscribe(f)) {
  return array.reduce(
    (unsubscribePrevious, x) => {
      const unsubscribe = subscribe(x, f)

      return () => {
        unsubscribePrevious(),
        unsubscribe()
      }
    },
    () => {}
  )
}
