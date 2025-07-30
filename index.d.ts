export * from './src/hooks';
export * from './src/schema';
export * from './src/state';
export * from './src/validation';

import { ValidationError } from './src/validation';

export type ValidationContext<T> = { form: T, parents: any[] };

export type FormFields<T> = { [K in keyof T]: FormField<T[K]> };

export type FormField<T> = {
  type: 'basic' | 'array' | 'object';
  name: string;
  validate(context: ValidationContext<T>): void;
  setSubmitted(isSubmitted: boolean): void;
  reset(): void;
  value: {
    get(): T;
    subscribe(f: (value: T) => void): () => void;
  };
  state: {
    get(): FormFieldState<T>;
    subscribe(f: (state: FormFieldState<T>) => void): () => void;
  };
  eventHandlers?: {
    onBlur(): void;
    onFocus(): void;
    onChange(eOrValue: T | string | { target: { value: string } }): void;
  };
  helpers?: T extends (infer E)[] ? {
    add(initialValue: E): void;
    remove(entry: FormField<E>): void;
  } : never;
  fields?: T extends object ? FormFields<T> : never;
};

export type FormFieldState<T> = {
  value: T;
  error: ValidationError | false;
  invalid: boolean;
  isSubmitted: boolean;
  isVisited: boolean;
  hasFocus: boolean;
  showError: boolean;
  children?: T extends (infer E)[] ? FormField<E>[] : never;
};

export type FormSnapshot<T> = {
  value: T;
  error: { self: ValidationError | false; children: any };
  invalid: boolean;
};

export declare const snapshot: {
  get<T>(field: FormField<T>): FormSnapshot<T>;
  subscribe<T>(field: FormField<T>, f: (snapshot: FormSnapshot<T>) => void): () => void;
  subscribeToFieldState<T>(field: FormField<T>, f: (field: FormField<T>) => void): () => void;
};