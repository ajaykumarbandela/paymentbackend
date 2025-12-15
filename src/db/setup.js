// Database Setup Script
// Run this file to initialize the database schema

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pool, { testConnection } from '../config/database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function setupDatabase() {
  console.log('🚀 Starting database setup...\n')

  // Test connection first
  const isConnected = await testConnection()
  if (!isConnected) {
    console.error('❌ Failed to connect to database. Please check your configuration.')
    process.exit(1)
  }

  try {
    // Read SQL file
    const sqlFilePath = path.join(__dirname, 'init.sql')
    const sql = fs.readFileSync(sqlFilePath, 'utf8')

    // Execute SQL statements
    console.log('📝 Executing database schema...')
    await pool.query(sql)

    console.log('\n✅ Database setup completed successfully!')
    console.log('\nCreated:')
    console.log('  - payment_transactions table')
    console.log('  - Indexes for optimized queries')
    console.log('  - Auto-update trigger for updated_at')
    console.log('  - Views: successful_payments, failed_payments, pending_payments')
    
    // Verify table creation
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'payment_transactions'
    `)

    if (result.rows.length > 0) {
      console.log('\n✓ Table verification successful')
    }

    process.exit(0)
  } catch (error) {
    console.error('❌ Error setting up database:', error.message)
    console.error('\nFull error:', error)
    process.exit(1)
  }
}

// Run setup
setupDatabase()
