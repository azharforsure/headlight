<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Headlight

## Local setup

Prerequisites: Node.js

1. Install dependencies with `npm install`.
2. Add app env vars in `.env.local`.
3. Run the app with `npm run dev`.

Required client env vars:
- `GEMINI_API_KEY`
- `VITE_CLERK_PUBLISHABLE_KEY`
- `VITE_TURSO_DATABASE_URL`
- `VITE_TURSO_AUTH_TOKEN`
- `VITE_GHOST_BRIDGE_URL` or `VITE_APP_BRIDGE_URL`

## Worker setup

The Cloudflare Worker now handles:
- crawler HTML bridge
- `POST /api/billing/checkout`
- `POST /api/billing/portal`
- `POST /api/webhooks/stripe`
- `GET /api/health`

Set Worker secrets before deploy:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `CLERK_SECRET_KEY`
- `STRIPE_TRIAL_DAYS` optional

Deploy with:
- `npm run deploy:bridge`

## Clerk setup

1. Create a Clerk application.
2. Enable Email/Password and any social providers you want.
3. Add your local origin, for example `http://localhost:5173`.
4. Add your production domain before release.
5. Put the publishable key in `.env.local` as `VITE_CLERK_PUBLISHABLE_KEY`.
6. Keep the Clerk secret key server-side only for Workers or backend routes.

## Production notes

- Billing routes now require a valid Clerk bearer token from the signed-in app session.
- Stripe webhooks should point to `/api/webhooks/stripe`.
- Stripe subscription events update Clerk private metadata so the app can read `subscription_status` and `stripe_customer_id`.
