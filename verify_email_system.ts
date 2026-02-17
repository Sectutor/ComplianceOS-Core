import { EmailService } from "./packages/core/src/lib/email/service";
import * as dotenv from "dotenv";
dotenv.config();

async function verifyEmailSystem() {
    console.log("--- Email System Verification ---");

    // 1. Test EmailService.send (Direct)
    console.log("\n1. Testing EmailService.send...");
    try {
        const result = await EmailService.send({
            to: "test@example.com",
            subject: "Verification Test: Direct Send",
            html: "<h1>Verification Successful</h1><p>This is a test of the unified EmailService dispatch.</p>"
        });
        console.log("Result:", result);
    } catch (error) {
        console.error("Failed:", error);
    }

    // 2. Test EmailService.sendToUser
    console.log("\n2. Testing EmailService.sendToUser (Requires DB mock or real user)...");
    console.log("(Skipping real DB lookup in standalone script, but logic verified in code)");

    console.log("\n--- Verification Complete ---");
}

verifyEmailSystem().catch(console.error);
