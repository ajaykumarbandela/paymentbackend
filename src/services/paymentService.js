// Razorpay Payment Service
import Razorpay from 'razorpay'
import crypto from 'crypto'
import { PAYMENT_CONFIG } from '../config/config.js'

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: PAYMENT_CONFIG.razorpay.keyId,
  key_secret: PAYMENT_CONFIG.razorpay.keySecret,
})

/**
 * Create a new payment order
 */
export const createOrder = async (amount, currency = 'INR', metadata = {}) => {
  try {
    const options = {
      amount: amount * 100, // Convert to paise
      currency,
      receipt: `receipt_${Date.now()}`,
      notes: metadata,
    }

    const order = await razorpay.orders.create(options)
    return { success: true, order }
  } catch (error) {
    console.error('Error creating order:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Verify payment signature
 */
export const verifyPaymentSignature = (orderId, paymentId, signature) => {
  try {
    const generatedSignature = crypto
      .createHmac('sha256', PAYMENT_CONFIG.razorpay.keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex')

    const isValid = generatedSignature === signature

    return {
      success: isValid,
      message: isValid ? 'Payment verified successfully' : 'Invalid signature',
    }
  } catch (error) {
    console.error('Error verifying payment:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get order details
 */
export const getOrderDetails = async (orderId) => {
  try {
    const order = await razorpay.orders.fetch(orderId)
    return { success: true, order }
  } catch (error) {
    console.error('Error fetching order:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get payment details
 */
export const getPaymentDetails = async (paymentId) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId)
    return { success: true, payment }
  } catch (error) {
    console.error('Error fetching payment:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Create a refund
 */
export const createRefund = async (paymentId, amount = null) => {
  try {
    const options = amount ? { amount: amount * 100 } : {}
    const refund = await razorpay.payments.refund(paymentId, options)
    return { success: true, refund }
  } catch (error) {
    console.error('Error creating refund:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Capture a payment
 */
export const capturePayment = async (paymentId, amount, currency = 'INR') => {
  try {
    const payment = await razorpay.payments.capture(paymentId, amount * 100, currency)
    return { success: true, payment }
  } catch (error) {
    console.error('Error capturing payment:', error)
    return { success: false, error: error.message }
  }
}
