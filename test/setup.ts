import dotenv from 'dotenv';
import path from 'path';

console.log("Loading .env from:", path.resolve(__dirname, '../.env'));
const result = dotenv.config({ path: path.resolve(__dirname, '../.env') });
if (result.error) console.error("Error loading .env:", result.error);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

console.log("DATABASE_URL is:", process.env.DATABASE_URL ? "Set" : "Unset");
