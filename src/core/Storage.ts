import { ValidationRuleTemplate } from "./types"

class Storage {
    private rules = new Map<Function, ValidationRuleTemplate[]>();

    addRule(params: ValidationRuleTemplate): void {
        const target = params.target;

        let targetRules = this.rules.get(target);

        if (!targetRules) {
            targetRules = [];
            this.rules.set(target, targetRules);
        }

        targetRules.push(params);
    }

    getRules(target: Function): ValidationRuleTemplate[] {
        return this.rules.get(target) || [];
    }
}

export const storage = new Storage();