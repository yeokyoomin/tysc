import { createDecorator } from "./common";
import { ValidationOptions } from "../core/types";

export function IsArray(options?: ValidationOptions) {
    return createDecorator('IsArray', [], options);
}

export function ArrayMinSize(min: number, options?: ValidationOptions) {
    return createDecorator('ArrayMinSize', [min], options);
}

export function ArrayMaxSize(max: number, options?: ValidationOptions) {
    return createDecorator('ArrayMaxSize', [max], options);
}