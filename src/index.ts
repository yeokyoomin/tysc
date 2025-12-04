export { validate } from "./core/Validators";

export type { ValidationError, ValidationOptions } from "./core/types";

export * from "./decorators";

export { createDecorator } from "./decorators/common";
export { registerStrategy } from "./core/strategies";
export type { ValidationStrategy } from "./core/strategies"