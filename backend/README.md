# Brivska Akademija - Backend Setup

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- Stripe Account (for payment processing)

## Database Setup

1. Make sure MySQL is running
2. Create a new MySQL database (or let the server create it automatically):
   ```sql
   CREATE DATABASE brivska_akademija;
   ```

## Configuration

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and update the following values:

### Database Configuration
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=brivska_akademija
```

### Session Configuration
```
SESSION_SECRET=your_very_long_and_secure_random_string
```

### Stripe Configuration
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Create a new product/price in Stripe Dashboard
3. Copy the Price ID (starts with `price_`)
4. Update the `.env` file:
```
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_ID=price_your_stripe_price_id
```

### Admin Configuration
```
ADMIN_EMAIL=admin@brivska-akademija.si
ADMIN_PASSWORD=your_secure_admin_password
```

## Stripe Webhook Setup (Required for Production)

1. Install the Stripe CLI for local development:
   ```bash
   # Windows (using Chocolatey)
   choco install stripe-cli

   # Or download from: https://github.com/stripe/stripe-cli/releases
   ```

2. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/payment/webhook
   ```

3. Copy the webhook signing secret (`whsec_...`) to your `.env` file

## Install Dependencies

```bash
cd backend
npm install
```

## Run the Server

### Development
```bash
npm run dev
# or
node server.js
```

The server will:
1. Connect to MySQL
2. Create the database and tables if they don't exist
3. Create an admin user if it doesn't exist
4. Start the server on port 3000

## Default Admin Credentials

After first run, you can log in with:
- **Email:** admin@brivska-akademija.si
- **Password:** admin123 (or whatever you set in .env)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `GET /api/auth/refresh` - Refresh session data

### Admin (requires admin role)
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get user by ID
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `PATCH /api/admin/users/:id/access` - Toggle user access
- `DELETE /api/admin/users/:id` - Delete user

### Payment
- `POST /api/payment/create-checkout-session` - Create Stripe checkout session
- `GET /api/payment/status` - Get payment status
- `POST /api/payment/webhook` - Stripe webhook endpoint

### Access
- `GET /api/check-access` - Check if user has access to posnetki

## Frontend Pages

- `login.html` - Login page
- `registracija.html` - Registration page
- `posnetki.html` - Video content (requires authentication + payment)
- `placilo.html` - Payment page
- `payment-success.html` - Payment success redirect
- `payment-cancel.html` - Payment cancelled redirect
- `admin.html` - Admin panel (requires admin role)

## Security Notes

1. Change the `SESSION_SECRET` to a long random string in production
2. Enable HTTPS in production
3. Set `NODE_ENV=production` in production
4. Use strong database passwords
5. Never commit the `.env` file to version control

## Troubleshooting

### Port already in use
If port 3000 is in use, change the PORT in `.env`:
```
PORT=3001
```

### Database connection errors
- Verify MySQL is running
- Check database credentials in `.env`
- Make sure the database user has permissions to create databases

### Stripe webhook not working
- Make sure Stripe CLI is running and forwarding to correct port
- Verify webhook secret matches in Stripe Dashboard and `.env`
