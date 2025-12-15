// Payment Routes
import express from 'express'
import {
  createOrder,
  verifyPaymentSignature,
  getOrderDetails,
  getPaymentDetails,
  createRefund,
} from '../services/paymentService.js'
import {
  createTransaction,
  updateTransactionPayment,
  updateTransactionStatus,
  getTransactionByOrderId,
  getTransactionByPaymentId,
  getAllTransactions,
  getTransactionsByUser,
  markTransactionRefunded,
  getTransactionStats,
} from '../models/transactionModel.js'
import {
  syncPaymentToAdminPortal,
  syncRefundToAdminPortal,
} from '../services/adminPortalSync.js'

const router = express.Router()

/**
 * POST /api/payment/create-order
 * Create a new payment order
 */
router.post('/create-order', async (req, res) => {
  try {
    const { amount, currency, metadata, userId, userEmail, userPhone } = req.body

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' })
    }

    const result = await createOrder(amount, currency, metadata)

    if (!result.success) {
      return res.status(500).json({ error: result.error })
    }

    // Save transaction to database
    const transactionResult = await createTransaction({
      orderId: result.order.id,
      amount: amount,
      currency: currency || 'INR',
      userId,
      userEmail,
      userPhone,
      metadata,
      notes: result.order.notes,
    })

    if (!transactionResult.success) {
      console.error('Failed to save transaction to database:', transactionResult.error)
    }

    res.json({ 
      order: result.order,
      transactionId: transactionResult.success ? transactionResult.transaction.transaction_id : null
    })
  } catch (error) {
    console.error('Error in create-order:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/payment/verify-payment
 * Verify payment signature and save to database
 */
router.post('/verify-payment', async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      payment_method 
    } = req.body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
      })
    }

    // Verify payment signature
    const result = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    )

    if (!result.success) {
      // Update transaction status as failed
      await updateTransactionStatus(
        razorpay_order_id,
        'failed',
        'SIGNATURE_VERIFICATION_FAILED',
        'Payment signature verification failed'
      )

      return res.status(400).json({
        success: false,
        message: result.message || result.error,
      })
    }

    // Get payment details from Razorpay
    const paymentDetails = await getPaymentDetails(razorpay_payment_id)

    // Update transaction with payment details
    const updateResult = await updateTransactionPayment(razorpay_order_id, {
      paymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      paymentMethod: payment_method || paymentDetails?.payment?.method || 'unknown',
      paymentStatus: 'success',
      isVerified: true,
    })

    if (!updateResult.success) {
      console.error('Failed to update transaction:', updateResult.error)
    }

    // Sync payment to Admin Portal (non-blocking)
    if (updateResult.success) {
      const transaction = updateResult.transaction
      syncPaymentToAdminPortal({
        orderId: transaction.order_id,
        paymentId: transaction.payment_id,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.payment_status,
        method: transaction.payment_method,
        email: transaction.user_email,
        phone: transaction.user_phone,
        description: transaction.description,
        metadata: transaction.metadata,
      }).catch(err => {
        console.error('Admin Portal sync error (non-critical):', err.message)
      })
    }

    res.json({
      success: true,
      message: result.message,
      transaction: updateResult.success ? updateResult.transaction : null,
    })
  } catch (error) {
    console.error('Error in verify-payment:', error)
    
    // Try to update transaction status
    try {
      if (req.body.razorpay_order_id) {
        await updateTransactionStatus(
          req.body.razorpay_order_id,
          'error',
          'SERVER_ERROR',
          error.message
        )
      }
    } catch (dbError) {
      console.error('Failed to update error status:', dbError)
    }

    res.status(500).json({ success: false, error: error.message })
  }
})

/**
 * GET /api/payment/order-status/:orderId
 * Get order details from Razorpay and database
 */
router.get('/order-status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params

    // Get from Razorpay
    const result = await getOrderDetails(orderId)

    if (!result.success) {
      return res.status(500).json({ error: result.error })
    }

    // Get from database
    const dbResult = await getTransactionByOrderId(orderId)

    res.json({ 
      order: result.order,
      transaction: dbResult.success ? dbResult.transaction : null
    })
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

    // Update database with refund information
    const updateResult = await markTransactionRefunded(
      paymentId,
      result.refund.id,
      amount || (result.refund.amount / 100)
    )

    if (!updateResult.success) {
      console.error('Failed to update refund in database:', updateResult.error)
    }

    // Sync refund to Admin Portal (non-blocking)
    if (updateResult.success) {
      syncRefundToAdminPortal({
        refundId: result.refund.id,
        paymentId: paymentId,
        amount: amount || (result.refund.amount / 100),
        currency: result.refund.currency || 'INR',
        status: 'processed',
        reason: result.refund.notes?.reason || 'Customer request',
      }).catch(err => {
        console.error('Admin Portal refund sync error (non-critical):', err.message)
      })
    }

    res.json({
      success: true,
      refund: result.refund,
      transaction: updateResult.success ? updateResult.transaction : null,
    })
  } catch (error) {
    console.error('Error in refund:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/payment/transaction/:transactionId
 * Get transaction details by transaction ID
 */
router.get('/transaction/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params

    const result = await getTransactionByPaymentId(transactionId)

    if (!result.success) {
      return res.status(404).json({ error: result.error })
    }

    res.json({ transaction: result.transaction })
  } catch (error) {
    console.error('Error fetching transaction:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/payment/transactions
 * Get all transactions with pagination
 */
router.get('/transactions', async (req, res) => {
  try {
    const { limit = 50, offset = 0, status } = req.query

    const result = await getAllTransactions(
      parseInt(limit),
      parseInt(offset),
      status
    )

    if (!result.success) {
      return res.status(500).json({ error: result.error })
    }

    res.json({
      transactions: result.transactions,
      count: result.count,
      limit: parseInt(limit),
      offset: parseInt(offset),
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/payment/user-transactions/:userId
 * Get transactions by user ID
 */
router.get('/user-transactions/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const { limit = 50, offset = 0 } = req.query

    const result = await getTransactionsByUser(
      userId,
      parseInt(limit),
      parseInt(offset)
    )

    if (!result.success) {
      return res.status(500).json({ error: result.error })
    }

    res.json({
      transactions: result.transactions,
      count: result.count,
    })
  } catch (error) {
    console.error('Error fetching user transactions:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/payment/stats
 * Get transaction statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    const result = await getTransactionStats(startDate, endDate)

    if (!result.success) {
      return res.status(500).json({ error: result.error })
    }

    res.json({ stats: result.stats })
  } catch (error) {
    console.error('Error fetching transaction stats:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
