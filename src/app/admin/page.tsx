"use client";

import AdminSidebar from "@/components/AdminSidebar";
import { motion } from "framer-motion";
import { TrendingUp, Users, Globe, ShieldCheck, ArrowUpRight, ArrowDownRight, CheckCircle2, XCircle, ImageIcon, X } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { fetchJson, useApiData } from "@/lib/api/client";
import { useEffect, useState } from "react";

type AdminDashboardResponse = {
  kpis: { label: string; value: string; change: string; trend: string }[];
  growth: { name: string; value: number }[];
  recentActivity: { id: string; type: string; user: string; amount: string; status: string; date: string }[];
};

type ManualDonation = {
  id: string;
  donorName: string;
  donorEmail: string;
  amount: number;
  currency: string;
  status: string;
  donatedAt: string;
  receiptUrl: string | null;
  screenshotUrl: string | null;
  campaign: string;
};

type ManualDonationsResponse = {
  donations: ManualDonation[];
};

type ManualDonationActionResponse = {
  donation: {
    id: string;
    status: string;
    receiptUrl: string | null;
  };
  invoice?: {
    status: "sent" | "already_sent" | "skipped" | "failed";
    message: string;
    receiptUrl: string;
  };
};

const kpiIcons = [TrendingUp, Users, Globe, ShieldCheck];

