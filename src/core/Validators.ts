import { storage } from "./Storage";
import { ValidationError, ValidatorOptions } from "./types";
import { validationStrategies } from "./strategies";

type RuleExecutor = (
    val: any,
    context: {
        failedRules: { [key: string]: string[] } | null;
        childrenErrors: ValidationError[] | null;
        abortEarly: boolean;
    }
) => boolean;

type PropExecutor = (
    obj: any,
    errors: ValidationError[],
    abortEarly: boolean
) => void;

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
        const abortEarly = !!options?.abortEarly;

        for (let i = 0; i < executors.length; i++) {
            executors[i]!(target_obj, errors, abortEarly);

            if (abortEarly && errors.length > 0) break;
        }

        return errors;
    }

    private compile(target: Function): PropExecutor[] {
        const rules = storage.getRules(target);
        const rulesByProp = new Map<string | symbol, typeof rules>();
        for (let i = 0; i < rules.length; i++) {
            const r = rules[i];
            if (r) {
                let list = rulesByProp.get(r.propertyKey);
                if (!list) {
                    list = [];
                    rulesByProp.set(r.propertyKey, list);
                }
                list.push(r);
            }
        }

        const executors: PropExecutor[] = [];

        for (const [prop, propRules] of rulesByProp) {
            const propName = String(prop);

            propRules.sort((a, b) => (b.options?.priority ?? 0) - (a.options?.priority ?? 0));

            const isOptional = propRules.some(r => r && r.type === "IsOptional");
            const firstWithAt = propRules.find(r => r && r.at && r.type !== "IsOptional");
            const atLocation = firstWithAt?.at;

            const ruleExecutors: RuleExecutor[] = [];

            for (let i = 0; i < propRules.length; i++) {
                const rule = propRules[i];
                if (!rule || rule.type === "IsOptional") continue;

                const options = rule.options;
                const isEach = options?.each === true;
                const ruleType = rule.type;
                const ruleMessage = options?.message ?? rule.message;

                if (rule.type === "ValidateNested") {
                    ruleExecutors.push((val, ctx) => {
                        if (!val) return false;

                        let shouldStop = false;

                        if (isEach && Array.isArray(val)) {
                            for (let k = 0; k < val.length; k++) {
                                const item = val[k];
                                if (item && typeof item === "object") {
                                    const nested = Validator.default.validate(item, { abortEarly: ctx.abortEarly });
                                    if (nested.length > 0) {
                                        if (!ctx.childrenErrors) ctx.childrenErrors = [];
                                        ctx.childrenErrors.push({
                                            property: `${propName}[${k}]`,
                                            index: k,
                                            children: nested
                                        });
                                        if (ctx.abortEarly) {
                                            shouldStop = true;
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
                                if (ctx.abortEarly) shouldStop = true;
                            }
                        }
                        return shouldStop;
                    });
                    continue;
                }

                const strategy = validationStrategies[ruleType];
                if (!strategy) continue;

                ruleExecutors.push((val, ctx) => {
                    let shouldStop = false;

                    if (isEach && Array.isArray(val)) {
                        for (let k = 0; k < val.length; k++) {
                            let res: string | null = null;
                            try {
                                res = strategy(val[k], rule, propName);
                            } catch (e: any) {
                                res = `Internal validation error: ${e.message}`;
                            }

                            if (res !== null) {
                                if (!ctx.failedRules) ctx.failedRules = {};
                                if (!ctx.failedRules[ruleType]) ctx.failedRules[ruleType] = [];

                                const msg = ruleMessage ? `${ruleMessage} (index: ${k})` : `${res} (at index ${k})`;
                                ctx.failedRules[ruleType].push(msg);

                                if (ctx.abortEarly) {
                                    shouldStop = true;
                                    break;
                                }
                            }
                        }
                    } else {
                        let res: string | null = null;
                        try {
                            res = strategy(val, rule, propName);
                        } catch (e: any) {
                            res = `Internal validation error: ${e.message}`;
                        }

                        if (res !== null) {
                            if (!ctx.failedRules) ctx.failedRules = {};
                            if (!ctx.failedRules[ruleType]) ctx.failedRules[ruleType] = [];

                            const msg = ruleMessage ?? res;
                            ctx.failedRules[ruleType].push(msg);

                            if (ctx.abortEarly) shouldStop = true;
                        }
                    }
                    return shouldStop;
                });
            }

            executors.push((obj: any, errors: ValidationError[], abortEarly: boolean) => {
                const value = obj[prop as keyof typeof obj];
                if ((value === undefined || value === null) && isOptional) return;

                const context = {
                    failedRules: null as { [key: string]: string[] } | null,
                    childrenErrors: null as ValidationError[] | null,
                    abortEarly: abortEarly
                };

                for (let i = 0; i < ruleExecutors.length; i++) {
                    const shouldStop = ruleExecutors[i]!(value, context);
                    if (shouldStop) break;
                }

                if (context.failedRules || context.childrenErrors) {
                    const err: ValidationError = { property: propName };
                    if (atLocation) err.at = atLocation;
                    if (context.failedRules) err.failedRules = context.failedRules;
                    if (context.childrenErrors) err.children = context.childrenErrors;
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