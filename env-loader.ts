import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Manually load .env.local first to override/augment .env
// This is necessary because standard dotenv.config() doesn't load .env.local automatically
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
    console.log('[Server] Loading .env.local overrides');
    const envConfig = dotenv.parse(fs.readFileSync(envLocalPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

// Load default .env (does not overwrite existing keys by default, but we already set .env.local ones)
dotenv.config();
