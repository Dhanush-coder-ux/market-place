import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { User, Phone, Mail, CreditCard, X, CheckCircle2, ShieldCheck, UserPlus, Info } from "lucide-react";
import { GradientButton } from "@/components/ui/GradientButton";

interface CustomerCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (customer: any) => void;
  initialName?: string;
  isSubmitting?: boolean;
}

const CustomerCreateModal: React.FC<CustomerCreateModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  initialName = "",
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState({
    name: initialName,
    mobile_number: "",
    email: "",
    credit_limit: 0,
    is_active: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Body Scroll Lock
  useEffect(() => {
    if (isOpen) document.body.classList.add("no-scroll");
    else document.body.classList.remove("no-scroll");
    return () => document.body.classList.remove("no-scroll");
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({ ...prev, name: initialName }));
      setErrors({});
    }
  }, [isOpen, initialName]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Full name is required";
    if (!formData.mobile_number.trim()) newErrors.mobile_number = "Mobile number is required";
    else if (!/^\d{10}$/.test(formData.mobile_number.trim())) newErrors.mobile_number = "Enter a valid 10-digit number";
    
    if (!formData.email.trim()) newErrors.email = "Email address is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) newErrors.email = "Enter a valid email address";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onCreated(formData);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-[480px] bg-white rounded-2xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] border border-slate-200/60 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <UserPlus size={20} />
            </div>
            <div>
              <h3 className="text-[16px] font-black text-slate-800 tracking-tight leading-none">New Customer</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">Quick Registration</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 hover:rotate-90 transition-all shadow-sm"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-7 space-y-5">
          
          {/* Name Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <User size={12} className="text-indigo-400" />
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input 
                autoFocus
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: John Doe"
                className={`w-full h-11 px-4 bg-slate-50 border rounded-xl text-[13px] font-bold text-slate-700 outline-none transition-all placeholder:text-slate-300 ${
                  errors.name ? "border-rose-300 bg-rose-50/30 ring-4 ring-rose-500/5" : "border-slate-200 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/5"
                }`}
              />
              {errors.name && <p className="text-[10px] font-bold text-rose-500 mt-1 flex items-center gap-1 animate-in fade-in slide-in-from-left-2"><Info size={10} /> {errors.name}</p>}
            </div>
          </div>

          {/* Contact Group */}
          <div className="grid grid-cols-2 gap-4">
            {/* Mobile Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Phone size={12} className="text-indigo-400" />
                Mobile <span className="text-rose-500">*</span>
              </label>
              <input 
                type="text"
                value={formData.mobile_number}
                onChange={e => setFormData({ ...formData, mobile_number: e.target.value })}
                placeholder="10 Digit Number"
                className={`w-full h-11 px-4 bg-slate-50 border rounded-xl text-[13px] font-bold text-slate-700 outline-none transition-all placeholder:text-slate-300 ${
                  errors.mobile_number ? "border-rose-300 bg-rose-50/30 ring-4 ring-rose-500/5" : "border-slate-200 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/5"
                }`}
              />
              {errors.mobile_number && <p className="text-[10px] font-bold text-rose-500 mt-1 flex items-center gap-1 animate-in fade-in slide-in-from-left-2"><Info size={10} /> {errors.mobile_number}</p>}
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Mail size={12} className="text-indigo-400" />
                Email <span className="text-rose-500">*</span>
              </label>
              <input 
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="Ex: john@company.com"
                className={`w-full h-11 px-4 bg-slate-50 border rounded-xl text-[13px] font-bold text-slate-700 outline-none transition-all placeholder:text-slate-300 ${
                  errors.email ? "border-rose-300 bg-rose-50/30 ring-4 ring-rose-500/5" : "border-slate-200 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/5"
                }`}
              />
              {errors.email && <p className="text-[10px] font-bold text-rose-500 mt-1 flex items-center gap-1 animate-in fade-in slide-in-from-left-2"><Info size={10} /> {errors.email}</p>}
            </div>
          </div>

          {/* Account Status Switch */}
          <div className={`p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between ${formData.is_active ? "bg-emerald-50/40 border-emerald-100" : "bg-slate-50 border-slate-100"}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${formData.is_active ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-400"}`}>
                <ShieldCheck size={18} />
              </div>
              <div className="flex flex-col">
                <span className={`text-[12px] font-black tracking-tight ${formData.is_active ? "text-emerald-700" : "text-slate-600"}`}>Account Active</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Enabled for transactions</span>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
              className={`w-11 h-6 rounded-full transition-all relative ${formData.is_active ? "bg-emerald-500 shadow-md shadow-emerald-500/20" : "bg-slate-300"}`}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm ${formData.is_active ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>

          {/* Credit Limit Field - Conditional */}
          {formData.is_active && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-4 duration-500">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <CreditCard size={12} className="text-indigo-400" />
                Monthly Credit Limit
              </label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[13px] font-black text-slate-400 group-focus-within:text-indigo-500 transition-colors">₹</span>
                <input 
                  type="number"
                  value={formData.credit_limit}
                  onChange={e => setFormData({ ...formData, credit_limit: Number(e.target.value) })}
                  className="w-full h-11 pl-8 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-black text-slate-800 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 tabular-nums"
                  placeholder="0.00"
                />
              </div>
              <p className="text-[9px] text-slate-400 font-bold px-1 italic">Maximum credit allowed for this account</p>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 h-11 px-6 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
            >
              Cancel
            </button>
            <GradientButton 
              type="submit"
              disabled={isSubmitting}
              className="flex-[1.5] h-11 rounded-xl text-[13px] font-black shadow-lg shadow-indigo-500/20"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Registering...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 size={16} />
                  Register Customer
                </div>
              )}
            </GradientButton>
          </div>
        </form>

        {/* Footer Hint */}
        <div className="px-7 py-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
            <Info size={12} />
          </div>
          <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
            Registering a customer here will automatically add them to your <span className="font-bold text-slate-600">Customer Directory</span> for future billing.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CustomerCreateModal;
