import { FormField, Snapshot } from './hooks'

type Unsubscribe = () => void

export function get<T>(field: FormField<T>): Snapshot<T>
export function subscribe<T>(field: FormField<T>, f: (snapshot: Snapshot<T>) => void): Unsubscribe
export function subscribeToFieldState<T>(field: FormField<T>, f: (field: FormField<T>) => void): Unsubscribe

export const snapshot: {
  get<T>(field: FormField<T>): Snapshot<T>
  subscribe<T>(field: FormField<T>, f: (snapshot: Snapshot<T>) => void): Unsubscribe
  subscribeToFieldState<T>(field: FormField<T>, f: (field: FormField<T>) => void): Unsubscribe
}