export default function AdminDashboard() {
  const { data, isLoading, error } = useApiData<AdminDashboardResponse>("/api/admin/dashboard");
  const {
    data: manualData,
    isLoading: manualLoading,
    error: manualError,
  } = useApiData<ManualDonationsResponse>("/api/admin/manual-donations");

  const kpis = data?.kpis || [];
  const growth = data?.growth || [];
  const recentActivity = data?.recentActivity || [];
  const [manualDonations, setManualDonations] = useState<ManualDonation[]>([]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [busyById, setBusyById] = useState<Record<string, boolean>>({});
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  useEffect(() => {
    setManualDonations(manualData?.donations || []);
  }, [manualData]);

  async function runManualAction(donationId: string, action: "verify" | "send_receipt" | "decline") {
    setActionMessage(null);
    setBusyById((prev) => ({ ...prev, [donationId]: true }));

    try {
      const response = await fetchJson<ManualDonationActionResponse>("/api/admin/manual-donations", {
        method: "POST",
        body: JSON.stringify({ donationId, action }),
      });

      setManualDonations((prev) =>
        prev.map((row) =>
          row.id === donationId
            ? {
                ...row,
                status: response.donation.status,
                receiptUrl: response.invoice?.receiptUrl || response.donation.receiptUrl,
              }
            : row,
        ),
      );

      if (response.invoice?.message) {
        setActionMessage(response.invoice.message);
      } else if (action === "decline") {
        setActionMessage("Donation declined.");
      } else {
        setActionMessage(action === "verify" ? "Donation verified." : "Receipt action completed.");
      }
    } catch (actionError) {
      setActionMessage((actionError as Error).message);
    } finally {
      setBusyById((prev) => ({ ...prev, [donationId]: false }));
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-grow p-4 pt-20 sm:p-6 sm:pt-24 lg:p-8 lg:pt-8 space-y-6 lg:space-y-8">
        <header>
          <h1 className="text-3xl font-display font-extrabold tracking-tight">Global Stewardship</h1>
          <p className="text-sm text-muted-foreground">Real-time overview of NGO operations.</p>
        </header>

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            Unable to load dashboard data: {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi, index) => {
            const Icon = kpiIcons[index] || TrendingUp;
            return (
              <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="no-line-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-accent/10 text-accent rounded-xl flex items-center justify-center"><Icon size={20} /></div>
                  <div className={cn("flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full", kpi.trend === "up" ? "bg-green-50 text-green-600" : "bg-muted text-muted-foreground")}>
                    {kpi.trend === "up" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {kpi.change}
                  </div>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">{kpi.label}</p>
                <p className="text-2xl font-display font-extrabold tracking-tight">{kpi.value}</p>
              </motion.div>
            );
          })}
          {!isLoading && kpis.length === 0 && (
            <div className="no-line-card p-6 md:col-span-2 lg:col-span-4">
              <p className="text-sm text-muted-foreground">No KPI data available for this tenant yet.</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 no-line-card p-6">
            <h3 className="font-display font-bold text-xl mb-8">Stewardship Growth</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growth}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00338D" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#00338D" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#737373" }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#737373" }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#00338D" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {!isLoading && growth.length === 0 && (
              <p className="mt-3 text-sm text-muted-foreground">No growth data available yet.</p>
            )}
          </div>

          <div className="no-line-card p-6">
            <h3 className="font-display font-bold text-xl mb-8">Recent Activity</h3>
            <div className="space-y-6">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading activity...</p>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4">
                    <div className="w-2 h-2 rounded-full mt-2 bg-accent" />
                    <div className="flex-grow">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-bold">{activity.user}</p>
                        <span className="text-[10px] text-muted-foreground">{activity.date}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{activity.type}: <span className="text-primary font-medium">{activity.amount}</span></p>
                    </div>
                  </div>
                ))
              )}
              {!isLoading && recentActivity.length === 0 && (
                <p className="text-sm text-muted-foreground">No recent activity available yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="no-line-card p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display font-bold text-xl">Manual QR Verifications</h3>
            <span className="text-xs text-muted-foreground">GPay QR donations</span>
          </div>

          {manualError && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              Unable to load manual donations: {manualError}
            </div>
          )}

          {actionMessage && (
            <p className="text-sm text-muted-foreground">{actionMessage}</p>
          )}

          {manualLoading ? (
            <p className="text-sm text-muted-foreground">Loading manual donations...</p>
          ) : manualDonations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No manual QR donations pending review.</p>
          ) : (
            <div className="space-y-4">
              {manualDonations.map((item) => {
                const isBusy = Boolean(busyById[item.id]);
                const isSucceeded = item.status === "succeeded";
                const isFailed = item.status === "failed";
                const isDone = isSucceeded || isFailed;

                return (
                  <div key={item.id} className="rounded-xl border border-muted bg-white overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      {/* Screenshot preview panel */}
                      <div className="md:w-44 md:shrink-0 bg-slate-50 border-b md:border-b-0 md:border-r border-muted flex items-center justify-center p-3">
                        {item.screenshotUrl ? (
                          <button
                            type="button"
                            onClick={() => setSelectedScreenshot(item.screenshotUrl)}
                            className="group relative block w-full"
                            title="Click to preview screenshot"
                          >
                            <img
                              src={item.screenshotUrl}
                              alt="Payment screenshot"
                              className="w-full max-h-36 object-contain rounded-lg group-hover:opacity-80 transition-opacity"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="rounded-full bg-black/60 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-sm">
                                View Full Size
                              </span>
                            </div>
                          </button>
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-slate-400 py-4">
                            <ImageIcon size={28} />
                            <p className="text-[11px] font-medium">No screenshot</p>
                          </div>
                        )}
                      </div>

                      {/* Donation info + actions */}
                      <div className="flex flex-col justify-between gap-4 p-4 flex-grow">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <p className="text-sm font-semibold">{item.donorName || item.donorEmail}</p>
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                isSucceeded
                                  ? "bg-green-50 text-green-700"
                                  : isFailed
                                  ? "bg-red-50 text-red-700"
                                  : "bg-amber-50 text-amber-700",
                              )}
                            >
                              {item.status}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {item.campaign} • {new Date(item.donatedAt).toLocaleString()}
                          </p>
                          <p className="text-sm font-semibold mt-1">
                            {new Intl.NumberFormat("en-IN", { style: "currency", currency: item.currency || "INR" }).format(item.amount)}
                          </p>
                          {item.receiptUrl && (
                            <a
                              href={item.receiptUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-block mt-1 text-xs font-semibold text-accent hover:underline"
                            >
                              View Receipt
                            </a>
                          )}
                          {!item.screenshotUrl && !isDone && (
                            <p className="mt-1 text-[11px] text-amber-600 font-medium">
                              ⚠ Donor has not uploaded a payment screenshot yet.
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={isBusy || isDone}
                            onClick={() => runManualAction(item.id, "verify")}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                          >
                            <CheckCircle2 size={13} />
                            {isBusy ? "Working..." : "Accept & Verify"}
                          </button>
                          <button
                            type="button"
                            disabled={isBusy || isDone}
                            onClick={() => runManualAction(item.id, "decline")}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-1.5 text-xs font-semibold hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                          >
                            <XCircle size={13} />
                            Decline
                          </button>
                          {isSucceeded && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => runManualAction(item.id, "send_receipt")}
                              className="rounded-lg border border-muted px-3 py-1.5 text-xs font-semibold hover:bg-muted/50 disabled:opacity-60 transition-colors"
                            >
                              Resend Receipt
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Screenshot Lightbox */}
      {selectedScreenshot && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Payment screenshot preview"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setSelectedScreenshot(null)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setSelectedScreenshot(null);
          }}
        >
          <div
            className="relative max-h-[90vh] max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedScreenshot(null)}
              aria-label="Close preview"
              className="absolute -right-3 -top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg hover:bg-slate-100"
            >
              <X size={16} className="text-slate-700" />
            </button>
            <img
              src={selectedScreenshot}
              alt="Payment screenshot full size"
              className="max-h-[85vh] w-full rounded-2xl object-contain shadow-2xl"
            />
            <p className="mt-3 text-center text-xs text-slate-300">Click outside or press Esc to close</p>
          </div>
        </div>
      )}
    </div>
  );
}
