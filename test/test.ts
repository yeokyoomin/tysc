// test.ts
import {
    IsString, validate, IsOptional
} from "../src";

class UpdateProfile {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    bio?: string | undefined;

    constructor(name: string, bio?: string) {
        this.name = name;
        this.bio = bio;
    }
}

console.log("🚀 Optional Test");
const user1 = new UpdateProfile("Admin");
console.log(validate(user1));

const user2 = new UpdateProfile("Admin", 123 as any);
console.log(validate(user2));