import { IsString, IsArray, validate } from "../src";

class Post {
    @IsArray()
    @IsString({ each: true, message: "태그는 문자열이어야 합니다" }) // ✨ 각 요소가 문자열인지 확인
    tags: string[];

    constructor(tags: any[]) {
        this.tags = tags;
    }
}

console.log("🚀 v1.4.0 each: true Test");

// [Case 1] 중간에 숫자가 섞여있음
const badPost = new Post(["HTML", 123, "CSS"]);
const res = validate(badPost);

console.log(JSON.stringify(res, null, 2));