const { Client } = require('pg');

async function updatePassword() {
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
    
    // Update password hash
    const newHash = '$2b$10$9owjFSW3xSZvjxagqxuRd.zpO2dl9ZYdYSDLe2edTL9ZFNEpwkQ.O';
    const result = await client.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, email, name, role',
      [newHash, 'admin@example.com']
    );
    
    if (result.rows.length > 0) {
      console.log('✓ Password updated successfully for:', result.rows[0].email);
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

updatePassword();
