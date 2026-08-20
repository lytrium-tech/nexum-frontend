import { execSync } from "child_process";
import fs from "fs";

const openapiPath = process.env.NEXUM_OPENAPI_PATH;

if (!openapiPath) {
    console.error("ERROR: NEXUM_OPENAPI_PATH environment variable is required.");
    console.error("Usage: NEXUM_OPENAPI_PATH=<path> pnpm api:generate");
    process.exit(1);
}

if (!fs.existsSync(openapiPath)) {
    console.error("ERROR: OpenAPI source file not found at: " + openapiPath);
    process.exit(1);
}

console.log("Generating types from: " + openapiPath);

try {
    execSync("npx openapi-typescript \"" + openapiPath + "\" -o src/lib/api/types.generated.ts", { stdio: "inherit" });
    console.log("Types generated successfully.");
} catch (error) {
    console.error("ERROR: Failed to generate types.");
    process.exit(1);
}

