"use client";

import AdminSidebar from "@/components/AdminSidebar";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Users, 
  CreditCard,
  Lock,
  X,
  Send,
  Camera,
  MapPin,
  RefreshCw
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const operations = [
  { id: 1, type: "Expense", title: "Borehole Maintenance", hub: "Kenya", amount: "$1,250.00", status: "Pending Verification", date: "2 hours ago" },
  { id: 2, type: "Dispatch", title: "Emergency Water Delivery", hub: "Vietnam", amount: "12 Volunteers", status: "Active", date: "5 hours ago" },
  { id: 3, type: "Payment", title: "Supplier Settlement", hub: "Brazil", amount: "$4,800.00", status: "Processing", date: "1 day ago" },
  { id: 4, type: "Verification", title: "Impact Audit Q3", hub: "Global", amount: "156 Projects", status: "Completed", date: "2 days ago" },
];

export default function OperationsPage() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleProcess = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setActiveModal(null);
      }, 2000);
    }, 1500);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-grow p-8 space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-display font-extrabold tracking-tight">Operational Workflows</h1>
            <p className="text-sm text-muted-foreground">Manage field expenses, dispatches, and secure verifications.</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveModal("expense")}
              className="btn-primary flex items-center gap-2 py-2 px-4 text-sm"
            >
              <Plus size={18} /> Submit Expense
            </button>
            <button 
              onClick={() => setActiveModal("dispatch")}
              className="btn-outline flex items-center gap-2 py-2 px-4 text-sm"
            >
              <Users size={18} /> Dispatch Volunteers
            </button>
          </div>
        </header>

        {/* Operations List */}
        <div className="no-line-card p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <h3 className="font-display font-bold text-xl">Active Operations</h3>
              <div className="px-2 py-1 bg-accent/10 text-accent rounded-lg text-[10px] font-bold uppercase tracking-widest">
                {operations.length} Pending
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <input 
                  type="text" 
                  placeholder="Filter operations..." 
                  className="pl-9 pr-4 py-1.5 bg-muted/30 border-none rounded-lg text-xs focus:ring-2 focus:ring-accent/20 transition-all w-48"
                />
              </div>
              <button className="p-2 text-muted-foreground hover:text-primary transition-colors">
                <Filter size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {operations.map((op) => (
              <div key={op.id} className="flex items-center justify-between p-6 bg-white border border-muted rounded-2xl group hover:shadow-lg hover:border-accent/20 transition-all">
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    op.type === "Expense" ? "bg-amber-50 text-amber-600" : 
                    op.type === "Dispatch" ? "bg-green-50 text-green-600" : 
                    op.type === "Payment" ? "bg-blue-50 text-blue-600" : "bg-accent/10 text-accent"
                  )}>
                    {op.type === "Expense" ? <CreditCard size={24} /> : 
                     op.type === "Dispatch" ? <Users size={24} /> : 
                     op.type === "Payment" ? <FileText size={24} /> : <ShieldCheck size={24} />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{op.type}</span>
                      <div className="w-1 h-1 bg-muted rounded-full" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-accent">{op.hub}</span>
                    </div>
                    <h4 className="font-display font-bold text-lg">{op.title}</h4>
                    <p className="text-xs text-muted-foreground">{op.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-12">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Allocation</p>
                    <p className="text-lg font-display font-extrabold">{op.amount}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className={cn(
                      "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                      op.status === "Completed" ? "bg-green-50 text-green-600" : 
                      op.status === "Pending Verification" ? "bg-amber-50 text-amber-600" : 
                      op.status === "Processing" ? "bg-blue-50 text-blue-600" : "bg-accent/10 text-accent"
                    )}>
                      {op.status === "Completed" ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                      {op.status}
                    </div>
                    <button 
                      onClick={() => setActiveModal("verify")}
                      className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
                    >
                      Process Action <ArrowRight size={14} />
                    </button>
                  </div>
                  <button className="p-2 text-muted-foreground hover:text-primary transition-colors">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modals */}
        <AnimatePresence>
          {activeModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActiveModal(null)}
                className="absolute inset-0 bg-primary/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
              >
                {/* Modal Header */}
                <div className="p-6 border-b border-muted flex items-center justify-between">
                  <h3 className="text-xl font-display font-bold">
                    {activeModal === "expense" ? "Submit Field Expense" : 
                     activeModal === "dispatch" ? "Volunteer Dispatch" : "Secure Verification"}
                  </h3>
                  <button onClick={() => setActiveModal(null)} className="p-2 text-muted-foreground hover:text-primary transition-colors">
                    <X size={20} />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-8 space-y-6">
                  {activeModal === "expense" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Amount</label>
                          <input type="number" placeholder="$0.00" className="w-full px-4 py-3 bg-muted/30 border-none rounded-xl text-sm focus:ring-2 focus:ring-accent/20 transition-all" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Category</label>
                          <select className="w-full px-4 py-3 bg-muted/30 border-none rounded-xl text-sm focus:ring-2 focus:ring-accent/20 transition-all">
                            <option>Infrastructure</option>
                            <option>Logistics</option>
                            <option>Supplies</option>
                            <option>Maintenance</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Description</label>
                        <textarea rows={3} placeholder="Describe the expense..." className="w-full px-4 py-3 bg-muted/30 border-none rounded-xl text-sm focus:ring-2 focus:ring-accent/20 transition-all resize-none" />
                      </div>
                      <div className="flex items-center gap-4 p-4 border-2 border-dashed border-muted rounded-2xl text-center cursor-pointer hover:border-accent/50 transition-colors">
                        <div className="w-full space-y-1">
                          <Camera size={24} className="mx-auto text-muted-foreground" />
                          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Upload Receipt</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeModal === "dispatch" && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Mission Target</label>
                        <select className="w-full px-4 py-3 bg-muted/30 border-none rounded-xl text-sm focus:ring-2 focus:ring-accent/20 transition-all">
                          <option>Clean Water Initiative - Kenya</option>
                          <option>Emergency Relief - Vietnam</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Volunteer Count</label>
                          <input type="number" placeholder="0" className="w-full px-4 py-3 bg-muted/30 border-none rounded-xl text-sm focus:ring-2 focus:ring-accent/20 transition-all" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Urgency</label>
                          <select className="w-full px-4 py-3 bg-muted/30 border-none rounded-xl text-sm focus:ring-2 focus:ring-accent/20 transition-all">
                            <option>High</option>
                            <option>Medium</option>
                            <option>Low</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Dispatch Location</label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                          <input type="text" placeholder="Enter GPS or Address" className="w-full pl-10 pr-4 py-3 bg-muted/30 border-none rounded-xl text-sm focus:ring-2 focus:ring-accent/20 transition-all" />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeModal === "verify" && (
                    <div className="space-y-8 text-center">
                      <div className="w-16 h-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto">
                        <Lock size={32} />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-2xl font-display font-bold">Secure Re-Auth</h4>
                        <p className="text-sm text-muted-foreground">For security, please verify your steward credentials to process this operation.</p>
                      </div>
                      <div className="space-y-4">
                        <input type="password" placeholder="Enter Steward Pin" className="w-full px-4 py-4 bg-muted/30 border-none rounded-2xl text-center text-2xl tracking-[1em] focus:ring-2 focus:ring-accent/20 transition-all" />
                        <div className="flex items-center gap-2 justify-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          <ShieldCheck size={14} className="text-green-500" />
                          End-to-end Encrypted
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-6 bg-muted/30 flex items-center gap-4">
                  <button 
                    onClick={() => setActiveModal(null)}
                    className="flex-1 py-3 font-bold text-muted-foreground hover:text-primary transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleProcess}
                    disabled={isProcessing || isSuccess}
                    className={cn(
                      "flex-[2] btn-primary flex items-center justify-center gap-2 py-3",
                      isSuccess && "bg-green-600 border-none"
                    )}
                  >
                    {isProcessing ? (
                      <RefreshCw size={20} className="animate-spin" />
                    ) : isSuccess ? (
                      <CheckCircle2 size={20} />
                    ) : (
                      <>
                        {activeModal === "verify" ? "Verify & Process" : "Submit Operation"} <Send size={18} />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
