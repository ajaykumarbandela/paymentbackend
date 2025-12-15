// PostgreSQL Database Configuration
import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

// Database configuration using Neon DB connection string
export const DB_CONFIG = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Neon DB
  },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased for cloud database
}

// Create connection pool
const pool = new Pool(DB_CONFIG)

// Handle pool errors
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err)
  process.exit(-1)
})

// Test connection
export const testConnection = async () => {
  try {
    const client = await pool.connect()
    console.log('✓ Database connected successfully')
    client.release()
    return true
  } catch (error) {
    console.error('✗ Database connection failed:', error.message)
    return false
  }
}

// Query helper function
export const query = async (text, params) => {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    console.log('Executed query', { text, duration, rows: res.rowCount })
    return res
  } catch (error) {
    console.error('Query error:', error)
    throw error
  }
}

// Get a client from the pool
export const getClient = async () => {
  const client = await pool.connect()
  const query = client.query
  const release = client.release

  // Set a timeout of 5 seconds, after which we will log this client's last query
  const timeout = setTimeout(() => {
    console.error('A client has been checked out for more than 5 seconds!')
  }, 5000)

  // Monkey patch the query method to keep track of the last query executed
  client.query = (...args) => {
    client.lastQuery = args
    return query.apply(client, args)
  }

  client.release = () => {
    // Clear our timeout
    clearTimeout(timeout)
    // Set the methods back to their old un-monkey-patched version
    client.query = query
    client.release = release
    return release.apply(client)
  }

  return client
}

export default pool
