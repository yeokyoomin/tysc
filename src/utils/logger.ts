import { ValidationError } from "../core/types";

export function printErrors(errors: ValidationError[]) {
    if (errors.length === 0) {
        console.log("\x1b[32m%s\x1b[0m", "✅ Validation Passed!");
        return;
    }

    console.log("\x1b[31m%s\x1b[0m", `🚨 Found ${errors.length} validation errors:`);

    errors.forEach((err, index) => {
        console.log(`\n--------------------------------------------------`);
        console.log(`❌ Error #${index + 1} in property: \x1b[33m${err.property}\x1b[0m`);

        if (err.at) {
            console.log(`📍 Location: \x1b[36m\x1b[4m${err.at}\x1b[0m`);
        }

        if (err.failedRules) {
            Object.entries(err.failedRules).forEach(([rule, msg]) => {
                console.log(`   - [${rule}]: ${msg}`);
            });
        }

        if (err.children) {
            console.log(`   ⬇️  Nested Errors inside '${err.property}':`);
            printErrors(err.children);
        }
    });
    console.log(`--------------------------------------------------\n`);
}