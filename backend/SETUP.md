# Brivska Akademija - Backend Setup

## Prerequisites

1. **Node.js** (v14 or higher) - https://nodejs.org/
2. **MySQL** (v5.7 or higher) - https://www.mysql.com/
3. **Stripe Account** - https://stripe.com/

## Database Setup

1. Install MySQL and start the service
2. Create a new database:

```sql
CREATE DATABASE brivska_akademija;
```

Or the database will be created automatically when you start the server.

## Configuration

1. Navigate to the backend folder:
   ```
   cd backend
   ```

2. Copy `.env.example` to `.env`:
   ```
   copy .env.example .env
   ```

3. Edit `.env` file with your settings:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=brivska_akademija

# Session Configuration
SESSION_SECRET=change_this_to_a_secure_random_string

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_ID=price_your_stripe_price_id

# Admin Configuration
ADMIN_EMAIL=admin@brivska-akademija.si
ADMIN_PASSWORD=admin123
```

## Stripe Setup

1. Create a Stripe account at https://stripe.com/
2. Get your API keys from the Stripe Dashboard
3. Create a product/price in Stripe Dashboard and get the price ID
4. Set up Stripe CLI for local webhook testing:
   ```
   stripe listen --forward-to localhost:3000/api/payment/webhook
   ```
5. Copy the webhook signing secret to your `.env` file

## Installation

1. Install dependencies:
   ```
   cd backend
   npm install
   ```

## Running the Application

1. Start the server:
   ```
   npm start
   ```

2. The server will:
   - Initialize the database tables
   - Create an admin user if not exists
   - Start on http://localhost:3000

## Default Admin Account

The first time the server runs, it will create a default admin account:
- Email: admin@brivska-akademija.si (or whatever you set in .env)
- Password: admin123 (or whatever you set in .env)

**Important:** Change the admin password after first login!

## Testing Stripe Webhooks Locally

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Run:
   ```
   stripe listen --forward-to localhost:3000/api/payment/webhook
   ```
3. Copy the webhook secret (starts with `whsec_`) to your `.env` file

## Project Structure

```
maturitetni_izdelek/
├── backend/
│   ├── config/
│   │   └── database.js      # Database connection and schema
│   ├── controllers/
│   │   ├── adminController.js    # Admin operations
│   │   ├── authController.js     # Authentication
│   │   └── paymentController.js  # Stripe payments
│   ├── middleware/
│   │   ├── auth.js         # Auth middleware
│   │   └── validation.js   # Input validation
│   ├── routes/
│   │   ├── admin.js        # Admin routes
│   │   ├── auth.js         # Auth routes
│   │   └── payment.js      # Payment routes
│   ├── .env                # Environment variables
│   ├── .env.example        # Example environment variables
│   ├── package.json        # Dependencies
│   └── server.js           # Main server file
├── admin.html              # Admin panel
├── placilo.html            # Payment page
├── login.html              # Login page
├── registracija.html       # Registration page
├── posnetki.html           # Protected videos page
├── payment-success.html    # Payment success page
├── payment-cancel.html     # Payment cancel page
└── ...
```

## User Flow

1. User registers at `registracija.html`
2. User logs in at `login.html`
3. If user doesn't have access, they're redirected to `placilo.html`
4. User completes payment via Stripe
5. After successful payment, user gets access to `posnetki.html`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Admin (requires admin role)
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get user by ID
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `PATCH /api/admin/users/:id/access` - Update user access
- `DELETE /api/admin/users/:id` - Delete user

### Payments
- `POST /api/payment/create-checkout-session` - Create Stripe checkout session
- `GET /api/payment/status` - Get payment status
- `POST /api/payment/webhook` - Stripe webhook endpoint
