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

### Complex Nested Objects

| Library         | Ops/sec       | Relative |
| --------------- | ------------- | -------- |
| **tysc**        | **5,177,232** | 100%     |
| zod             | 4,764,749     | 92%      |
| class-validator | 289,808       | 5.6%     |

> tysc is faster than Zod and up to ~18x faster than class-validator for complex nested structures.

### Simple Flat Objects

| Library         | Ops/sec    | Relative |
| --------------- | ---------- | -------- |
| zod             | 27,211,846 | 100%     |
| **tysc**        | 16,564,024 | 61%      |
| class-validator | 1,082,037  | 4%       |

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
