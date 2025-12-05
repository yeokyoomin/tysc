import { storage } from "./Storage";
import { ValidationError, ValidatorOptions } from "./types";
import { validationStrategies } from "./strategies";

type ValidationContext = {
    failedRules: { [key: string]: string[] } | null;
    childrenErrors: ValidationError[] | null;
    shouldStop: boolean;
    abortEarly: boolean;
};

type ValidationAction = (value: any, context: ValidationContext) => void;
type PropExecutor = (obj: any, errors: ValidationError[], options?: ValidatorOptions) => void;

export class Validator {
    private static instance: Validator;

    static get default(): Validator {
        if (!Validator.instance) {
            Validator.instance = new Validator();
        }
        return Validator.instance;
    }

    private static cache = new Map<Function, PropExecutor[]>();

    validate<T extends object>(target_obj: T, options?: ValidatorOptions): ValidationError[] {
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
            if (options?.abortEarly && errors.length > 0) break;
            if (exec) exec(target_obj, errors, options);
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

            propRules.sort((a, b) => (b.options?.priority ?? 0) - (a.options?.priority ?? 0));

            const isOptional = propRules.some(r => r && r.type === "IsOptional");
            const firstWithAt = propRules.find(r => r && r.at && r.type !== "IsOptional");
            const atLocation = firstWithAt?.at;

            const actions: ValidationAction[] = [];

            for (let i = 0; i < propRules.length; i++) {
                const rule = propRules[i];
                if (!rule || rule.type === "IsOptional") continue;

                const options = rule.options;
                const isEach = options?.each === true;
                const ruleType = rule.type;
                const ruleMessage = options?.message ?? rule.message;

                if (rule.type === "ValidateNested") {
                    actions.push((val, ctx) => {
                        if (ctx.shouldStop) return;
                        if (!val) return;

                        if (isEach && Array.isArray(val)) {
                            for (let k = 0; k < val.length; k++) {
                                const item = val[k];
                                if (item && typeof item === "object") {
                                    if (ctx.shouldStop) break;

                                    const nested = Validator.default.validate(item, { abortEarly: ctx.abortEarly });

                                    if (nested.length > 0) {
                                        if (!ctx.childrenErrors) ctx.childrenErrors = [];
                                        ctx.childrenErrors.push({
                                            property: `${propName}[${k}]`,
                                            index: k,
                                            children: nested
                                        });
                                        if (ctx.abortEarly) {
                                            ctx.shouldStop = true;
                                            break;
                                        }
                                    }
                                }
                            }
                        } else if (typeof val === "object") {
                            const nested = Validator.default.validate(val, { abortEarly: ctx.abortEarly });
                            if (nested.length > 0) {
                                if (!ctx.childrenErrors) ctx.childrenErrors = [];
                                ctx.childrenErrors.push(...nested);
                                if (ctx.abortEarly) ctx.shouldStop = true;
                            }
                        }
                    });
                    continue;
                }

                const strategy = validationStrategies[ruleType];
                if (!strategy) continue;

                actions.push((val, ctx) => {
                    if (ctx.shouldStop) return;

                    const safeStrategy = (v: any, r: any, p: string) => {
                        try {
                            return strategy(v, r, p);
                        } catch (e: any) {
                            return `Internal validation error: ${e.message}`;
                        }
                    };

                    if (isEach && Array.isArray(val)) {
                        for (let k = 0; k < val.length; k++) {
                            const res = safeStrategy(val[k], rule, propName);
                            if (res !== null) {
                                if (!ctx.failedRules) ctx.failedRules = {};
                                if (!ctx.failedRules[ruleType]) ctx.failedRules[ruleType] = [];

                                const msg = ruleMessage
                                    ? `${ruleMessage} (index: ${k})`
                                    : `${res} (at index ${k})`;

                                ctx.failedRules[ruleType].push(msg);
                                if (ctx.abortEarly) {
                                    ctx.shouldStop = true;
                                    break;
                                }
                            }
                        }
                    } else {
                        const res = safeStrategy(val, rule, propName);
                        if (res !== null) {
                            if (!ctx.failedRules) ctx.failedRules = {};
                            if (!ctx.failedRules[ruleType]) ctx.failedRules[ruleType] = [];

                            const msg = ruleMessage ?? res;
                            ctx.failedRules[ruleType].push(msg);
                            if (ctx.abortEarly) ctx.shouldStop = true;
                        }
                    }
                });
            }

            executors.push((obj: any, errors: ValidationError[], opts?: ValidatorOptions) => {
                if (opts?.abortEarly && errors.length > 0) return;

                const value = obj[prop as keyof typeof obj];
                if ((value === undefined || value === null) && isOptional) return;

                const ctx: ValidationContext = {
                    failedRules: null,
                    childrenErrors: null,
                    shouldStop: false,
                    abortEarly: !!opts?.abortEarly
                };

                for (let i = 0; i < actions.length; i++) {
                    const action = actions[i];
                    if (action) {
                        action(value, ctx);
                        if (ctx.shouldStop) break;
                    }
                }

                if (ctx.failedRules || ctx.childrenErrors) {
                    const err: ValidationError = { property: propName };
                    if (atLocation) err.at = atLocation;
                    if (ctx.failedRules) err.failedRules = ctx.failedRules;
                    if (ctx.childrenErrors) err.children = ctx.childrenErrors;
                    errors.push(err);
                }
            });
        }

        return executors;
    }
}

export function validate<T extends object>(obj: T, options?: ValidatorOptions) {
    return Validator.default.validate(obj, options);
}