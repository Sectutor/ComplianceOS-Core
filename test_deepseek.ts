import 'dotenv/config';
import { LLMService } from './packages/core/src/lib/llm/service';

async function testExtraction() {
    console.log("Starting extraction test...");
    const llm = new LLMService();

    try {
        const response = await llm.generate({
            feature: 'framework_studio',
            userPrompt: 'Extract 3 requirements from this text: 1. User must login. 2. Password must be complex. 3. Backups must be daily.',
            systemPrompt: 'You are a compliance assistant. Return a JSON array of objects with "title" and "description" fields.',
            jsonMode: true
        });

        console.log("Response Success!");
        console.log("Provider:", response.provider);
        console.log("Model:", response.model);
        console.log("Text:", response.text);
    } catch (error) {
        console.error("Test Failed:", error);
    }
}

testExtraction();
