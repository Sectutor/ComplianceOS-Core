
import fs from 'fs';
const content = fs.readFileSync('d:/OneDrive - Intellfence/WebDev/ComplianceOS/packages/core/src/server/routers/federal.ts', 'utf-8');
const lines = content.split('\n');
const keys = new Map<string, number[]>();

lines.forEach((line, index) => {
    const match = line.match(/^\s+(\w+):/);
    if (match) {
        const key = match[1];
        if (!keys.has(key)) {
            keys.set(key, []);
        }
        keys.get(key)!.push(index + 1);
    }
});

keys.forEach((positions, key) => {
    if (positions.length > 1) {
        console.log(`Duplicate key "${key}" at lines: ${positions.join(', ')}`);
    }
});
