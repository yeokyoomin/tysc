import { createDecorator, ValidationOptions } from "./common";

export function IsOptional(options?: ValidationOptions) {
    return createDecorator('IsOptional', [], options);
}