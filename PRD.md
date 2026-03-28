# Improved PRD for Lions NGO Management System

## Executive summary and product definition

### Problem statement
Lions Club–style NGOs typically run on a fragmented stack: a public donation page, spreadsheets for donor records and expense tracking, ad‑hoc volunteer coordination (WhatsApp), and inconsistent reporting to donors. This leads to avoidable failure modes: incomplete payment reconciliation, weak auditability, donor trust erosion due to unclear fund utilization, and operational inefficiency in dispatching volunteers across campaigns.

Stripe’s nonprofit guidance frames “nonprofit payment processing” as the behind-the-scenes system that **securely accepts, verifies, and transfers digital donations**, and emphasizes that the best tooling reduces donor friction while ensuring the right data lands in the correct place. citeturn0search0  
At the same time, a robust donation platform cannot rely on front-end confirmation alone: Stripe explicitly recommends using **webhooks** to monitor successful payments and complete business workflows asynchronously. citeturn6view3turn8view1

### Product vision
Build a unified system that combines:
- Public fundraising (high-conversion donation + trust building)
- Donor CRM (profiles, receipts, engagement)
- Fund accounting primitives (restricted vs unrestricted, allocations, expense approvals, audit)
- Volunteer operations (campaign planning, dispatch, check-ins, field reporting)
- Transparency engine (donor-facing fund utilization updates tied to real expenses)

### Tenancy model
The PRD should treat LNMS as “multi-tenant ready” from day one: one deployment can support multiple Lions chapters/NGOs, each isolated by tenant boundaries. Multi-tenant systems create cross-tenant leakage risks; OWASP explicitly highlights tenant isolation as a core security challenge in multi-tenant applications. citeturn5search2  
If you later want to operate this as a SaaS, tenant isolation will become a hard non-negotiable—not a refactor. citeturn5search2turn5search26

### Goals and measurable success criteria
**Fundraising conversion & retention**
- Donation completion rate, step drop-off, recurring conversion rate (one-time → monthly)
- Refund/dispute rate (payments quality signal)
- Donor repeat rate (90-day, 1-year)

**Operational throughput**
- Time to staff a campaign (campaign created → roles filled)
- Volunteer check-in compliance (% assignments checked-in/out)
- Field report SLA (% reports submitted within N hours of shift end)

**Transparency & auditability**
- % donations fully mapped: donation → allocation → expense → donor update
- Audit log completeness for privileged actions (role changes, export, expense approvals)

## Users, roles, and permissions

### Personas and role set
The initial PRD’s 4-role model is a good start, but real NGOs need finer separation of duties—especially around funds and communications. This PRD uses a minimum set of roles with **least privilege** and **separation of duties**.

**Public / Donor**
- **Guest Donor**: donate without account; optionally claim an account later
- **Registered Donor**: donation history, receipts, impact/fund usage, preferences

**Volunteer operations**
- **Volunteer**: availability, assignments, check-in/out, field forms, uploads
- **Campaign Coordinator**: dispatch volunteers, manage tasks, approve field reports

**Finance & governance**
- **Finance Admin**: allocations, expenses, reimbursements, reconciliation, exports
- **Org Admin**: manage org profile, roles, permissions, integrations (Stripe, email)

**Platform**
- **Super Admin** (optional SaaS): create/disable tenants, global audit, policy controls

OWASP defines authorization as verifying a requested action is approved for an entity and stresses the distinction from authentication; for this system, consistent authorization design is essential because many objects are tenant-scoped and role-scoped. citeturn1search0

### Access control model
Use a hybrid:
- **RBAC** for broad role capabilities (donor/volunteer/finance/campaign admin)  
- **Attribute-based checks** for resource scope (tenant_id, campaign_id, assignment_id ownership)

OWASP’s multi-tenant security guidance emphasizes preventing cross-tenant data leakage; your authorization layer must always enforce tenant context, not just hide menu items. citeturn5search2turn1search0

### Permission matrix baseline
A simplified matrix (expand during implementation):

