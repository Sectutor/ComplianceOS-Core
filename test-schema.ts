import * as schema from './schema';

const tables = Object.keys(schema).filter(key => {
    const val = (schema as any)[key];
    return val && typeof val === 'object' && 'id' in val && '_extraConfig' in val;
});

console.log("Total tables found in schema.ts:", tables.length);
console.log("Samples:", tables.slice(0, 10));

if (tables.includes('reportLogs')) {
    console.log("Found reportLogs table definition");
} else {
    console.log("reportLogs table NOT found in schema exports");
}
