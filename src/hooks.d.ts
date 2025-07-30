import { FormField, FormFields, FormFieldState, FormSnapshot, FieldsSchema, ValidationRule, TypeFromFieldsSchema } from '../index';

export type EventHandlers<T> = {
  onBlur(): void;
  onFocus(): void;
  onChange(
    eOrValue: T extends boolean
      ? (boolean | { target: { checked: boolean } })
      : (T | string | { target: { value: string } })
  ): void;
};

export function useForm<T extends FieldsSchema<any>>(options: {
  initialValues?: Partial<TypeFromFieldsSchema<T>>;
  fields: T;
  validate?: ValidationRule<TypeFromFieldsSchema<T>>;
  onSubmit(snapshot: FormSnapshot<TypeFromFieldsSchema<T>>): void;
  formId?: string;
}): { form: FormField<TypeFromFieldsSchema<T>>; submit: (e?: React.FormEvent) => void; reset: () => void };

export function useFormField<T>(field: FormField<T>): { name: string; state: FormFieldState<T>; eventHandlers: EventHandlers<T> };
export function useNumberFormField(field: FormField<number>): { name:string; state: FormFieldState<number>; eventHandlers: EventHandlers<number> };
export function useBooleanFormField(field: FormField<boolean>): { name: string; state: FormFieldState<boolean>; eventHandlers: EventHandlers<boolean> };
export function useArrayFormField<E>(field: FormField<E[]>): { name: string; state: FormFieldState<E[]>; helpers: { add(initialValue: E): void; remove(entry: FormField<E>): void; } };
export function useObjectFormField<T extends object>(field: FormField<T>): { name: string; state: FormFieldState<T>; fields: FormFields<T> };

export function useFormFieldSnapshot<T>(field: FormField<T>): FormSnapshot<T>;
export function useFormFieldValue<T>(field: FormField<T>): T;
export function useFormFieldsValues<T extends FormField<any>[]>(fields: T): { [K in keyof T]: T[K] extends FormField<infer V> ? V : never };