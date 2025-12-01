import { storage } from "../core/Storage";
import { getCallerLocation } from "../utils/stack"

export type ValidationOptions = {
    message?: string;
}

export function createDecorator(type: string, constraints: any[] = [], options?: ValidationOptions) {
    const location = getCallerLocation();
    return function (target: Object, propertyKey: string) {
        storage.addrule({
            target: target.constructor,
            propertyKey: propertyKey,
            type: type,
            constraints: constraints,
            message: options?.message,
            at: location
        });
    };
}