| Resource | Donor | Volunteer | Coordinator | Finance Admin | Org Admin |
|---|---|---|---|---|---|
| Donate | Create | — | — | — | Configure |
| Donor profile | Self read/update | — | — | Read (selected) | Read (selected) |
| Campaigns | Read | Read | CRUD | Read | CRUD |
| Assignments | — | Self read/update | CRUD | Read | CRUD |
| Field Reports | View own | Create own | Review/approve | Read | Read |
| Donations ledger | Self read | — | Read (campaign totals) | Read/export | Read/export |
| Allocations | View (summarized) | — | Read | CRUD | CRUD |
| Expenses | View (summarized) | — | Submit (optional) | CRUD + approve | CRUD |
| Roles/Users | — | — | Limited | Limited | CRUD |
| Audit log | — | — | Read (campaign) | Read | Read/export |

Additionally, adopt ASVS-aligned access-control practices: enforce access checks server-side, log access control failures, and protect against insecure direct object reference patterns. citeturn4search6turn1search0

## Functional requirements and user journeys

### Public website and donation flow
**Public pages**
- Landing, About, Campaigns listing + details, Transparency overview, Contact
- Donation flows must be mobile-first and friction-reducing, while capturing necessary donor metadata for reporting and receipts. Stripe’s nonprofit guide stresses reducing donor friction and ensuring data ends up in the right place. citeturn0search0

**Donation modes**
- One-time donation (general fund or designated campaign)
- Recurring donation (monthly default; configurable) using Stripe Billing/Checkout patterns for recurring payments. Stripe describes multiple ways to accept recurring donations and recurring payments, including Checkout and customer self-service portal. citeturn5search3turn5search23

**Payment UI integration decision**
- **MVP recommended**: Stripe Checkout redirect flow (Stripe-hosted payment page) because it reduces custom UI/security complexity. Stripe’s Checkout quickstart describes redirecting to a Stripe-hosted payment page. citeturn0search1
- **Phase 2**: Embedded Payment Element when you need a fully integrated branded checkout inside your site. (This remains Stripe-hosted fields, but embedded.) citeturn6view3turn10view0

### Payment processing reliability and correctness
**Source of truth rules**
- The LNMS database is the **system of record** for donors, allocations, expenses, and campaign outcomes.
- Stripe is the **system of record** for payment status and financial transaction objects.
- Client-side “success pages” are never authoritative.

Stripe explicitly warns against handling fulfillment on the client side because users can leave after payment; instead, handle completion using webhooks (e.g., `payment_intent.succeeded`). citeturn6view3

**Webhook handling requirements**
- Verify signatures using Stripe signing secret; Stripe documents that every signed event includes a `Stripe-Signature` header and recommends signature verification, plus timestamp tolerance to mitigate replay attacks. citeturn6view1turn2search2
- Return a `2xx` quickly and process asynchronously; Stripe states handlers should return success before complex logic to avoid timeouts, and recommends asynchronous queue processing for scalability. citeturn6view0turn8view0turn8view1
- Duplicate events are expected; Stripe states webhook endpoints might receive the same event more than once and recommends logging processed event IDs to prevent duplicate processing. citeturn8view0
- Event ordering is not guaranteed; Stripe explicitly says it doesn’t guarantee event delivery order, so the system must not depend on a strict sequence. citeturn8view1
- Retry behavior: Stripe automatically retries undelivered events for up to three days; LNMS must be resilient to delayed deliveries and provide reconciliation tooling. citeturn7search1turn8view1

**Events to support (minimum)**
- One-time donations: `payment_intent.succeeded`, `payment_intent.payment_failed` (or `checkout.session.completed` if using Checkout) citeturn6view3turn6view2
- Refunds: integrate Refunds API + webhook handling for `charge.refunded`/refund-related events; Stripe supports full/partial refunds and cancellations. citeturn4search3turn4search15
- Disputes: listen and notify for `charge.dispute.created`; Stripe documents disputes APIs for responding programmatically when needed. citeturn2search3turn9search3

**Receipts**
- Enable Stripe receipts/invoices as proof of payment where appropriate; Stripe documents receipts and paid invoices options (especially relevant for recurring via invoices). citeturn4search7turn4search23

### Donor CRM and transparency engine
**Donor profile**
- Identity: name, email, phone, address (optional), consent preferences
- Donation history: by date/campaign, payment status
- Receipts: downloadable receipts/invoices, tax certificates (region module)
- Preferences: recurring management, communication opt-in/out, anonymity preferences

**Donor transparency**
- Donors see:
  - Donation → designation (campaign/general)
  - Allocation (planned) and utilization (actual) mapped to expense categories
  - Milestone updates (campaign progress)
