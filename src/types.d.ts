type FormFields = object
type Validation = ValidationArray | ValidationFunction
type ValidationArray = Array<ValidationFunction>
type ValidationObject = { validation: ValidationFunction }
type ValidationFunction = (value: any) => ValidationResult | undefined
type ValidationResult = { id: string, params: Array<any> }
