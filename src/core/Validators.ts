import { storage } from "./Storage";
import { ValidationError } from "./types";
import { validationStrategies } from "./strategies";

type ValidationContext = {
    failedRules: { [key: string]: string };
    childrenErrors: ValidationError[];
};

type ValidationAction = (value: any, context: ValidationContext) => void;

type PropExecutor = (obj: any, errors: ValidationError[]) => void;

export class Validator {
    private static cache = new Map<Function, PropExecutor[]>();

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

        for (let i = 0; i < executors.length; i++) {
            const executor = executors[i];
            if (executor) {
                executor(target_obj, errors);
            }
        }

        return errors;
    }

    private compile(target: Function): PropExecutor[] {
        const rules = storage.getRules(target);
        const executors: PropExecutor[] = [];
        const props = new Set(rules.map(r => r.propertyKey));

        for (const prop of props) {
            const propRules = rules.filter(r => r.propertyKey === prop);
            const isOptional = propRules.some(r => r.type === 'IsOptional');
            
            const activeRules = propRules.filter(r => r.type !== 'IsOptional');
            const firstActiveRule = activeRules[0];
            const atLocation = firstActiveRule ? firstActiveRule.at : undefined;

            const actions: ValidationAction[] = [];

            for (const rule of propRules) {
                if (rule.type === 'IsOptional') continue;

                if (rule.type === "ValidateNested") {
                    actions.push((val, ctx) => {
                        if (val && typeof val === 'object') {
                            const nestedErrors = new Validator().validate(val);
                            if (nestedErrors.length > 0) {
                                ctx.childrenErrors.push(...nestedErrors);
                            }
                        }
                    });
                    continue;
                }

                const strategy = validationStrategies[rule.type];
                if (strategy) {
                    const ruleType = rule.type;
                    const ruleMessage = rule.message;
                    
                    actions.push((val, ctx) => {
                        const errorMsg = strategy(val, rule, prop);
                        if (errorMsg !== null) {
                            ctx.failedRules[ruleType] = ruleMessage ?? errorMsg;
                        }
                    });
                }
            }

            executors.push((obj: any, errors: ValidationError[]) => {
                const value = obj[prop];

                if ((value === undefined || value === null) && isOptional) {
                    return;
                }

                const context: ValidationContext = {
                    failedRules: {},
                    childrenErrors: []
                };

                for (let i = 0; i < actions.length; i++) {
                    const action = actions[i];
                    if (action) {
                        action(value, context);
                    }
                }

                if (Object.keys(context.failedRules).length > 0 || context.childrenErrors.length > 0) {
                    const errorResult: ValidationError = { property: prop };
                    
                    if (atLocation) {
                        errorResult.at = atLocation;
                    }

                    if (Object.keys(context.failedRules).length > 0) {
                        errorResult.failedRules = context.failedRules;
                    }
                    if (context.childrenErrors.length > 0) {
                        errorResult.children = context.childrenErrors;
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