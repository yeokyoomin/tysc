import { createDecorator, ValidationOptions } from "./common";

export function IsBoolean(options?: ValidationOptions) {
    return createDecorator('IsBoolean', [], options);
}