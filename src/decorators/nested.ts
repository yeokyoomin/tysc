import { storage } from "../core/Storage"

export function ValidateNested() {
    return function (target: Object, propertyKey: string) {
        storage.addrule({
            target: target.constructor,
            propertyKey,
            type: "ValidateNested"
        })
    }
}