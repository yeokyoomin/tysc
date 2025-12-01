<div align="center">

# Tysc

**Zero-dependency TypeScript Validation Library**

[![npm version](https://img.shields.io/npm/v/tysc?color=blue&style=flat-square)](https://www.npmjs.com/package/tysc)
[![dependencies](https://img.shields.io/badge/dependencies-0-brightgreen?style=flat-square)](https://packagephobia.com/result?p=tysc)
[![license](https://img.shields.io/npm/l/tysc?style=flat-square)](https://github.com/your-id/tysc/blob/main/LICENSE)
[![size](https://img.shields.io/bundlephobia/minzip/tysc?style=flat-square&color=orange)](https://bundlephobia.com/package/tysc)

</div>

<br/>

> **Validation made simple. Debugging made instant.**

`tysc` is a lightweight, decorator-based validation library for TypeScript.
Unlike other libraries, `tysc` has **Zero Dependencies** and provides **Source Location Tracking (`at`)** to help you debug errors instantly.

---

## ✨ Features

- 🪶 **Zero Dependencies**: Ultra-lightweight. Perfect for Serverless (AWS Lambda, Cloudflare Workers).
- 📍 **Click-to-Jump Debugging**: Error logs include the exact file path and line number (`at`).
- 🎨 **Modern Decorators**: Clean, OOP-style validation logic.
- 🧩 **Nested Validation**: Validates complex objects recursively.
- 🛠 **Custom Rules**: Define your own validation logic inline.

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

## 2. Custom Logic (`@Custom`)

Create your own validation rules instantly without boilerplate.

```ts
import { Custom } from "tysc";

class Post {
  @Custom((val) => val.includes("#"), { message: "Must contain a hashtag" })
  content: string;
}
```

---

## 📖 API Reference

### Common

- `@IsString(options?)`: Checks if the value is a string.

* `@IsNumber(options?)`: Checks if the value is a number.

* `@IsBoolean(options?)`: Checks if the value is a boolean (true/false).

### Numeric

- `@Min(min: number, options?)`: Checks if number is >= min.

- `@Max(max: number, options?)`: Checks if number is <= max.

- `@IsInt(options?)`: Checks if number is an integer.

- `@IsPositive(options?)`: Checks if number is > 0.

### Advanced

- `@ValidateNested()`: Recursively validates child objects.

- `@Custom(validatorFn, options?)`: Runs a custom validation function.

- `@IsOptional()`: Perform inspections selectively.

---

## 📄 License

MIT
