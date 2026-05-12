# PayPulse - Premium Fintech Payment Collection

PayPulse is a professional payment collection system designed for businesses to initiate real-time M-Pesa payment prompts (STK Push) and track transaction statuses in a sleek, mobile-ready dashboard.

## Features
- **M-Pesa STK Push**: Initiate payments directly from the dashboard to customer phones.
- **Real-time Monitoring**: Instant status updates (Pending, Completed, Failed) via Firebase onSnapshot.
- **Secure Dashboard**: Admin and Staff roles with Firebase Authentication.
- **Analytics**: Key performance indicators like Total Revenue and Success Rate.
- **Transaction History**: Detailed logs with M-Pesa receipt references.
- **Full Audit Trail**: Automatic logging of sensitive system actions.
- **Export**: Export transaction data to CSV for external reporting.

## Tech Stack
- **Frontend**: React 19, Tailwind CSS 4, Motion (Animations), Lucide icons.
- **Backend**: Node.js + Express (Handles M-Pesa Daraja API & Callbacks).
- **Database**: Google Firestore (NoSQL).
- **Auth**: Firebase Google Authentication.

## Setup Instructions
1. **M-Pesa Credentials**: Obtain your `Consumer Key`, `Consumer Secret`, `Shortcode`, and `Passkey` from [Safaricom Daraja Portal](https://developer.safaricom.co.ke/).
2. **Environment Variables**: Populate the following in your environment or Secrets panel:
   - `MPESA_CONSUMER_KEY`
   - `MPESA_CONSUMER_SECRET`
   - `MPESA_SHORTCODE`
   - `MPESA_PASSKEY`
   - `MPESA_ENVIRONMENT` (sandbox or production)
   - `APP_URL` (Automatically set in AI Studio)

## API Endpoints
- `POST /api/mpesa/stkpush`: Initiates an STK Push.
- `POST /api/mpesa/callback`: Webhook handling incoming payment notifications from Safaricom.

## Security
- **ABAC (Attribute-Based Access Control)**: Enforced via Firestore Security Rules.
- **Secure Backend**: Sensitive API keys never exposed to the client.
- **Validation**: Strict schema validation for all writes.
