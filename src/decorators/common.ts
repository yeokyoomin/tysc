import { storage } from "../core/Storage";
import { getCallerLocation } from "../utils/stack"
import { ValidationOptions } from "../core/types";

export function createDecorator(type: string, constraints: any[] = [], options?: ValidationOptions) {
    const location = getCallerLocation();
    return function (target: Object, propertyKey: string) {
        storage.addRule({
            target: target.constructor,
            propertyKey: propertyKey,
            type: type,
            constraints: constraints,
            message: options?.message,
            at: location
        });
    };
}