import { FormField, FormFields, FormFieldState, FormSnapshot, FieldsSchema } from '../index';

export function useForm<T extends object>(options: {
  initialValues?: T;
  fields: FieldsSchema<T>;
  validate?: any;
  onSubmit(snapshot: FormSnapshot<T>): void;
  formId?: string;
}): { form: FormField<T>; submit: (e?: React.FormEvent) => void; reset: () => void };

export function useFormField<T>(field: FormField<T>): { name: string; state: FormFieldState<T>; eventHandlers: any };
export function useNumberFormField(field: FormField<number>): { name:string; state: FormFieldState<number>; eventHandlers: any };
export function useBooleanFormField(field: FormField<boolean>): { name: string; state: FormFieldState<boolean>; eventHandlers: any };
export function useArrayFormField<E>(field: FormField<E[]>): { name: string; state: FormFieldState<E[]>; helpers: { add(initialValue: E): void; remove(entry: FormField<E>): void; } };
export function useObjectFormField<T extends object>(field: FormField<T>): { name: string; state: FormFieldState<T>; fields: FormFields<T> };

export function useFormFieldSnapshot<T>(field: FormField<T>): FormSnapshot<T>;
export function useFormFieldValue<T>(field: FormField<T>): T;
export function useFormFieldsValues<T extends FormField<any>[]>(fields: T): { [K in keyof T]: T[K] extends FormField<infer V> ? V : never };