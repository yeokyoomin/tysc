import { ValidationRuleTemplate } from "./types";

export type ValidationStrategy = (value: any, rule: ValidationRuleTemplate, prop: string) => string | null;

const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const getConstraint = (rule: ValidationRuleTemplate, index: number, def: any = undefined) => {
    return (rule.constraints && rule.constraints[index] !== undefined) ? rule.constraints[index] : def;
};

export const validationStrategies: Record<string, ValidationStrategy> = {
    IsString: (value, rule, prop) =>
        typeof value === 'string' ? null : `${prop} must be a string`,

    IsNumber: (value, rule, prop) => {
        if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
            return `${prop} must be a valid number`;
        }
        return null;
    },

    IsBoolean: (value, rule, prop) =>
        typeof value === 'boolean' ? null : `${prop} must be a boolean`,

    IsArray: (value, rule, prop) =>
        Array.isArray(value) ? null : `${prop} must be an array`,

    IsPositive: (value, rule, prop) =>
        (typeof value === 'number' && value > 0) ? null : `${prop} must be a positive number`,

    IsInt: (value, rule, prop) =>
        (typeof value === 'number' && Number.isInteger(value)) ? null : `${prop} must be an integer`,

    Min: (value, rule, prop) => {
        const min = getConstraint(rule, 0, 0);
        return (typeof value === 'number' && value >= min)
            ? null
            : `${prop} must be at least ${min}`;
    },

    Max: (value, rule, prop) => {
        const max = getConstraint(rule, 0, 0);
        return (typeof value === 'number' && value <= max)
            ? null
            : `${prop} must be at most ${max}`;
    },

    Length: (value, rule, prop) => {
        if (typeof value !== 'string') return `${prop} must be a string`;

        const min = getConstraint(rule, 0, 0);
        const max = getConstraint(rule, 1, Infinity);

        if (value.length < min || value.length > max) {
            if (max === Infinity) return `${prop} must be longer than or equal to ${min} characters`;
            return `${prop} must be between ${min} and ${max} characters`;
        }
        return null;
    },

    Matches: (value, rule, prop) => {
        if (typeof value !== 'string') return `${prop} must be a string`;
        const pattern = getConstraint(rule, 0);

        if (!(pattern instanceof RegExp)) return `${prop} validation configuration error`;

        return pattern.test(value) ? null : `${prop} format is invalid`;
    },

    IsEmail: (value, rule, prop) =>
        (typeof value === 'string' && emailRegex.test(value))
            ? null
            : `${prop} must be a valid email address`,

    ArrayMinSize: (value, rule, prop) => {
        if (!Array.isArray(value)) return `${prop} must be an array`;
        const min = getConstraint(rule, 0, 0);
        return value.length >= min
            ? null
            : `${prop} must contain at least ${min} elements`;
    },

    ArrayMaxSize: (value, rule, prop) => {
        if (!Array.isArray(value)) return `${prop} must be an array`;
        const max = getConstraint(rule, 0, Infinity);
        return value.length <= max
            ? null
            : `${prop} must contain no more than ${max} elements`;
    }
};

export function registerStrategy(name: string, strategy: ValidationStrategy) {
    if (Object.prototype.hasOwnProperty.call(validationStrategies, name)) {
        console.warn(`[Validator] Strategy '${name}' is being overwritten.`);
    }
    validationStrategies[name] = strategy;
}