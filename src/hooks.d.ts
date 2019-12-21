type ValuesOf<X> = X extends infer O ? { [K in keyof O]: ValueOf<O[K]> } : never

type ValueOf<X> =
  X extends { type: 'array', fields: infer Y } ? Array<ValuesOf<Y>> :
  X extends { type: 'object', fields: infer Y } ? ValuesOf<Y> :
  unknown

type FieldOf<X> =
  X extends { type: 'array', fields: infer Y } ? FieldOfArray<Y> :
  X extends { type: 'object', fields: infer Y } ? FieldOfObject<Y> :
  FieldOfOther

type FieldOfObject<X> = X extends infer O
  ? BaseField & {
    fields: { [K in keyof O]: FieldOf<O[K]> }
  }
  : never

type FieldOfArray<X> = BaseField & {

}

type FieldOfOther = BaseField & {

}

type BaseField = {
  name: string,
  value: {
    readonly current: unknown,
    subscribe(f: (value: unknown) => void): void
  }
}

export function useForm<X>(input: {
  initialValues: Partial<ValuesOf<X>>,
  fields: X,
  onSubmit: (x: ValuesOf<X>) => void
}): {
  form: FieldOfObject<X>,
  submit(e: { preventDefault(): void }): void,
  reset(): void
}
