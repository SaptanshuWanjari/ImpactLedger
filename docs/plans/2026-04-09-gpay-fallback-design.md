# GPay QR Fallback Design

## Context
Razorpay setup requires more time, so we need a simple GPay QR fallback to accept payments manually. 

## Approach
Client-side payment toggle + static GPay QR image with a manual backend record creation.

### 1. User Interface (Donate Flow)
- Update `src/app/donate/page.tsx` to include "Google Pay QR (Manual)" alongside "UPI via Razorpay".
- If GPay is selected, instead of launching the Razorpay checkout modal, present a static QR image to the user.
- Add an "I've Paid" button for the user to confirm manual completion.

### 2. Backend Updates
- Update `/api/payments/checkout-session/route.ts` to accept a `provider` flag (`razorpay` | `gpay`).
- If `provider === "gpay"`, bypass the Razorpay order creation (`createRazorpayOrder`).
- Insert the `donation` and `donation_ledger` records with `payment_provider: "gpay"` and `status: "pending"`.
- Return the `donationId` and a flag `manual: true` to the frontend.

### 3. Manual Success Page
- Create `src/app/donate/manual-success/page.tsx` for users completing the GPay flow.
- Display a confirmation message: "Thank you. We will manually verify your GPay QR payment soon."

## Security & Verification
- No automated webhooks for GPay. Admins will verify receipts manually via the UPI app.
- Donation records stay `pending` until manually marked as `succeeded` in the admin dashboard.
