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
  default: {
    id: "default",
    name: "Standard Professional",
    description: "Clean business invoice",
    container: "bg-white border border-slate-200/60 shadow-[0_2px_12px_rgba(0,0,0,0.04)] mx-auto w-full max-w-[560px] print:max-w-none print:border-none print:shadow-none",
    header: {
      wrapper: "px-8 pt-8 pb-6 border-b border-slate-100 flex justify-between items-start",
      logoBg: "w-10 h-10 rounded bg-slate-900 flex items-center justify-center print:bg-black",
      logoText: "text-white text-[13px] font-bold",
      businessName: "text-[16px] font-semibold text-slate-900 leading-tight",
      businessCategory: "text-[11px] text-slate-500 font-medium",
      address: "text-[10px] text-slate-500 mt-2 leading-relaxed max-w-[200px]",
      metaWrapper: "text-right",
      metaTitle: "text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1",
      metaId: "text-[14px] font-semibold text-slate-900 mb-1",
      metaDate: "text-[11px] text-slate-500",
      badge: "inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-600 bg-slate-50 border border-slate-100 rounded-md px-2 py-1 mt-2 print:border-slate-200",
    },
    customer: {
      wrapper: "px-8 py-4 border-b border-slate-100 flex flex-col print:border-slate-200",
      title: "text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5",
      name: "text-[13px] font-semibold text-slate-900",
      phone: "text-[11px] text-slate-500",
    },
    table: {
      wrapper: "px-0",
      head: "bg-slate-50/50 border-b border-slate-100 print:bg-slate-50 text-[10px] font-medium text-slate-500 uppercase tracking-wider",
      headRow: "",
      row: "border-b border-slate-50 hover:bg-slate-50/50 transition-colors print:hover:bg-transparent",
      cellStrong: "text-[12px] font-medium text-slate-900 leading-tight",
      cellMuted: "text-[11px] text-slate-500 mt-0.5",
    },
    summary: {
      wrapper: "px-8 py-5 flex justify-end",
      row: "flex justify-between text-[11px] text-slate-600 py-1",
      text: "",
      value: "tabular-nums font-medium",
      totalWrapper: "border-t border-slate-200 pt-2 mt-2 flex justify-between items-end",
      totalText: "text-[14px] font-semibold text-slate-900",
      totalValue: "tabular-nums text-slate-900 text-[16px] font-bold",
    },
    footer: {
      wrapper: "px-8 py-6 border-t border-slate-100 bg-slate-50/30 print:bg-white flex justify-between items-end",
      title: "text-[11px] font-semibold text-slate-900 mb-1",
      text: "text-[10px] text-slate-500 leading-relaxed max-w-[260px]",
      signature: "text-[10px] text-slate-400 border-t border-slate-300 pt-1 text-center w-28",
    },
    typography: { fontFamily: "font-sans" }
  },
  modern: {
    id: "modern",
    name: "Modern Executive",
    description: "Premium business identity",
    container: "bg-white border border-slate-200 shadow-[0_8px_24px_rgba(0,0,0,0.06)] mx-auto w-full max-w-[560px] print:max-w-none print:border-none print:shadow-none overflow-hidden",
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
  minimal: {
    id: "minimal",
    name: "Minimal Editorial",
    description: "Maximum whitespace, minimal lines",
    container: "bg-white mx-auto w-full max-w-[560px] print:max-w-none print:border-none print:shadow-none",
    header: {
      wrapper: "px-8 pt-10 pb-8 flex justify-between items-start",
      logoBg: "w-8 h-8 flex items-center justify-start",
      logoText: "text-slate-900 text-[14px] font-bold uppercase tracking-widest",
      businessName: "text-[14px] font-medium text-slate-900 leading-tight tracking-wide",
      businessCategory: "text-[10px] text-slate-500",
      address: "text-[10px] text-slate-500 mt-2 leading-relaxed max-w-[200px]",
      metaWrapper: "text-right",
      metaTitle: "text-[9px] font-medium text-slate-400 uppercase tracking-widest mb-1",
      metaId: "text-[13px] font-medium text-slate-900 mb-1",
      metaDate: "text-[10px] text-slate-500",
      badge: "inline-flex items-center gap-1.5 text-[10px] text-slate-600 mt-2",
    },
    customer: {
      wrapper: "px-8 pb-8 flex flex-col",
      title: "text-[9px] font-medium text-slate-400 uppercase tracking-widest mb-0.5",
      name: "text-[13px] font-medium text-slate-900 tracking-wide",
      phone: "text-[11px] text-slate-500",
    },
    table: {
      wrapper: "px-8",
      head: "border-b-2 border-slate-900 text-[9px] font-medium text-slate-900 uppercase tracking-widest",
      headRow: "",
      row: "border-b border-slate-100",
      cellStrong: "text-[12px] font-medium text-slate-900 leading-tight",
      cellMuted: "text-[11px] text-slate-500 mt-0.5",
    },
    summary: {
      wrapper: "px-8 py-6 flex justify-end",
      row: "flex justify-between text-[11px] text-slate-500 py-1",
      text: "",
      value: "tabular-nums text-slate-900",
      totalWrapper: "border-t border-slate-900 pt-3 mt-3 flex justify-between items-end",
      totalText: "text-[12px] font-medium text-slate-900 uppercase tracking-widest",
      totalValue: "tabular-nums text-slate-900 text-[15px] font-medium",
    },
    footer: {
      wrapper: "px-8 py-8 flex justify-between items-end",
      title: "text-[10px] font-medium text-slate-900 mb-1 uppercase tracking-widest",
      text: "text-[10px] text-slate-500 leading-relaxed max-w-[260px]",
      signature: "text-[9px] text-slate-400 border-t border-slate-300 pt-1 text-center w-28 uppercase tracking-widest",
    },
    typography: { fontFamily: "font-sans" }
  },
  elegant: {
    id: "elegant",
    name: "Elegant Classic",
    description: "Refined formal layout",
    container: "bg-[#faf9f6] border border-[#e8e6e1] shadow-sm mx-auto w-full max-w-[560px] print:bg-white print:max-w-none print:border-none print:shadow-none",
    header: {
      wrapper: "px-8 pt-10 pb-8 border-b border-[#e8e6e1] flex flex-col items-center text-center",
      logoBg: "w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center mb-3 print:bg-stone-800",
      logoText: "text-[#faf9f6] text-[13px] font-serif italic",
      businessName: "text-[18px] font-serif text-stone-900 leading-tight",
      businessCategory: "text-[11px] text-stone-500 font-serif italic",
      address: "text-[10px] text-stone-500 mt-2 leading-relaxed max-w-[240px]",
      metaWrapper: "text-center mt-6 w-full flex justify-between border-t border-[#e8e6e1] pt-4",
      metaTitle: "text-[9px] font-medium text-stone-400 uppercase tracking-widest mb-1",
      metaId: "text-[13px] font-serif text-stone-900 mb-1",
      metaDate: "text-[11px] text-stone-500 font-serif",
      badge: "inline-flex items-center gap-1.5 text-[10px] font-serif text-stone-600 bg-stone-100 border border-stone-200 rounded px-2 py-0.5",
    },
    customer: {
      wrapper: "px-8 py-6 border-b border-[#e8e6e1] flex flex-col text-center items-center print:border-[#e8e6e1]",
      title: "text-[10px] font-medium text-stone-400 uppercase tracking-widest mb-1",
      name: "text-[14px] font-serif font-bold text-stone-900",
      phone: "text-[11px] font-serif text-stone-500 italic",
    },
    table: {
      wrapper: "px-0",
      head: "bg-[#f0eee9] border-y border-[#e8e6e1] text-[10px] font-serif text-stone-600 uppercase tracking-widest print:bg-stone-50",
      headRow: "",
      row: "border-b border-[#e8e6e1] hover:bg-stone-50/50 transition-colors print:hover:bg-transparent",
      cellStrong: "text-[12px] font-serif text-stone-900 leading-tight",
      cellMuted: "text-[11px] text-stone-500 font-serif mt-0.5 italic",
    },
    summary: {
      wrapper: "px-8 py-6 flex justify-end",
      row: "flex justify-between text-[11px] font-serif text-stone-600 py-1",
      text: "",
      value: "tabular-nums",
      totalWrapper: "border-t border-[#dcdad4] pt-2 mt-2 flex justify-between items-end",
      totalText: "text-[14px] font-serif text-stone-900",
      totalValue: "tabular-nums text-stone-900 text-[16px] font-serif",
    },
    footer: {
      wrapper: "px-8 py-8 border-t border-[#e8e6e1] bg-[#f5f4f0] print:bg-white flex justify-between items-end",
      title: "text-[12px] font-serif text-stone-900 mb-1 italic",
      text: "text-[10px] text-stone-500 font-serif leading-relaxed max-w-[260px]",
      signature: "text-[10px] text-stone-400 font-serif border-t border-stone-300 pt-1 text-center w-28 italic",
    },
    typography: { fontFamily: "font-serif" }
  },
  forestGreen: {
    id: "forestGreen",
    name: "Forest Green Premium",
    description: "Sophisticated financial theme",
    container: "bg-white border border-[#A8C898]/40 shadow-lg mx-auto w-full max-w-[560px] print:max-w-none print:border-none print:shadow-none overflow-hidden",
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
