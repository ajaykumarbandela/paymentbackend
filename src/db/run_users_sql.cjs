const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const sql = fs.readFileSync(path.join(__dirname, 'users.sql'), 'utf8');

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

client.connect()
  .then(() => client.query(sql))
  .then(() => {
    console.log('Users table created and admin user seeded!');
    return client.end();
  })
  .catch(err => {
    console.error('Error running SQL:', err);
    client.end();
  });
