-- ExtraHand Payment Transactions Database Schema
-- This file contains the SQL schema for storing payment transaction details

-- Create database (run this manually if needed)
-- CREATE DATABASE extrahand_db;

-- Connect to the database
-- \c extrahand_db;

-- Create transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id SERIAL PRIMARY KEY,
    
    -- Transaction identifiers
    transaction_id VARCHAR(255) UNIQUE NOT NULL,
    order_id VARCHAR(255) NOT NULL,
    payment_id VARCHAR(255) UNIQUE,
    
    -- Payment details
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    
    -- User information (optional - add user_id if you have user authentication)
    user_id VARCHAR(255),
    user_email VARCHAR(255),
    user_phone VARCHAR(20),
    
    -- Razorpay specific fields
    razorpay_order_id VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    razorpay_signature VARCHAR(500),
    
    -- Additional metadata
    receipt_id VARCHAR(255),
    notes JSONB,
    metadata JSONB,
    
    -- Payment verification
    is_verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMP,
    
    -- Refund information
    is_refunded BOOLEAN DEFAULT FALSE,
    refund_id VARCHAR(255),
    refund_amount DECIMAL(10, 2),
    refund_date TIMESTAMP,
    
    -- Error tracking
    error_code VARCHAR(100),
    error_description TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_date TIMESTAMP,
    
    -- Indexes for faster queries
    CONSTRAINT chk_amount CHECK (amount > 0)
);

-- Create indexes for frequently queried fields
CREATE INDEX IF NOT EXISTS idx_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_id ON payment_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_razorpay_order_id ON payment_transactions(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_razorpay_payment_id ON payment_transactions(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_status ON payment_transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_created_at ON payment_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_date ON payment_transactions(payment_date);

-- Create function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_payment_transactions_updated_at ON payment_transactions;
CREATE TRIGGER update_payment_transactions_updated_at
    BEFORE UPDATE ON payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create view for successful payments
CREATE OR REPLACE VIEW successful_payments AS
SELECT 
    id,
    transaction_id,
    order_id,
    payment_id,
    amount,
    currency,
    payment_method,
    user_email,
    payment_date,
    created_at
FROM payment_transactions
WHERE payment_status = 'success' AND is_verified = TRUE
ORDER BY payment_date DESC;

-- Create view for failed payments
CREATE OR REPLACE VIEW failed_payments AS
SELECT 
    id,
    transaction_id,
    order_id,
    amount,
    currency,
    payment_status,
    error_code,
    error_description,
    created_at
FROM payment_transactions
WHERE payment_status IN ('failed', 'error')
ORDER BY created_at DESC;

-- Create view for pending payments
CREATE OR REPLACE VIEW pending_payments AS
SELECT 
    id,
    transaction_id,
    order_id,
    amount,
    currency,
    payment_status,
    created_at
FROM payment_transactions
WHERE payment_status = 'pending'
ORDER BY created_at DESC;

-- Sample query to check the table
-- SELECT * FROM payment_transactions ORDER BY created_at DESC LIMIT 10;
