<div align="center">

# Tysc

**The World's Fastest Decorator-based Validation Library**

[![npm version](https://img.shields.io/npm/v/tysc?color=blue&style=flat-square)](https://www.npmjs.com/package/tysc)  
[![dependencies](https://img.shields.io/badge/dependencies-0-brightgreen?style=flat-square)](https://packagephobia.com/result?p=tysc)
[![license](https://img.shields.io/npm/l/tysc?style=flat-square)](https://github.com/yeokyoomin/tysc/blob/main/LICENSE)
[![size](https://img.shields.io/bundlephobia/minzip/tysc?style=flat-square&color=orange)](https://bundlephobia.com/package/tysc)

</div>

<br/>

> **Validation made simple. Debugging made instant.**

`tysc` is a lightweight, decorator-based validation library for TypeScript.
Unlike other libraries, `tysc` has **Zero Dependencies** and provides **Source Location Tracking (`at`)** to help you debug errors instantly.

---

## 🚀 What's New in v2.2.0? (Architectural Polish)
- 💎 **Singleton Architecture**: The Validator engine has been refactored to use a **Singleton pattern**. Nested validations (`@ValidateNested`) now reuse the existing instance, achieving Zero-Allocation even for deep complex objects.

- 📊 **Precise Array Error Tracking**: Array validation errors now include an `index` property and formatted paths (e.g., `tags[1]`), making it easier to pinpoint errors in UI/Frontend.

- 🛡️ **Robust Option Parsing**: Fixed internal logic to explicitly read `rule.options`, ensuring 100% reliability for options like `{ each: true }`.

- ✅ **Strict Mode Compatibility**: Resolved all `TS(2722)` and `possibly undefined` errors. Fully compatible with TypeScript `strict: true`.

---

## ✨ Why Tysc?

- 🚀 **Unrivaled Performance**: **15.2x faster** than `class-validator`. The fastest decorator-based library in existence.
- 📍 **Click-to-Jump Debugging**: Error logs include the exact file path and line number (`at`). Ctrl+Click to jump straight to the code.
- 🪶 **Zero Dependencies**: Ultra-lightweight (~3KB). Perfect for Serverless (AWS Lambda, Cloudflare Workers).
- 🧩 **Nested & Array Validation**: Easily validates complex JSON structures and DTOs.
- 🛠 **Custom Rules**: Define your own validation logic inline without boilerplate.

---

## ⚡ Performance Benchmark

Benchmark conducted on two different environments.

### 1. High-End Environment (i7-13700F)
> **Tested on v2.0.0** (10M iterations)

| Library         |    Ops/Sec     | Relative Speed |
| :-------------- | :------------: | :------------: |
| **zod** |   33,706,554   |     27.3x      |
| **tysc** 🚀     | **18,811,928** |   **15.2x** |
| class-validator |   1,230,639    |       1x       |

### 2. Low-Spec Environment (Pentium Gold 6500Y, 4GB RAM)
> **Tested on v2.2.0** (1M iterations)
> Even on limited hardware, `tysc` maintains **Zod-like performance** due to its **Zero-Allocation** architecture.

| Library         |   Ops/Sec   |        Note         |
| :-------------- | :---------: | :-----------------: |
| **zod** |  3,541,333  | Functional (Schema) |
| **tysc** 🚀     | **3,289,613** | **OOP (Decorator)** |
| class-validator |   351,623   |   OOP (Decorator)   |

> **💡 Insight:**
> On low-end devices, `tysc` is **~9.3x faster** than `class-validator` and performs nearly identically to `zod`. This proves that `tysc` is highly optimized for memory-constrained environments like **AWS Lambda** or **Edge functions**.

---

## 📦 Installation

```bash
npm install tysc
```

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

## 🚀 Quick Start

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
      "Min": "You must be at least 18 years old"
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
  name: string;
}

class CreatePostDto {
  @IsString()
  title: string;

  @IsOptional() // If null/undefined, validation is skipped
  @IsString()
  description?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested() // Validates each Tag object in the array
  tags: Tag[];
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
  code: string;
}
```

### 3. Array Validation (each: true)
Validate every item in an array without creating a wrapper class.

```ts
class Post {
    @IsString({ each: true }) // Checks if every item is a string
    tags: string[];
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
    if (typeof value !== 'string') return `${prop} must be a string`;
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
    @Custom((val) => val.startsWith("USER_"), { message: "Must start with USER_" })
    id: string;
}
```

---

## ⚙️ Decorator Options

All decorators accept an optional options object as the last argument.

```ts
interface ValidationOptions {
  message?: string; // Custom error message
  // ... more options coming soon
}
```

### Examples

```ts
// 1. Custom Message
@IsString({ message: "Please enter a valid name" })

// 2. Array Validation
@IsString({ each: true }) // Validates that every item in the array is a string
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
