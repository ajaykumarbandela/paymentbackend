const { Client } = require('pg');

async function updateRole() {
  const client = new Client({
    user: process.env.PGUSER || process.env.DB_USER || 'postgres',
    host: process.env.PGHOST || process.env.DB_HOST || 'localhost',
    database: process.env.PGDATABASE || process.env.DB_NAME || 'extrahand_db',
    password: process.env.PGPASSWORD || process.env.DB_PASSWORD || 'postgres',
    port: process.env.PGPORT ? parseInt(process.env.PGPORT) : (process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432),
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✓ Connected to database');
    
    // Update role to super_admin
    const result = await client.query(
      'UPDATE users SET role = $1 WHERE email = $2 RETURNING id, email, name, role',
      ['super_admin', 'admin@example.com']
    );
    
    if (result.rows.length > 0) {
      console.log('✓ Role updated successfully');
      console.log('User details:', result.rows[0]);
    } else {
      console.log('⚠ No user found with email: admin@example.com');
    }
    
    await client.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

updateRole();
