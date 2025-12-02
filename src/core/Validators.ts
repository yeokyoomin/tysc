import { storage } from "./Storage";
import { ValidationError } from "./types";
import { validationStrategies } from "./strategies";

type ValidatorExecutor = (obj: any, errors: ValidationError[]) => void;

export class Validator {
    private static cache = new Map<Function, ValidatorExecutor[]>();

    validate(target_obj: object): ValidationError[] {
        if (!target_obj || typeof target_obj !== 'object') {
            return [];
        }

        const targetConstructor = target_obj.constructor;

        let executors = Validator.cache.get(targetConstructor);

        if (!executors) {
            executors = this.compile(targetConstructor);
            Validator.cache.set(targetConstructor, executors);
        }

        const errors: ValidationError[] = [];

        if (executors) {
            for (const executor of executors) {
                executor(target_obj, errors);
            }
        }

        return errors;
    }

    private compile(target: Function): ValidatorExecutor[] {
        const rules = storage.getRules(target);
        const executors: ValidatorExecutor[] = [];

        const props = new Set(rules.map(r => r.propertyKey));

        for (const prop of props) {
            const propRules = rules.filter(r => r.propertyKey === prop);
            const isOptional = propRules.some(r => r.type === 'IsOptional');

            const activeRules = propRules.filter(r => r.type !== 'IsOptional');

            executors.push((obj: any, errors: ValidationError[]) => {
                const value = obj[prop];

                if ((value === undefined || value === null) && isOptional) {
                    return;
                }

                const failedRules: { [key: string]: string } = {};
                let childrenErrors: ValidationError[] = [];

                for (const rule of activeRules) {
                    if (rule.type === "ValidateNested") {
                        if (value && typeof value === 'object') {
                            const nestedErrors = new Validator().validate(value);
                            if (nestedErrors.length > 0) {
                                childrenErrors = nestedErrors;
                            }
                        }
                        continue;
                    }

                    const strategy = validationStrategies[rule.type];
                    if (strategy) {
                        const errorMsg = strategy(value, rule, prop);
                        if (errorMsg !== null) {
                            failedRules[rule.type] = rule.message || errorMsg;
                        }
                    }
                }

                if (Object.keys(failedRules).length > 0 || childrenErrors.length > 0) {
                    const errorResult: ValidationError = { property: prop };

                    const firstRule = activeRules[0];
                    if (firstRule?.at) {
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
            });
        }

        return executors;
    }
}

export function validate(obj: object) {
    return new Validator().validate(obj);
}