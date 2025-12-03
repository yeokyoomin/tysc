<div align="center">

# Tysc

**Zero-dependency TypeScript Validation Library**

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

## 🚀 What's New in v1.3.2?

- **⚡ Performance Boost**: Performance has been improved by modifying the validator structure. For details, please check the Benchmark tab.

---

## ✨ Features

- 🪶 **Zero Dependencies**: Ultra-lightweight. Perfect for Serverless (AWS Lambda, Cloudflare Workers).
- 📍 **Click-to-Jump Debugging**: Error logs include the exact file path and line number (`at`).
- 🎨 **Modern Decorators**: Clean, OOP-style validation logic.
- 🧩 **Nested Validation**: Validates complex objects recursively.
- 🛠 **Custom Rules**: Define your own validation logic inline.

---

## ⚡ Performance Benchmark

Benchmark conducted on **Intel Core i7-13700F, 10M iterations (v1.3.2)**.

| Library         |    Ops/Sec     | Relative Speed |        Style        |
| :-------------- | :------------: | :------------: | :-----------------: |
| **zod**         |   33,706,554   |     27.3x      | Schema (Functional) |
| **tysc** 🚀     | **18,811,928** |   **15.2x**    | **Decorator (OOP)** |
| class-validator |   1,230,639    |       1x       |   Decorator (OOP)   |

> **🚀 Breaking the Limit:**
> Through **Zero-Allocation Optimization**, `tysc` v1.3.2 is now **~15.2x faster than `class-validator`**.

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

### 1. Define your Class

```ts
import { IsString, IsNumber, Min, Max, validate } from "tysc";

class User {
  @IsString({ message: "Name must be a string" })
  username: string;

  @IsNumber()
  @Min(18)
  @Max(100)
  age: number;

  constructor(username: string, age: number) {
    this.username = username;
    this.age = age;
  }
}
```

### 2. Validate Data

```ts
const user = new User("admin", 15); // Invalid age
const errors = validate(user);

if (errors.length > 0) {
  console.log("Validation Failed:", errors);
} else {
  console.log("Validation Passed!");
}
```

---

## 📌 Source Tracking (at)

`tysc` tells you exactly where the validation rule was defined. In VS Code, you can Ctrl + Click the path to jump directly to the code!

```json
[
  {
    "property": "age",
    "at": "C:\\Projects\\my-app\\src\\dto\\user.ts:12:3",  <-- Click here!
    "failedRules": {
      "Min": "age must be at least 18"
    }
  }
]
```

---

## 📚 Advanced Usage

### 1. Nested Objects (`@ValidateNested`)

Validate objects inside objects.

```ts
import { ValidateNested, IsString } from "tysc";

class Profile {
  @IsString()
  bio: string;
}

class User {
  @ValidateNested()
  profile: Profile;
}
```

### 2. Custom Logic (`@Custom`)

Create your own validation rules instantly without boilerplate.

```ts
import { Custom } from "tysc";

class Post {
  @Custom((val) => val.includes("#"), { message: "Must contain a hashtag" })
  content: string;
}
```

### 3. Arrays (`@IsArray`)

Validate lists of items.

```ts
import { IsArray, ArrayMinSize, IsString } from "tysc";

class Post {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  tags: string[];
}
```

### 4. Optional Fields (`@IsOptional`)

skip validation if the value is `null` or `undefined`.

```ts
import { IsOptional, IsString } from "tysc";

class User {
  @IsString()
  name: string; // Required

  @IsOptional()
  @IsString()
  bio?: string; // Optional
}
```

---

## ⚙️ Validation Options

All decorators accept an optional `options` object as the **last argument**.

### `message` (string)

You can overwrite the default error message with your own.

```typescript
// 1. Decorator without arguments
@IsString({ message: "The name is a required field and must be a string." })
username: string;

// 2. Decorator with arguments
@Min(18, { message: "Minors are not eligible to join." })
age: number;

// 3. Custom Validator
@Custom(val => val > 0, { message: "The value must be greater than zero." })
value: number;
```

---

## 📖 API Reference

### Common

- `@IsString(options?)`: Checks if the value is a string.

* `@IsNumber(options?)`: Checks if the value is a number.

* `@IsBoolean(options?)`: Checks if the value is a boolean (true/false).

* `@IsOptional(options?)`: Skips validation if value is null or undefined.

### Numeric

- `@Min(min: number, options?)`: Checks if number is >= min.

- `@Max(max: number, options?)`: Checks if number is <= max.

- `@IsInt(options?)`: Checks if number is an integer.

- `@IsPositive(options?)`: Checks if number is > 0.

### String

- `@IsEmail(options?)`: Checks if the string is an email.

- `@Length(min, max, options?)`: Checks string length.

- `@Matches(regex, options?)`: Checks if string matches tha pattern.

### Array

- `@IsArray(options?)`: Checks if the value is an array.

- `@ArrayMinSize(min:number, options?)`: Checks array length >= min.

- `@ArrayMaxSize(max:number, options?)`: Checks array length <= max.

### Advanced

- `@ValidateNested()`: Recursively validates child objects.

- `@Custom(validatorFn, options?)`: Runs a custom validation function.

---

## 📄 License

MIT
