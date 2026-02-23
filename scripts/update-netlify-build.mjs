// Script to update Netlify build settings via API
// Usage: node scripts/update-netlify-build.mjs

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read token from netlify config
const configPath = join(process.env.APPDATA || process.env.HOME, 'netlify', 'Config', 'config.json');
let token;
try {
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    // Find the token in the nested structure
    const users = config.users;
    if (users) {
        const userKey = Object.keys(users)[0];
        token = users[userKey]?.auth?.token;
    }
} catch (e) {
    console.error('Could not read netlify config:', e.message);
}

if (!token) {
    token = process.env.NETLIFY_AUTH_TOKEN;
}

if (!token) {
    console.error('No Netlify token found. Set NETLIFY_AUTH_TOKEN env var.');
    process.exit(1);
}

const SITE_ID = '46bcc385-5b15-48d3-8a89-ce79730a921f';

const body = {
    build_settings: {
        cmd: 'npm --prefix packages/core install && npm --prefix packages/core run build',
        dir: 'packages/core/dist',
        base: ''
    }
};

console.log('Updating Netlify site build settings...');
console.log('Site ID:', SITE_ID);
console.log('New build command:', body.build_settings.cmd);
console.log('Publish dir:', body.build_settings.dir);

const response = await fetch(`https://api.netlify.com/api/v1/sites/${SITE_ID}`, {
    method: 'PATCH',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
});

const data = await response.json();

if (!response.ok) {
    console.error('Error:', data);
    process.exit(1);
}

console.log('\n✅ Build settings updated successfully!');
console.log('Build command:', data.build_settings?.cmd);
console.log('Publish dir:', data.build_settings?.dir);
console.log('Base dir:', data.build_settings?.base);
