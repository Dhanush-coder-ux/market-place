import React, { useState } from "react";
import { X, CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GradientButton } from "@/components/ui/GradientButton";

export interface QuickCreateStep {
  id: number;
  title: string;
  subtitle: string;
  content: React.ReactNode;
  isValid?: boolean;
}

interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  steps: QuickCreateStep[];
  onSubmit: () => void;
  isSubmitting: boolean;
  submitLabel?: string;
  size?: "md" | "lg" | "xl" | "2xl";
}

export const QuickCreateModal: React.FC<QuickCreateModalProps> = ({
  isOpen,
  onClose,
  title,
  steps,
  onSubmit,
  isSubmitting,
  submitLabel = "Complete Creation",
  size = "xl"
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const maxWidthClass = {
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  }[size];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={`w-full ${maxWidthClass} bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/20`}
      >
        {/* Header */}
        <div className="px-8 py-6 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl hover:bg-slate-200 text-slate-400 transition-all hover:rotate-90"
          >
            <X size={20} />
          </button>
        </div>

        {/* Stepper Progress */}
        <div className="px-10 pt-8 pb-4 flex items-center justify-between relative">
          <div className="absolute left-16 right-16 top-1/2 h-[2px] bg-slate-100 -z-10 -translate-y-2" />
          {steps.map((step, idx) => {
            const isActive = idx === currentStep;
            const isPassed = idx < currentStep;
            return (
              <div key={step.id} className="flex flex-col items-center gap-2 bg-white px-3 relative z-10">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black transition-all duration-300 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110"
                      : isPassed
                      ? "bg-emerald-100 text-emerald-600 border border-emerald-200"
                      : "bg-slate-50 text-slate-400 border border-slate-100"
                  }`}
                >
                  {isPassed ? <CheckCircle2 size={18} /> : step.id}
                </div>
                <span
                  className={`text-[9px] font-black uppercase tracking-[0.15em] ${
                    isActive ? "text-blue-600" : "text-slate-400"
                  }`}
                >
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="p-8 min-h-[400px] max-h-[70vh] overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-8">
                <h3 className="text-xl font-black text-slate-800 tracking-tight">
                  {steps[currentStep].title}
                </h3>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">
                  {steps[currentStep].subtitle}
                </p>
              </div>
              {steps[currentStep].content}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="px-6 py-2.5 text-xs font-black text-slate-500 hover:text-slate-800 disabled:opacity-30 flex items-center gap-2 transition-all uppercase tracking-widest"
          >
            <ChevronLeft size={18} /> Back
          </button>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right mr-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step</p>
              <p className="text-xs font-black text-slate-800">{currentStep + 1} of {steps.length}</p>
            </div>
            
            <GradientButton
              onClick={handleNext}
              disabled={isSubmitting || (steps[currentStep].isValid === false)}
              className="rounded-[1.25rem] px-10 h-11 text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-100 flex items-center gap-2"
            >
              {isSubmitting ? (
                "Processing..."
              ) : currentStep === steps.length - 1 ? (
                submitLabel
              ) : (
                <>
                  Continue <ChevronRight size={18} />
                </>
              )}
            </GradientButton>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
