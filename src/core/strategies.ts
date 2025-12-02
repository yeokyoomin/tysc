import { ValidationRuleTemplate } from "./types";

type ValidationStrategy = (value: any, rule: ValidationRuleTemplate, prop: string) => string | null;

export const validationStrategies: Record<string, ValidationStrategy> = {
    IsString: (value, rule, prop) => 
        typeof value === 'string' ? null : `${prop} must be a string`,

    IsNumber: (value, rule, prop) => 
        typeof value === 'number' ? null : `${prop} must be a number`,

    IsBoolean: (value, rule, prop) => 
        typeof value === 'boolean' ? null : `${prop} must be a boolean`,

    IsPositive: (value, rule, prop) => 
        typeof value === 'number' && value > 0 ? null : `${prop} must be a positive number`,

    IsInt: (value, rule, prop) => 
        typeof value === 'number' && Number.isInteger(value) ? null : `${prop} must be an integer`,

    IsEmail: (value, rule, prop) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return typeof value === 'string' && emailRegex.test(value) 
            ? null 
            : `${prop} must be a valid email address`;
    },

    IsArray: (value, rule, prop) => 
        Array.isArray(value) ? null : `${prop} must be an array`,

    Min: (value, rule, prop) => {
        const [min] = rule.constraints || [0];
        return typeof value === 'number' && value >= min 
            ? null 
            : `${prop} must be at least ${min}`;
    },

    Max: (value, rule, prop) => {
        const [max] = rule.constraints || [0];
        return typeof value === 'number' && value <= max 
            ? null 
            : `${prop} must be at most ${max}`;
    },

    Length: (value, rule, prop) => {
        const [min, max] = rule.constraints || [0, 0];
        return typeof value === 'string' && value.length >= min && value.length <= max
            ? null 
            : `${prop} must be between ${min} and ${max} characters`;
    },

    Matches: (value, rule, prop) => {
        const [pattern] = rule.constraints || [];
        return typeof value === 'string' && pattern instanceof RegExp && pattern.test(value)
            ? null
            : `${prop} format is invalid`;
    },

    ArrayMinSize: (value, rule, prop) => {
        const [min] = rule.constraints || [0];
        return Array.isArray(value) && value.length >= min
            ? null
            : `${prop} must contain at least ${min} elements`;
    },

    ArrayMaxSize: (value, rule, prop) => {
        const [max] = rule.constraints || [0];
        return Array.isArray(value) && value.length <= max
            ? null
            : `${prop} must contain no more than ${max} elements`;
    },

    Custom: (value, rule, prop) => {
        const [validatorFn] = rule.constraints || [];
        try {
            if (typeof validatorFn === 'function' && validatorFn(value)) {
                return null;
            }
        } catch {}
        return `${prop} failed custom validation`;
    }
};