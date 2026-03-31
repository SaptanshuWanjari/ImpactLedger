import { redirect } from "next/navigation";
import { ADMIN_ALLOWED_ROLES, getAuthContext, getHomePathForRole, hasAllowedRole } from "@/lib/server/auth";

type AdminLayoutProps = {
  children: React.ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const context = await getAuthContext();

  if (!context) {
    redirect("/auth/login?next=/admin");
  }

  if (!hasAllowedRole(context.role, ADMIN_ALLOWED_ROLES)) {
    redirect(getHomePathForRole(context.role));
  }

  return <>{children}</>;
}
