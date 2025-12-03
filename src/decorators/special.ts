import { createDecorator } from "./common";
import { ValidationOptions } from "../core/types"

export function IsOptional(options?: ValidationOptions) {
    return createDecorator('IsOptional', [], options);
}

type CustomValidator = (value: any) => boolean;

export function Custom(validator: CustomValidator, options?: ValidationOptions) {
    return createDecorator('Custom', [validator], options);
}