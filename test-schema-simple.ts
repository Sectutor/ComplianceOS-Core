import * as schema from './schema';

console.log("Keys in schema export:", Object.keys(schema).length);
console.log("Is reportLogs exported?", 'reportLogs' in schema);
console.log("Type of reportLogs:", typeof (schema as any).reportLogs);
if ('reportLogs' in schema) {
    console.log("Table name:", (schema as any).reportLogs.tableName || (schema as any).reportLogs[Symbol.for('drizzle:Name')]);
}
