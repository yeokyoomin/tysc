import { createDecorator } from "./common";
import { ValidationOptions } from "../core/types";


export function IsOptional(options?: ValidationOptions) {
    return createDecorator('IsOptional', [], options);
}