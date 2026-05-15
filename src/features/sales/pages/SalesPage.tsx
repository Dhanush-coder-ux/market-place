import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search, Eye, ChevronDown, X,
  CreditCard, Package, RotateCcw, Receipt, AlertCircle, CheckCircle2,
  ChevronRight, Minus, Plus, ArrowRight, RefreshCw, Banknote,
  Gift, ArrowLeft, Check, Loader2,
  DollarSign,
  BarChart2,
  Smartphone,
  Hash,
  TrendingUp,
} from "lucide-react";
import { useApi } from "@/context/ApiContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { OrderResponse } from "@/features/order/types";
import { inventoryApi } from "@/services/api/inventory";
import { useToast } from "@/context/ToastContext";
import ProductSelectionModal from "../../billing/components/ProductSelectionModel";
import { InventoryItem, ProductVariant } from "../../billing/types";

/* ═══════════════════════════════════════════════════════════════
   TYPES  (unchanged)
═══════════════════════════════════════════════════════════════ */
type OriginType = "Sales" | "Sales Return";
type PaymentMethod = "Cash" | "Card" | "UPI" | "G-Pay" | "PhonePe" | "Other";
type SaleStatus = "Completed" | "Pending" | "Cancelled";
type ReturnMode = "refund" | "exchange";
type ReturnReason = "Damaged" | "Wrong Item" | "Customer Request" | "Size Issue" | "Other" | "";
type SettlementMethod = "Cash" | "UPI" | "Card" | "Bank" | "Store Credit" | "";
type SaleRecord = OrderResponse;

interface SaleItem {
  id: string; name: string; sku: string; category: string;
  quantity: number; unitPrice: number; buyPrice: number;
  imageColor: string; status?: string; stocks_before?: number; serial_numbers?: string[];
}
interface SelectedReturnItem extends SaleItem { returnQty: number; exchangeItemId?: string; selectedSerials?: string[]; }
interface ReturnErrors { reason?: string; items?: string; settlement?: string; serials?: string; }
type ReturnStep = 1 | 2 | 3 | 4 | 5;
interface ReturnState {
  step: ReturnStep; mode: ReturnMode;
  returnItems: Record<string, number>; exchangeMap: Record<string, any>;
  serialReturnMap: Record<string, string[]>; reason: ReturnReason;
  notes: string; settlementMethod: SettlementMethod;
  errors: ReturnErrors; isSubmitting: boolean;
}

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS (unchanged)
═══════════════════════════════════════════════════════════════ */
const RETURN_REASONS: Exclude<ReturnReason, "">[] = ["Damaged", "Wrong Item", "Customer Request", "Size Issue", "Other"];
const ITEM_COLORS = ["#dbeafe", "#dcfce7", "#fef3c7", "#fce7f3", "#ede9fe", "#ffedd5", "#f0fdf4", "#ecfeff"];

