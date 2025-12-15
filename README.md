# ExtraHand Backend API

Payment gateway backend with Neon DB (PostgreSQL) database integration for transaction management.

## 🚀 Features

- ✅ Razorpay payment integration
- ✅ Neon DB (cloud PostgreSQL) for transaction storage
- ✅ Complete payment lifecycle management
- ✅ Transaction history and statistics
- ✅ Refund processing
- ✅ User transaction tracking
- ✅ Error handling and logging
- ✅ RESTful API endpoints

## 📋 Prerequisites

- Node.js (v14 or higher)
- Neon DB account (free tier available at https://neon.tech)
- Razorpay account (for API keys)

## 🛠️ Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Set Up Neon Database

1. Go to https://neon.tech and create a free account
2. Create a new project
3. Copy your connection string from the Neon dashboard
4. Your connection string will look like:
   ```
   postgresql://user:password@host.neon.tech/dbname?sslmode=require
   ```

### 3. Configure Environment

```bash
# Copy environment template
cp .env.example .env
```

Edit `.env` file with your credentials:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Neon Database Configuration
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require
```

### 4. Initialize Database

```bash
npm run db:setup
```

Expected output:
```
✓ Database connected successfully
✅ Database setup completed successfully!
```

### 5. Test Database Connection

```bash
npm run db:test
```

### 6. Start Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Server will start at: `http://localhost:5000`

## 📚 API Documentation

### Payment Endpoints

#### Create Order
```http
POST /api/payment/create-order
Content-Type: application/json

{
  "amount": 500,
  "currency": "INR",
  "userId": "user_123",
  "userEmail": "user@example.com",
  "userPhone": "9876543210",
  "metadata": {}
}
```

#### Verify Payment
```http
POST /api/payment/verify-payment
Content-Type: application/json

{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx",
  "payment_method": "card"
}
```

#### Get Order Status
```http
GET /api/payment/order-status/:orderId
```

#### Process Refund
```http
POST /api/payment/refund
Content-Type: application/json

{
  "paymentId": "pay_xxx",
  "amount": 500
}
```

### Transaction Endpoints

#### Get All Transactions
```http
GET /api/payment/transactions?limit=50&offset=0&status=success
```

#### Get Single Transaction
```http
GET /api/payment/transaction/:transactionId
```

#### Get User Transactions
```http
GET /api/payment/user-transactions/:userId?limit=50&offset=0
```

#### Get Statistics
```http
GET /api/payment/stats
```

### Health Check
```http
GET /health
```

## 🗄️ Database Schema

### payment_transactions Table

| Field | Type | Description |
|-------|------|-------------|
| id | SERIAL | Primary key |
| transaction_id | VARCHAR(255) | Unique transaction ID |
| order_id | VARCHAR(255) | Razorpay order ID |
| payment_id | VARCHAR(255) | Razorpay payment ID |
| amount | DECIMAL(10,2) | Payment amount |
| currency | VARCHAR(10) | Currency code |
| payment_method | VARCHAR(50) | Payment method |
| payment_status | VARCHAR(50) | Status (pending/success/failed) |
| user_id | VARCHAR(255) | User identifier |
| user_email | VARCHAR(255) | User email |
| user_phone | VARCHAR(20) | User phone |
| razorpay_order_id | VARCHAR(255) | Razorpay order ID |
| razorpay_payment_id | VARCHAR(255) | Razorpay payment ID |
| razorpay_signature | VARCHAR(500) | Payment signature |
| is_verified | BOOLEAN | Verification status |
| verification_date | TIMESTAMP | Verification timestamp |
| is_refunded | BOOLEAN | Refund status |
| refund_id | VARCHAR(255) | Refund ID |
| refund_amount | DECIMAL(10,2) | Refund amount |
| refund_date | TIMESTAMP | Refund timestamp |
| error_code | VARCHAR(100) | Error code |
| error_description | TEXT | Error description |
| notes | JSONB | Additional notes |
| metadata | JSONB | Custom metadata |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |
| payment_date | TIMESTAMP | Payment timestamp |

### Database Views

- `successful_payments` - All successful verified payments
- `failed_payments` - All failed payments
- `pending_payments` - All pending payments

## 🧪 Testing

### Test Database Connection
```bash
npm run db:test
```

### Test API Endpoints

Using PowerShell:

```powershell
# Create order
Invoke-RestMethod -Uri "http://localhost:5000/api/payment/create-order" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"amount":100,"userId":"test_user","userEmail":"test@test.com"}'

# Get transactions
Invoke-RestMethod -Uri "http://localhost:5000/api/payment/transactions?limit=10" -Method GET

# Get stats
Invoke-RestMethod -Uri "http://localhost:5000/api/payment/stats" -Method GET
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── config.js          # Configuration
│   │   └── database.js        # Database connection
│   ├── db/
│   │   ├── init.sql           # Database schema
│   │   ├── setup.js           # Setup script
│   │   ├── test-connection.js # Connection test
│   │   └── migration-template.sql
│   ├── models/
│   │   └── transactionModel.js # Transaction operations
│   ├── routes/
│   │   └── paymentRoutes.js   # API routes
│   ├── services/
│   │   └── paymentService.js  # Payment service
│   └── server.js              # Main server file
├── .env                       # Environment variables (create this)
├── .env.example               # Environment template
├── package.json               # Dependencies
├── DATABASE_SETUP.md          # Detailed DB guide
├── INTEGRATION_COMPLETE.md    # Integration summary
└── README.md                  # This file
```

## 🔧 Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm run db:setup` - Initialize database schema
- `npm run db:test` - Test database connection

## 🛡️ Security

- Environment variables for sensitive data
- Prepared SQL statements to prevent SQL injection
- Payment signature verification
- CORS configuration
- Error message sanitization in production

## 📊 Monitoring

### View Recent Transactions
```sql
SELECT * FROM payment_transactions 
ORDER BY created_at DESC LIMIT 10;
```

### Get Today's Revenue
```sql
SELECT SUM(amount) as revenue, COUNT(*) as count
FROM payment_transactions
WHERE payment_status = 'success'
AND DATE(payment_date) = CURRENT_DATE;
```

## 🐛 Troubleshooting

### Database Connection Failed
1. Check PostgreSQL is running
2. Verify credentials in `.env`
3. Ensure database exists

### Table Not Found
Run setup script: `npm run db:setup`

### Permission Errors
```sql
GRANT ALL PRIVILEGES ON DATABASE extrahand_db TO postgres;
```

## 📖 Additional Documentation

- [Database Setup Guide](./DATABASE_SETUP.md) - Comprehensive database setup
- [Integration Guide](./INTEGRATION_COMPLETE.md) - Complete integration details

## 🚀 Production Deployment

Before deploying to production:

1. ✅ Use strong database passwords
2. ✅ Enable SSL for database connections
3. ✅ Set up automated backups
4. ✅ Configure connection pool limits
5. ✅ Set up monitoring and alerts
6. ✅ Use environment-specific databases
7. ✅ Never commit `.env` files
8. ✅ Implement rate limiting
9. ✅ Set up logging service
10. ✅ Review security best practices

## 📝 License

ISC

## 👥 Support

For issues or questions, check the documentation:
- [DATABASE_SETUP.md](./DATABASE_SETUP.md)
- [INTEGRATION_COMPLETE.md](./INTEGRATION_COMPLETE.md)
