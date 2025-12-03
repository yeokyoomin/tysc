import { storage } from "../core/Storage";
import { ValidationOptions } from "../core/types";
import { getCallerLocation } from "../utils/stack";

export function ValidateNested(options?: ValidationOptions) {
    const location = getCallerLocation();

    return function (target: Object, propertyKey: string) {
        storage.addRule({
            target: target.constructor,
            propertyKey,
            type: "ValidateNested",
            options: options,
            at: location
        });
    };
}