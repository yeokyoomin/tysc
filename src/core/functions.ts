import { Validator } from "./Validators";
import {
    ValidatorOptions,
    ClassConstructor,
    ValidationException
} from "./types";
import { plainToInstance } from "../utils/transformer";

export function check<T extends object>(
    cls: ClassConstructor<T>,
    plain: unknown
): plain is T {
    if (!plain || typeof plain !== "object") return false;

    const instance = plainToInstance(cls, plain, false);

    const errors = Validator.default.validate(instance, { abortEarly: true });
    return errors.length === 0;
}

export function assert<T extends object>(
    cls: ClassConstructor<T>,
    plain: unknown,
    options?: ValidatorOptions
): T {
    if (!plain || typeof plain !== "object") {
        throw new ValidationException([{
            property: "root",
            failedRules: { Type: ["Input must be an object"] }
        }]);
    }

    const instance = plainToInstance(cls, plain, !!options?.stripUnknown);

    const errors = Validator.default.validate(instance, options);

    if (errors.length > 0) {
        throw new ValidationException(errors);
    }

    return instance;
}

export function validate<T extends object>(obj: T, options?: ValidatorOptions) {
    return Validator.default.validate(obj, options);
}