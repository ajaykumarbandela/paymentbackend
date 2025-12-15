import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkTables() {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to Neon DB\n');
    
    // Get all tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Tables in your Neon database:');
    console.log('=================================');
    tablesResult.rows.forEach(row => {
      console.log('  ✓', row.table_name);
    });
    
    // Get table structure
    console.log('\n📊 Payment Transactions Table Structure:');
    console.log('=========================================');
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'payment_transactions'
      ORDER BY ordinal_position
    `);
    
    columnsResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(required)' : '(optional)'}`);
    });
    
    // Count records
    const countResult = await client.query('SELECT COUNT(*) FROM payment_transactions');
    console.log(`\n📈 Total transactions: ${countResult.rows[0].count}`);
    
    client.release();
    await pool.end();
    console.log('\n✅ Database check complete!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkTables();
