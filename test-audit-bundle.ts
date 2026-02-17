import "dotenv/config";
import { generateAuditBundle } from "./lib/reporting";
import fs from "fs";

async function test() {
    const clientId = 681;
    console.log(`Generating Audit Bundle for client ${clientId}...`);
    try {
        const buffer = await generateAuditBundle(clientId);
        fs.writeFileSync(`audit_bundle_${clientId}.zip`, buffer);
        console.log("Success! Saved as audit_bundle_681.zip");
    } catch (error) {
        console.error("FAILED to generate audit bundle:", error);
    }
}

test().then(() => process.exit(0));
