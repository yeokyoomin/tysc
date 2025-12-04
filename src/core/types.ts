export interface ValidationOptions {
    message?: string | undefined;
    each?: boolean | undefined;
}

export interface ValidationRuleTemplate {
    target: Function;
    type: string;
    propertyKey: string;
    constraints?: any[] | undefined;
    message?: string | undefined;
    options?: ValidationOptions | undefined;
    at?: string | undefined;
}

export interface ValidationError {
    property: string;
    index?: number | undefined;
    failedRules?: { [key: string]: string } | undefined;
    children?: ValidationError[] | undefined;
    at?: string | undefined;
}