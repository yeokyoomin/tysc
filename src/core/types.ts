export type ValidationError = {
    property: string;
    at?: string;
    failedRules?: { [rule: string]: string };
    children?: ValidationError[];
}

export type ValidationRuleTemplate = {
    target: object;
    propertyKey: string;
    type: string;
    constraints?: any[] | undefined;
    message?: string | undefined;
    at?: string;
}