- Donor update delivery:
  - Triggered updates: donation confirmed, campaign milestone reached, campaign closed
  - Periodic digest: monthly “Your impact” statement

This feature is directly aligned with donor intent management: nonprofit accounting standards distinguish resources with and without donor-imposed restrictions; the product should support donor restrictions and clear reporting. citeturn2search0turn1search15

### Fund management, allocations, and expense workflows
To make “notify donors about their fund usage” credible, LNMS must implement *fund-accounting-like* primitives.

**Core accounting concepts to model**
- **Restricted vs unrestricted**: Nonprofits often classify net assets as “with donor restrictions” and “without donor restrictions,” rather than older three-class models; ASU 2016-14 explicitly uses these two buckets. citeturn2search0turn2search34
- **Release from restrictions**: when restriction conditions are met, funds move from restricted to usable for expenses (conceptually; implement as reclassification events). citeturn2search4turn2search0

**Allocation workflow**
1. Donation recorded (Stripe-confirmed)
2. Funds assigned to:
   - General fund (unrestricted) OR
   - Restricted campaign fund OR
   - Restricted category (e.g., medical supplies)
3. Allocation rules validate donor restrictions
4. Allocation events recorded in immutable ledger
5. Spending allowed only against available allocated balance

**Expense workflow (minimum viable approval)**
- Draft → Submitted → Approved → Paid/Posted → (Optional) Reconciled
- Required fields: campaign/program, category, vendor/payee, amount, date, receipt upload, notes
- Approval policy: amount thresholds; two-person approval for high-value spend (configurable)

**Reconciliation**
- Finance admin can reconcile Stripe payouts/transactions against LNMS donation ledger.
- System must support Stripe’s retry + delayed event delivery realities by offering reconciliation queries and “undelivered event processing” playbook. citeturn7search1turn8view1

### Volunteer operations and dispatch
Volunteer dispatch becomes far more manageable when treated like structured incident/campaign operations.

**Campaign structure**
- Campaign: objectives, location(s), timeline, roles needed, budget plan, risk notes
- Shifts: time blocks with capacity and required skills
- Assignments: volunteer ↔ shift ↔ role, with state machine:
  - Proposed → Assigned → Accepted → Checked-in → Completed → Report submitted → Reviewed

**Dispatch principles**
While LNMS isn’t an emergency responder tool, incident-management frameworks like ICS emphasize integrating people, procedures, communications, and resource coordination under a common structure—conceptually similar to volunteer dispatch needs. citeturn11search3

**Volunteer check-in/out**
- Web/mobile check-in (QR optional)
- Attendance logs feed:
  - Volunteer hours reports
  - Campaign staffing analytics
  - Audit trail

### Field data collection and verification
Your PRD includes “their data collection,” which implies field forms, attachments, and offline capability.

**Field form system requirements**
- Form templates per campaign type (e.g., medical camp, food distribution)
- Support repeatable sections (multiple beneficiaries), constraints, and logic
- Offline-first draft capture, then sync when online

ODK Collect exemplifies proven patterns: offline form filling, logic/constraints, repeating sub-structures, and syncing filled forms later—this is a validated model for real-world field data collection. citeturn11search0

**Report review**
- Coordinator review: approve/return for corrections
- Data quality checks: missing required metrics, invalid ranges, duplicate beneficiary identifiers (when applicable)

### Notifications and communication
**Channels**
- Email (required)
- SMS/WhatsApp (optional, pluggable provider)
- In-app notifications

**Trigger catalog**
- Donation confirmed / failed
- Recurring payment success/failure
- Refund initiated/completed
- Campaign assignment issued; volunteer acceptance reminder
- Report due reminder; report approved
- Fund utilization update published

### Compliance and region modules
Because you’re in Asia/Kolkata, India compliance is a common requirement for NGOs that issue tax-deduction certificates.

**India module (optional but recommended if operating in India)**
- If the NGO is approved under Section 80G: support generating donor certificates and reporting
- Income Tax Department guidance indicates NGOs approved under section 80G must furnish a donation statement in **Form 10BD** and issue donation certificate **Form 10BE** (via Rule 18AB). citeturn4search1  
This implies the system should store donor identifiers required by those forms and generate export files / structured reports (exact legal formatting validated with a CA).

