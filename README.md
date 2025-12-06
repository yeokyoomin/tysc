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

> **Zod-like Developer Experience. Bare-metal Performance.**

`tysc` is a zero-dependency validation library that combines the **convenience of Zod** with the **speed of JIT compilation**.
It allows you to validate raw JSON objects directly, ensuring type safety and high performance without the overhead of manual class instantiation.

---

## ✨ Key Features

- **🚀 Extreme Performance**: Uses JIT compilation, Stack Allocation, and Loop Unrolling to outperform even functional libraries like Zod.
- **🛡️ Direct JSON Validation**: Use `assert()` and `check()` to validate raw JSON directly. No need to manually instantiate classes.
- **💎 Type Guard Support**: `check(User, body)` validates the object and narrows TypeScript type, but does not remove unknown properties.
- **🪶 Zero-Allocation**: No objects are created during the validation of valid data (Lazy Context).
- **📦 Zero Dependencies**: Lightweight (~3KB) and completely bloat-free.

---

## 📦 Installation

```bash
npm install tysc
```

---

## ⚡Quick Start

### 1. Define your DTO

```ts
import { IsString, IsNumber, Min, Max } from "tysc";

class CreateUserDto {
  @IsString({ message: "Username is required" })
  name!: string;

  @IsNumber()
  @Min(18)
  age!: number;
}
```

### 2. Validate & Transform

Use `assert` to validate, strip unknown keys, and transform JSON in one go.

```ts
import { assert, ValidationException } from "tysc";

// Incoming JSON request (unknown type)
const body = { name: "Alice", age: 25, admin: true };

try {
  // 1. Validates data
  // 2. Returns a typed instance of CreateUserDto
  // 3. Optionally strips unknown properties if { stripUnknown: true } is passed
  const user = assert(CreateUserDto, body, { stripUnknown: true });

  console.log(user.name); // Typed as string!
  console.log(user); // CreateUserDto { name: "Alice", age: 25 }
} catch (e) {
  if (e instanceof ValidationException) {
    console.error(e.errors); // Detailed error array
  }
}
```

### 3. Type Guard (Lightweight Check)

Use `check` for simple boolean checks. It uses `abortEarly` internally for maximum speed.

```ts
import { check } from "tysc";

if (check(CreateUserDto, body)) {
  // TypeScript now knows 'body' is CreateUserDto
  console.log(body.age);
}
```

---

## ⚡ Performance Benchmark

Benchmark conducted on **v2.5.0** (1,000,000 iterations).
With **Stack-based Optimization** and **Zero-Allocation** architecture, `tysc` dominates in complex scenarios.

### 🏆 Scenario: Complex Nested Objects (Real-world DTO)

> Deeply nested objects + Arrays + Recursion.

| Library         |    Ops/Sec    |   Relative Speed   |        Note         |
| :-------------- | :-----------: | :----------------: | :-----------------: |
| **tysc** 🚀     | **6,188,961** | **100% (Fastest)** | **Zero-Allocation** |
| **zod**         |   4,572,810   |       73.9%        |     Functional      |
| class-validator |    266,609    |        4.3%        |         OOP         |

> **💡 Insight:**
> For complex data structures, `tysc` is **35% faster than Zod** and **~23x faster than `class-validator`**.

---

### 📦 Scenario: Simple Flat Objects

| Library         |    Ops/Sec     | Relative Speed |
| :-------------- | :------------: | :------------: |
| **zod**         |   25,516,518   |      100%      |
| **tysc** 🚀     | **20,678,246** |     81.0%      |
| class-validator |   1,018,098    |      4.0%      |

> **💡 Note:** Even in simple scenarios, `tysc` processes over **20 million ops/sec**, making it **20x faster** than `class-validator`.

---

## ⚙️ Advanced Features

### Abort Early (Fail-Fast)

Stop validation immediately after finding the first error. Useful for saving resources on large datasets.

```ts
const errors = validate(obj, { abortEarly: true });
```

### Strip Unknown Properties

Secure your API by automatically removing fields that are not decorated in your DTO.

```ts
const body = { name: "Alice", age: 25, admin: true };

const user = assert(CreateUserDto, body, { stripUnknown: true });
```

### Nested Validation

Validate nested objects and arrays of objects easily.

```ts
class Post {
  @IsString()
  title!: string;
}

class User {
  @IsArray()
  @ValidateNested()
  posts!: Post[];
}
```

### Custom Decorators

Register your own high-performance validation logic using `registerStrategy`.

```ts
import { createDecorator, registerStrategy } from "tysc";

// 1. Register Logic
registerStrategy("IsKoreanPhone", (val, rule, prop) => {
  return /^010-\d{4}-\d{4}$/.test(val) ? null : "Invalid format";
});

// 2. Create Decorator
function IsKoreanPhone() {
  return createDecorator("IsKoreanPhone");
}
```

## 📖 API Reference

### Core Functions

`assert(Class, json, options?)`: Validates JSON and returns an instance. Throws `ValidationException` on failure.

`check(Class, json)`: Returns `true` if valid. Acts as a Type Guard.

`validate(instance, options?)`: (Traditional) Validates an existing class instance. Returns `ValidationError[]`.

### Decorators

**Common**: `@IsString`, `@IsNumber`, `@IsBoolean`, `@IsOptional`

**String**: `@IsEmail`, `@Length(min, max)`, `@Matches(regex)`

**Numeric**: `@Min(n)`, `@Max(n)`, `@IsInt`, `@IsPositive`

**Array/Nested**: `@IsArray`, `@ValidateNested`, `@ArrayMinSize`, `@ArrayMaxSize`

## ⚠️ Configuration

To use decorators, you must enable the following settings in your `tsconfig.json`:

```JSON
{
"compilerOptions": {
"experimentalDecorators": true,
"emitDecoratorMetadata": true
}
}
```

## 📄 License

MIT
