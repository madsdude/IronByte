const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgres://postgres:password@localhost:5432/csm',
});

async function migrate() {
    try {
        console.log('Migrating database...');
        await pool.query(`
      ALTER TABLE changes 
      ADD COLUMN IF NOT EXISTS assigned_approver_id UUID REFERENCES users(id);
    `);
        console.log('Migration successful: assigned_approver_id added.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
