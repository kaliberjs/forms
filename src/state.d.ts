export type State<T> = {
  subscribe: (f: (newState: T, oldState: T) => void) => () => void;
  update: (f: (state: T) => T) => T;
  get: () => T;
}

export function createState<T>(initialState: T): State<T>;

export function subscribeToAll<T, C>(config: {
  state: State<T>;
  childrenFromState: (state: T) => C[];
  notify: (newState: T, oldState: T) => void;
  subscribeToChild: (child: C, notify: (newState: T, oldState: T) => void) => () => void;
  onlyNotifyOnChildChange?: boolean;
}): () => void;

export function subscribeToChildren<C>(config: {
  children: C[];
  notify: (child: C) => void;
  subscribeToChild: (child: C, notify: (child: C) => void) => () => void;
}): () => void;
