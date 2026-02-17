import 'dotenv/config';
import { PolicyGenerator } from './lib/policy/policy-generation';

async function test() {
    const pg = new PolicyGenerator();
    try {
        console.log("Testing getGenerationPrompt...");
        const result = await pg.getGenerationPrompt(678, 6, [], {
            tailorToIndustry: true,
            customInstruction: "Make it professional",
            language: 'en'
        });
        console.log("SUCCESS");
        console.log("System Prompt Snippet:", result.systemPrompt.substring(0, 50));
        console.log("User Prompt Snippet:", result.userPrompt.substring(0, 100));
    } catch (e) {
        console.error("FAILED:", e);
    }
    process.exit(0);
}

test();
