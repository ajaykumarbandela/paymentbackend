// Express Server - ExtraHand Backend
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
import paymentRoutes from './routes/paymentRoutes.js'
import { SERVER_CONFIG } from './config/config.js'

// Load environment variables
dotenv.config()

const app = express()

// Middleware
app.use(cors({
  origin: SERVER_CONFIG.allowedOrigins,
  credentials: true,
}))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`)
  next()
})

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'ExtraHand Backend is running',
    timestamp: new Date().toISOString(),
  })
})

// API Routes
app.use('/api/payment', paymentRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err)
  res.status(500).json({ 
    error: 'Internal server error',
    message: SERVER_CONFIG.nodeEnv === 'development' ? err.message : undefined,
  })
})

// Start server
const PORT = SERVER_CONFIG.port
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║           🚀 ExtraHand Backend Server                ║
║                                                       ║
║  Server running at: http://localhost:${PORT}           ║
║  Environment: ${SERVER_CONFIG.nodeEnv.padEnd(37)}║
║  Razorpay: ✓ Configured                              ║
║                                                       ║
║  Available endpoints:                                 ║
║  - GET  /health                                       ║
║  - POST /api/payment/create-order                     ║
║  - POST /api/payment/verify-payment                   ║
║  - GET  /api/payment/order-status/:orderId            ║
║  - POST /api/payment/refund                           ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `)
})

export default app
