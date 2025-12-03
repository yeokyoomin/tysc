import { createDecorator } from "./common";
import { ValidationOptions } from "../core/types";

export function IsBoolean(options?: ValidationOptions) {
    return createDecorator('IsBoolean', [], options);
}