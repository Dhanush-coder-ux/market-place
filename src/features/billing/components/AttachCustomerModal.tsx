import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Search, Plus } from "lucide-react";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { CustomerData } from "../types";

interface AttachCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (customer: CustomerData) => void;
  onOpenCreateCustomer: () => void;
}

const getInitials = (name: string) => {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const getAvatarBg = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 65%, 42%)`;
};

const formatINR = (amount: number, decimals = 0) =>
  amount.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const AttachCustomerModal: React.FC<AttachCustomerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  onOpenCreateCustomer
}) => {
  const { getData } = useApi();
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Search logic using q and search query param for full workability
  const loadCustomers = useCallback(
    async (query: string) => {
      setLoading(true);
      try {
        const res = await getData(`${ENDPOINTS.CUSTOMERS}/by/shop/${SHOP_ID}`, { q: query, search: query, limit: "20" });
        if (res && res.data) {
          const list = res.data.map((c: any) => ({
            id: c.id,
            name: c.name || "Unnamed Customer",
            phone: c.mobile_number || c.phone || c.mobilenum || "",
            outstanding: Number(c.outstanding || 0),
            creditLimit: Number(c.credit_limit || 0),
            totalSpent: Number(c.total_spent || 0),
            gstNumber: c.gst_number || c.datas?.gst_number || ""
          }));
          setCustomers(list);
          setActiveIndex(0);
        } else {
          setCustomers([]);
        }
      } catch (err) {
        console.error("Failed to load customers:", err);
      } finally {
        setLoading(false);
      }
    },
    [getData]
  );

  // Debounced search trigger
  useEffect(() => {
    if (!isOpen) return;
    const delayDebounce = setTimeout(() => {
      loadCustomers(searchQuery);
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, isOpen, loadCustomers]);

  // Focus search bar on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      setSearchQuery("");
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }
    return () => document.body.classList.remove("no-scroll");
  }, [isOpen]);

  // Handle Select Customer
  const handleSelectCustomer = (cust: any) => {
    onSelect({
      id: cust.id,
      name: cust.name,
      phone: cust.phone,
      outstanding: cust.outstanding,
      creditLimit: cust.creditLimit,
      totalSpent: cust.totalSpent
    });
    onClose();
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (customers.length > 0 ? (prev + 1) % customers.length : 0));
        // Scroll active item into view
        const activeNode = listRef.current?.children[activeIndex + 1] as HTMLElement;
        if (activeNode) {
          activeNode.scrollIntoView({ block: "nearest" });
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (customers.length > 0 ? (prev - 1 + customers.length) % customers.length : 0));
        const activeNode = listRef.current?.children[activeIndex - 1] as HTMLElement;
        if (activeNode) {
          activeNode.scrollIntoView({ block: "nearest" });
        }
      } else if (e.key === "Enter") {
        if (customers[activeIndex]) {
          e.preventDefault();
          handleSelectCustomer(customers[activeIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, customers, activeIndex, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={onClose} 
      />
      
      {/* Modal Container */}
      <div 
        ref={modalRef}
        className="relative w-full max-w-[540px] bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
      >
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-[17px] font-bold text-slate-800 tracking-tight leading-none">Search customer</h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1.5">Search by name or phone. Credit limit and outstanding shown.</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-7 h-7 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-650 hover:bg-slate-100 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Search Bar Input */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 shrink-0">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input 
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name or phone..."
              className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-[13px] font-medium text-slate-700 placeholder:text-slate-450 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Scrollable Customer List */}
        <div 
          ref={listRef}
          className="flex-1 overflow-y-auto px-4 py-2 divide-y divide-slate-50 custom-scrollbar modal-content max-h-[320px] min-h-[180px]"
        >
          {loading && customers.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs font-medium">
              <div className="w-5 h-5 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
              Loading customer results...
            </div>
          ) : customers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs italic font-medium">
              No matching customers found. Register a new one below.
            </div>
          ) : (
            customers.map((cust, idx) => {
              const isActive = idx === activeIndex;
              const initials = getInitials(cust.name);
              const avatarBg = getAvatarBg(cust.name);
              const hasGst = !!cust.gstNumber;
              const freeCredit = Math.max(0, cust.creditLimit - cust.outstanding);

              return (
                <div 
                  key={cust.id}
                  onClick={() => handleSelectCustomer(cust)}
                  className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all duration-100 my-1 ${
                    isActive 
                      ? "bg-blue-50 border border-blue-200/80 shadow-sm" 
                      : "hover:bg-slate-50/70 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Circle Initials Avatar */}
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[12px] font-black shrink-0 shadow-sm"
                      style={{ backgroundColor: avatarBg }}
                    >
                      {initials}
                    </div>
                    {/* Name, Phone, GSTIN */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-[13px] font-bold text-slate-800 truncate leading-snug">{cust.name}</p>
                        {hasGst && (
                          <span className="text-[8px] font-extrabold text-blue-600 bg-blue-50 px-1 py-0.2 rounded border border-blue-100 uppercase tracking-wide">
                            GST
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-bold tracking-wide">
                        {cust.phone} {hasGst && `· ${cust.gstNumber}`}
                      </p>
                    </div>
                  </div>

                  {/* Financials (Right Side) */}
                  <div className="text-right shrink-0 flex flex-col justify-center">
                    <div className="text-[10px] text-slate-550 font-bold leading-tight">
                      Limit: <span className="text-slate-700 tabular-nums">₹{formatINR(cust.creditLimit)}</span>
                    </div>
                    {cust.outstanding > 0 && (
                      <div className="text-[10px] text-amber-600 font-extrabold leading-tight mt-0.5">
                        Owed: <span className="tabular-nums">₹{formatINR(cust.outstanding)}</span>
                      </div>
                    )}
                    <div className="text-[10px] text-emerald-600 font-black leading-tight mt-0.5">
                      Free: <span className="tabular-nums">₹{formatINR(freeCredit)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>



        {/* Modal Footer Keyboard Guide */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center gap-4 shrink-0 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white border rounded font-mono text-[9px] text-slate-500 shadow-sm">↑↓</kbd> Navigate</span>
          <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white border rounded font-mono text-[9px] text-slate-500 shadow-sm">Enter</kbd> Select</span>
          <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white border rounded font-mono text-[9px] text-slate-500 shadow-sm">Esc</kbd> Cancel</span>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default AttachCustomerModal;
