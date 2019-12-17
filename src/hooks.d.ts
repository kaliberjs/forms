type ValuesOf<X> = X extends infer O ? { [K in keyof O]: ValueOf<O[K]> } : never

type ValueOf<X> =
  X extends { type: 'array', fields: infer Y } ? Array<ValuesOf<Y>> :
  X extends { type: 'object', fields: infer Y } ? ValuesOf<Y> :
  unknown

type ValuesOf1<X> = ValuesOf<X>

export function useForm<X>(input: {
  initialValues: Partial<ValuesOf<X>>,
  fields: X,
  onSubmit: (x: ValuesOf<X>) => void
}): { test: ValuesOf<X> }