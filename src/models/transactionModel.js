// Transaction Database Model
// Handles all database operations for payment transactions

import { query, getClient } from '../config/database.js'
import { v4 as uuidv4 } from 'uuid'

/**
 * Create a new transaction record
 */
export const createTransaction = async (transactionData) => {
  const {
    orderId,
    amount,
    currency = 'INR',
    userId = null,
    userEmail = null,
    userPhone = null,
    metadata = {},
    notes = {},
  } = transactionData

  const transactionId = `txn_${uuidv4()}`

  const sql = `
    INSERT INTO payment_transactions (
      transaction_id, order_id, amount, currency,
      user_id, user_email, user_phone,
      payment_status, notes, metadata
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `

  try {
    const result = await query(sql, [
      transactionId,
      orderId,
      amount,
      currency,
      userId,
      userEmail,
      userPhone,
      'pending',
      JSON.stringify(notes),
      JSON.stringify(metadata),
    ])

    return { success: true, transaction: result.rows[0] }
  } catch (error) {
    console.error('Error creating transaction:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Update transaction with payment details
 */
export const updateTransactionPayment = async (orderId, paymentData) => {
  const {
    paymentId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    paymentMethod,
    paymentStatus = 'success',
    isVerified = true,
  } = paymentData

  const sql = `
    UPDATE payment_transactions
    SET 
      payment_id = $1,
      razorpay_order_id = $2,
      razorpay_payment_id = $3,
      razorpay_signature = $4,
      payment_method = $5,
      payment_status = $6,
      is_verified = $7,
      verification_date = $8,
      payment_date = $9
    WHERE order_id = $10
    RETURNING *
  `

  try {
    const result = await query(sql, [
      paymentId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paymentMethod,
      paymentStatus,
      isVerified,
      new Date(),
      new Date(),
      orderId,
    ])

    if (result.rows.length === 0) {
      return { success: false, error: 'Transaction not found' }
    }

    return { success: true, transaction: result.rows[0] }
  } catch (error) {
    console.error('Error updating transaction payment:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Update transaction status (for failed/error cases)
 */
export const updateTransactionStatus = async (orderId, status, errorCode = null, errorDescription = null) => {
  const sql = `
    UPDATE payment_transactions
    SET 
      payment_status = $1,
      error_code = $2,
      error_description = $3
    WHERE order_id = $4
    RETURNING *
  `

  try {
    const result = await query(sql, [status, errorCode, errorDescription, orderId])

    if (result.rows.length === 0) {
      return { success: false, error: 'Transaction not found' }
    }

    return { success: true, transaction: result.rows[0] }
  } catch (error) {
    console.error('Error updating transaction status:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get transaction by order ID
 */
export const getTransactionByOrderId = async (orderId) => {
  const sql = `
    SELECT * FROM payment_transactions
    WHERE order_id = $1
  `

  try {
    const result = await query(sql, [orderId])

    if (result.rows.length === 0) {
      return { success: false, error: 'Transaction not found' }
    }

    return { success: true, transaction: result.rows[0] }
  } catch (error) {
    console.error('Error fetching transaction:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get transaction by payment ID
 */
export const getTransactionByPaymentId = async (paymentId) => {
  const sql = `
    SELECT * FROM payment_transactions
    WHERE payment_id = $1 OR razorpay_payment_id = $1
  `

  try {
    const result = await query(sql, [paymentId])

    if (result.rows.length === 0) {
      return { success: false, error: 'Transaction not found' }
    }

    return { success: true, transaction: result.rows[0] }
  } catch (error) {
    console.error('Error fetching transaction:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get all transactions with pagination
 */
export const getAllTransactions = async (limit = 50, offset = 0, status = null) => {
  let sql = `
    SELECT * FROM payment_transactions
  `
  const params = []

  if (status) {
    sql += ` WHERE payment_status = $1`
    params.push(status)
    sql += ` ORDER BY created_at DESC LIMIT $2 OFFSET $3`
    params.push(limit, offset)
  } else {
    sql += ` ORDER BY created_at DESC LIMIT $1 OFFSET $2`
    params.push(limit, offset)
  }

  try {
    const result = await query(sql, params)
    return { success: true, transactions: result.rows, count: result.rowCount }
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get transactions by user
 */
export const getTransactionsByUser = async (userId, limit = 50, offset = 0) => {
  const sql = `
    SELECT * FROM payment_transactions
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `

  try {
    const result = await query(sql, [userId, limit, offset])
    return { success: true, transactions: result.rows, count: result.rowCount }
  } catch (error) {
    console.error('Error fetching user transactions:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Mark transaction as refunded
 */
export const markTransactionRefunded = async (paymentId, refundId, refundAmount) => {
  const sql = `
    UPDATE payment_transactions
    SET 
      is_refunded = true,
      refund_id = $1,
      refund_amount = $2,
      refund_date = $3,
      payment_status = 'refunded'
    WHERE payment_id = $4 OR razorpay_payment_id = $4
    RETURNING *
  `

  try {
    const result = await query(sql, [refundId, refundAmount, new Date(), paymentId])

    if (result.rows.length === 0) {
      return { success: false, error: 'Transaction not found' }
    }

    return { success: true, transaction: result.rows[0] }
  } catch (error) {
    console.error('Error marking transaction as refunded:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get transaction statistics
 */
export const getTransactionStats = async (startDate = null, endDate = null) => {
  let sql = `
    SELECT 
      COUNT(*) as total_transactions,
      COUNT(CASE WHEN payment_status = 'success' THEN 1 END) as successful_payments,
      COUNT(CASE WHEN payment_status = 'failed' THEN 1 END) as failed_payments,
      COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_payments,
      COUNT(CASE WHEN is_refunded = true THEN 1 END) as refunded_payments,
      SUM(CASE WHEN payment_status = 'success' THEN amount ELSE 0 END) as total_revenue,
      AVG(CASE WHEN payment_status = 'success' THEN amount ELSE NULL END) as average_transaction_value
    FROM payment_transactions
  `

  const params = []

  if (startDate && endDate) {
    sql += ` WHERE created_at BETWEEN $1 AND $2`
    params.push(startDate, endDate)
  } else if (startDate) {
    sql += ` WHERE created_at >= $1`
    params.push(startDate)
  } else if (endDate) {
    sql += ` WHERE created_at <= $1`
    params.push(endDate)
  }

  try {
    const result = await query(sql, params)
    return { success: true, stats: result.rows[0] }
  } catch (error) {
    console.error('Error fetching transaction stats:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Delete old pending transactions (cleanup)
 */
export const deleteOldPendingTransactions = async (daysOld = 7) => {
  const sql = `
    DELETE FROM payment_transactions
    WHERE payment_status = 'pending'
    AND created_at < NOW() - INTERVAL '${daysOld} days'
    RETURNING *
  `

  try {
    const result = await query(sql)
    return { success: true, deletedCount: result.rowCount }
  } catch (error) {
    console.error('Error deleting old transactions:', error)
    return { success: false, error: error.message }
  }
}
