-- Recreate reporting views expected by the application layer.

create or replace view public.campaign_funding_summary as
with donation_totals as (
  select
    d.tenant_id,
    d.campaign_id,
    coalesce(
      sum(
        case
          when d.status in ('succeeded', 'refunded', 'disputed') then d.amount
          else 0
        end
      ),
      0
    ) as raised_amount
  from public.donations d
  where d.campaign_id is not null
  group by d.tenant_id, d.campaign_id
)
select
  c.id,
  c.tenant_id,
  c.title,
  c.description,
  c.category,
  c.location,
  c.image_url,
  c.goal_amount,
  c.currency,
  c.status,
  c.urgency,
  c.starts_at,
  c.ends_at,
  c.created_at,
  c.updated_at,
  coalesce(dt.raised_amount, 0) as raised_amount,
  case
    when c.goal_amount > 0
      then least(100, round((coalesce(dt.raised_amount, 0) / c.goal_amount) * 100))
    else 0
  end as progress_percent
from public.campaigns c
left join donation_totals dt
  on dt.tenant_id = c.tenant_id
 and dt.campaign_id = c.id;

create or replace view public.transparency_ledger as
select
  dl.id,
  dl.tenant_id,
  dl.occurred_at,
  dl.event_type,
  dl.amount,
  coalesce(c.title, 'General Fund') as campaign,
  coalesce(c.location, 'Global') as location,
  coalesce(c.category, 'General') as category
from public.donation_ledger dl
left join public.campaigns c
  on c.id = dl.campaign_id
 and c.tenant_id = dl.tenant_id;

grant select on public.campaign_funding_summary to anon, authenticated, service_role;
grant select on public.transparency_ledger to anon, authenticated, service_role;
