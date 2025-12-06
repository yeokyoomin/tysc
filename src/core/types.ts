export interface ValidationOptions {
    message?: string | undefined;
    each?: boolean | undefined;
    priority?: number | undefined;
}

export interface ValidatorOptions {
    abortEarly?: boolean;
    stripUnknown?: boolean;
}

export interface ValidationRuleTemplate {
    target: Function;
    type: string;
    propertyKey: string | symbol;
    constraints?: any[] | undefined;
    message?: string | undefined;
    options?: ValidationOptions | undefined;
    at?: string | undefined;
}

export interface ValidationError {
    property: string;
    index?: number | undefined;
    failedRules?: { [key: string]: string[] } | null;
    children?: ValidationError[] | null;
    at?: string | undefined;
}

export type ClassConstructor<T> = { new(...args: any[]): T };
export class ValidationException extends Error {
    constructor(public errors: ValidationError[]) {
        super(ValidationException.formatMessage(errors));
        this.name = "ValidationException";
        Object.setPrototypeOf(this, ValidationException.prototype);
    }

    private static formatMessage(errors: ValidationError[]): string {
        if (errors.length === 0) return "Validation Failed";
        const first = errors[0];
        const ruleMsg = first!.failedRules
            ? Object.values(first!.failedRules).flat()[0]
            : "Unknown error";
        return `Validation Failed: ${ruleMsg} (and ${errors.length - 1} more errors)`;
    }
}