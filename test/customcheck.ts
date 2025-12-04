import { 
    validate, 
    createDecorator, 
    registerStrategy, 
    ValidationOptions 
} from "../src"; // 실제 경로로 수정 (dist 대신 src 권장)

// ==========================================
// 1. 커스텀 전략 등록 (Business Logic)
// ==========================================

console.log("🛠️ Registering Custom Strategies...");

// [Case 1] 단순 정규식: 한국 사업자등록번호 포맷 (000-00-00000)
registerStrategy("IsBizNumber", (value, rule, prop) => {
    if (typeof value !== 'string') return `${prop} must be a string`;
    const regex = /^\d{3}-\d{2}-\d{5}$/;
    return regex.test(value) ? null : `${prop} is not a valid business number`;
});

// [Case 2] 파라미터 받기: N의 배수인지 확인
registerStrategy("IsMultipleOf", (value, rule, prop) => {
    // constraints에서 인자 꺼내기
    const divisor = rule.constraints ? rule.constraints[0] : 1;
    
    if (typeof value !== 'number') return `${prop} must be a number`;
    return value % divisor === 0 ? null : `${prop} must be a multiple of ${divisor}`;
});

// [Case 3] 복합 로직: 강력한 비밀번호 (길이 + 특수문자 + 대문자)
registerStrategy("IsStrongPassword", (value, rule, prop) => {
    if (typeof value !== 'string') return `${prop} must be a string`;
    
    if (value.length < 8) return "Password too short";
    if (!/[A-Z]/.test(value)) return "Must contain uppercase";
    if (!/[!@#$%^&*]/.test(value)) return "Must contain special char";
    
    return null; // Pass
});

// [Case 4] 허용된 값 리스트 (Enum 흉내)
registerStrategy("IsAllowedColor", (value, rule, prop) => {
    const allowed = rule.constraints || []; // ["red", "blue"] 등
    return allowed.includes(value) 
        ? null 
        : `${prop} must be one of: ${allowed.join(", ")}`;
});

console.log("✅ Strategies Registered!\n");


// ==========================================
// 2. 데코레이터 팩토리 생성 (Wrappers)
// ==========================================

// 1. 인자 없는 데코레이터
function IsBizNumber(options?: ValidationOptions) {
    return createDecorator("IsBizNumber", [], options);
}

// 2. 인자 있는 데코레이터 (숫자)
function IsMultipleOf(num: number, options?: ValidationOptions) {
    return createDecorator("IsMultipleOf", [num], options);
}

// 3. 인자 없는 데코레이터 (로직 복잡)
function IsStrongPassword(options?: ValidationOptions) {
    return createDecorator("IsStrongPassword", [], options);
}

// 4. 가변 인자 데코레이터 (...colors)
function IsAllowedColor(colors: string[], options?: ValidationOptions) {
    return createDecorator("IsAllowedColor", colors, options); // 배열 통째로 constraints에 넣지 말고 spread 하거나 전략에 맞춰 조정
    // 여기선 colors 배열 자체가 constraints[0]이 되지 않도록 주의.
    // tysc 엔진은 constraints 배열을 그대로 저장함.
    // 전략에서 `rule.constraints`로 접근하므로, `colors` 배열 자체를 넘기면 됨.
}


// ==========================================
// 3. DTO 정의 (Test Class)
// ==========================================

class CustomTestDto {
    // 1. 단순 정규식
    @IsBizNumber()
    bizNum: string;

    // 2. 파라미터 전달 (5의 배수)
    @IsMultipleOf(5)
    score: number;

    // 3. 복합 로직
    @IsStrongPassword()
    password: string;

    // 4. 가변 인자 (허용 색상: red, blue)
    // createDecorator의 두번째 인자는 배열이어야 하므로, 
    // IsAllowedColor 내부에서 colors 배열을 spread 해서 넣거나 전략을 맞춰야 함.
    // 위 전략 코드에서는 `rule.constraints` 자체를 배열로 쓰므로, 
    // createDecorator("IsAllowedColor", ["red", "blue"], ...) 로 호출됨.
    @IsAllowedColor(["red", "blue", "green"])
    theme: string;

    // ✨ 5. [중요] 커스텀 데코레이터 + 배열 호환성 (each: true)
    @IsMultipleOf(10, { each: true, message: "Should be multiple of 10" })
    points: number[];

    constructor(data: any) {
        this.bizNum = data.bizNum;
        this.score = data.score;
        this.password = data.password;
        this.theme = data.theme;
        this.points = data.points;
    }
}


// ==========================================
// 4. 테스트 실행
// ==========================================

function runTest(name: string, data: any, shouldPass: boolean) {
    console.log(`🧪 Testing: ${name}`);
    const dto = new CustomTestDto(data);
    const errors = validate(dto);

    if (shouldPass) {
        if (errors.length === 0) console.log("   ✅ Passed (As Expected)");
        else {
            console.error("   ❌ Failed (Unexpected Errors):");
            console.log(JSON.stringify(errors, null, 2));
        }
    } else {
        if (errors.length > 0) {
            console.log("   ✅ Caught Errors (As Expected):");
            // 에러 메시지 요약 출력
            errors.forEach(e => {
                const rules = e.failedRules ? Object.keys(e.failedRules).join(", ") : "";
                const msg = e.failedRules ? Object.values(e.failedRules)[0] : "";
                console.log(`      - Property: ${e.property} [${rules}] -> "${msg}"`);
            });
        } else {
            console.error("   ❌ Failed (Expected Errors but got none)");
        }
    }
    console.log("-".repeat(50));
}

// --- [Scenario 1] 모든 데이터 정상 ---
runTest("Valid Data", {
    bizNum: "123-45-67890",
    score: 25,          // 5의 배수 OK
    password: "Password1!", // 8자, 대문자, 특수문자 OK
    theme: "red",       // allowed OK
    points: [10, 20, 30] // 10의 배수들 OK
}, true);

// --- [Scenario 2] 모든 데이터 실패 ---
runTest("Invalid Data", {
    bizNum: "1234567890", // 포맷 에러
    score: 22,            // 5의 배수 아님
    password: "weak",     // 너무 짧음
    theme: "purple",      // allowed 아님
    points: [10, 25, 30]  // 중간에 25가 10의 배수가 아님
}, false);

// --- [Scenario 3] 각 데코레이터별 엣지 케이스 ---
runTest("Edge Case: Password missing special char", {
    bizNum: "123-45-67890",
    score: 25,
    password: "Password123", // 특수문자 없음
    theme: "blue",
    points: [] // 빈 배열은 통과 (옵션에 따라 다름, 기본은 통과)
}, false); // password에서 에러 나야 함