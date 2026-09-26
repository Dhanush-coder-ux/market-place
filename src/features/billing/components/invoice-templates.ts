export interface InvoiceTemplateConfig {
  id: string;
  name: string;
  description: string;
  container: string;
  header: {
    wrapper: string;
    logoBg: string;
    logoText: string;
    businessName: string;
    businessCategory: string;
    address: string;
    metaWrapper: string;
    metaTitle: string;
    metaId: string;
    metaDate: string;
    badge: string;
  };
  customer: {
    wrapper: string;
    title: string;
    name: string;
    phone: string;
  };
  table: {
    wrapper: string;
    head: string;
    headRow: string;
    row: string;
    cellStrong: string;
    cellMuted: string;
  };
  summary: {
    wrapper: string;
    row: string;
    text: string;
    value: string;
    totalWrapper: string;
    totalText: string;
    totalValue: string;
  };
  footer: {
    wrapper: string;
    title: string;
    text: string;
    signature: string;
  };
  typography: {
    fontFamily: string;
  }
}

export const INVOICE_TEMPLATES: Record<string, InvoiceTemplateConfig> = {
  minimal: {
    id: "minimal",
    name: "Minimal Editorial",
    description: "Vibrant modern editorial with refined color accents",
    container: "bg-white border border-slate-200/80 shadow-[0_4px_24px_rgba(79,70,229,0.06)] rounded-xl mx-auto w-full max-w-[560px] print:max-w-none print:border-none print:shadow-none print:rounded-none overflow-hidden",
    header: {
      wrapper: "px-8 pt-9 pb-7 border-b border-indigo-100/70 bg-gradient-to-r from-indigo-50/60 via-white to-sky-50/40 flex justify-between items-start print:bg-white print:border-slate-200",
      logoBg: "w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 shadow-md shadow-indigo-300/40 flex items-center justify-center print:bg-indigo-600",
      logoText: "text-white text-[13px] font-extrabold tracking-wider",
      businessName: "text-[17px] font-bold text-slate-900 leading-tight tracking-tight",
      businessCategory: "text-[11px] font-semibold text-indigo-600",
      address: "text-[10px] text-slate-500 mt-2 leading-relaxed max-w-[210px]",
      metaWrapper: "text-right",
      metaTitle: "text-[9px] font-bold text-indigo-500 uppercase tracking-widest mb-1",
      metaId: "text-[15px] font-black text-slate-900 mb-1",
      metaDate: "text-[11px] text-slate-500 font-medium",
      badge: "inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-700 bg-indigo-50/90 border border-indigo-200/70 rounded-lg px-2.5 py-1 mt-2 shadow-xs",
    },
    customer: {
      wrapper: "px-8 py-4 border-b border-slate-100 flex flex-col bg-slate-50/40 print:bg-white print:border-slate-100",
      title: "text-[9px] font-bold text-indigo-500 uppercase tracking-widest mb-0.5",
      name: "text-[13px] font-bold text-slate-900",
      phone: "text-[11px] text-slate-600 font-medium",
    },
    table: {
      wrapper: "px-0",
      head: "bg-indigo-50/70 border-y border-indigo-100/70 text-[9px] font-bold text-indigo-900 uppercase tracking-widest print:bg-slate-50 print:border-slate-200",
      headRow: "",
      row: "border-b border-slate-100/80 hover:bg-indigo-50/20 transition-colors print:hover:bg-transparent",
      cellStrong: "text-[12px] font-semibold text-slate-800 leading-tight",
      cellMuted: "text-[11px] text-slate-500 mt-0.5",
    },
    summary: {
      wrapper: "px-8 py-5 flex justify-end bg-gradient-to-b from-white to-slate-50/30 print:bg-white",
      row: "flex justify-between text-[11px] text-slate-600 py-1 font-medium",
      text: "",
      value: "tabular-nums text-slate-800 font-semibold",
      totalWrapper: "border-t-2 border-indigo-600 pt-2.5 mt-2.5 flex justify-between items-end bg-indigo-50/50 -mx-3 px-3 py-2 rounded-lg print:bg-transparent print:p-0",
      totalText: "text-[13px] font-bold text-indigo-950 uppercase tracking-wide",
      totalValue: "tabular-nums text-indigo-700 text-[18px] font-black",
    },
    footer: {
      wrapper: "px-8 py-6 border-t border-slate-100 bg-slate-50/50 print:bg-white flex justify-between items-end",
      title: "text-[10px] font-bold text-indigo-900 uppercase tracking-wider mb-1",
      text: "text-[10px] text-slate-500 leading-relaxed max-w-[260px]",
      signature: "text-[9px] font-semibold text-slate-400 border-t border-slate-300 pt-1 text-center w-28 uppercase tracking-widest",
    },
    typography: { fontFamily: "font-sans" }
  },
  modern: {
    id: "modern",
    name: "Modern Executive",
    description: "Premium dark slate business identity",
    container: "bg-white border border-slate-200 shadow-[0_8px_24px_rgba(0,0,0,0.06)] mx-auto w-full max-w-[560px] print:max-w-none print:border-none print:shadow-none overflow-hidden rounded-xl",
    header: {
      wrapper: "px-8 pt-8 pb-6 bg-slate-900 text-white print:bg-slate-900 print:text-white flex justify-between items-start",
      logoBg: "w-10 h-10 rounded bg-white/10 flex items-center justify-center",
      logoText: "text-white text-[13px] font-bold",
      businessName: "text-[16px] font-bold text-white leading-tight",
      businessCategory: "text-[11px] text-slate-400 font-medium",
      address: "text-[10px] text-slate-400 mt-2 leading-relaxed max-w-[200px]",
      metaWrapper: "text-right",
      metaTitle: "text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1",
      metaId: "text-[15px] font-bold text-white mb-1",
      metaDate: "text-[11px] text-slate-300",
      badge: "inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-200 bg-white/10 border border-white/10 rounded-md px-2 py-1 mt-2",
    },
    customer: {
      wrapper: "px-8 py-5 border-b border-slate-200 flex flex-col bg-slate-50/30 print:border-slate-200",
      title: "text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5",
      name: "text-[13px] font-bold text-slate-900",
      phone: "text-[11px] text-slate-500",
    },
    table: {
      wrapper: "px-0",
      head: "bg-white border-b border-slate-200 text-[10px] font-semibold text-slate-400 uppercase tracking-wider",
      headRow: "",
      row: "border-b border-slate-100 hover:bg-slate-50/50 transition-colors print:hover:bg-transparent",
      cellStrong: "text-[12px] font-bold text-slate-800 leading-tight",
      cellMuted: "text-[11px] text-slate-500 mt-0.5",
    },
    summary: {
      wrapper: "px-8 py-5 bg-slate-50/50 print:bg-white flex justify-end",
      row: "flex justify-between text-[11px] text-slate-600 py-1",
      text: "",
      value: "tabular-nums font-medium text-slate-800",
      totalWrapper: "border-t-2 border-slate-900 pt-2 mt-2 flex justify-between items-end",
      totalText: "text-[14px] font-bold text-slate-900 uppercase tracking-wide",
      totalValue: "tabular-nums text-slate-900 text-[18px] font-black",
    },
    footer: {
      wrapper: "px-8 py-6 border-t border-slate-200 bg-white flex justify-between items-end",
      title: "text-[11px] font-bold text-slate-900 mb-1",
      text: "text-[10px] text-slate-500 leading-relaxed max-w-[260px]",
      signature: "text-[10px] text-slate-400 border-t border-slate-300 pt-1 text-center w-28",
    },
    typography: { fontFamily: "font-sans" }
  },
  forestGreen: {
    id: "forestGreen",
    name: "Forest Green Premium",
    description: "Sophisticated emerald & gold financial theme",
    container: "bg-white border border-[#A8C898]/40 shadow-lg mx-auto w-full max-w-[560px] print:max-w-none print:border-none print:shadow-none overflow-hidden rounded-xl",
    header: {
      wrapper: "px-8 pt-8 pb-6 bg-[#083020] text-white print:bg-[#083020] print:text-white flex justify-between items-start",
      logoBg: "w-10 h-10 rounded bg-[#C49850] flex items-center justify-center print:bg-[#C49850]",
      logoText: "text-[#083020] text-[14px] font-bold",
      businessName: "text-[17px] font-semibold text-white leading-tight",
      businessCategory: "text-[11px] text-[#A8C898] font-medium",
      address: "text-[10px] text-[#88B878] mt-2 leading-relaxed max-w-[200px]",
      metaWrapper: "text-right",
      metaTitle: "text-[10px] font-medium text-[#88B878] uppercase tracking-widest mb-1",
      metaId: "text-[14px] font-semibold text-[#D4A85C] mb-1",
      metaDate: "text-[11px] text-[#A8C898]",
      badge: "inline-flex items-center gap-1.5 text-[10px] font-medium text-white bg-[#286038] border border-[#88B878]/30 rounded-md px-2 py-1 mt-2",
    },
    customer: {
      wrapper: "px-8 py-5 border-b border-[#A8C898]/30 flex flex-col bg-[#103020]/[0.02] print:border-[#A8C898]/30",
      title: "text-[10px] font-semibold text-[#88B878] uppercase tracking-wider mb-0.5",
      name: "text-[13px] font-semibold text-[#103020]",
      phone: "text-[11px] text-[#286038]",
    },
    table: {
      wrapper: "px-0",
      head: "bg-[#103020]/5 border-b border-[#286038]/20 text-[9px] font-semibold text-[#103020] uppercase tracking-wider",
      headRow: "",
      row: "border-b border-[#A8C898]/20 hover:bg-[#A8C898]/10 transition-colors print:hover:bg-transparent",
      cellStrong: "text-[12px] font-semibold text-[#103020] leading-tight",
      cellMuted: "text-[11px] text-[#286038] mt-0.5",
    },
    summary: {
      wrapper: "px-8 py-5 flex justify-end",
      row: "flex justify-between text-[11px] text-[#286038] py-1",
      text: "",
      value: "tabular-nums font-medium text-[#103020]",
      totalWrapper: "border-t-2 border-[#103020] pt-2 mt-2 flex justify-between items-end",
      totalText: "text-[14px] font-semibold text-[#103020]",
      totalValue: "tabular-nums text-[#083020] text-[17px] font-bold",
    },
    footer: {
      wrapper: "px-8 py-6 border-t border-[#A8C898]/30 bg-[#103020]/[0.02] print:bg-white flex justify-between items-end",
      title: "text-[11px] font-semibold text-[#103020] mb-1",
      text: "text-[10px] text-[#286038] leading-relaxed max-w-[260px]",
      signature: "text-[10px] text-[#286038] border-t border-[#A8C898] pt-1 text-center w-28",
    },
    typography: { fontFamily: "font-sans" }
  }
};
