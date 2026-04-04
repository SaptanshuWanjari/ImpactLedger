1. MVP gap: Admin campaign CRUD is not implemented (currently read-only list via GET /api/admin/campaigns).
2. MVP gap: Volunteer onboarding and admin-side assignment management are missing (volunteers can view assignments and submit reports, but admin
   assignment workflow is not present).
3. MVP gap: Expense workflow has submission only; approval flow and status transitions (submitted -> approved -> paid/reconciled) are not implemented.
4. MVP gap: Allocation mapping is not implemented in APIs/workflows (table exists, but no create/adjust/release flows tied to donations+expenses).
5. MVP reliability gap: Stripe webhook handling is synchronous; PRD calls for quick ack + async/queued processing.
6. MVP audit gap: Audit logging is partial (donation create present), but privileged + financial actions are not comprehensively logged.
7. MVP UX gap: Transparency page search/filter is still disabled placeholder; no server filtering.
8. Current quality issue: Integration tests mostly pass (10/11), but GET /api/public/overview failed once with transient Supabase fetch failed (flaky
   reliability issue).
9. Phase 1 not implemented: Recurring donations (subscription flow + donor self-service portal).
10. Phase 1 not implemented: Volunteer check-in/out, scheduled shifts, report SLA reminders.
11. Phase 1/2 not implemented: Allocation-to-expense drill-down transparency, reconciliation tooling, undelivered-event processing tooling.
12. Phase 2/not started: Notifications system (email/SMS/in-app trigger catalog), compliance exports (e.g., 10BD/10BE), donor/volunteer data-rights
    workflows, admin MFA/step-up controls.
