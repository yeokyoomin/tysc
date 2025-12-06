import { storage } from "../core/Storage";
import { ClassConstructor } from "../core/types";

const keysCache = new Map<Function, Set<string | symbol>>();

export function getAllowedKeys(cls: Function): Set<string | symbol> {
    let keys = keysCache.get(cls);
    if (!keys) {
        const rules = storage.getRules(cls);
        keys = new Set(rules.map(r => r.propertyKey));
        keysCache.set(cls, keys);
    }
    return keys;
}

export function plainToInstance<T extends object>(
    cls: ClassConstructor<T>,
    plain: any,
    stripUnknown: boolean
): T {
    const instance = Object.create(cls.prototype);

    if (stripUnknown) {
        const allowedKeys = getAllowedKeys(cls);

        for (const key of allowedKeys) {
            const propName = key as string;
            if (plain[propName] !== undefined) {
                instance[propName] = plain[propName];
            }
        }
    } else {
        Object.assign(instance, plain);
    }

    return instance;
}