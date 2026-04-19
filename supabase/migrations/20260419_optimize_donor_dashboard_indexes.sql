-- Optimize donor dashboard and donor history lookup paths.

create index if not exists idx_donations_tenant_donor_donated_at
  on public.donations (tenant_id, donor_id, donated_at desc)
  where donor_id is not null;

create index if not exists idx_donation_ledger_tenant_donation_event_occurred_at
  on public.donation_ledger (tenant_id, donation_id, event_type, occurred_at desc);
