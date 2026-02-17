import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
import fs from "fs";

dotenv.config({ path: ".env" });
if (fs.existsSync(".env.local")) {
    dotenv.config({ path: ".env.local", override: true });
}

export default defineConfig({
    schema: ["./packages/core/src/schema/licenses.ts"],
    out: "./packages/core/drizzle",
    driver: "pg",
    dbCredentials: {
        connectionString: process.env.DATABASE_URL || "",
    },
});
