
import pkg from 'pg';
const { Client } = pkg;

async function checkSchema() {
    const client = new Client({
        connectionString: "postgresql://postgres.erjlkrtccmlrvsjtpppp:rDAO3DsFTjZyZJpj@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"
    });

    try {
        await client.connect();
        console.log("Checking columns for training_modules...");
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'training_modules';
        `);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

checkSchema();
