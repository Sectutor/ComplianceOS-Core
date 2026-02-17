
import { appRouter } from './routers';
import { createContext } from './routers';
import { getDb } from './db';
import 'dotenv/config';

async function main() {
    console.log('Starting AI Control Suggestion Verification...');

    const db = await getDb();
    if (!db) {
        console.error('Database connection failed');
        process.exit(1);
    }

    // Mock Context
    const ctx = {
        req: {} as any,
        res: {} as any,
        user: { id: 1, email: 'test@example.com', role: 'admin' }
    };

    const caller = appRouter.createCaller(ctx);

    try {
        console.log('Fetching AI Suggestions...');
        const suggestions = await caller.risks.getSuggestedControls({
            threat: "Phishing Attack targeting employees",
            vulnerability: "Lack of security awareness training",
            riskDetails: "Employees are clicking on malicious links in emails."
        });

        console.log('Suggestions received:', suggestions.length);
        if (suggestions.length > 0) {
            console.log('Top Suggestion:', suggestions[0]);
            console.log('PASS: AI Suggestions working.');
        } else {
            console.log('WARN: No suggestions returned (might be LLM issue or empty context).');
        }

    } catch (error) {
        console.error('Error fetching suggestions:', error);
    }

    console.log('Verification Complete.');
    process.exit(0);
}

main();
