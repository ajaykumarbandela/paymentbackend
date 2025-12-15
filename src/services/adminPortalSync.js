// Admin Portal Sync Service
import axios from 'axios';
import { PAYMENT_CONFIG } from '../config/config.js';

const ADMIN_PORTAL_URL = process.env.ADMIN_PORTAL_URL || 'http://localhost:5002';
const ADMIN_PORTAL_API_KEY = process.env.ADMIN_PORTAL_API_KEY || '';

/**
 * Sync payment data to Admin Portal
 */
export async function syncPaymentToAdminPortal(paymentData) {
  try {
    const {
      orderId,
      paymentId,
      amount,
      currency,
      status,
      method,
      email,
      phone,
      description,
      metadata,
    } = paymentData;

    const payload = {
      orderId,
      paymentId,
      amountPaise: Math.round(amount * 100),
      currency: currency || 'INR',
      status,
      method,
      email,
      phone,
      description,
      metadata,
      captured: status === 'success',
      capturedAt: status === 'success' ? new Date().toISOString() : null,
    };

    const response = await axios.post(
      `${ADMIN_PORTAL_URL}/api/payments/webhook`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ADMIN_PORTAL_API_KEY,
        },
        timeout: 10000, // 10 seconds
      }
    );

    console.log('✅ Payment synced to Admin Portal:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Failed to sync payment to Admin Portal:', error.message);
    
    // Don't throw error - sync is not critical
    return { 
      success: false, 
      error: error.message,
      details: error.response?.data 
    };
  }
}

/**
 * Sync refund data to Admin Portal
 */
export async function syncRefundToAdminPortal(refundData) {
  try {
    const {
      refundId,
      paymentId,
      amount,
      currency,
      status,
      reason,
    } = refundData;

    const payload = {
      refundId,
      paymentId,
      amountPaise: Math.round(amount * 100),
      currency: currency || 'INR',
      status,
      reason,
      processedAt: new Date().toISOString(),
    };

    const response = await axios.post(
      `${ADMIN_PORTAL_URL}/api/refunds/webhook`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ADMIN_PORTAL_API_KEY,
        },
        timeout: 10000,
      }
    );

    console.log('✅ Refund synced to Admin Portal:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Failed to sync refund to Admin Portal:', error.message);
    
    return { 
      success: false, 
      error: error.message,
      details: error.response?.data 
    };
  }
}

/**
 * Batch sync all existing transactions to Admin Portal
 */
export async function batchSyncTransactions(transactions) {
  console.log(`🔄 Starting batch sync of ${transactions.length} transactions...`);
  
  const results = {
    success: 0,
    failed: 0,
    errors: [],
  };

  for (const transaction of transactions) {
    const result = await syncPaymentToAdminPortal({
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
    });

    if (result.success) {
      results.success++;
    } else {
      results.failed++;
      results.errors.push({
        transactionId: transaction.transaction_id,
        error: result.error,
      });
    }

    // Small delay to avoid overwhelming the admin portal
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`✅ Batch sync completed: ${results.success} successful, ${results.failed} failed`);
  return results;
}
