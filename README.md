<div align="center">

# tysc

> **The World's Fastest Decorator-based Validation Library for TypeScript.**

[![npm version](https://img.shields.io/npm/v/tysc?color=blue&style=flat-square)](https://www.npmjs.com/package/tysc)
[![dependencies](https://img.shields.io/badge/dependencies-0-brightgreen?style=flat-square)](https://packagephobia.com/result?p=tysc)
[![license](https://img.shields.io/npm/l/tysc?style=flat-square)](https://github.com/yeokyoomin/tysc/blob/main/LICENSE)
[![size](https://img.shields.io/bundlephobia/minzip/tysc?style=flat-square&color=orange)](https://bundlephobia.com/package/tysc)
[![codecov](https://codecov.io/gh/yeokyoomin/tysc/branch/main/graph/badge.svg)](https://codecov.io/gh/yeokyoomin/tysc)

</div>

<br/>

> **Validation made simple. Debugging made instant.**

`tysc` is a lightweight, decorator-based validation library for TypeScript.
Unlike other libraries, `tysc` has **Zero Dependencies** and provides **Source Location Tracking (`at`)** to help you debug errors instantly.

---

## 🚀 What's New in v2.4.2? (Stability & Precision)

- 🚑 **Critical Fix for `abortEarly`**: Resolved a logic issue where enabling `abortEarly` caused validation to skip entirely. The validator now correctly executes strategies and stops **immediately after** the first error is detected.
- ✨ **Nested Error Flattening**: Improved error reporting for single nested objects. Errors are now mapped directly to their properties without redundant wrapping (e.g., `meta -> name` instead of `meta -> meta -> name`).
- 🛡️ **Context State Isolation**: Refactored internal `ValidationContext` to strictly separate user configuration (`abortEarly`) from runtime state (`shouldStop`), ensuring 100% stability in complex recursive validations.
- ⚡ **Performance Retained**: All fixes maintain the **Zero-Allocation** architecture introduced in v2.4.2.

---

## ✨ Why Tysc?

- 🚀 **Extreme Performance**: Uses JIT compilation and Singleton architecture to minimize memory overhead.
- 🪶 **Zero-Allocation**: No objects are created during the validation of valid data.
- 🧩 **Safe & Robust**: Handles `Symbol` keys safely and wraps strategies in error boundaries.
- 🛠 **Developer Friendly**: Supports `abortEarly`, rule priorities, and detailed error reporting.
- 🪶 **Zero Dependencies**: Lightweight and bloat-free.

---

## 📦 Installation

```bash
npm install tysc
```

---

## ⚡ Performance Benchmark

Benchmark conducted on **v2.4.0** (1,000,000 iterations).
Thanks to **Lazy Allocation** and **Singleton Architecture**, `tysc` outperforms `zod` in complex, real-world scenarios.

### 🏆 Scenario: Complex Nested Objects (Real-world DTO)

> Deeply nested objects + Arrays + Recursion.

| Library         |    Ops/Sec    |   Relative Speed   |        Note         |
| :-------------- | :-----------: | :----------------: | :-----------------: |
| **tysc** 🚀     | **5,177,232** | **100% (Fastest)** | **Zero-Allocation** |
| **zod**         |   4,764,749   |       92.0%        |     Functional      |
| class-validator |    289,808    |        5.6%        |         OOP         |

> **💡 Insight:**
> For complex data structures, `tysc` is **faster than Zod** and **~18x faster than `class-validator`**.

---

### 📦 Scenario: Simple Flat Objects

| Library         |    Ops/Sec     | Relative Speed |
| :-------------- | :------------: | :------------: |
| **zod**         |   27,211,846   |      100%      |
| **tysc** 🚀     | **16,564,024** |     60.9%      |
| class-validator |   1,082,037    |      4.0%      |

> **💡 Note:** Even in simple scenarios, `tysc` maintains **~16x speed advantage** over `class-validator`.

---

## ⚠️ Important: Configuration

To use decorators, you must enable the following settings in your tsconfig.json:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

---

## ⚡ Quick Start

### 1. Define your DTO

```ts
import { IsString, IsNumber, Min, Max, validate } from "tysc";

class CreateUserDto {
  @IsString({ message: "Username is required" })
  username: string;

  @IsNumber()
  @Min(18, { message: "You must be at least 18 years old" })
  @Max(100)
  age: number;

  constructor(username: string, age: number) {
    this.username = username;
    this.age = age;
  }
}
```

### 2. Validate & Debug Instantly

```ts
const dto = new CreateUserDto("admin", 15); // Invalid age (15 < 18)
const errors = validate(dto);

if (errors.length > 0) {
  console.log(JSON.stringify(errors, null, 2));
}
```

### Output:

```json
[
  {
    "property": "age",
    "at": "src/dto/create-user.dto.ts:9:3",  <-- Ctrl+Click to jump here! 🖱️
    "failedRules": {
      "Min": ["You must be at least 18 years old"]
    }
  }
]
```

---

## 📚 Real-world Examples

### 1. Complex API Request Body

Validate nested objects and arrays in a single pass.

```ts
import {
  IsString,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsOptional,
} from "tysc";

class Tag {
  @IsString()
  name!: string;
}

class CreatePostDto {
  @IsString()
  title!: string;

  @IsOptional() // If null/undefined, validation is skipped
  @IsString()
  description?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested() // Validates each Tag object in the array
  tags!: Tag[];
}
```

### 2. Custom Logic with Inline Validation

No need to create separate constraint classes. Just pass a function.

```ts
import { Custom } from "tysc";

class CouponDto {
  @Custom((code) => code.startsWith("PROMO_"), {
    message: "Invalid promo code format",
  })
  code!: string;
}
```

---

## 🛠️ Creating Custom Decorators

You can register your own high-performance validation logic using `registerStrategy`.
Your custom rules will run as fast as built-in rules thanks to the JIT engine.

### Example: Reusable Phone Validator

```typescript
import { createDecorator, registerStrategy, ValidationOptions } from "tysc";

// 1. Register Logic (Global)
registerStrategy("IsKoreanPhone", (value, rule, prop) => {
  const regex = /^010-\d{4}-\d{4}$/;
  if (typeof value !== "string") return `${prop} must be a string`;
  return regex.test(value) ? null : `${prop} format is invalid`;
});

// 2. Create Decorator
export function IsKoreanPhone(options?: ValidationOptions) {
  return createDecorator("IsKoreanPhone", [], options);
}

// 3. Use it!
class User {
  @IsKoreanPhone()
  phone: string;
}

//
```

- Pro Tip: For simple inline logic, use @Custom:

```ts
import { Custom } from "tysc";

class User {
  @Custom((val) => val.startsWith("USER_"), {
    message: "Must start with USER_",
  })
  id: string;
}
```

---

## ⚙️ Advanced Options

### Abort Early (Fail-Fast)

Stop validation immediately after finding the first error. Useful for large datasets.

```ts
const errors = validate(largeObject, { abortEarly: true });
```

### Rule Priority

Control the order of validation execution.

```ts
class User {
  @IsString({ priority: 10 }) // Checks type first (Priority 10)
  @Length(5, 20, { priority: 5 }) // Then checks length (Priority 5)
  username!: string;
}
```

---

## 📖 API Reference

### Common

- `@IsString(options?)`: Checks if the value is a string.

- `@IsNumber(options?)`: Checks if the value is a number.

- `@IsBoolean(options?)`: Checks if the value is a boolean.

- `@IsOptional(options?)`: Skips validation if the value is null or undefined.

### String

- `@IsEmail(options?)`: Checks if the string is a valid email.

- `@Length(min, max, options?)`: Checks string length.

- `@Matches(regex, options?)`: Checks if string matches the pattern.

### Numeric

- `@Min(min, options?)`: Checks if number is >= min.

- `@Max(max, options?)`: Checks if number is <= max.

- `@IsInt(options?)`: Checks if number is an integer.

- `@IsPositive(options?)`: Checks if number is > 0.

### Array & Nested

- `@IsArray(options?)`: Checks if the value is an array.

- `@ArrayMinSize(min, options?)`: Checks array length >= min.

- `@ArrayMaxSize(max, options?)`: Checks array length <= max.

- `@ValidateNested()`: Recursively validates child objects (or arrays of objects).

### Utility

- `@Custom(fn, options?)`: Runs a custom validation function.

---

## 🤝 Contributing

Contributions are welcome!

- Fork the repository.

- Create a feature branch (`git checkout -b feature/amazing-feature`).

- Commit your changes (`git commit -m 'Add some amazing feature'`).

- Push to the branch (`git push origin feature/amazing-feature`).

- Open a Pull Request.

---

## 📄 License

MIT
