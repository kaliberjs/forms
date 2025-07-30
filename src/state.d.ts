export type State<T> = {
  get(): T;
  subscribe(f: (newState: T, oldState: T) => void): () => void;
  update(f: (state: T) => T): T;
};

export function createState<T>(initialState: T): State<T>;

export function subscribeToAll<T, C>(options: {
  state: State<T>;
  childrenFromState: (state: T) => C[];
  notify: (newState: T, oldState: T) => void;
  subscribeToChild: (child: C, notify: (newState: T, oldState: T) => void) => () => void;
  onlyNotifyOnChildChange?: boolean;
}): () => void;

export function subscribeToChildren<T>(options: {
  children: T[];
  notify: (value: any) => void;
  subscribeToChild: (child: T, notify: (value: any) => void) => () => void;
}): () => void;