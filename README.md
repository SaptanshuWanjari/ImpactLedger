# ImpactLedger Supabase Setup

## RBAC Toggle (Development)

To disable RBAC route and API guards during development, set either env var:

```bash
ENABLE_RBAC=false
# or
NEXT_PUBLIC_ENABLE_RBAC=false
```

Default is enabled (`true`).

## Payments (Razorpay)

Required env vars:

```bash
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Webhook endpoint:

```bash
/api/payments/razorpay/webhook
```
