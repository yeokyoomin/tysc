import { storage } from "./Storage";
import { ValidationError } from "./types";

export class Validator {
    validate(target_obj: object): ValidationError[] {

        const _obj = target_obj as any;

        if (!_obj || typeof _obj !== 'object') {
            return [];
        }

        const target = _obj.constructor;
        const rules = storage.getRules(target);
        const errors: ValidationError[] = [];

        const properties = new Set(rules.map(r => r.propertyKey));

        for (const prop of properties) {
            const propRules = rules.filter(r => r.propertyKey === prop);
            const _value = _obj[prop];

            const isOptional = propRules.some(rule => rule.type === 'IsOptional');

            if ((_value === undefined || _value === null) && isOptional) {
                continue;
            }

            const failedRules: { [key: string]: string } = {};
            let childrenErrors: ValidationError[] = [];

            for (const rule of propRules) {
                if (rule.type == "ValidateNested") {
                    if (_value && typeof _value === 'object') {
                        const nestedValidator = new Validator();
                        childrenErrors = nestedValidator.validate(_value);
                    }
                    continue;
                }

                let isValid = true;
                let message = rule.message;

                switch (rule.type) {
                    case "IsString":
                        isValid = typeof _value === "string";
                        if (!isValid && !message) message = `${prop} must be string`;
                        break;
                    case "IsNumber":
                        isValid = typeof _value == "number";
                        if (!isValid && !message) message = `${prop} must be number`;
                        break;
                    case "IsPositive":
                        isValid = typeof _value == "number" && _value > 0;
                        if (!isValid && !message) message = `${prop} must be a positive number`
                        break;
                    case "IsBoolean":
                        isValid = typeof _value == "boolean";
                        if (!isValid && !message) message = `${prop} must be a boolean.`
                        break;
                    case "IsInt":
                        isValid = typeof _value == "number" && Number.isInteger(_value);
                        if (!isValid && !message) message = `${prop} must be an integer`
                        break;
                    case "Max": {
                        const [max] = rule.constraints || [0];
                        isValid = typeof _value == "number" && _value <= max;
                        if (!isValid && !message) message = `${prop} must be at most ${max}`
                        break;
                    }
                    case "Min": {
                        const [min] = rule.constraints || [0];
                        isValid = typeof _value === "number" && _value >= min;
                        if (!isValid && !message) message = `${prop} must be at least ${min}`;
                        break;
                    }
                    case 'Custom': {
                        const [validatorFn] = rule.constraints || [];

                        if (typeof validatorFn === 'function') {
                            try {
                                isValid = validatorFn(_value);
                            } catch (e) {
                                isValid = false;
                            }
                        }

                        if (!isValid && !message) {
                            message = `${prop} failed custom validation`;
                        }
                        break;
                    }
                }

                if (!isValid) {
                    failedRules[rule.type] = message || "Validation failed";
                }
            }

            if (Object.keys(failedRules).length > 0 || childrenErrors.length > 0) {
                const errorResult: ValidationError = { property: prop };
                const firstRule = propRules[0];

                if (firstRule && firstRule.at) {
                    errorResult.at = firstRule.at;
                }

                if (Object.keys(failedRules).length > 0) {
                    errorResult.failedRules = failedRules;
                }
                if (childrenErrors.length > 0) {
                    errorResult.children = childrenErrors;
                }

                errors.push(errorResult);
            }

        }

        return errors;
    }
}

export function validate(obj: object) {
    return new Validator().validate(obj);
}