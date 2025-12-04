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
            if (exec) exec(target_obj, errors);
        }

        return errors;
    }

    private compile(target: Function): PropExecutor[] {
        const rules = storage.getRules(target);

        const rulesByProp = new Map<string | symbol, typeof rules>();
        for (let i = 0; i < rules.length; i++) {
            const r = rules[i];
            if (!r) continue;

            let list = rulesByProp.get(r.propertyKey);
            if (!list) {
                list = [];
                rulesByProp.set(r.propertyKey, list);
            }
            list.push(r);
        }

        const executors: PropExecutor[] = [];

        for (const [prop, propRules] of rulesByProp) {
            const propName = String(prop);

            const isOptional = propRules.some(r => r && r.type === "IsOptional");
            const firstWithAt = propRules.find(r => r && r.at && r.type !== "IsOptional");
            const atLocation = firstWithAt?.at;

            const actions: ValidationAction[] = [];

            for (let i = 0; i < propRules.length; i++) {
                const rule = propRules[i];
                if (!rule) continue;
                if (rule.type === "IsOptional") continue;

                const options = rule.options;
                const isEach = options?.each === true;

                if (rule.type === "ValidateNested") {
                    actions.push((val, ctx) => {
                        if (!val) return;

                        if (isEach && Array.isArray(val)) {
                            for (let k = 0; k < val.length; k++) {
                                const item = val[k];
                                if (item && typeof item === "object") {
                                    const nested = Validator.default.validate(item);
                                    if (nested.length > 0) {
                                        ctx.childrenErrors.push({
                                            property: `${propName}[${k}]`,
                                            index: k,
                                            children: nested
                                        });
                                    }
                                }
                            }
                        } else if (typeof val === "object") {
                            const nested = Validator.default.validate(val);
                            if (nested.length > 0) {
                                ctx.childrenErrors.push({
                                    property: propName,
                                    children: nested
                                });
                            }
                        }
                    });
                    continue;
                }

                const strategy = validationStrategies[rule.type];
                if (!strategy) continue;

                const ruleType = rule.type;
                const ruleMessage = options?.message ?? rule.message;

                actions.push((val, ctx) => {
                    if (isEach && Array.isArray(val)) {
                        for (let k = 0; k < val.length; k++) {
                            const res = strategy(val[k], rule, propName);
                            if (res !== null) {
                                ctx.failedRules[ruleType] =
                                    ruleMessage
                                        ? `${ruleMessage} (index: ${k})`
                                        : `${res} (at index ${k})`;
                                break;
                            }
                        }
                    } else {
                        const res = strategy(val, rule, propName);
                        if (res !== null) {
                            ctx.failedRules[ruleType] = ruleMessage ?? res;
                        }
                    }
                });
            }

            executors.push((obj: any, errors: ValidationError[]) => {
                // ❗ symbol-safe property 접근
                const value = obj[prop as keyof typeof obj];

                if ((value === undefined || value === null) && isOptional) return;

                const ctx: ValidationContext = {
                    failedRules: {},
                    childrenErrors: []
                };

                for (let i = 0; i < actions.length; i++) {
                    const action = actions[i];
                    if (action) action(value, ctx);
                }

                const hasFailed = Object.keys(ctx.failedRules).length > 0;
                const hasChildren = ctx.childrenErrors.length > 0;

                if (hasFailed || hasChildren) {
                    const err: ValidationError = { property: propName };
                    if (atLocation) err.at = atLocation;
                    if (hasFailed) err.failedRules = ctx.failedRules;
                    if (hasChildren) err.children = ctx.childrenErrors;
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
