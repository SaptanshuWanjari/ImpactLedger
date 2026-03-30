[
  {
    "schemaname": "public",
    "tablename": "campaigns",
    "policyname": "members can manage campaigns",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "ALL",
    "using_expression": "app.is_tenant_member(tenant_id)",
    "with_check": "app.is_tenant_member(tenant_id)"
  },
  {
    "schemaname": "public",
    "tablename": "campaigns",
    "policyname": "public can read active campaigns",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "SELECT",
    "using_expression": "((status = ANY (ARRAY['active'::campaign_status, 'urgent'::campaign_status, 'completed'::campaign_status])) OR app.is_tenant_member(tenant_id))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "tenant_memberships",
    "policyname": "tenant members can read memberships",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "SELECT",
    "using_expression": "app.is_tenant_member(tenant_id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "tenants",
    "policyname": "tenant members can read tenants",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "command": "SELECT",
    "using_expression": "app.is_tenant_member(id)",
    "with_check": null
  }
]
