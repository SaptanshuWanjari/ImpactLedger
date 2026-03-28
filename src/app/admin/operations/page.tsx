"use client";

import AdminSidebar from "@/components/AdminSidebar";
import { CheckCircle2, AlertCircle, Send } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { fetchJson, useApiData } from "@/lib/api/client";

type Operation = {
  id: string;
  type: string;
  title: string;
  hub: string;
  amount: string;
  status: string;
  date: string;
};

type Response = { operations: Operation[] };

export default function OperationsPage() {
  const { data, isLoading } = useApiData<Response>("/api/admin/operations");
  const [category, setCategory] = useState("Infrastructure");
  const [amount, setAmount] = useState("0");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function submitExpense() {
    try {
      await fetchJson("/api/admin/operations", {
        method: "POST",
        body: JSON.stringify({ category, amount: Number(amount), notes }),
      });
      setMessage("Expense submitted.");
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-grow p-8 space-y-8">
        <header>
          <h1 className="text-3xl font-display font-extrabold tracking-tight">Operational Workflows</h1>
          <p className="text-sm text-muted-foreground">Manage field expenses and verify operational updates.</p>
        </header>

        <div className="no-line-card p-6">
          <h3 className="font-display font-bold text-xl mb-6">Submit Expense</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-4 py-3 bg-muted/30 rounded-xl">
              <option>Infrastructure</option>
              <option>Logistics</option>
              <option>Supplies</option>
            </select>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" className="px-4 py-3 bg-muted/30 rounded-xl" placeholder="Amount" />
            <button onClick={submitExpense} className="btn-primary flex items-center justify-center gap-2">Submit <Send size={16} /></button>
          </div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full mt-4 px-4 py-3 bg-muted/30 rounded-xl" placeholder="Notes" />
          {message && <p className="mt-3 text-sm text-muted-foreground">{message}</p>}
        </div>

        <div className="no-line-card p-6">
          <h3 className="font-display font-bold text-xl mb-6">Active Operations</h3>
          <div className="space-y-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading operations...</p>
            ) : (
              (data?.operations || []).map((op) => (
                <div key={op.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">{op.type} • {op.hub}</p>
                    <h4 className="font-bold">{op.title}</h4>
                    <p className="text-xs text-muted-foreground">{op.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{op.amount}</p>
                    <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] uppercase", op.status.includes("Approved") ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600")}>
                      {op.status.includes("Approved") ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />} {op.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
