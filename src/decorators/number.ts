import { createDecorator, ValidationOptions } from "./common";

export function IsNumber(options?: ValidationOptions) {
    return createDecorator('IsNumber', [], options);
}

export function Min(min: number, options?: ValidationOptions) {
    return createDecorator('Min', [min], options);
}

export function Max(max: number, options?: ValidationOptions) {
    return createDecorator('Max', [max], options);
}

export function IsPositive(options?: ValidationOptions) {
    return createDecorator('IsPositive', [], options);
}

export function IsInt(options?: ValidationOptions) {
    return createDecorator('IsInt', [], options);
}