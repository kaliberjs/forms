export * from './src/hooks';
export * from './src/schema';
export * from './src/state';
export * from './src/validation';

import { ValidationRule, ValidationError } from './src/validation';

export type FormField<T> = {
  type: 'basic' | 'array' | 'object';
  name: string;
  validate(context: any): void;
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
    onChange(eOrValue: any): void;
  };
  helpers?: {
    add(initialValue: any): void;
    remove(entry: any): void;
  };
  fields?: { [key: string]: FormField<any> };
};

export type FormFieldState<T> = {
  value: T;
  error: ValidationError | false;
  invalid: boolean;
  isSubmitted: boolean;
  isVisited: boolean;
  hasFocus: boolean;
  showError: boolean;
  children?: FormField<any>[];
};

export type FormSnapshot<T> = {
  value: T;
  error: { self: ValidationError | false; children: any };
  invalid: boolean;
};

export declare const snapshot: {
  get<T>(field: FormField<T>): FormSnapshot<T>;
  subscribe<T>(field: FormField<T>, f: (snapshot: FormSnapshot<T>) => void): () => void;
};
