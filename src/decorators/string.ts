import { createDecorator } from "./common";
import { ValidationOptions } from "../core/types";


export function IsString(options?: ValidationOptions) {
    return createDecorator('IsString', [], options);
}

export function IsEmail(options?: ValidationOptions) {
    return createDecorator('IsEmail', [], options);
}

export function Length(min: number, max: number, options?: ValidationOptions) {
    return createDecorator('Length', [min, max], options);
}

export function Matches(pattern: RegExp, options?: ValidationOptions) {
    return createDecorator('Matches', [pattern], options);
}