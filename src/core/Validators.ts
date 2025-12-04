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
    private static instance: Validator;

    static get default(): Validator {
        if (!Validator.instance) {
            Validator.instance = new Validator();
        }
        return Validator.instance;
    }

    private static cache = new Map<Function, PropExecutor[]>();

    validate(target_obj: object): ValidationError[] {
        if (!target_obj || typeof target_obj !== "object") return [];

        const ctor = target_obj.constructor;

        let executors = Validator.cache.get(ctor);
        if (!executors) {
            executors = this.compile(ctor);
            Validator.cache.set(ctor, executors);
        }

        const errors: ValidationError[] = [];

        for (let i = 0; i < executors.length; i++) {
            const exec = executors[i];
            if (exec !== undefined) exec(target_obj, errors);
        }

        return errors;
    }

    private compile(target: Function): PropExecutor[] {
        const rules = storage.getRules(target);
        const executors: PropExecutor[] = [];
        const props = new Set(rules.map(r => r.propertyKey));

        for (const prop of props) {
            const propRules = rules.filter(r => r.propertyKey === prop);

            const isOptional = propRules.some(r => r.type === "IsOptional");

            let atLocation: string | undefined;
            const firstWithAt = propRules.find(r => r.at && r.type !== "IsOptional");
            if (firstWithAt) atLocation = firstWithAt.at;

            const actions: ValidationAction[] = [];

            for (const rule of propRules) {
                if (rule.type === "IsOptional") continue;

                const options = rule.options;
                const isEach = options?.each === true;

                if (rule.type === "ValidateNested") {
                    actions.push((val, ctx) => {
                        if (!val) return;

                        if (isEach && Array.isArray(val)) {
                            for (let i = 0; i < val.length; i++) {
                                const item = val[i];
                                if (item && typeof item === "object") {
                                    const nestedErrors = Validator.default.validate(item);
                                    if (nestedErrors.length > 0) {
                                        ctx.childrenErrors.push({
                                            property: `${prop}[${i}]`,
                                            index: i,
                                            children: nestedErrors
                                        });
                                    }
                                }
                            }
                        } else if (typeof val === "object") {
                            const nestedErrors = Validator.default.validate(val);
                            if (nestedErrors.length > 0) {
                                ctx.childrenErrors.push({
                                    property: prop,
                                    children: nestedErrors
                                });
                            }
                        }
                    });
                    continue;
                }

                const strategy = validationStrategies[rule.type];
                if (strategy) {
                    const ruleType = rule.type;
                    const ruleMessage = options?.message ?? rule.message;

                    actions.push((val, ctx) => {
                        if (isEach && Array.isArray(val)) {
                            for (let i = 0; i < val.length; i++) {
                                const res = strategy(val[i], rule, prop);
                                if (res !== null) {
                                    ctx.failedRules[ruleType] =
                                        ruleMessage
                                            ? `${ruleMessage} (index: ${i})`
                                            : `${res} (at index ${i})`;
                                    break;
                                }
                            }
                        } else {
                            const res = strategy(val, rule, prop);
                            if (res !== null) {
                                ctx.failedRules[ruleType] = ruleMessage ?? res;
                            }
                        }
                    });
                }
            }

            executors.push((obj: any, errors: ValidationError[]) => {
                const value = obj[prop];

                if ((value === undefined || value === null) && isOptional) {
                    return;
                }

                const ctx: ValidationContext = {
                    failedRules: {},
                    childrenErrors: []
                };

                for (let i = 0; i < actions.length; i++) {
                    const action = actions[i];
                    if (action !== undefined) action(value, ctx);
                }

                const hasFailedRules = Object.keys(ctx.failedRules).length > 0;
                const hasChildrenErrors = ctx.childrenErrors.length > 0;

                if (hasFailedRules || hasChildrenErrors) {
                    const err: ValidationError = { property: prop };
                    if (atLocation) err.at = atLocation;
                    if (hasFailedRules) err.failedRules = ctx.failedRules;
                    if (hasChildrenErrors) err.children = ctx.childrenErrors;

                    errors.push(err);
                }
            });
        }

        return executors;
    }
}

export function validate(obj: object) {
    return Validator.default.validate(obj);
}
