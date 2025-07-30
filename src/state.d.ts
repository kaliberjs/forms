export type State<T> = {
  get(): T;
  subscribe(f: (newState: T, oldState: T) => void): () => void;
  update(f: (state: T) => T): T;
};

export function createState<T>(initialState: T): State<T>;

export function subscribeToAll<T>(options: {
  state: State<T>;
  childrenFromState: (state: T) => any[];
  notify: (newState: T, oldState: T) => void;
  subscribeToChild: (child: any, notify: (newState: T, oldState: T) => void) => () => void;
  onlyNotifyOnChildChange?: boolean;
}): () => void;

export function subscribeToChildren(options: {
  children: any[];
  notify: (value: any) => void;
  subscribeToChild: (child: any, notify: (value: any) => void) => () => void;
}): () => void;
