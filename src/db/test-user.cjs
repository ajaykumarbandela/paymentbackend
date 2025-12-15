require('dotenv').config(); // Load environment variables from .env file

const { Client } = require('pg');

async function testUser() {
  const client = new Client({
    user: process.env.PGUSER || process.env.DB_USER || 'postgres',
    host: process.env.PGHOST || process.env.DB_HOST || 'localhost',
    database: process.env.PGDATABASE || process.env.DB_NAME || 'extrahand_db',
    password: process.env.PGPASSWORD || process.env.DB_PASSWORD || 'postgres',
    port: process.env.PGPORT ? parseInt(process.env.PGPORT) : (process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432),
    ssl: { rejectUnauthorized: false }, // Enable SSL with relaxed security
  });

  try {
    await client.connect();
    console.log('✓ Connected to database');
    
    // Check if users table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    console.log('Users table exists:', tableCheck.rows[0].exists);
    
    if (tableCheck.rows[0].exists) {
      // List all users
      const users = await client.query('SELECT id, email, name, role, created_at FROM users ORDER BY created_at');
      console.log('\nUsers in database:');
      console.table(users.rows);
      
      // Check the specific admin user
      const admin = await client.query('SELECT * FROM users WHERE email = $1', ['admin@example.com']);
      if (admin.rows.length > 0) {
        console.log('\nAdmin user found:');
        console.log('Email:', admin.rows[0].email);
        console.log('Name:', admin.rows[0].name);
        console.log('Role:', admin.rows[0].role);
        console.log('Password hash exists:', !!admin.rows[0].password_hash);
        console.log('Password hash length:', admin.rows[0].password_hash?.length);
      } else {
        console.log('\n⚠ Admin user NOT found in database!');
      }
    }
    
    await client.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testUser();
