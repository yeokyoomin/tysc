import { storage } from "./Storage";
import { ValidationError } from "./types";
import { validationStrategies } from "./strategies";

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
                if (rule.type === 'IsOptional') continue;

                if (rule.type === "ValidateNested") {
                    if (_value && typeof _value === 'object') {
                        const nestedValidator = new Validator();
                        childrenErrors = nestedValidator.validate(_value);
                    }
                    continue;
                }

                const strategy = validationStrategies[rule.type];

                if (strategy) {
                    const errorMessage = strategy(_value, rule, prop);
                    
                    if (errorMessage !== null) {
                        failedRules[rule.type] = rule.message || errorMessage;
                    }
                } else {
                    console.warn(`No validation strategy found for rule type: ${rule.type}`);
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