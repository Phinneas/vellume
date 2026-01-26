# Vellume API

Cloudflare Workers API for Vellume - a pixel art journaling app with premium subscriptions and cloud AI generation.

## Features

- **Authentication**: JWT-based auth with signup/login
- **Journal Entries**: CRUD operations for journal entries
- **Image Upload**: R2 storage for pixel art images
- **Premium Subscriptions**: Stripe integration for monthly/yearly plans
- **Cloud AI Generation**: Cloudflare Workers AI for premium pixel art generation
- **Usage Tracking**: Weekly limits for free users (3 images/week)

## Setup

### Prerequisites

1. [Cloudflare account](https://dash.cloudflare.com/sign-up)
2. [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
3. [Stripe account](https://dashboard.stripe.com/register)

### Installation

```bash
# Install dependencies
npm install

# Login to Cloudflare
wrangler login
```

### Create Resources

```bash
# Create D1 database
wrangler d1 create vellume-db

# Create R2 bucket
wrangler r2 bucket create vellume-images
```

After creating the D1 database, copy the `database_id` from the output and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "vellume-db"
database_id = "YOUR_DATABASE_ID_HERE"  # Replace with actual ID
```

### Run Database Migrations

```bash
# Run migrations on remote database
wrangler d1 execute vellume-db --file=schema.sql

# Or for local development
wrangler d1 execute vellume-db --local --file=schema.sql
```

### Set Secrets

```bash
# JWT secret for token signing
wrangler secret put JWT_SECRET

# Stripe secrets
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put STRIPE_PRICE_ID_MONTHLY
wrangler secret put STRIPE_PRICE_ID_YEARLY
```

### Stripe Setup

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Create a product "Vellume Premium"
3. Create two prices:
   - Monthly: $4.99/month (recurring)
   - Yearly: $39.99/year (recurring)
4. Copy the price IDs (e.g., `price_xxxxx`) and set as secrets
5. Go to Developers > API Keys and copy your secret key
6. Go to Developers > Webhooks:
   - Add endpoint: `https://your-worker.workers.dev/api/webhooks/stripe`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Copy the signing secret

### Development

```bash
# Start local development server
npm run dev
```

### Deployment

```bash
# Deploy to Cloudflare Workers
npm run deploy
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create new account |
| POST | `/api/auth/login` | Login and get token |

### User

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/me` | Get user info, subscription, and usage |

### Subscriptions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/subscription/checkout` | Create Stripe checkout session |
| POST | `/api/webhooks/stripe` | Stripe webhook handler |

### Entries

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/entries` | List all entries |
| POST | `/api/entries` | Create new entry |
| GET | `/api/entries/:id` | Get single entry |

### Images

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/images/upload` | Upload pixel art image |
| POST | `/api/images/generate-cloud` | Generate AI pixel art (Premium) |

## Environment Variables

### Secrets (set with `wrangler secret put`)

| Name | Description |
|------|-------------|
| `JWT_SECRET` | Secret for signing JWT tokens |
| `STRIPE_SECRET_KEY` | Stripe API secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRICE_ID_MONTHLY` | Stripe price ID for monthly plan |
| `STRIPE_PRICE_ID_YEARLY` | Stripe price ID for yearly plan |

### Bindings (configured in wrangler.toml)

| Name | Type | Description |
|------|------|-------------|
| `DB` | D1 | SQLite database |
| `IMAGES` | R2 | Object storage for images |
| `AI` | AI | Cloudflare Workers AI |

## Subscription Plans

### Free Tier
- 3 pixel art generations per week
- On-device generation only
- Basic features

### Premium ($4.99/month or $39.99/year)
- Unlimited pixel art generations
- Cloud AI generation (higher quality)
- Multiple style presets
- Priority processing

## Cloud AI Styles

| Style | Description |
|-------|-------------|
| `default` | Classic pixel art style |
| `gameboy` | Game Boy green monochrome palette |
| `nes` | NES 8-bit limited colors |
| `commodore` | Commodore 64 CRT effect |

## Deep Linking

The API returns deep links for mobile app integration:

- Success: `vellumeapp://subscription/success`
- Cancel: `vellumeapp://subscription/cancel`

Configure your mobile app to handle these URL schemes.

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

Common error codes:
- `UNAUTHORIZED` - Invalid or missing auth token
- `LIMIT_REACHED` - Free tier usage limit exceeded
- `PREMIUM_REQUIRED` - Feature requires premium subscription
- `INVALID_BODY` - Invalid request body
- `NOT_FOUND` - Resource not found

## License

MIT
