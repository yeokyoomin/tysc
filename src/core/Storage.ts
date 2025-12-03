import { ValidationRuleTemplate } from "./types"

class Storage {
    private rules: ValidationRuleTemplate[] = [];
    addRule(params: ValidationRuleTemplate): unknown {
        return this.rules.push(params)
    }
    getRules(target: Function): ValidationRuleTemplate[] {
        return this.rules.filter(rule => rule.target === target)
    }
}

export const storage = new Storage()