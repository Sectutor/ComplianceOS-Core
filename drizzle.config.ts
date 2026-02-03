import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./packages/core/src/schema.ts",
    out: "./packages/core/drizzle",
    driver: "pg",
    dbCredentials: {
        connectionString: process.env.DATABASE_URL || "",
    },
    tablesFilter: ["!surfsense_*", "!search*", "!user", "!new_chat_threads", "!alembic_version", "!checkpoint_*", "!ai_usage_metrics", "!embeddings"],
});