## Data model, trust, and auditability

### Multi-tenant data model
**Core tenant objects**
- Tenant/Organization
- Users (global identity) + TenantMembership (role per tenant)
- Campaigns (tenant-scoped)
- Donations, Allocations, Expenses (tenant-scoped)
- Volunteers (tenant-scoped profile layer)

**Isolation enforcement**
- Enforce `tenant_id` at:
  - Query layer (always)
  - Authorization layer (always)
  - Database-level constraints / policies (recommended)

OWASP’s multi-tenant guidance stresses that a single vulnerability or misconfiguration can expose all tenants’ data; implement defense-in-depth for tenant isolation. citeturn5search2turn5search26

### Immutable ledgers and logs
Your current PRD says “immutable logs,” but to make that implementable, define two ledgers:

**Donation ledger**
- Rows are append-only events:
  - donation_created (pending)
  - donation_confirmed (Stripe succeeded)
  - donation_failed
  - donation_refunded (partial/full)
  - donation_disputed (if relevant)
- Each ledger entry includes:
  - tenant_id, donor_id, campaign_id, amount, currency
  - Stripe object references (PaymentIntent/Charge/CheckoutSession IDs)
  - event_time, source (“stripe_webhook”, “admin_action”)
  - idempotency key / Stripe event ID to prevent duplicates

Stripe’s webhook best practices explicitly recommend logging event IDs to handle duplicate deliveries, and note events can arrive out of order. citeturn8view0turn8view1  
Stripe’s API explicitly supports idempotent requests using idempotency keys for safe retries on create/update. citeturn5search1turn5search5

**Allocation & spending ledger**
- allocation_created (donation → fund/campaign bucket)
- allocation_adjusted (correction)
- expense_posted (spend against allocation)
- restriction_released (if modeled)
- Each expense references uploaded receipt assets and approval events

### Audit log requirements
OWASP emphasizes that custom application event logging is often missing or poorly configured and is critical beyond infrastructure logs. citeturn0search2turn0search22

Audit log must record:
- Authentication events (login, logout, MFA changes)
- Authorization failures (access control denies)
- Privileged actions (role updates, export, Stripe config changes)
- Financial actions (allocation edits, expense approvals, refunds initiated)

Audit log properties:
- Append-only, tamper-evident storage policy (at least integrity controls)
- Search by actor, action, target, date range
- Exportable for auditors (admin-only)

### Data retention and data subject rights
If you serve donors from jurisdictions with privacy laws, you need a data governance model:
- Minimize collection to what’s necessary and declare purposes clearly (especially on donation forms). GDPR Article 5 establishes purpose limitation, data minimization, storage limitation, and integrity/confidentiality as core principles. citeturn4search0turn4search24
- If operating in India, DPDP Act 2023 establishes obligations of the Data Fiduciary including consent/notice and data principal rights like correction and erasure. citeturn3search0

In practice, LNMS must provide:
- Export “My Data” for donors/volunteers (self-service)
- Admin workflow to respond to deletion/correction requests (subject to financial record retention needs)

## Non-functional requirements and compliance

### Security and payments compliance
**PCI DSS and Stripe integration**
Stripe’s Integration Security Guide states PCI DSS applies to anyone storing/processing/transmitting card data, and that PCI compliance is a shared responsibility; Stripe is audited as a PCI Level 1 service provider, while your business must still attest annually. citeturn10view0turn10view1  
This PRD therefore requires:
- Use low-risk Stripe integrations so untokenized PAN never touches LNMS servers; Stripe states this reduces PCI obligations for many business models. citeturn10view0
- Never store raw card data; store only non-sensitive card metadata returned by Stripe (brand, last4, expiry), which Stripe describes as out-of-scope card data that can be stored. citeturn10view0

**Webhook security**
- Signature verification + timestamp tolerance to mitigate replay attacks. citeturn6view1turn2search2
- Respond quickly (2xx) and queue processing. citeturn6view0turn8view0
- Handle duplicates and out-of-order delivery. citeturn8view0turn8view1
- Implement “process undelivered events” operational runbook since Stripe retries up to three days. citeturn7search1turn8view1

