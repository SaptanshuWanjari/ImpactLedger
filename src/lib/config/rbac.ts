function parseBoolean(value: string | undefined, fallback = true) {
  if (value == null) return fallback;
  const normalized = value.trim().toLowerCase();
  if (["0", "false", "off", "no"].includes(normalized)) return false;
  if (["1", "true", "on", "yes"].includes(normalized)) return true;
  return fallback;
}

export function isRbacEnabled() {
  const value = process.env.ENABLE_RBAC ?? process.env.NEXT_PUBLIC_ENABLE_RBAC;
  return parseBoolean(value, true);
}

