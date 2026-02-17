import "dotenv/config";
import { getDb } from "./packages/core/src/db";
import { vendorDpas, dpaTemplates, vendors } from "./packages/core/src/schema";
import { eq } from "drizzle-orm";

async function main() {
    try {
        const db = await getDb();

        // Find any vendor
        const [v] = await db.select().from(vendors).limit(1);
        if (!v) {
            console.log("No vendors found");
            return;
        }

        const clientId = v.clientId;
        const vendorId = v.id;

        // Get first template
        const [template] = await db.select().from(dpaTemplates).limit(1);
        if (!template) {
            console.log("No templates found");
            return;
        }

        console.log(`Using vendor: ${v.name} (ID: ${v.id}, Client: ${v.clientId})`);
        console.log(`Using template: ${template.name} (ID: ${template.id})`);

        // Try insert
        const [dpa] = await db.insert(vendorDpas).values({
            clientId,
            vendorId,
            templateId: template.id,
            name: "Test DPA - " + new Date().toISOString(),
            content: template.content,
            status: 'Draft',
            version: template.version || 1,
        }).returning();

        console.log("Successfully created DPA:", dpa.id);
    } catch (err) {
        console.error("Error creating DPA:", err);
    } finally {
        process.exit();
    }
}

main();
