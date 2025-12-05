<div align="center">

# tysc

> **The World's Fastest Decorator-Based Validation Library for TypeScript**

[![npm version](https://img.shields.io/npm/v/tysc?color=blue&style=flat-square)](https://www.npmjs.com/package/tysc)
[![dependencies](https://img.shields.io/badge/dependencies-0-brightgreen?style=flat-square)](https://packagephobia.com/result?p=tysc)
[![license](https://img.shields.io/npm/l/tysc?style=flat-square)](https://github.com/yeokyoomin/tysc/blob/main/LICENSE)
[![size](https://img.shields.io/bundlephobia/minzip/tysc?style=flat-square&color=orange)](https://bundlephobia.com/package/tysc)
[![codecov](https://codecov.io/gh/yeokyoomin/tysc/branch/main/graph/badge.svg)](https://codecov.io/gh/yeokyoomin/tysc)

</div>

---

## 🚀 Why Tysc?

- ⚡ **Extreme Performance**: JIT-based execution strategy delivers optimal speed even with complex DTOs.
- 🪶 **Zero-Allocation Architecture**: No objects are created during the validation of valid data.
- 🔍 **Instant Debugging**: Track source code locations immediately using the `at` field.
- 🧩 **Decorator-Based**: Familiar syntax for TypeScript and NestJS developers.
- 📦 **Zero Dependencies**: Easy to integrate without adding project overhead.

---

## 📦 Installation

```bash
npm install tysc
```

---

## ⚡ Quick Start

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

const dto = new CreateUserDto("admin", 15);
const errors = validate(dto);

console.log(errors);
```

### Output:

```json
[
  {
    "property": "age",
    "at": "src/dto/create-user.dto.ts:9:3",
    "failedRules": {
      "Min": ["You must be at least 18 years old"]
    }
  }
]
```

---

## 📚 Examples

### Nested Objects & Arrays

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

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested()
  tags!: Tag[];
}
```

### Custom Inline Validation

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

## 🛠️ Creating Custom Validators

```ts
import { createDecorator, registerStrategy, ValidationOptions } from "tysc";

registerStrategy("IsKoreanPhone", (value, rule, prop) => {
  const regex = /^010-\d{4}-\d{4}$/;
  if (typeof value !== "string") return `${prop} must be a string`;
  return regex.test(value) ? null : `${prop} format is invalid`;
});

export function IsKoreanPhone(options?: ValidationOptions) {
  return createDecorator("IsKoreanPhone", [], options);
}

class User {
  @IsKoreanPhone()
  phone: string;
}
```

---

## ⚙️ Advanced Options

- **Abort Early**: Stop validation immediately after the first error.
- **Rule Priority**: Control the order of validation execution.

```ts
const errors = validate(largeObject, { abortEarly: true });
```

```ts
class User {
  @IsString({ priority: 10 })
  @Length(5, 20, { priority: 5 })
  username!: string;
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

## ⚠️ tsconfig.json

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

---

## 🤝 Contributing

Fork the repository, create a branch, commit, push, and open a pull request.

---

## 📄 License

MIT
