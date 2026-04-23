"use client";

import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronDown, LogOut, LayoutDashboard } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { isRbacEnabled } from "@/lib/config/rbac";

const ProfileDropdown = ({ onLogout }: { onLogout?: () => void } = {}) => {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData.session?.user?.id;
        if (!userId) return;

        setUserEmail(sessionData.session?.user?.email ?? null);

        // Fetch name from `profiles` and role from `tenant_memberships` in parallel
        const tenantId = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID;
        const membershipQuery = tenantId
          ? supabase.from("tenant_memberships").select("role").eq("user_id", userId).eq("tenant_id", tenantId).maybeSingle()
          : supabase.from("tenant_memberships").select("role").eq("user_id", userId).maybeSingle();

        const [profileRes, membershipRes] = await Promise.all([
          supabase.from("profiles").select("full_name").eq("id", userId).single(),
          membershipQuery,
        ]);

        if (profileRes.error) console.warn("profile fetch error", profileRes.error);
        if (membershipRes.error) console.warn("membership fetch error", membershipRes.error);

        setFullName(profileRes.data?.full_name ?? null);
        setRole(membershipRes.data?.role ?? null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [supabase]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out", {
        description: error.message,
        position: "bottom-right",
      });
    } else {
      toast.success("Signed out", { position: "bottom-right" });
      router.push("/");
      router.refresh(); // Refresh to update navbar state if needed
      if (onLogout) onLogout();
    }
  };

  if (loading || !userEmail) return null;

  const rbacEnabled = isRbacEnabled();

  let dashboardLink = "/profile";
  let displayRole = "Dashboard";

  if (!rbacEnabled) {
    dashboardLink = "/admin"; // Default to admin if RBAC is disabled
  } else if (role) {
    const lowerRole = role.toLowerCase();
    if (lowerRole === "admin" || lowerRole === "org_admin") {
      dashboardLink = "/admin";
      displayRole = "Admin Dashboard";
    } else if (lowerRole === "volunteer") {
      dashboardLink = "/volunteer";
      displayRole = "Volunteer Dashboard";
    } else if (lowerRole === "donor") {
      dashboardLink = "/donor";
      displayRole = "Donor Dashboard";
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 px-4 py-2 rounded-full border-gray-200 hover:bg-gray-100 transition-colors shadow-sm"
        >
          <span className="text-sm font-medium text-gray-700">
            {fullName || userEmail.split("@")[0]}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-56 mt-2 rounded-xl border border-gray-200 shadow-lg bg-white"
      >
        <DropdownMenuLabel className="px-4 py-3">
          <p className="font-semibold text-gray-900">
            {fullName || userEmail.split("@")[0]}
          </p>
          <p className="text-xs text-gray-500 truncate">{userEmail}</p>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-gray-100" />

        <DropdownMenuItem
          asChild
          className="cursor-pointer px-4 py-3 hover:bg-gray-50 transition-colors"
        >
          <Link href={dashboardLink} className="flex items-center w-full">
            <LayoutDashboard className="h-4 w-4 mr-3 text-gray-600" />
            <span className="text-sm text-gray-700 capitalize">
              {displayRole}
            </span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-gray-100" />

        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer px-4 py-3 text-red-600 hover:bg-red-400 hover:text-red-700 transition-colors focus:bg-red-400 focus:text-red-700"
        >
          <LogOut className="h-4 w-4 mr-3" />
          <span className="text-sm">Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileDropdown;
