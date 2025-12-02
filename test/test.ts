import { IsArray, ArrayMinSize, ArrayMaxSize, validate } from "../src";

class ProductDto {
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(3)
    tags: string[];

    constructor(tags: any) {
        this.tags = tags;
    }
}

console.log("🚀 [tysc] Array Validation Test\n");

const badType = new ProductDto("clothes, summer");
console.log("❌ Case 1 (Not Array):", JSON.stringify(validate(badType), null, 2));

const tooMany = new ProductDto(["A", "B", "C", "D"]);
console.log("\n❌ Case 2 (Too Many):", JSON.stringify(validate(tooMany), null, 2));

const good = new ProductDto(["Summer", "Sale"]);
const res = validate(good);
console.log("\n✅ Case 3 (Good):", res.length === 0 ? "Pass!" : "Fail...");