/* ═══════════════════════════════════════════════════════════════
   UTILS (unchanged)
═══════════════════════════════════════════════════════════════ */
const generateItems = (sale: SaleRecord, productMap: Record<string, string> = {}): SaleItem[] =>
  (sale.items || []).map((item, i) => {
    const productName = productMap[item.inventory_id] || item.barcode || `Item ${i + 1}`;
    return {
      id: item.id,
      name: item.status === "REFUNDED" ? `(Refunded) ${productName}` : item.status === "EXCHANGED" ? `(Exchanged) ${productName}` : productName,
      sku: item.barcode?.trim() || item.inventory_id.slice(-6),
      category: "General", quantity: item.quantity,
      unitPrice: item.sell_price, buyPrice: item.buy_price,
      imageColor: ITEM_COLORS[i % ITEM_COLORS.length],
      status: item.status, variant_id: item.variant_id,
      batch_id: item.batch_id, serialno_id: item.serialno_id,
      serial_numbers: item.serial_numbers || [],
      stocks_before: (item as any).stocks_before,
    } as any;
  });

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/* ═══════════════════════════════════════════════════════════════
   BADGE CONFIGS (unchanged)
═══════════════════════════════════════════════════════════════ */
type BadgeConfig = { cls: string; dot: string };
const ORIGIN_CFG: Record<OriginType, BadgeConfig> = {
  "Sales": { cls: "bg-blue-50 text-blue-700 border-blue-100", dot: "bg-blue-400" },
  "Sales Return": { cls: "bg-orange-50 text-orange-700 border-orange-100", dot: "bg-orange-400" },
};
const PAYMENT_CFG: Record<string, BadgeConfig> = {
  Cash: { cls: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-400" },
  Card: { cls: "bg-purple-50 text-purple-700 border-purple-100", dot: "bg-purple-400" },
  UPI: { cls: "bg-indigo-50 text-indigo-700 border-indigo-100", dot: "bg-indigo-400" },
  "G-Pay": { cls: "bg-blue-50 text-blue-700 border-blue-100", dot: "bg-blue-400" },
  PhonePe: { cls: "bg-purple-50 text-purple-700 border-purple-100", dot: "bg-purple-400" },
  Credit: { cls: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-400" },
  Other: { cls: "bg-slate-50 text-slate-700 border-slate-100", dot: "bg-slate-400" },
};
const STATUS_CFG: Record<SaleStatus, BadgeConfig> = {
  Completed: { cls: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" },
  Pending: { cls: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-400" },
  Cancelled: { cls: "bg-red-50 text-red-600 border-red-100", dot: "bg-red-400" },
};

/* ═══════════════════════════════════════════════════════════════
   GLOBAL STYLES — REFACTORED
═══════════════════════════════════════════════════════════════ */
const STYLES = `
  /* ── Reset & Root ── */
  *, *::before, *::after { box-sizing: border-box; }

  .sl-root {
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    width: 100%;
    /* Contain everything — no horizontal bleed */
    overflow-x: hidden;
    position: relative;
  }

  /* ── Monospace ── */
  .sl-mono { font-family: ui-monospace, "SFMono-Regular", Menlo, Monaco, Consolas, monospace; }

  /* ── Scrollbars ── */
  .sl-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
  .sl-scroll::-webkit-scrollbar-track { background: transparent; }
  .sl-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 999px; }
  .sl-scroll::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }

  /* ── KPI Cards ── */
  .sl-kpi {
    background: white;
    border: 1px solid #f1f5f9;
    border-radius: 14px;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 180px;
    transition: box-shadow 0.2s, transform 0.2s;
    flex: 1 0 0;
  }
  .sl-kpi:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); transform: translateY(-1px); }
  .sl-kpi-icon {
    width: 40px; height: 40px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  /* ── Toolbar ── */
  .sl-toolbar {
    background: white;
    border: 1px solid #f1f5f9;
    border-radius: 14px;
    padding: 10px 14px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  }

  /* ── Table card ── */
  .sl-table-card {
    background: white;
    border: 1px solid #f1f5f9;
    border-radius: 14px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
    /* Critical: isolate from parent width */
    min-width: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  /* ── Table scroll container ── */
  .sl-table-wrap {
    overflow-x: auto;
    overflow-y: auto;
    /* Table alone scrolls; no parent bleed */
    -webkit-overflow-scrolling: touch;
    flex: 1;
  }

  /* ── Table ── */
  .sl-table {
    width: 100%;
    border-collapse: collapse;
    /* Do NOT allow table to exceed wrapper */
    table-layout: fixed;
  }
  .sl-table thead { position: sticky; top: 0; z-index: 10; }
  .sl-table thead tr {
    background: #f8fafc;
    border-bottom: 1px solid #f1f5f9;
  }
  .sl-table th {
    padding: 10px 12px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: #94a3b8;
    text-transform: uppercase;
    text-align: left;
    white-space: nowrap;
    user-select: none;
  }
  .sl-table th.r { text-align: right; }
  .sl-table th.c { text-align: center; }

  /* Column widths via table-layout:fixed */
  .sl-col-inv   { width: 110px; }
  .sl-col-cust  { width: 160px; }
  .sl-col-orig  { width: 100px; }
  .sl-col-pay   { width: 110px; }
  .sl-col-date  { width: 96px; }
  .sl-col-qty   { width: 62px; }
  .sl-col-amt   { width: 110px; }
  .sl-col-stat  { width: 100px; }
  .sl-col-act   { width: 76px; }

  /* ── Table rows ── */
  .sl-row { transition: background 0.1s; }
  .sl-row:hover { background: #f8fafc; }
  .sl-row td {
    padding: 10px 12px;
    border-bottom: 1px solid #f8fafc;
    vertical-align: middle;
    max-width: 0; /* required with table-layout:fixed to truncate */
  }
  .sl-row:last-child td { border-bottom: none; }

  /* ── Row action buttons ── */
  .sl-act-btn {
    width: 28px; height: 28px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 7px;
    border: none; background: transparent; cursor: pointer;
    color: #94a3b8;
    transition: background 0.12s, color 0.12s;
  }
  .sl-act-btn:hover { background: #eff6ff; color: #2563eb; }
  .sl-act-btn.danger:hover { background: #fef2f2; color: #dc2626; }
  .sl-act-btn:disabled { color: #e2e8f0; cursor: not-allowed; background: transparent; }

  /* ── Filter button ── */
  .sl-filter-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 12px;
    font-size: 11px; font-weight: 500;
    border: 1px solid #e2e8f0;
    border-radius: 8px; background: white;
    color: #475569; cursor: pointer;
    transition: all 0.12s; white-space: nowrap;
  }
  .sl-filter-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
  .sl-filter-btn.active { background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; }

  /* ── Dropdown ── */
  .sl-dropdown {
    position: absolute; top: calc(100% + 6px); left: 0;
    min-width: 140px; background: white;
    border: 1px solid #e2e8f0; border-radius: 10px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
    z-index: 50; overflow: hidden;
    animation: slDrop 0.12s ease forwards;
    transform-origin: top left;
  }
  @keyframes slDrop {
    from { opacity: 0; transform: scale(0.96) translateY(-4px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  .sl-dropdown-item {
    display: block; width: 100%; text-align: left;
    padding: 8px 14px; font-size: 12px; font-weight: 500;
    color: #374151; background: transparent; border: none; cursor: pointer;
    transition: background 0.1s;
  }
  .sl-dropdown-item:hover { background: #f8fafc; }
  .sl-dropdown-item.active { background: #eff6ff; color: #1d4ed8; }

  /* ── Search input ── */
  .sl-search-wrap { position: relative; flex: 1; min-width: 200px; max-width: 320px; }
  .sl-search-wrap svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; }
  .sl-search-input {
    width: 100%; height: 36px;
    padding: 0 12px 0 36px;
    font-size: 12px; color: #1e293b;
    background: #f8fafc;
    border: 1px solid #e2e8f0; border-radius: 8px;
    outline: none; transition: all 0.15s;
  }
  .sl-search-input:focus { background: white; border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
  .sl-search-input::placeholder { color: #94a3b8; }

  /* ── Date input ── */
  .sl-date-input {
    height: 36px; padding: 0 10px;
    font-size: 11px; font-weight: 500; color: #475569;
    background: white; border: 1px solid #e2e8f0; border-radius: 8px;
    outline: none; cursor: pointer; transition: all 0.12s;
  }
  .sl-date-input:focus { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
  .sl-date-input.active { background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; }

  /* ── Process Return button ── */
  .sl-return-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 14px; font-size: 12px; font-weight: 600;
    background: blue; color: white;
    border: none; border-radius: 8px; cursor: pointer;
    transition: all 0.15s; white-space: nowrap;
    box-shadow: 0 1px 3px rgba(0,0,0,0.12);
  }
  .sl-return-btn:hover { background: blue; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }

  /* ── Table footer ── */
  .sl-table-footer {
    padding: 10px 16px;
    border-top: 1px solid #f1f5f9;
    display: flex; align-items: center; justify-content: space-between;
    flex-shrink: 0;
    background: #fafafa;
  }

  /* ── Badge ── */
  .sl-badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 8px; border-radius: 999px;
    font-size: 10px; font-weight: 600; border: 1px solid;
    white-space: nowrap;
  }
  .sl-badge-dot { width: 5px; height: 5px; border-radius: 999px; flex-shrink: 0; }

  /* ── Truncate ── */
  .sl-truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  /* ── DRAWER (fixed overlay, never shifts layout) ── */
  .sl-drawer-backdrop {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(15,23,42,0.3);
    backdrop-filter: blur(2px);
    opacity: 0; animation: slFadeIn 0.2s ease forwards;
  }
  @keyframes slFadeIn { to { opacity: 1; } }

  .sl-drawer {
    position: fixed; top: 0; right: 0;
    height: 100vh; width: 420px; max-width: 100vw;
    background: white; z-index: 201;
    display: flex; flex-direction: column;
    box-shadow: -16px 0 48px rgba(0,0,0,0.08);
    transform: translateX(100%);
    transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
    will-change: transform;
  }
  .sl-drawer.open { transform: translateX(0); }

  /* ── Return modal ── */
  .sl-modal-backdrop {
    position: fixed; inset: 0; z-index: 300;
    background: rgba(15,23,42,0.45);
    backdrop-filter: blur(4px);
    animation: slFadeIn 0.15s ease forwards;
  }
  .sl-modal-panel {
    position: fixed; inset: 0; z-index: 301;
    display: flex; align-items: center; justify-content: center;
    padding: 16px;
  }
  .sl-modal-box {
    background: white; border-radius: 20px;
    width: 100%; max-width: 520px;
    max-height: calc(100vh - 32px);
    display: flex; flex-direction: column;
    box-shadow: 0 24px 64px rgba(0,0,0,0.18);
    animation: slModalIn 0.22s cubic-bezier(0.34,1.15,0.64,1) forwards;
  }
  @keyframes slModalIn {
    from { opacity: 0; transform: scale(0.95) translateY(8px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  /* ── Return search modal ── */
  .sl-search-modal {
    position: fixed; inset: 0; z-index: 400;
    display: flex; align-items: flex-start; justify-content: center;
    padding-top: 80px; padding-left: 16px; padding-right: 16px;
  }
  .sl-search-modal-box {
    background: white; border-radius: 16px; width: 100%; max-width: 480px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.18);
    overflow: hidden;
    animation: slModalIn 0.18s cubic-bezier(0.34,1.15,0.64,1) forwards;
  }

  /* ── Step progress ── */
  .sl-step-bar { transition: width 0.3s ease; }
  .sl-step-enter { animation: slStepIn 0.2s ease forwards; }
  @keyframes slStepIn {
    from { opacity: 0; transform: translateX(8px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  /* ── Done pop ── */
  .sl-done-pop { animation: slDonePop 0.35s cubic-bezier(0.34,1.5,0.64,1) forwards; }
  @keyframes slDonePop {
    from { opacity: 0; transform: scale(0.7); }
    to   { opacity: 1; transform: scale(1); }
  }

  /* ── Checkbox ── */
  .sl-cb {
    appearance: none; width: 15px; height: 15px;
    border: 1.5px solid #d1d5db; border-radius: 4px;
    background: white; cursor: pointer; position: relative; flex-shrink: 0;
    transition: all 0.12s;
  }
  .sl-cb:checked { background: #2563eb; border-color: #2563eb; }
  .sl-cb:checked::after {
    content: ''; position: absolute;
    left: 3.5px; top: 1px; width: 5px; height: 8px;
    border: 1.5px solid white; border-top: none; border-left: none;
    transform: rotate(42deg);
  }

  /* ── Item rows (return modal) ── */
  .sl-item-row { transition: background 0.1s, border-color 0.1s; cursor: pointer; }
  .sl-item-row.sel { background: #eff6ff; border-color: #bfdbfe; }
  .sl-item-row:not(.sel):hover { background: #f8fafc; }

  /* ── Qty stepper ── */
  .sl-qty-btn {
    width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;
    border: none; background: transparent; cursor: pointer; color: #94a3b8;
    transition: background 0.1s, color 0.1s; border-radius: 5px;
  }
  .sl-qty-btn:hover:not(:disabled) { background: #eff6ff; color: #2563eb; }
  .sl-qty-btn:disabled { opacity: 0.3; cursor: not-allowed; }

  /* ── Exchange card ── */
  .sl-exch-card { transition: all 0.12s; cursor: pointer; }
  .sl-exch-card:hover:not(.disabled) { border-color: #93c5fd; background: #f0f7ff; }
  .sl-exch-card.selected { border-color: #3b82f6; background: #eff6ff; }
  .sl-exch-card.disabled { opacity: 0.4; cursor: not-allowed; }

  /* ── Mode pill (return modal) ── */
  .sl-mode-pill { transition: all 0.15s; }
  .sl-mode-pill.active { background: white; border-color: #93c5fd; color: #1d4ed8; box-shadow: 0 1px 6px rgba(59,130,246,0.12); }

  /* ── Refund method pill ── */
  .sl-rfm-pill { transition: all 0.12s; cursor: pointer; }
  .sl-rfm-pill.active { border-color: #3b82f6; background: #eff6ff; }
  .sl-rfm-pill:not(.active):hover { border-color: #93c5fd; }

  /* ── Select ── */
  select.sl-select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
  }

  /* ── Btn primary ── */
  .sl-btn-primary {
    transition: all 0.15s;
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  }
  .sl-btn-primary:hover:not(:disabled) { filter: brightness(1.05); box-shadow: 0 4px 12px rgba(37,99,235,0.25); }
  .sl-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }

  /* ── Drawer section ── */
  .sl-section { margin-bottom: 24px; }
  .sl-section-header {
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 12px; padding-bottom: 8px;
    border-bottom: 1px solid #f1f5f9;
  }
  .sl-section-title {
    font-size: 11px; font-weight: 700; color: #94a3b8;
    letter-spacing: 0.05em; text-transform: uppercase;
  }

  /* ── Info Grid ── */
  .sl-info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .sl-info-card {
    background: white; border: 1px solid #f1f5f9;
    border-radius: 12px; padding: 12px;
    transition: border-color 0.15s;
  }
  .sl-info-card:hover { border-color: #e2e8f0; }
  .sl-info-label {
    font-size: 9px; font-weight: 700; color: #94a3b8;
    text-transform: uppercase; letter-spacing: 0.05em;
    margin-bottom: 4px; display: flex; align-items: center; gap: 4px;
  }
  .sl-info-value { font-size: 12px; font-weight: 600; color: #1e293b; word-break: break-all; }

  /* ── Price breakdown ── */
  .sl-price-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; }
  .sl-price-label { color: #64748b; }
  .sl-price-val { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace; font-weight: 600; color: #1e293b; }
  .sl-price-total { border-top: 1px solid #e2e8f0; margin-top: 8px; padding-top: 8px; font-weight: 700; color: #0f172a; font-size: 14px; }

  /* ── Responsive ── */
  @media (max-width: 768px) {
    .sl-kpi { min-width: 150px; padding: 12px 14px; }
    .sl-drawer { width: 100vw; }
    .sl-col-cust { width: 120px; }
    .sl-col-orig, .sl-col-pay { width: 88px; }
    .sl-info-grid { grid-template-columns: 1fr; }
  }
`;

/* ═══════════════════════════════════════════════════════════════
   BADGE
═══════════════════════════════════════════════════════════════ */
const Badge: React.FC<{ cls: string; dot: string; label: string }> = ({ cls, dot, label }) => (
  <span className={`sl-badge ${cls}`}>
    <span className={`sl-badge-dot ${dot}`} />
    {label}
  </span>
);

/* ═══════════════════════════════════════════════════════════════
   KPI CARD  (replaces StatsCard for layout control)
═══════════════════════════════════════════════════════════════ */
interface KpiCardProps {
  label: string; value: string | number;
  icon: React.ReactNode; iconBg: string; iconColor: string;
  sub?: string;
}
const KpiCard: React.FC<KpiCardProps> = ({ label, value, icon, iconBg, iconColor, sub }) => (
  <div className="sl-kpi">
    <div className={`sl-kpi-icon ${iconBg}`}>
      <span className={iconColor}>{icon}</span>
    </div>
    <div className="min-w-0">
      <p style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 10, color: '#64748b', marginTop: 3 }}>{sub}</p>}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   QUANTITY STEPPER (unchanged logic)
═══════════════════════════════════════════════════════════════ */
interface QuantityStepperProps { value: number; min?: number; max: number; onChange: (v: number) => void; onClick?: (e: React.MouseEvent) => void; }
const QuantityStepper: React.FC<QuantityStepperProps> = ({ value, min = 1, max, onChange, onClick }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', background: 'white' }} onClick={onClick}>
    <button className="sl-qty-btn" disabled={value <= min} onClick={e => { e.stopPropagation(); onChange(Math.max(min, value - 1)); }}><Minus size={9} /></button>
    <span className="sl-mono" style={{ width: 28, textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#1e293b' }}>{value}</span>
    <button className="sl-qty-btn" disabled={value >= max} onClick={e => { e.stopPropagation(); onChange(Math.min(max, value + 1)); }}><Plus size={9} /></button>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   STEP HEADER (unchanged logic, refined style)
═══════════════════════════════════════════════════════════════ */
const STEP_LABELS: Record<ReturnStep, string> = { 1: "Mode", 2: "Items", 3: "Reason", 4: "Review", 5: "Done" };

interface StepHeaderProps { step: ReturnStep; mode: ReturnMode; invoice: string; }
const StepHeader: React.FC<StepHeaderProps> = ({ step, mode, invoice }) => {
  const progress = ((step - 1) / 3) * 100;
  return (
    <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3 }}>
            {step < 5 ? `Step ${step} of 4` : 'Complete'}
          </p>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
            {step === 1 ? "Choose Return Mode"
              : step === 2 ? (mode === "refund" ? "Select Items for Refund" : "Select Items to Exchange")
                : step === 3 ? "Reason & Settlement"
                  : step === 4 ? "Review & Confirm"
                    : "Return Processed"}
          </p>
        </div>
        <span className="sl-mono" style={{ fontSize: 10, color: '#94a3b8', background: '#f8fafc', border: '1px solid #f1f5f9', padding: '4px 8px', borderRadius: 6 }}>{invoice}</span>
      </div>
      {step < 5 && (
        <>
          <div style={{ height: 3, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden', marginBottom: 8 }}>
            <div className="sl-step-bar" style={{ height: '100%', background: '#2563eb', borderRadius: 999, width: `${progress}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {([1, 2, 3, 4] as ReturnStep[]).map(s => (
              <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <div style={{ width: 6, height: 6, borderRadius: 999, background: s <= step ? '#2563eb' : '#e2e8f0', transition: 'background 0.3s' }} />
                <span style={{ fontSize: 9, fontWeight: 600, color: s <= step ? '#2563eb' : '#cbd5e1', letterSpacing: '0.06em', textTransform: 'uppercase', transition: 'color 0.3s' }}>{STEP_LABELS[s]}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   REFUND SUMMARY (unchanged logic)
═══════════════════════════════════════════════════════════════ */
interface RefundSummaryProps {
  mode: ReturnMode; selectedItems: SelectedReturnItem[];
  totals: { returnValue: number; exchangeValue: number; diff: number };
  settlementMethod: SettlementMethod; originalPayment: PaymentMethod;
}
const RefundSummary: React.FC<RefundSummaryProps> = ({ mode, selectedItems, totals, settlementMethod, originalPayment }) => {
  const { returnValue, exchangeValue, diff } = totals;
  const isStoreCredit = settlementMethod === "Store Credit";
  if (mode === "refund") {
    return (
      <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)', border: '1px solid #bfdbfe', borderRadius: 14, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#3b82f6', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
              {isStoreCredit ? "Store Credit" : "Refund Amount"}
            </p>
            <p className="sl-mono" style={{ fontSize: 26, fontWeight: 300, color: '#1d4ed8' }}>{fmt(returnValue)}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <span style={{ fontSize: 10, color: '#64748b' }}>{selectedItems.reduce((s, i) => s + i.returnQty, 0)} item(s)</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
              {isStoreCredit ? <Gift size={10} /> : <Banknote size={10} />}
              {isStoreCredit ? "Store Credit" : `Via ${settlementMethod || originalPayment}`}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ border: '1px solid', borderColor: diff > 0 ? '#fde68a' : diff < 0 ? '#a7f3d0' : '#e2e8f0', borderRadius: 14, padding: '14px 16px', background: diff > 0 ? '#fffbeb' : diff < 0 ? '#ecfdf5' : '#f8fafc' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, textAlign: 'center' }}>
        {[
          { label: 'Return Value', val: fmt(returnValue), color: '#475569' },
          { label: 'Exchange Value', val: fmt(exchangeValue), color: '#475569' },
          { label: diff > 0 ? 'Customer Pays' : diff < 0 ? 'Shop Refunds' : 'Settled', val: diff === 0 ? '–' : fmt(Math.abs(diff)), color: diff > 0 ? '#b45309' : diff < 0 ? '#065f46' : '#94a3b8' },
        ].map(({ label, val, color }) => (
          <div key={label}>
            <p style={{ fontSize: 9, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</p>
            <p className="sl-mono" style={{ fontSize: 13, fontWeight: 700, color }}>{val}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SERIAL RETURN PICKER (unchanged logic)
═══════════════════════════════════════════════════════════════ */
interface SerialReturnPickerProps { allSerials: string[]; selected: string[]; required: number; onChange: (serials: string[]) => void; }
const SerialReturnPicker: React.FC<SerialReturnPickerProps> = ({ allSerials, selected, required, onChange }) => {
  const toggle = (sn: string) => {
    if (selected.includes(sn)) onChange(selected.filter(s => s !== sn));
    else if (selected.length < required) onChange([...selected, sn]);
  };
  const ok = selected.length === required;
  return (
    <div style={{ marginTop: 10, borderRadius: 10, border: '1px solid #ddd6fe', background: 'rgba(237,233,254,0.5)', padding: 10 }} onClick={e => e.stopPropagation()}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', display: 'flex', alignItems: 'center', gap: 4 }}><Hash size={10} />Select Serial Numbers</p>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: ok ? '#d1fae5' : '#fef3c7', color: ok ? '#065f46' : '#92400e' }}>{selected.length}/{required}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {allSerials.map(sn => {
          const isSel = selected.includes(sn);
          const isDisabled = !isSel && selected.length >= required;
          return (
            <button key={sn} onClick={() => toggle(sn)} disabled={isDisabled}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, fontSize: 10, fontFamily: 'monospace', fontWeight: 600, border: '1px solid', cursor: isDisabled ? 'not-allowed' : 'pointer', transition: 'all 0.1s', background: isSel ? '#7c3aed' : isDisabled ? 'white' : 'white', color: isSel ? 'white' : isDisabled ? '#d1d5db' : '#7c3aed', borderColor: isSel ? '#7c3aed' : isDisabled ? '#f3f4f6' : '#ddd6fe' }}>
              {isSel && <Check size={8} />}{sn}
            </button>
          );
        })}
      </div>
      {!ok && <p style={{ marginTop: 6, fontSize: 10, color: '#d97706', display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={10} />Select {required - selected.length} more to proceed</p>}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   ITEM SELECTOR (unchanged logic)
═══════════════════════════════════════════════════════════════ */
interface ItemSelectorProps {
  items: SaleItem[]; returnItems: Record<string, number>; serialReturnMap: Record<string, string[]>;
  onToggle: (id: string) => void; onQtyChange: (id: string, v: number) => void;
  onSerialChange: (id: string, serials: string[]) => void; onSelectAll: (all: boolean) => void; error?: string;
}
const ItemSelector: React.FC<ItemSelectorProps> = ({ items, returnItems, serialReturnMap, onToggle, onQtyChange, onSerialChange, onSelectAll, error }) => {
  const [q, setQ] = useState("");
  const filtered = items.filter(i => i.name.toLowerCase().includes(q.toLowerCase()) || i.sku.toLowerCase().includes(q.toLowerCase()));
  const selectableItems = filtered.filter(i => i.status !== "REFUNDED" && i.status !== "EXCHANGED");
  const allSelected = selectableItems.length > 0 && selectableItems.every(i => returnItems[i.id] !== undefined);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input type="text" placeholder="Search items..." value={q} onChange={e => setQ(e.target.value)}
            className="sl-search-input" style={{ paddingLeft: 32, height: 34 }} />
        </div>
        <button onClick={() => onSelectAll(!allSelected)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600, border: '1px solid', transition: 'all 0.12s', cursor: 'pointer', background: allSelected ? '#2563eb' : 'white', borderColor: allSelected ? '#2563eb' : '#e2e8f0', color: allSelected ? 'white' : '#475569' }}>
          {allSelected ? <Check size={11} /> : <div style={{ width: 11, height: 11, borderRadius: 3, border: '1.5px solid #d1d5db' }} />}
          All
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filtered.map(item => {
          const checked = returnItems[item.id] !== undefined;
          const qty = returnItems[item.id] ?? 1;
          const isProcessed = item.status === "REFUNDED" || item.status === "EXCHANGED";
          const hasSerials = item.serial_numbers && item.serial_numbers.length > 0;
          const selectedSerials = serialReturnMap[item.id] ?? [];
          return (
            <div key={item.id} className={`sl-item-row ${checked ? "sel" : ""}`}
              style={{ border: '1px solid', borderColor: checked ? '#bfdbfe' : '#f1f5f9', borderRadius: 10, padding: '10px 12px', opacity: isProcessed ? 0.6 : 1, cursor: isProcessed ? 'not-allowed' : 'pointer', background: isProcessed ? '#f8fafc' : '' }}
              onClick={() => !isProcessed && onToggle(item.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" className="sl-cb" checked={checked} disabled={isProcessed} readOnly onClick={e => e.stopPropagation()} />
                <div style={{ width: 34, height: 34, borderRadius: 8, background: item.imageColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Package size={13} style={{ color: '#64748b', opacity: 0.6 }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>{item.name}</p>
                        {item.status && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: item.status === "REFUNDED" ? '#fef2f2' : '#eff6ff', color: item.status === "REFUNDED" ? '#dc2626' : '#2563eb' }}>{item.status}</span>}
                        {hasSerials && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', gap: 3 }}><Hash size={8} />SN</span>}
                      </div>
                      <p className="sl-mono" style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{item.sku} · {item.category}</p>
                    </div>
                    <p className="sl-mono" style={{ fontSize: 11, fontWeight: 700, color: '#1e293b', flexShrink: 0 }}>{fmt(item.unitPrice)}</p>
                  </div>
                  {checked && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }} onClick={e => e.stopPropagation()}>
                        <span style={{ fontSize: 10, color: '#94a3b8' }}>Qty</span>
                        <QuantityStepper value={qty} max={item.quantity} onChange={v => onQtyChange(item.id, v)} />
                        <span style={{ fontSize: 10, color: '#94a3b8' }}>of {item.quantity}</span>
                        <span className="sl-mono" style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: '#2563eb' }}>{fmt(item.unitPrice * qty)}</span>
                      </div>
                      {hasSerials && <SerialReturnPicker allSerials={item.serial_numbers as string[]} selected={selectedSerials} required={qty} onChange={s => onSerialChange(item.id, s)} />}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ padding: '32px 0', textAlign: 'center', background: '#f8fafc', borderRadius: 10, border: '1px dashed #e2e8f0' }}>
            <p style={{ fontSize: 12, color: '#94a3b8' }}>No items match your search.</p>
          </div>
        )}
      </div>
      {error && <p style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#ef4444' }}><AlertCircle size={11} />{error}</p>}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   USE RETURN HOOK (100% unchanged)
═══════════════════════════════════════════════════════════════ */
const initialState = (): ReturnState => ({
  step: 1, mode: "refund", returnItems: {}, exchangeMap: {}, serialReturnMap: {},
  reason: "", notes: "", settlementMethod: "Cash", errors: {}, isSubmitting: false,
});

const useReturnModal = (sale: SaleRecord | null, productMap: Record<string, string> = {}) => {
  const [state, setState] = useState<ReturnState>(initialState());
  const saleItems = useMemo<SaleItem[]>(() => (sale ? generateItems(sale, productMap) : []), [sale?.id, productMap]);
  const reset = useCallback(() => setState(initialState()), []);
  const setStep = (step: ReturnStep) => setState(s => ({ ...s, step }));
  const setMode = (mode: ReturnMode) => setState(s => ({ ...s, mode, settlementMethod: mode === "refund" ? "Cash" : "" }));
  const setReason = (reason: ReturnReason) => setState(s => ({ ...s, reason, errors: { ...s.errors, reason: undefined } }));
  const setNotes = (notes: string) => setState(s => ({ ...s, notes }));
  const setSettlementMethod = (sm: SettlementMethod) => setState(s => ({ ...s, settlementMethod: sm, errors: { ...s.errors, settlement: undefined } }));
  const { showToast } = useToast();

  const toggleItem = useCallback((itemId: string) => {
    setState(s => {
      const next = { ...s.returnItems }, nextEx = { ...s.exchangeMap }, nextSer = { ...s.serialReturnMap };
      if (next[itemId] !== undefined) { delete next[itemId]; delete nextEx[itemId]; delete nextSer[itemId]; }
      else {
        const item = saleItems.find(i => i.id === itemId);
        next[itemId] = item?.quantity ?? 1;
        if (item?.serial_numbers?.length) nextSer[itemId] = [...item.serial_numbers];
      }
      return { ...s, returnItems: next, exchangeMap: nextEx, serialReturnMap: nextSer, errors: { ...s.errors, items: undefined } };
    });
  }, [saleItems]);

  const setSerialReturns = useCallback((itemId: string, serials: string[]) => setState(s => ({ ...s, serialReturnMap: { ...s.serialReturnMap, [itemId]: serials } })), []);
  const selectAll = useCallback((all: boolean) => {
    setState(s => {
      if (!all) return { ...s, returnItems: {}, exchangeMap: {} };
      const next: Record<string, number> = {};
      saleItems.forEach(i => { if (i.status !== "REFUNDED" && i.status !== "EXCHANGED") next[i.id] = i.quantity; });
      return { ...s, returnItems: next, errors: { ...s.errors, items: undefined } };
    });
  }, [saleItems]);

  const updateQty = useCallback((itemId: string, v: number) => {
    const item = saleItems.find(i => i.id === itemId);
    if (!item) return;
    setState(s => ({ ...s, returnItems: { ...s.returnItems, [itemId]: Math.min(Math.max(1, v), item.quantity) } }));
  }, [saleItems]);

  const setExchangeProduct = useCallback((itemId: string, product: any) => setState(s => ({ ...s, exchangeMap: { ...s.exchangeMap, [itemId]: product } })), []);

  const selectedItems = useMemo<SelectedReturnItem[]>(() =>
    saleItems.filter(i => state.returnItems[i.id] !== undefined)
      .map(i => ({ ...i, returnQty: state.returnItems[i.id], exchangeItemId: state.exchangeMap[i.id], selectedSerials: state.serialReturnMap[i.id] })),
    [saleItems, state.returnItems, state.exchangeMap, state.serialReturnMap]);

  const totals = useMemo(() => {
    const returnValue = selectedItems.reduce((s, i) => s + i.unitPrice * i.returnQty, 0);
    const exchangeValue = state.mode === "exchange" ? selectedItems.reduce((s, i) => { if (!i.exchangeItemId) return s; const ep = i.exchangeItemId as any; return s + (ep?.sell_price ?? 0); }, 0) : 0;
    return { returnValue, exchangeValue, diff: exchangeValue - returnValue };
  }, [selectedItems, state.mode]);

  const validate = useCallback((): boolean => {
    const errs: ReturnErrors = {};
    if (!state.reason) errs.reason = "Please select a reason.";
    if (selectedItems.length === 0) errs.items = "Select at least one item.";
    const requiresSettlement = state.mode === "refund" || totals.diff !== 0;
    if (requiresSettlement && !state.settlementMethod) errs.settlement = "Please select a payment/refund method.";
    setState(s => ({ ...s, errors: errs }));
    return Object.keys(errs).length === 0;
  }, [state.reason, state.mode, state.settlementMethod, selectedItems, totals]);

  const goNext = useCallback(() => { if (state.step === 3 && !validate()) return; setStep((state.step + 1) as ReturnStep); }, [state.step, validate]);
  const goBack = useCallback(() => { if (state.step > 1) setStep((state.step - 1) as ReturnStep); }, [state.step]);

  const confirm = useCallback(async (onSuccess?: () => void) => {
    setState(s => ({ ...s, isSubmitting: true }));
    try {
      if (state.mode === "refund") {
        await inventoryApi.bulkReturnOrder({ order_id: sale?.id || "", items_id: selectedItems.map(i => i.id), serial_numbers: selectedItems.filter(i => i.selectedSerials?.length).flatMap(i => i.selectedSerials as string[]) } as any);
        showToast("Refund(s) processed successfully", "success");
      } else {
        const productsMap = new Map<string, any>();
        selectedItems.forEach(item => {
          const replacement = state.exchangeMap[item.id]; if (!replacement) return;
          const key = `${replacement.id}-${replacement.variant_id || "none"}-${replacement.batch_id || "none"}-${replacement.serialno_id || "none"}`;
          if (productsMap.has(key)) { const ex = productsMap.get(key); ex.quantity += replacement.quantity || item.returnQty; if (replacement.serial_numbers) ex.serial_numbers = [...ex.serial_numbers, ...replacement.serial_numbers]; }
          else productsMap.set(key, { id: replacement.id, variant_id: replacement.variant_id || null, batch_id: replacement.batch_id || null, serialno_id: replacement.serialno_id || null, serial_numbers: replacement.serial_numbers || [], quantity: replacement.quantity || item.returnQty });
        });
        await inventoryApi.bulkExchangeOrder({ shop_id: SHOP_ID, customer_id: sale?.customer_id || "", order_id: sale?.id || "", items_id: selectedItems.map(i => i.id), payment_method: state.settlementMethod || sale?.payment_method || "Cash", products: Array.from(productsMap.values()) });
        showToast("Exchange(s) processed successfully", "success");
      }
      onSuccess?.();
      setState(s => ({ ...s, isSubmitting: false, step: 5 }));
    } catch (err) {
      console.error("Return/Exchange failed:", err);
      showToast("Operation failed. Please try again.", "error");
      setState(s => ({ ...s, isSubmitting: false }));
    }
  }, [state, selectedItems, sale, showToast]);

  const canProceed = useMemo(() => {
    if (state.step === 2) {
      if (selectedItems.length === 0) return false;
      const serialsOk = selectedItems.every(i => !i.serial_numbers?.length || (i.selectedSerials?.length ?? 0) === i.returnQty);
      if (!serialsOk) return false;
      return state.mode === "refund" || selectedItems.every(i => !!i.exchangeItemId);
    }
    if (state.step === 3) return !!state.reason && (state.mode === "refund" || totals.diff === 0 || !!state.settlementMethod);
    return true;
  }, [state.step, state.mode, selectedItems, state.reason, totals.diff, state.settlementMethod]);

  return { state, saleItems, selectedItems, totals, reset, setMode, setReason, setNotes, setSettlementMethod, toggleItem, selectAll, updateQty, setExchangeProduct, setSerialReturns, goNext, goBack, confirm, canProceed };
};

/* ═══════════════════════════════════════════════════════════════
   RETURN MODAL (refactored UI, identical logic)
═══════════════════════════════════════════════════════════════ */
interface ReturnModalProps { sale: SaleRecord; onClose: () => void; onRefresh: () => void; productMap: Record<string, string>; }

const ReturnModal: React.FC<ReturnModalProps> = ({ sale, onClose, onRefresh, productMap }) => {
  const m = useReturnModal(sale, productMap);
  const { state, saleItems, selectedItems, totals } = m;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [exchSearch, setExchSearch] = useState("");
  const [activeReplaceId, setActiveReplaceId] = useState<string | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<InventoryItem | null>(null);
  const [exchProducts, setExchProducts] = useState<any[]>([]);
  const [loadingExch, setLoadingExch] = useState(false);

  const mapToInventoryItem = (p: any): InventoryItem => ({
    id: p.id, product_barcode: p.barcode || "N/A", product_name: p.name || "Unknown", category: p.category || "Other",
    variants: (p.variants || []).map((v: any) => ({ ...v, price: v.sell_price || 0, stock: v.stocks || 0, serialnoId: v.serial_numbers?.id || v.serial_number?.id || v.batches?.[0]?.serial_numbers?.id, availableSerials: v.serial_numbers?.serial_numbers || v.serial_number?.serial_numbers || v.batches?.[0]?.serial_numbers?.serial_numbers || [], batchId: v.batches?.[0]?.id })),
    requireSerial: p.has_serialno || false, batchTracking: p.has_batch || false,
    manufacturingDate: p.batches?.[0]?.manufacturing_date, expiryDate: p.batches?.[0]?.expiry_date,
    price: p.sell_price || 0, stocks: p.stocks || 0,
    serialnoId: p.serial_number?.id || p.batches?.[0]?.serial_numbers?.id,
    availableSerials: p.serial_number?.serial_numbers || p.batches?.[0]?.serial_numbers?.serial_numbers || [],
    batchId: p.batches?.[0]?.id,
  });

  const handleExchangeClick = (ep: any) => { setPendingProduct(mapToInventoryItem(ep)); setIsProductModalOpen(true); };
  const handleProductSelectSuccess = (variant: ProductVariant, quantity: number, serials?: string[]) => {
    if (!activeReplaceId || !pendingProduct) return;
    m.setExchangeProduct(activeReplaceId, { id: pendingProduct.id, name: variant.id === "default" ? pendingProduct.product_name : `${pendingProduct.product_name} - ${variant.name}`, sell_price: variant.price, variant_id: variant.id === "default" ? null : variant.id, batch_id: variant.batchId || pendingProduct.batchId, serialno_id: variant.serialnoId || pendingProduct.serialnoId, serial_numbers: serials || [], quantity });
    setIsProductModalOpen(false); setPendingProduct(null);
  };

  useEffect(() => {
    const t = setTimeout(async () => { setLoadingExch(true); const res = await inventoryApi.searchInventories(exchSearch); setExchProducts(res); setLoadingExch(false); }, 300);
    return () => clearTimeout(t);
  }, [exchSearch]);

  useEffect(() => {
    if (selectedItems.length > 0 && (!activeReplaceId || !selectedItems.some(i => i.id === activeReplaceId))) setActiveReplaceId(selectedItems[0].id);
  }, [selectedItems, activeReplaceId]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }, [state.step]);
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [onClose]);

  const canReturn = sale.status === "Completed" && sale.origin !== "Sales Return";

  return (
    <>
      <div className="sl-modal-backdrop" onClick={onClose} />
      <div className="sl-modal-panel">
        <div className="sl-modal-box" onClick={e => e.stopPropagation()}>
          <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, zIndex: 10, width: 26, height: 26, borderRadius: '50%', background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
            <X size={13} />
          </button>
          <StepHeader step={state.step} mode={state.mode} invoice={`INV-${sale.ui_id}`} />

          {!canReturn ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '48px 32px', textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fff7ed', border: '1px solid #fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertCircle size={20} style={{ color: '#f97316' }} /></div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>{sale.origin === "Sales Return" ? "Already Returned" : "Not Eligible"}</p>
                <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>{sale.origin === "Sales Return" ? "This order is already a Sales Return." : `Only Completed orders can be returned. This order is ${sale.status}.`}</p>
              </div>
              <button onClick={onClose} style={{ padding: '8px 18px', fontSize: 12, fontWeight: 600, color: '#475569', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer' }}>Close</button>
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="sl-scroll" style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>
                <div key={state.step} className="sl-step-enter" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                  {/* STEP 1 */}
                  {state.step === 1 && (
                    <>
                      <p style={{ fontSize: 12, color: '#64748b' }}>How would you like to handle this return?</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {[
                          { id: "refund" as ReturnMode, icon: <Banknote size={20} />, label: "Refund", desc: "Return money to customer" },
                          { id: "exchange" as ReturnMode, icon: <RefreshCw size={20} />, label: "Exchange", desc: "Swap for other products" },
                        ].map(opt => (
                          <button key={opt.id} onClick={() => m.setMode(opt.id)}
                            className={`sl-mode-pill ${state.mode === opt.id ? "active" : ""}`}
                            style={{ textAlign: 'left', padding: '14px', border: '2px solid', borderColor: state.mode === opt.id ? '#93c5fd' : '#f1f5f9', borderRadius: 12, background: state.mode === opt.id ? 'white' : '#f8fafc', cursor: 'pointer', transition: 'all 0.15s' }}>
                            <div style={{ marginBottom: 8, color: state.mode === opt.id ? '#2563eb' : '#94a3b8' }}>{opt.icon}</div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>{opt.label}</p>
                            <p style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>{opt.desc}</p>
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {/* STEP 2 */}
                  {state.step === 2 && (
                    <>
                      <ItemSelector items={saleItems} returnItems={state.returnItems} serialReturnMap={state.serialReturnMap} onToggle={m.toggleItem} onQtyChange={m.updateQty} onSerialChange={m.setSerialReturns} onSelectAll={m.selectAll} error={state.errors.items} />
                      {state.mode === "exchange" && selectedItems.length > 0 && (
                        <div style={{ paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                          <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Replacement Items</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                            {selectedItems.map(si => {
                              const hasRep = !!state.exchangeMap[si.id];
                              const isAct = activeReplaceId === si.id;
                              return (
                                <button key={si.id} onClick={() => setActiveReplaceId(si.id)}
                                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600, border: '1px solid', cursor: 'pointer', transition: 'all 0.12s', background: isAct ? '#eff6ff' : 'white', borderColor: isAct ? '#3b82f6' : '#e2e8f0', color: isAct ? '#1d4ed8' : '#475569', boxShadow: isAct ? '0 1px 4px rgba(59,130,246,0.15)' : 'none' }}>
                                  {si.name}
                                  {hasRep && <CheckCircle2 size={11} style={{ color: isAct ? '#2563eb' : '#10b981' }} />}
                                </button>
                              );
                            })}
                          </div>
                          <div style={{ position: 'relative', marginBottom: 12 }}>
                            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input type="text" placeholder="Search replacement catalog..." value={exchSearch} onChange={e => setExchSearch(e.target.value)}
                              className="sl-search-input" style={{ paddingLeft: 32, height: 36, width: '100%' }} />
                          </div>
                          {activeReplaceId && (() => {
                            const ai = selectedItems.find(i => i.id === activeReplaceId);
                            if (!ai) return null;
                            return (
                              <>
                                <p style={{ fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <ArrowRight size={10} style={{ color: '#94a3b8' }} />
                                  Replacing: <span style={{ color: '#1e293b' }}>{ai.name}</span>
                                  <span className="sl-mono" style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: 10 }}>{fmt(ai.unitPrice * ai.returnQty)}</span>
                                </p>
                                {loadingExch ? (
                                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                                    <Loader2 size={22} style={{ color: '#3b82f6', margin: '0 auto', display: 'block' }} className="animate-spin" />
                                    <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 8 }}>Searching...</p>
                                  </div>
                                ) : exchProducts.length === 0 ? (
                                  <div style={{ padding: '24px 0', textAlign: 'center', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9' }}>
                                    <p style={{ fontSize: 11, color: '#94a3b8' }}>No products found</p>
                                  </div>
                                ) : (
                                  <div className="sl-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto', paddingRight: 2 }}>
                                    {exchProducts.map(ep => {
                                      const sel = state.exchangeMap[activeReplaceId]?.id === ep.id;
                                      const inStock = (ep.stocks || 0) > 0;
                                      return (
                                        <div key={ep.id} onClick={() => inStock && handleExchangeClick(ep)}
                                          className={`sl-exch-card ${sel ? "selected" : ""} ${!inStock ? "disabled" : ""}`}
                                          style={{ border: '1px solid', borderColor: sel ? '#3b82f6' : '#f1f5f9', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                                          <div style={{ width: 34, height: 34, borderRadius: 8, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Package size={13} style={{ color: '#94a3b8', opacity: 0.6 }} />
                                          </div>
                                          <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: 11, fontWeight: 600, color: '#1e293b' }} className="sl-truncate">{ep.name}</p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                                              <span className="sl-mono" style={{ fontSize: 9, color: '#94a3b8' }}>{ep.barcode || ep.id.slice(-6)}</span>
                                              <span style={{ fontSize: 9, fontWeight: 700, color: inStock ? '#10b981' : '#ef4444' }}>{inStock ? `${ep.stocks} IN STOCK` : 'OUT OF STOCK'}</span>
                                            </div>
                                          </div>
                                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            <p className="sl-mono" style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{fmt(ep.sell_price)}</p>
                                            {sel && <div style={{ marginTop: 4, display: 'flex', justifyContent: 'flex-end' }}><div style={{ width: 16, height: 16, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={9} style={{ color: 'white' }} /></div></div>}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </>
                  )}

                  {/* STEP 3 */}
                  {state.step === 3 && (
                    <>
                      <div>
                        <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Return Reason <span style={{ color: '#ef4444' }}>*</span></label>
                        <select value={state.reason} onChange={e => m.setReason(e.target.value as ReturnReason)}
                          className="sl-select"
                          style={{ width: '100%', padding: '10px 36px 10px 12px', fontSize: 12, border: '1px solid', borderColor: state.errors.reason ? '#fca5a5' : '#e2e8f0', borderRadius: 9, background: state.errors.reason ? '#fef2f2' : 'white', color: '#1e293b', outline: 'none' }}>
                          <option value="">Select a reason…</option>
                          {RETURN_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        {state.errors.reason && <p style={{ marginTop: 5, fontSize: 11, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={11} />{state.errors.reason}</p>}
                      </div>

                      {(state.mode === "refund" || totals.diff !== 0) && (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                              {state.mode === "refund" || totals.diff < 0 ? "Refund Via" : "Collect Via"} <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            {totals.diff !== 0 && state.mode === "exchange" && (
                              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: totals.diff > 0 ? '#fffbeb' : '#ecfdf5', color: totals.diff > 0 ? '#b45309' : '#065f46', border: '1px solid', borderColor: totals.diff > 0 ? '#fde68a' : '#a7f3d0' }}>Balance: {fmt(Math.abs(totals.diff))}</span>
                            )}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                            {[{ id: "Cash", icon: <Banknote size={18} strokeWidth={1.5} /> }, { id: "UPI", icon: <Smartphone size={18} strokeWidth={1.5} /> }, { id: "Card", icon: <CreditCard size={18} strokeWidth={1.5} /> }, ...(state.mode === "refund" || totals.diff < 0 ? [{ id: "Store Credit", icon: <Gift size={18} strokeWidth={1.5} /> }] : [])].map(opt => (
                              <div key={opt.id} onClick={() => m.setSettlementMethod(opt.id as SettlementMethod)}
                                className={`sl-rfm-pill ${state.settlementMethod === opt.id ? "active" : ""}`}
                                style={{ border: '2px solid', borderColor: state.settlementMethod === opt.id ? '#3b82f6' : '#f1f5f9', borderRadius: 10, padding: '10px 12px', background: state.settlementMethod === opt.id ? '#eff6ff' : 'white' }}>
                                <div style={{ marginBottom: 6, color: state.settlementMethod === opt.id ? '#2563eb' : '#94a3b8' }}>{opt.icon}</div>
                                <p style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>{opt.id}</p>
                              </div>
                            ))}
                          </div>
                          {state.errors.settlement && <p style={{ marginTop: 5, fontSize: 11, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={11} />{state.errors.settlement}</p>}
                        </div>
                      )}

                      <div>
                        <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Notes <span style={{ fontSize: 10, color: '#cbd5e1', fontWeight: 400 }}>(optional)</span></label>
                        <textarea value={state.notes} onChange={e => m.setNotes(e.target.value)} rows={3} placeholder="Any additional context…"
                          style={{ width: '100%', padding: '10px 12px', fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 9, background: 'white', color: '#1e293b', outline: 'none', resize: 'none', fontFamily: 'inherit' }} />
                      </div>
                    </>
                  )}

                  {/* STEP 4 */}
                  {state.step === 4 && (
                    <>
                      <RefundSummary mode={state.mode} selectedItems={selectedItems} totals={totals} settlementMethod={state.settlementMethod} originalPayment={sale.payment_method as PaymentMethod} />
                      <div>
                        <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Items</p>
                        <div style={{ border: '1px solid #f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
                          {selectedItems.map((item, idx) => (
                            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderTop: idx > 0 ? '1px solid #f8fafc' : 'none', background: 'white' }}>
                              <div style={{ width: 28, height: 28, borderRadius: 7, background: item.imageColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Package size={11} style={{ color: '#64748b', opacity: 0.6 }} /></div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>{item.name}</p>
                                <p className="sl-mono" style={{ fontSize: 10, color: '#94a3b8' }}>{item.sku} · qty {item.returnQty}</p>
                                {item.exchangeItemId && <p style={{ fontSize: 10, color: '#2563eb', marginTop: 2 }}>→ {(item.exchangeItemId as any).name}</p>}
                              </div>
                              <span className="sl-mono" style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{fmt(item.unitPrice * item.returnQty)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {[{ label: "Mode", value: state.mode === "refund" ? "Refund" : "Exchange" }, { label: "Reason", value: state.reason }, ...((state.mode === "refund" || totals.diff !== 0) && state.settlementMethod ? [{ label: totals.diff > 0 ? "Payment Via" : "Refund Via", value: state.settlementMethod }] : [])].map(row => (
                          <div key={row.label} style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 10, padding: '10px 12px' }}>
                            <p style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>{row.label}</p>
                            <p style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>{row.value}</p>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 14px' }}>
                        <AlertCircle size={13} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
                        <p style={{ fontSize: 11, color: '#92400e', lineHeight: 1.5 }}>Confirming will mark this order as a return and {state.mode === "refund" ? "initiate a refund" : "process the exchange"}. This cannot be undone.</p>
                      </div>
                    </>
                  )}

                  {/* STEP 5 */}
                  {state.step === 5 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16, padding: '24px 0' }}>
                      <div className="sl-done-pop" style={{ width: 60, height: 60, borderRadius: '50%', background: '#ecfdf5', border: '2px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle2 size={26} style={{ color: '#10b981' }} />
                      </div>
                      <div>
                        <p style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>{state.mode === "refund" ? "Refund Processed" : "Exchange Initiated"}</p>
                        <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, maxWidth: 280, margin: '0 auto' }}>
                          {state.mode === "refund" ? `A refund of ${fmt(totals.returnValue)} has been processed via ${state.settlementMethod}.` : totals.diff > 0 ? `Exchange created. Balance of ${fmt(totals.diff)} collected via ${state.settlementMethod}.` : totals.diff < 0 ? `Exchange created. Balance of ${fmt(Math.abs(totals.diff))} refunded via ${state.settlementMethod}.` : "Exchange order has been created successfully."}
                        </p>
                      </div>
                      <div style={{ width: '100%', border: '1px solid #f1f5f9', borderRadius: 12, overflow: 'hidden' }}>
                        {[{ label: "Invoice", value: `INV-${sale.ui_id}` }, { label: "Mode", value: state.mode === "refund" ? "Refund" : "Exchange" }, { label: "Reason", value: state.reason }, ...(state.mode === "refund" ? [{ label: "Refunded", value: fmt(totals.returnValue) }] : totals.diff !== 0 ? [{ label: totals.diff > 0 ? "Balance Paid" : "Balance Refunded", value: fmt(Math.abs(totals.diff)) }] : [])].map((row, i) => (
                          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderTop: i > 0 ? '1px solid #f8fafc' : 'none', background: 'white' }}>
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>{row.label}</span>
                            <span className="sl-mono" style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>{row.value}</span>
                          </div>
                        ))}
                      </div>
                      <button onClick={onClose} style={{ width: '100%', padding: '12px 0', background: '#0f172a', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'background 0.15s' }}>Close</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Product selection modal (unchanged) */}
              {(() => {
                const usedSerials = Object.entries(state.exchangeMap).reduce((acc: string[], [itemId, data]) => { if (itemId === activeReplaceId) return acc; return [...acc, ...(data.serial_numbers || [])]; }, []);
                return <ProductSelectionModal isOpen={isProductModalOpen} product={pendingProduct} onClose={() => setIsProductModalOpen(false)} onSuccess={handleProductSelectSuccess} excludedSerials={usedSerials} initialQuantity={selectedItems.find(i => i.id === activeReplaceId)?.returnQty} />;
              })()}

              {/* Footer */}
              {state.step < 5 && (
                <div style={{ flexShrink: 0, padding: '14px 22px', borderTop: '1px solid #f1f5f9', background: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {state.step > 1 && (
                    <button onClick={m.goBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', fontSize: 12, fontWeight: 600, color: '#475569', background: 'white', border: '1px solid #e2e8f0', borderRadius: 9, cursor: 'pointer', transition: 'all 0.12s' }}>
                      <ArrowLeft size={13} />Back
                    </button>
                  )}
                  {state.step < 4 ? (
                    <button onClick={m.goNext} disabled={!m.canProceed} className="sl-btn-primary" style={{ flex: 1, padding: '10px 0', background: '#2563eb', color: 'white', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: m.canProceed ? 'pointer' : 'not-allowed', opacity: m.canProceed ? 1 : 0.45 }}>
                      Continue <ChevronRight size={14} />
                    </button>
                  ) : (
                    <button onClick={() => m.confirm(onRefresh)} disabled={state.isSubmitting} className="sl-btn-primary" style={{ flex: 1, padding: '10px 0', background: '#2563eb', color: 'white', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: state.isSubmitting ? 'not-allowed' : 'pointer', opacity: state.isSubmitting ? 0.6 : 1 }}>
                      {state.isSubmitting ? <><Loader2 size={14} className="animate-spin" />Processing…</> : <>{state.mode === "refund" ? "Confirm Refund" : "Confirm Exchange"}<ChevronRight size={14} /></>}
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   FILTER DROPDOWN
═══════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════
   FILTER DROPDOWN
═══════════════════════════════════════════════════════════════ */
interface FilterDropdownProps { label: string; options: string[]; value: string; onChange: (v: string) => void; }
const FilterDropdown: React.FC<FilterDropdownProps> = ({ label, options, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = value !== "";
  useEffect(() => { const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button onClick={() => setOpen(p => !p)} className={`sl-filter-btn ${active ? "active" : ""}`}>
        {active ? value : label}
        {active ? <X size={10} style={{ color: '#93c5fd' }} onClick={e => { e.stopPropagation(); onChange(""); setOpen(false); }} /> : <ChevronDown size={11} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />}
      </button>
      {open && (
        <div className="sl-dropdown">
          {options.map(opt => (
            <button key={opt} onClick={() => { onChange(opt === value ? "" : opt); setOpen(false); }} className={`sl-dropdown-item ${opt === value ? "active" : ""}`}>{opt}</button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
const SalesListPage: React.FC = () => {
  const api = useApi();
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterOrigin, setFilterOrigin] = useState("");
  const [filterPayment, setFilterPayment] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [customerMap, setCustomerMap] = useState<Record<string, string>>({});
  const [productMap, setProductMap] = useState<Record<string, string>>({});
  const [isReturnSearchOpen, setIsReturnSearchOpen] = useState(false);
  const [returnSearchQuery, setReturnSearchQuery] = useState("");
  const [returnSale, setReturnSale] = useState<SaleRecord | null>(null);

  const searchSalesForReturn = useMemo(() => {
    if (!returnSearchQuery) return [];
    const q = returnSearchQuery.toLowerCase();
    return orders.filter(s => s.ui_id.toString().includes(q) || s.customer_id.toLowerCase().includes(q)).slice(0, 5);
  }, [returnSearchQuery, orders]);

  const openDetail = (sale: SaleRecord) => navigate(`/sales/${sale.id}`, { state: { sale, customerMap, productMap } });
  const openReturn = (sale: SaleRecord) => { setTimeout(() => setReturnSale(sale), 50); };

  /* Handle return trigger coming back from SaleDetailPage */
  useEffect(() => {
    if (location.state?.openReturn) {
      setReturnSale(location.state.openReturn);
      window.history.replaceState({}, "");
    }
  }, [location.state]);
  const closeReturn = () => setReturnSale(null);

  /* ── Data fetching (100% unchanged) ── */
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.getData(`${ENDPOINTS.ORDERS}/${SHOP_ID}`);
      if (res && res.data) {
        const normalized = (res.data as any[]).map(s => {
          let pm = "Other";
          if (s.payments && Object.keys(s.payments).length > 0) {
            pm = Object.keys(s.payments).map(k => { const u = k.toUpperCase(); if (u === "CASH") return "Cash"; if (u === "CARD") return "Card"; if (u === "UPI" || u === "G-PAY" || u === "GPAY") return "UPI"; if (u === "PHONEPE") return "PhonePe"; if (u === "CREDIT") return "Credit"; return k.charAt(0).toUpperCase() + k.slice(1).toLowerCase(); }).join(", ");
          } else if (s.payment_method) {
            const r = (s.payment_method || "Other").toUpperCase();
            pm = r === "CASH" ? "Cash" : r === "CARD" ? "Card" : r === "UPI" || r === "G-PAY" || r === "GPAY" ? "UPI" : r === "PHONEPE" ? "PhonePe" : r === "CREDIT" ? "Credit" : s.payment_method;
          }
          return { ...s, status: s.status.charAt(0).toUpperCase() + s.status.slice(1).toLowerCase(), payment_method: pm, origin: s.origin === "OFFLINE" ? "Sales" : s.origin };
        });
        setOrders(normalized);
        fetchDetails();
      }
    } catch (err) { console.error("Failed to fetch orders:", err); }
    finally { setLoading(false); }
  };

  const fetchDetails = async () => {
    try {
      const custRes = await api.getData(`${ENDPOINTS.CUSTOMERS}/by/shop/${SHOP_ID}`);
      if (custRes?.data) { const m: Record<string, string> = {}; custRes.data.forEach((c: any) => { m[c.id] = c.name; }); setCustomerMap(m); }
      const invRes = await api.getData(ENDPOINTS.INVENTORIES);
      if (invRes?.data) { const m: Record<string, string> = {}; invRes.data.forEach((p: any) => { m[p.id] = p.name; }); setProductMap(m); }
    } catch (err) { console.error("Failed to fetch details:", err); }
  };

  useEffect(() => { fetchOrders(); }, []);

  /* ── Filters (unchanged) ── */
  const filtered = useMemo(() => orders.filter(s => {
    const q = search.toLowerCase();
    const dateStr = s.created_at.split("T")[0];
    return (!q || s.ui_id.toString().includes(q) || s.customer_id.toLowerCase().includes(q) || (customerMap[s.customer_id] || "").toLowerCase().includes(q)) && (!filterOrigin || s.origin === filterOrigin) && (!filterPayment || s.payment_method === filterPayment) && (!filterStatus || s.status.toLowerCase() === filterStatus.toLowerCase()) && (!filterDate || dateStr === filterDate);
  }), [search, filterOrigin, filterPayment, filterStatus, filterDate, orders]);

  /* ── Stats (unchanged) ── */
  const totalRevenue = useMemo(() => orders.filter(s => s.status.toLowerCase() === "completed").reduce((a, b) => a + b.total_sellprice, 0), [orders]);
  const salesCount = useMemo(() => orders.filter(s => s.origin === "Sales").length, [orders]);
  const salesReturnCount = useMemo(() => orders.filter(s => s.origin === "Sales Return").length, [orders]);
  const todayRevenue = useMemo(() => { const today = new Date().toISOString().split("T")[0]; return orders.filter(s => s.created_at.startsWith(today) && s.status.toLowerCase() === "completed").reduce((a, b) => a + b.total_sellprice, 0); }, [orders]);

  const activeFilters = [filterOrigin, filterPayment, filterStatus, filterDate].filter(Boolean).length;
  const clearAll = () => { setFilterOrigin(""); setFilterPayment(""); setFilterStatus(""); setFilterDate(""); setSearch(""); };

  const filteredRevenue = useMemo(() => filtered.filter(s => s.status === "Completed").reduce((a, b) => a + b.total_sellprice, 0), [filtered]);

  return (
    <>
      <style>{STYLES}</style>
      {/*
        ┌──────────────────────────────────────────────────────────────┐
        │  Root: overflow-x:hidden prevents any horizontal body scroll  │
        │  All child widths are constrained — no parent bleed           │
        └──────────────────────────────────────────────────────────────┘
      */}
      <div className="sl-root" style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: '100vh', padding: '0 0 24px' }}>

        {/* ── KPI Row ── */}
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 2 }} className="sl-scroll">
          <KpiCard label="Total Revenue" value={fmt(totalRevenue)} icon={<DollarSign size={18} />} iconBg="bg-emerald-50" iconColor="text-emerald-600" sub="All completed orders" />
          <KpiCard label="Total Sales" value={salesCount} icon={<BarChart2 size={18} />} iconBg="bg-blue-50" iconColor="text-blue-600" sub="All origins" />
          <KpiCard label="Returns" value={salesReturnCount} icon={<RefreshCw size={18} />} iconBg="bg-red-50" iconColor="text-red-500" sub="Sales returns" />
          <KpiCard label="Today's Revenue" value={fmt(todayRevenue)} icon={<TrendingUp size={18} />} iconBg="bg-amber-50" iconColor="text-amber-500" sub="Completed today" />
        </div>

        {/* ── Toolbar ── */}
        <div className="sl-toolbar">
          <div className="sl-search-wrap">
            <Search size={13} />
            <input className="sl-search-input" placeholder="Search invoice or customer…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className={`sl-date-input ${filterDate ? "active" : ""}`} />
          <FilterDropdown label="Origin" options={["Sales", "Sales Return"]} value={filterOrigin} onChange={setFilterOrigin} />
          <FilterDropdown label="Payment" options={["Cash", "Card", "UPI"]} value={filterPayment} onChange={setFilterPayment} />
          <FilterDropdown label="Status" options={["Completed", "Pending", "Cancelled"]} value={filterStatus} onChange={setFilterStatus} />
          {activeFilters > 0 && (
            <button onClick={clearAll} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 10px', fontSize: 11, fontWeight: 600, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, cursor: 'pointer' }}>
              <X size={11} />Clear ({activeFilters})
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button className="sl-return-btn" onClick={() => setIsReturnSearchOpen(true)}>
            <RotateCcw size={13} />Process Return
          </button>
          <span style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8' }} className="sl-mono">{filtered.length}/{orders.length}</span>
        </div>

        {/* ── Table Card ── */}
        <div className="sl-table-card" style={{ flex: 1 }}>
          {/*
            The wrapper handles ONLY horizontal+vertical scroll.
            The table uses fixed layout so columns never blow out.
          */}
          <div className="sl-table-wrap sl-scroll" style={{ maxHeight: 'calc(100vh - 260px)' }}>
            <table className="sl-table">
              <colgroup>
                <col className="sl-col-inv" />
                <col className="sl-col-cust" />
                <col className="sl-col-orig" />
                <col className="sl-col-pay" />
                <col className="sl-col-date" />
                <col className="sl-col-qty" />
                <col className="sl-col-amt" />
                <col className="sl-col-stat" />
                <col className="sl-col-act" />
              </colgroup>
              <thead>
                <tr>
                  {["Invoice", "Customer", "Origin", "Payment", "Date", "Qty", "Amount", "Status", ""].map((h, i) => (
                    <th key={i} style={{ textAlign: i === 5 ? 'center' : i === 6 ? 'right' : i === 8 ? 'right' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9}>
                    <div className="sl-empty">
                      <Loader2 size={28} style={{ color: '#3b82f6', margin: '0 auto 10px', display: 'block' }} className="animate-spin" />
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>Fetching sales records…</p>
                    </div>
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={9}>
                    <div className="sl-empty">
                      <Receipt size={32} style={{ color: '#e2e8f0', margin: '0 auto 10px', display: 'block' }} />
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>No sales found</p>
                      <p style={{ fontSize: 12, color: '#94a3b8' }}>Try adjusting your filters</p>
                    </div>
                  </td></tr>
                ) : filtered.map(sale => {
                  const oCfg = ORIGIN_CFG[sale.origin as OriginType] || ORIGIN_CFG["Sales"];
                  const returnable = sale.status === "Completed" && sale.origin !== "Sales Return";
                  const dateStr = sale.created_at.split("T")[0];
                  const refundedCount = (sale.items || []).filter(i => i.status === "REFUNDED").length;
                  const exchangedCount = (sale.items || []).filter(i => i.status === "EXCHANGED").length;

                  return (
                    <tr key={sale.id} className="sl-row">
                      {/* Invoice */}
                      <td>
                        <div>
                          <span className="sl-mono" style={{ fontSize: 11, fontWeight: 600, color: '#1e293b', display: 'block' }}>INV-{sale.ui_id}</span>
                          <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                            {sale.origin === "Sales Return" && <span style={{ fontSize: 9, fontWeight: 700, color: '#dc2626', background: '#fef2f2', padding: '1px 5px', borderRadius: 3 }}>Return</span>}
                            {refundedCount > 0 && <span style={{ fontSize: 9, fontWeight: 700, color: '#ea580c', background: '#fff7ed', padding: '1px 5px', borderRadius: 3 }}>{refundedCount} Refunded</span>}
                            {exchangedCount > 0 && <span style={{ fontSize: 9, fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '1px 5px', borderRadius: 3 }}>{exchangedCount} Exchanged</span>}
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td>
                        <span className="sl-truncate" style={{ fontSize: 12, fontWeight: 500, color: '#1e293b', display: 'block' }} title={customerMap[sale.customer_id] || sale.customer_id}>
                          {customerMap[sale.customer_id] || sale.customer_id}
                        </span>
                      </td>

                      {/* Origin */}
                      <td><Badge cls={oCfg.cls} dot={oCfg.dot} label={sale.origin} /></td>

                      {/* Payment */}
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {sale.payments && Object.keys(sale.payments).length > 0 ? (
                            Object.keys(sale.payments).map(k => {
                              const u = k.toUpperCase();
                              const label = u === "CASH" ? "Cash" : u === "CARD" ? "Card" : u === "UPI" || u === "G-PAY" || u === "GPAY" ? "UPI" : u === "PHONEPE" ? "PhonePe" : u === "CREDIT" ? "Credit" : k;
                              const cfg = PAYMENT_CFG[label] || PAYMENT_CFG["Other"];
                              return <Badge key={k} cls={cfg.cls} dot={cfg.dot} label={label} />;
                            })
                          ) : (
                            <Badge cls={(PAYMENT_CFG[sale.payment_method || ""] || PAYMENT_CFG["Other"]).cls} dot={(PAYMENT_CFG[sale.payment_method || ""] || PAYMENT_CFG["Other"]).dot} label={sale.payment_method || "Other"} />
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td><span className="sl-mono" style={{ fontSize: 11, color: '#64748b' }}>{dateStr}</span></td>

                      {/* Qty */}
                      <td style={{ textAlign: 'center' }}><span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>{sale.total_quantity}</span></td>

                      {/* Amount */}
                      <td style={{ textAlign: 'right' }}><span className="sl-mono" style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{fmt(sale.total_sellprice)}</span></td>

                      {/* Status */}
                      <td>{(() => { const cfg = STATUS_CFG[sale.status as SaleStatus] || STATUS_CFG["Pending"]; return <Badge cls={cfg.cls} dot={cfg.dot} label={sale.status} />; })()}</td>

                      {/* Actions */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                          <button className="sl-act-btn" onClick={() => openDetail(sale)} title="View details"><Eye size={14} /></button>
                          <button className={`sl-act-btn ${returnable ? "danger" : ""}`} onClick={() => returnable && openReturn(sale)} disabled={!returnable} title={!returnable ? (sale.origin === "Sales Return" ? "Already returned" : `Status: ${sale.status}`) : "Process return"}>
                            <RotateCcw size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          {filtered.length > 0 && (
            <div className="sl-table-footer">
              <p style={{ fontSize: 12, color: '#94a3b8' }}>
                <span style={{ fontWeight: 600, color: '#475569' }}>{filtered.length}</span>
                {' '}of{' '}
                <span style={{ fontWeight: 600, color: '#475569' }}>{orders.length}</span>
                {' '}records
              </p>
              <span style={{ fontSize: 12, color: '#64748b' }}>
                Filtered revenue:{' '}
                <span className="sl-mono" style={{ fontWeight: 700, color: '#0f172a' }}>{fmt(filteredRevenue)}</span>
              </span>
            </div>
          )}
        </div>
      </div>



      {/* ── Return Modal ── */}
      {returnSale && <ReturnModal sale={returnSale} onClose={closeReturn} onRefresh={fetchOrders} productMap={productMap} />}

      {/* ── Return Search Modal ── */}
      {isReturnSearchOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(3px)', zIndex: 399 }} onClick={() => setIsReturnSearchOpen(false)} />
          <div className="sl-search-modal">
            <div className="sl-search-modal-box">
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Process Return</h3>
                  <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Find an order by invoice or customer name</p>
                </div>
                <button onClick={() => setIsReturnSearchOpen(false)} style={{ width: 28, height: 28, borderRadius: '50%', background: '#f8fafc', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}><X size={14} /></button>
              </div>
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ position: 'relative' }}>
                  <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input autoFocus placeholder="Invoice ID or customer name…" value={returnSearchQuery} onChange={e => setReturnSearchQuery(e.target.value)}
                    style={{ width: '100%', height: 44, paddingLeft: 40, paddingRight: 12, fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 10, outline: 'none', background: '#f8fafc', color: '#1e293b', transition: 'all 0.15s', fontFamily: 'inherit' }}
                    onFocus={e => { e.target.style.borderColor = '#93c5fd'; e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {searchSalesForReturn.length > 0 ? searchSalesForReturn.map(sale => (
                    <button key={sale.id} onClick={() => { openReturn(sale); setIsReturnSearchOpen(false); setReturnSearchQuery(""); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'white', border: '1px solid #f1f5f9', borderRadius: 12, cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s', width: '100%' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#bfdbfe'; (e.currentTarget as HTMLElement).style.background = '#eff6ff'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#f1f5f9'; (e.currentTarget as HTMLElement).style.background = 'white'; }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: '#f8fafc', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Receipt size={16} style={{ color: '#94a3b8' }} /></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>INV-{sale.ui_id}</p>
                          <span className="sl-mono" style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{fmt(sale.total_sellprice)}</span>
                        </div>
                        <p style={{ fontSize: 11, color: '#64748b' }} className="sl-truncate">{customerMap[sale.customer_id] || sale.customer_id} · {sale.created_at.split('T')[0]}</p>
                      </div>
                      <ChevronRight size={14} style={{ color: '#cbd5e1', flexShrink: 0 }} />
                    </button>
                  )) : returnSearchQuery ? (
                    <div style={{ padding: '40px 0', textAlign: 'center' }}>
                      <Search size={28} style={{ color: '#e2e8f0', margin: '0 auto 10px', display: 'block' }} />
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>No matching orders</p>
                      <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Try a different invoice ID or name</p>
                    </div>
                  ) : (
                    <div style={{ padding: '40px 0', textAlign: 'center' }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}><RotateCcw size={20} style={{ color: '#3b82f6' }} /></div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Find an order to return</p>
                      <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Search by Invoice Number or Customer Name</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default SalesListPage;