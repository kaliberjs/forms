import { FormField, FormFieldState, FormSnapshot } from '../index';

export function useForm<T>(options: {
  initialValues?: T;
  fields: { [key: string]: any };
  validate?: any;
  onSubmit(snapshot: FormSnapshot<T>): void;
  formId?: string;
}): { form: FormField<T>; submit: (e?: React.FormEvent) => void; reset: () => void };

export function useFormField<T>(field: FormField<T>): { name: string; state: FormFieldState<T>; eventHandlers: any };
export function useNumberFormField(field: FormField<number>): { name: string; state: FormFieldState<number>; eventHandlers: any };
export function useBooleanFormField(field: FormField<boolean>): { name: string; state: FormFieldState<boolean>; eventHandlers: any };
export function useArrayFormField<T>(field: FormField<T[]>): { name: string; state: FormFieldState<T[]>; helpers: any };
export function useObjectFormField<T>(field: FormField<T>): { name: string; state: FormFieldState<T>; fields: any };

export function useFormFieldSnapshot<T>(field: FormField<T>): FormSnapshot<T>;
export function useFormFieldValue<T>(field: FormField<T>): T;
export function useFormFieldsValues(fields: FormField<any>[]): any[];
