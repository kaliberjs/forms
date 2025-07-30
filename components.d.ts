import { FormField } from './index';

export function FormFieldValue<T>(props: { field: FormField<T>; render: (value: T) => React.ReactNode }): React.ReactElement | null;
export function FormFieldsValues(props: { fields: FormField<any>[]; render: (values: any[]) => React.ReactNode }): React.ReactElement | null;
export function FormFieldValid(props: { field: FormField<any>; render: (isValid: boolean) => React.ReactNode }): React.ReactElement | null;