**Authentication & sessions**
- Enforce secure sessions (HTTPOnly cookies, secure attributes, rotation policies where applicable) and protect session identifiers; OWASP session guidance defines web sessions and highlights the importance of correct session handling. citeturn1search1
- Admin MFA: OWASP defines MFA as requiring more than one factor and provides implementation guidance; require MFA for Org Admin and Finance Admin roles. citeturn1search2
- For sensitive actions (export donors, change payout/webhook settings), require re-authentication/step-up.

**Authorization**
- Follow OWASP authorization guidance and enforce decisions server-side; log access control failures. citeturn1search0turn4search2

### Privacy and regulatory posture
- Publish clear privacy notice and consent capture for communications.
- Apply GDPR principles (lawfulness, purpose limitation, data minimization, storage limitation) where applicable. citeturn4search0turn4search24
- If operating in India, implement DPDP Act-aligned notice/consent and data subject rights workflow (access, correction, erasure, grievance). citeturn3search0

### Accessibility and UX quality bars
Target WCAG 2.2 AA. WCAG 2.2 includes specific success criteria relevant to this product, including error identification, error prevention for financial/data actions, and re-authentication/timeouts experiences. citeturn0search3  
Key requirements:
- All forms (donation, expense, volunteer report) must provide text-based error identification and guidance. citeturn0search3turn0search19
- Status messages for async actions (payment processing, export job started) must be announced accessibly. citeturn0search3

### Reliability, scalability, and observability
- Queue-based webhook processing (to prevent timeouts and handle spikes); Stripe explicitly recommends asynchronous processing to avoid overwhelming endpoints during spikes (e.g., subscription renewals). citeturn8view0
- Implement SLOs:
  - Public donation availability (e.g., 99.9%)
  - Webhook ingestion success rate
  - Time to reflect confirmed donation in donor dashboard (P95)

Logging:
- Security logs must be protected against tampering and unauthorized access; OWASP logging guidance emphasizes building robust application logging. citeturn0search2turn0search22

## Delivery plan, milestones, and test strategy

### MVP scope
**MVP goal**: launch a credible donation + transparency + basic volunteer ops platform with correct payment handling (webhook-driven) and minimum auditability.

MVP includes:
- Public site + campaigns + donation flow (Stripe Checkout recommended) citeturn0search1turn0search0
- Webhook service with signature verification, dedupe, and async processing citeturn6view1turn8view0turn8view1
- Donor dashboard (history, receipts link, simplified utilization summaries) citeturn4search7turn4search23
- Admin: campaign CRUD, volunteer onboarding + assignments, expense entry + approval, basic allocation mapping
- Audit log for privileged + financial actions citeturn0search2

### Phase plan
**Phase one**
- Recurring donations (Stripe Billing/Checkout subscription flow), donor self-service portal session (optional) citeturn5search3turn5search19
- Enhanced transparency: drill-down from allocation to expense receipts
- Volunteer check-in/out, scheduled shifts, report SLA

**Phase two**
- Offline-first mobile field reporting with form templates and richer logic (ODK-inspired patterns) citeturn11search0
- Advanced reconciliation and “undelivered event processing” admin tooling citeturn7search1turn7search2
- Multi-tenant SaaS hardening (tenant isolation controls, tenant-level policies) citeturn5search2turn5search26
- India/region compliance module (Form 10BD/10BE exports) if needed citeturn4search1

### Testing strategy
Payments and auditability have a “high blast radius,” so testing is not optional.

**Stripe integration testing**
- Use Stripe CLI triggers to generate events such as `payment_intent.succeeded` for local webhook testing; Stripe documents event triggering via CLI. citeturn2search33turn7search0
- Simulate duplicate deliveries and out-of-order deliveries; ensure idempotent processing per Stripe webhook guidance. citeturn8view0turn8view1
- Validate refund flows using Stripe refunds docs. citeturn4search3

**Security testing**
- Access control tests aligned with ASVS access control verification categories (function-level checks, IDOR prevention, server-side enforcement, logging failures). citeturn4search6turn4search2
- Session management tests guided by OWASP session guidance. citeturn1search1

**Accessibility testing**
- Validate forms and dashboards against WCAG 2.2 criteria on errors and status messages. citeturn0search3turn0search19

**Operational resilience**
- Webhook endpoint chaos tests: timeout, 500 errors, downstream queue failures—confirm Stripe retries and LNMS recovers without double-posting donations. citeturn7search1turn8view0turn8view1