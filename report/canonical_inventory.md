# ImpactLedger Canonical Inventory (Code-Grounded)

## 1) Tech stack
- Frontend: `next` + `react` (App Router pages in `src/app/**/page.tsx`)
- Backend: Next.js route handlers in `src/app/api/**/route.ts`
- Data layer: Supabase/PostgreSQL schema in `supabase/schema.sql`
- Auth: Supabase auth and tenant-role resolution in `src/lib/server/auth.ts`
- Payments: Razorpay integration and webhook verification in `src/lib/server/razorpay.ts` and `src/app/api/payments/razorpay/webhook/route.ts`
- Email/PDF: invoice dispatch (`src/lib/server/invoice.ts`) and in-house PDF generation (`src/lib/server/pdf.ts`)
- Tooling: scripts in `package.json` (`lint`, `test`, `build`)

## 2) Role model
- `donor`
- `volunteer`
- `org_admin`

Defined and enforced in:
- `src/lib/server/auth.ts`
- `supabase/schema.sql` (`tenant_memberships.role` check)

## 3) Page route inventory (App Router)
- Public: `/`, `/about`, `/campaigns`, `/campaigns/[id]`, `/donate`, `/donate/success`, `/donate/cancel`, `/donate/manual-success`, `/impact`, `/transparency`, `/terms`, `/privacy`, `/cookies`
- Auth: `/auth/login`, `/auth/signup`
- Donor: `/donor`, `/donor/donations`
- Volunteer: `/volunteer`, `/volunteer/assignments`, `/volunteer/assignment`, `/volunteer/logs`, `/volunteer/resources`, `/volunteer/verification`
- Admin: `/admin`, `/admin/campaigns`, `/admin/donors`, `/admin/operations`, `/admin/reports`, `/admin/analytics`, `/admin/settings`

Primary evidence: `src/app/**/page.tsx`

## 4) API endpoint inventory
- Auth:
  - `POST /api/auth/provision`
  - `GET /auth/callback` (route handler under app auth)
  - `POST /auth/signout` (route handler under app auth)
- Public:
  - `GET /api/public/overview`
  - `GET /api/campaigns`
  - `GET /api/campaigns/[id]`
  - `GET /api/transparency`
  - `GET /api/health/supabase`
- Donations/payments:
  - `GET /api/donations`
  - `POST /api/donations`
  - `GET /api/donations/[id]/status`
  - `POST /api/donations/[id]/invoice`
  - `POST /api/payments/checkout-session`
  - `POST /api/payments/verify`
  - `POST /api/payments/razorpay/webhook`
  - `POST /api/payments/stripe/webhook` (deprecated; returns 410)
- Donor:
  - `GET /api/donor/dashboard`
  - `GET /api/donor/donations`
- Volunteer:
  - `GET /api/volunteer/dashboard`
  - `GET /api/volunteer/assignments`
  - `POST /api/volunteer/assignments`
  - `GET /api/volunteer/logs`
  - `GET /api/volunteer/resources`
  - `GET /api/volunteer/verification`
- Admin:
  - `GET /api/admin/dashboard`
  - `GET /api/admin/campaigns`
  - `GET /api/admin/donors`
  - `GET /api/admin/operations`
  - `POST /api/admin/operations`
  - `GET /api/admin/reports`
  - `GET /api/admin/analytics`
  - `GET /api/admin/manual-donations`
  - `POST /api/admin/manual-donations`
  - `GET /api/admin/settings/organization`
  - `GET /api/admin/settings/membership`
  - `GET /api/admin/settings/integrations`
  - `GET /api/admin/settings/security`

Primary evidence: `src/app/api/**/route.ts`

## 5) Data entities
- `tenants`
- `profiles`
- `tenant_memberships`
- `donors`
- `campaigns`
- `campaign_updates`
- `donations`
- `donation_ledger`
- `allocation_ledger`
- `expenses`
- `volunteer_profiles`
- `volunteer_assignments`
- `field_reports`
- `audit_logs`
- `payment_webhook_events`
- `stripe_webhook_events`

Primary evidence: `supabase/schema.sql`

## 6) Core implemented feature domains
- Campaign discovery and campaign detail
- Donation checkout + order creation
- Payment verification + webhook reconciliation
- Receipt generation + invoice dispatch
- Donor dashboard and donation history
- Volunteer dashboard + assignments/logs/resources/verification
- Admin dashboard + donors + campaigns + operations + reports + analytics + settings
- Transparency ledger and public overview

Evidence:
- `src/app/**/page.tsx`
- `src/app/api/**/route.ts`
- `src/lib/server/data.ts`
