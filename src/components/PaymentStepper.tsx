"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

interface PaymentStepperProps {
  currentStep: number;
  steps: string[];
}

export default function PaymentStepper({ currentStep, steps }: PaymentStepperProps) {
  return (
    <div className="flex items-center justify-between w-full max-w-2xl mx-auto mb-12">
      {steps.map((step, index) => (
        <div key={step} className="flex flex-col items-center gap-2 relative flex-1">
          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div className={cn(
              "absolute top-5 left-1/2 w-full h-0.5 -z-10",
              index < currentStep ? "bg-accent" : "bg-muted"
            )} />
          )}
          
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all",
            index < currentStep ? "bg-accent text-white" : 
            index === currentStep ? "bg-primary text-white scale-110 shadow-lg" : "bg-muted text-muted-foreground"
          )}>
            {index < currentStep ? <CheckCircle2 size={20} /> : index + 1}
          </div>
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-widest transition-colors",
            index === currentStep ? "text-primary" : "text-muted-foreground"
          )}>
            {step}
          </span>
        </div>
      ))}
    </div>
  );
}
