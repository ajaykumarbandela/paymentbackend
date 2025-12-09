// Payment Routes
import express from 'express'
import {
  createOrder,
  verifyPaymentSignature,
  getOrderDetails,
  getPaymentDetails,
  createRefund,
} from '../services/paymentService.js'

const router = express.Router()

/**
 * POST /api/payment/create-order
 * Create a new payment order
 */
router.post('/create-order', async (req, res) => {
  try {
    const { amount, currency, metadata } = req.body

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' })
    }

    const result = await createOrder(amount, currency, metadata)

    if (!result.success) {
      return res.status(500).json({ error: result.error })
    }

    res.json({ order: result.order })
  } catch (error) {
    console.error('Error in create-order:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/payment/verify-payment
 * Verify payment signature
 */
router.post('/verify-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
      })
    }

    const result = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    )

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || result.error,
      })
    }

    // TODO: Add your business logic here
    // - Save payment to database
    // - Update order status
    // - Send confirmation email

    res.json({
      success: true,
      message: result.message,
    })
  } catch (error) {
    console.error('Error in verify-payment:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/payment/order-status/:orderId
 * Get order details
 */
router.get('/order-status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params

    const result = await getOrderDetails(orderId)

    if (!result.success) {
      return res.status(500).json({ error: result.error })
    }

    res.json({ order: result.order })
  } catch (error) {
    console.error('Error in order-status:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/payment/refund
 * Process a refund
 */
router.post('/refund', async (req, res) => {
  try {
    const { paymentId, amount } = req.body

    if (!paymentId) {
      return res.status(400).json({ error: 'Payment ID is required' })
    }

    const result = await createRefund(paymentId, amount)

    if (!result.success) {
      return res.status(500).json({ error: result.error })
    }

    // TODO: Add business logic
    // - Update database
    // - Send refund notification

    res.json({
      success: true,
      refund: result.refund,
    })
  } catch (error) {
    console.error('Error in refund:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
