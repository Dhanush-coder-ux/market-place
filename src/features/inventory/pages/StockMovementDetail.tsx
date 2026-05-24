import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Package, User, Calendar, FileText,
  TrendingUp, TrendingDown, Layers, Hash, Zap,
  ArrowUp, ArrowDown, Warehouse, BarChart3,
} from "lucide-react";
import { ProfileHeaderCard, SectionCard, DetailItem, InfoRow } from "@/components/common/SuperUI";
import { StatCard } from "@/components/common/StatsCard";
import type { Movement, MovementType } from "./StockMovement";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function TypeBadgeConfig(type: MovementType): { bg: string; text: string; dot: string; label: string } {
  const configs: Record<MovementType, { bg: string; text: string; dot: string; label: string }> = {
    PURCHASE:         { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Purchase" },
    PO_PURCHASE:      { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "PO Purchase" },
    SALES:            { bg: "bg-rose-50",    text: "text-rose-700",    dot: "bg-rose-500",    label: "Sales" },
    STOCK_ADJUSTMENT: { bg: "bg-violet-50",  text: "text-violet-700",  dot: "bg-violet-500",  label: "Adjustment" },
    TRANSFER:         { bg: "bg-sky-50",     text: "text-sky-700",     dot: "bg-sky-500",     label: "Transfer" },
    OPENING:          { bg: "bg-slate-50",   text: "text-slate-700",   dot: "bg-slate-500",   label: "Opening" },
    PRODUCTION:       { bg: "bg-teal-50",    text: "text-teal-700",    dot: "bg-teal-500",    label: "Production" },
    SALE_RETURN:      { bg: "bg-fuchsia-50", text: "text-fuchsia-700", dot: "bg-fuchsia-500", label: "Sale Return" },
  };
  return configs[type] ?? { bg: "bg-slate-50", text: "text-slate-700", dot: "bg-slate-500", label: type };
}

// ─── Main Component ───────────────────────────────────────────────────────────

const StockMovementDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const movement = location.state?.movement as Movement | undefined;
  const [activeTab, setActiveTab] = useState(0);

  if (!movement) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 font-sans">
        <Package size={48} className="text-slate-300" />
        <p className="text-lg font-bold text-slate-800">Movement record not found</p>
        <p className="text-sm text-slate-400">This record may have been deleted or the link is invalid.</p>
        <button
          onClick={() => navigate("/stock-movement")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft size={16} /> Back to Stock Movement
        </button>
      </div>
    );
  }

  const isPositive = movement.qty > 0;
  const typeCfg = TypeBadgeConfig(movement.type);
  const closingStock = movement.stocks_before !== undefined ? movement.stocks_before + movement.qty : undefined;

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full bg-slate-50/50 font-sans text-slate-900 overflow-hidden relative">

      {/* ── Profile Header ── */}
      <div className="flex-none p-1 pb-0">
        <ProfileHeaderCard
          name={`Movement · ${movement.ref}`}
          initials={isPositive ? "IN" : "OUT"}
          subText={`ID: ${movement.id}`}
          badges={[
            { text: typeCfg.label, variant: "primary" },
            { text: movement.status, variant: movement.status === "Completed" ? "success" : "warning" },
          ]}
          infoItems={[
            { icon: Calendar, text: `${fmtDate(movement.date)} at ${fmtTime(movement.date)}` },
            { icon: User, text: movement.user || "Admin" },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/stock-movement")}
                className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-slate-650 rounded-lg hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm active:scale-95"
                title="Back to Stock Movement"
              >
                <ArrowLeft size={14} />
              </button>
            </div>
          }
        />
      </div>

      {/* ── Tabs ── */}
      <div className="flex-none px-1 py-2">
        <div className="flex gap-2 p-1 bg-slate-100/50 w-fit rounded-lg border border-slate-200/50">
          {["Overview", "Inventory Path", "Context"].map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                activeTab === i
                  ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Panels ── */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-1 pb-6">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* TAB 0 — Overview */}
          {activeTab === 0 && (
            <div className="space-y-4">
              {/* Quick Stats */}
              <div className="flex flex-wrap gap-2">
                <StatCard
                  icon={isPositive ? TrendingUp : TrendingDown}
                  label="Stock Change"
                  value={isPositive ? `+${movement.qty}` : String(movement.qty)}
                  iconBg={isPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}
                  valueClassName={isPositive ? "text-emerald-600" : "text-rose-600"}
                  className="flex-1 min-w-[140px]"
                />
                {movement.stocks_before !== undefined && (
                  <StatCard
                    icon={BarChart3}
                    label="Opening Stock"
                    value={String(movement.stocks_before)}
                    iconBg="bg-slate-50 text-slate-500"
                    className="flex-1 min-w-[140px]"
                  />
                )}
                {closingStock !== undefined && (
                  <StatCard
                    icon={Package}
                    label="Closing Stock"
                    value={String(closingStock)}
                    iconBg="bg-blue-50 text-blue-600"
                    className="flex-1 min-w-[140px]"
                  />
                )}
                {movement.current_stock !== undefined && (
                  <StatCard
                    icon={Warehouse}
                    label="Current Stock"
                    value={String(movement.current_stock)}
                    iconBg="bg-indigo-50 text-indigo-600"
                    className="flex-1 min-w-[140px]"
                  />
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Impact Card */}
                <div className="lg:col-span-8">
                  <SectionCard title="Stock Impact Summary">
                    <div className="space-y-1">
                      {movement.stocks_before !== undefined && (
                        <InfoRow label="Opening Stock" value={String(movement.stocks_before)} />
                      )}
                      <InfoRow
                        label={isPositive ? "Stock In" : "Stock Out"}
                        value={
                          <span className={isPositive ? "text-emerald-600 font-black" : "text-rose-600 font-black"}>
                            {isPositive ? `+${movement.qty}` : `${movement.qty}`}
                          </span>
                        }
                      />
                      {closingStock !== undefined && (
                        <InfoRow label="Closing Stock" value={<span className="text-blue-600 font-black">{closingStock}</span>} />
                      )}
                      {movement.current_stock !== undefined && (
                        <>
                          <div className="my-2 border-t border-dashed border-slate-100" />
                          <InfoRow label="Live Current Stock" value={<span className="text-indigo-600 font-black">{movement.current_stock} units</span>} />
                        </>
                      )}
                    </div>

                    {/* Visual direction */}
                    <div className="mt-4 flex items-center justify-between gap-3 bg-slate-50 rounded-lg px-4 py-3 border border-slate-100">
                      <div className="text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Source</p>
                        <p className="text-xs font-bold text-slate-700">{movement.source}</p>
                      </div>
                      <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-black border ${isPositive ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-rose-50 border-rose-200 text-rose-700"}`}>
                        {isPositive ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
                        {isPositive ? "Stock In" : "Stock Out"}
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Destination</p>
                        <p className="text-xs font-bold text-slate-700">{movement.destination}</p>
                      </div>
                    </div>
                  </SectionCard>
                </div>

                {/* Type & Status card */}
                <div className="lg:col-span-4 space-y-4">
                  <SectionCard title="Movement Details">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tight">Type</span>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border ${typeCfg.bg} ${typeCfg.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${typeCfg.dot}`} />
                          {typeCfg.label}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tight">Status</span>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border ${movement.status === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                          {movement.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tight">Reference</span>
                        <span className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded font-mono">{movement.ref}</span>
                      </div>
                    </div>
                  </SectionCard>

                  {movement.notes && (
                    <SectionCard title="Notes / Description">
                      <div className="flex gap-2">
                        <FileText size={14} className="text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">{movement.notes}</p>
                      </div>
                    </SectionCard>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 1 — Inventory Path */}
          {activeTab === 1 && (
            <div className="space-y-4">
              <SectionCard title="Inventory Specification Path">
                <div className="relative pl-6 before:absolute before:left-[11px] before:top-8 before:bottom-0 before:w-0.5 before:bg-slate-100 space-y-4">
                  {/* Product Level */}
                  <div className="relative group">
                    <div className="absolute -left-[19px] top-1.5 w-4 h-4 rounded-full border-2 border-blue-500 bg-white z-10" />
                    <div className="bg-blue-50/40 border border-blue-100 rounded-lg p-4 transition-all hover:bg-blue-50">
                      <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-wider mb-1">
                        <Package size={12} /> Product Root
                      </div>
                      <p className="text-slate-800 font-bold text-base leading-tight">{movement.product}</p>
                      {movement.sku && (
                        <span className="text-[10px] font-mono text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-100 mt-2 inline-block">SKU: {movement.sku}</span>
                      )}
                    </div>
                  </div>

                  {/* Variant Level */}
                  {movement.variant && (
                    <div className="relative group">
                      <div className="absolute -left-[19px] top-1.5 w-4 h-4 rounded-full border-2 border-violet-500 bg-white z-10" />
                      <div className="bg-violet-50/40 border border-violet-100 rounded-lg p-4 ml-2 transition-all hover:bg-violet-50">
                        <div className="flex items-center gap-2 text-violet-600 font-black text-[10px] uppercase tracking-wider mb-1">
                          <Layers size={12} /> Variant Configuration
                        </div>
                        <p className="text-slate-800 font-bold text-sm">{movement.variant}</p>
                      </div>
                    </div>
                  )}

                  {/* Batch Level */}
                  {movement.batch && (
                    <div className="relative group">
                      <div className="absolute -left-[19px] top-1.5 w-4 h-4 rounded-full border-2 border-amber-500 bg-white z-10" />
                      <div className="bg-amber-50/40 border border-amber-100 rounded-lg p-4 ml-4 transition-all hover:bg-amber-50">
                        <div className="flex items-center gap-2 text-amber-600 font-black text-[10px] uppercase tracking-wider mb-1">
                          <Hash size={12} /> Batch Identifier
                        </div>
                        <p className="text-slate-800 font-bold text-sm mb-2">{movement.batch}</p>
                        {(movement.expiry_date || movement.manufacturing_date) && (
                          <div className="space-y-1.5 border-t border-amber-100 pt-2 mt-2">
                            {movement.manufacturing_date && (
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-amber-600/70 font-bold uppercase tracking-tight">MFG Date</span>
                                <span className="text-slate-700 font-bold">{movement.manufacturing_date.slice(0, 10)}</span>
                              </div>
                            )}
                            {movement.expiry_date && (
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-amber-600/70 font-bold uppercase tracking-tight">EXP Date</span>
                                <span className="text-slate-700 font-bold">{movement.expiry_date.slice(0, 10)}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Serial Numbers Level */}
                  {movement.serial_numbers && movement.serial_numbers.length > 0 && (
                    <div className="relative group">
                      <div className="absolute -left-[19px] top-1.5 w-4 h-4 rounded-full border-2 border-emerald-500 bg-white z-10" />
                      <div className="bg-emerald-50/30 border border-emerald-100 rounded-lg p-4 ml-6 transition-all hover:bg-emerald-50/50">
                        <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-wider mb-3">
                          <Zap size={12} fill="currentColor" /> Unique Serials ({movement.serial_numbers.length})
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                          {movement.serial_numbers.map((sn, i) => (
                            <span key={i} className="px-2 py-1 rounded-lg bg-white border border-emerald-100 text-emerald-700 font-mono text-[10px] font-bold shadow-sm">
                              {sn}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </SectionCard>
            </div>
          )}

          {/* TAB 2 — Context */}
          {activeTab === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SectionCard title="Movement Information">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                  <DetailItem icon={Package} label="Product" value={movement.product} />
                  <DetailItem icon={FileText} label="Reference" value={movement.ref} />
                  <DetailItem icon={Calendar} label="Date" value={fmtDate(movement.date)} />
                  <DetailItem icon={User} label="Processed By" value={movement.user || "Admin"} />
                  <DetailItem icon={Warehouse} label="Source" value={movement.source} />
                  <DetailItem icon={Warehouse} label="Destination" value={movement.destination} />
                </div>
              </SectionCard>

              <SectionCard title="Quantity Breakdown">
                <div className="space-y-4">
                  {/* Direction Hero */}
                  <div className={`rounded-xl p-5 text-center border ${isPositive ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"}`}>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Net Stock Impact</p>
                    <p className={`text-4xl font-black tabular-nums ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                      {isPositive ? `+${movement.qty}` : movement.qty}
                    </p>
                    <p className="text-xs font-bold text-slate-400 mt-1">Units</p>
                  </div>

                  {/* Stock flow grid */}
                  {movement.stocks_before !== undefined && (
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-lg p-3 border border-slate-100">
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">Opening</span>
                        <span className="text-sm font-bold text-slate-700 mt-0.5">{movement.stocks_before}</span>
                      </div>
                      <div className="flex flex-col items-center border-x border-slate-200">
                        <span className={`text-[9px] font-black uppercase tracking-tight ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                          {isPositive ? "In" : "Out"}
                        </span>
                        <span className={`text-sm font-bold mt-0.5 ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                          {isPositive ? `+${movement.qty}` : movement.qty}
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] font-black text-blue-400 uppercase tracking-tight">Closing</span>
                        <span className="text-sm font-bold text-blue-600 mt-0.5">{closingStock}</span>
                      </div>
                    </div>
                  )}
                </div>
              </SectionCard>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default StockMovementDetail;
