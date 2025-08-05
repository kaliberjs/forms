import { ObjectFieldDefinition } from "types";
import { Validate } from "src/validation";

export function objectWithValidation<T>(params: { fields: ObjectFieldDefinition<T>['fields'], validators: Validate<T>[] }): Validate<T>[] & ObjectFieldDefinition<T> 
