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

## 🚀 What's New in v2.0.0? (Major Update)

- **✨ Full Array Support**: Added `{ each: true }` for verifying individual array items.
- **⚡ JIT Compilation**: The validation engine has been rewritten for maximum performance.
- **🛠️ Stability**: Fixed logical inconsistencies in rule execution order and `at` tracking.

---

## ✨ Why Tysc?

- 🚀 **Unrivaled Performance**: **15.2x faster** than `class-validator`. The fastest decorator-based library in existence.
- 📍 **Click-to-Jump Debugging**: Error logs include the exact file path and line number (`at`). Ctrl+Click to jump straight to the code.
- 🪶 **Zero Dependencies**: Ultra-lightweight (~3KB). Perfect for Serverless (AWS Lambda, Cloudflare Workers).
- 🧩 **Nested & Array Validation**: Easily validates complex JSON structures and DTOs.
- 🛠 **Custom Rules**: Define your own validation logic inline without boilerplate.

---

## ⚡ Performance Benchmark

Benchmark conducted on **Intel Core i7-13700F, 10M iterations (v2.0.0)**.

| Library         |    Ops/Sec     | Relative Speed |        Style        |
| :-------------- | :------------: | :------------: | :-----------------: |
| **zod**         |   33,706,554   |     27.3x      | Schema (Functional) |
| **tysc** 🚀     | **18,811,928** |   **15.2x**    | **Decorator (OOP)** |
| class-validator |   1,230,639    |       1x       |   Decorator (OOP)   |

> **🚀 Breaking the Limit:**
> Through **Zero-Allocation Optimization**, `tysc` v2.0.0 is now **~15.2x faster than `class-validator`**.

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
