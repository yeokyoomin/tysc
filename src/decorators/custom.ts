import { createDecorator, ValidationOptions } from "./common";

type CustomValidator = (value: any) => boolean;

export function Custom(validator: CustomValidator, options?: ValidationOptions) {
    return createDecorator('Custom', [validator], options);
}