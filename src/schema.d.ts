import { ValidationRule } from './validation';

type IfAny<T, Y, N> = 0 extends (1 & T) ? Y : N;
type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

export function object<A, B>(fieldsOrValidate: A, fields?: B): Expand<{ type: 'object' } & IfAny<B, { fields: A }, { fields: B, validate: A }>>;
export function array<A, B>(fieldsOrValidate: A, fields?: B): Expand<{ type: 'array' } & IfAny<B, { fields: A }, { fields: B, validate: A }>>;
