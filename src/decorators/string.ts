import { createDecorator, ValidationOptions } from "./common";

export function IsString(options?: ValidationOptions) {
    return createDecorator('IsString', [], options);
}