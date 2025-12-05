export interface ValidationOptions {
    message?: string | undefined;
    each?: boolean | undefined;
    priority?: number | undefined;
}

export interface ValidatorOptions {
    abortEarly?: boolean;
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