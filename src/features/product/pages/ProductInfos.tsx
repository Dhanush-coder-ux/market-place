import React, { useState, useEffect, useMemo, Fragment } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Package, Search, Filter, Bookmark, Trash2,
  ChevronDown, ChevronRight, Layers, AlertTriangle,
  X, AlertCircle, Calendar, Hash, ExternalLink,
  Copy, Check, Pencil, Eye, MoreVertical, RefreshCw, History, Plus
} from "lucide-react";
import { VariantRows, BatchCards, SerialBadgeList } from "../../inventory/components/StockTree";
import { useHeader } from "@/context/HeaderContext";
import { useApi, useApiLoading } from "@/context/ApiContext";
import { useToast } from "@/context/ToastContext";
import { ColumnPicker } from "@/components/common/ColumnPicker";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { GradientButton } from "@/components/ui/GradientButton";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { StatCard } from "@/components/common/StatsCard";
import SkeletonLoader from "@/components/common/SkeletonLoader";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import type { InventoryRecord } from "@/types/api";
import { RightSidebarFilter } from "@/components/common/RightSidebarFilter";

// --- Helpers (logic unchanged) ---
const formatCurrency = (amount?: any) => {
  if (amount === undefined || amount === null || amount === "—") return "—";
  const num = Number(amount);
  if (isNaN(num)) return amount;
  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const columnLabels: Record<string, string> = {
  ui_id: "SKU",
  barcode: "Barcode",
  buy_price: "Buy Price",
  sell_price: "Sell Price",
  stocks: "Stock",
  status: "Status",
  category: "Category",
  unit: "Unit",
  brand: "Brand",
  supplier: "Supplier",
  serial_number: "Serials",
  reorder_point: "Reorder Point",
};

const columnOrder = [
  "category",
  "supplier",
  "unit",
  "brand",
  "buy_price",
  "sell_price",
  "stocks",
  "status",
  "reorder_point",
  "ui_id",
  "barcode",
  "serial_number"
];

const hiddenProductColumns = new Set(["cost_to_make"]);

const sortKeys = (keys: string[]) => {
  return [...keys].sort((a, b) => {
    const idxA = columnOrder.indexOf(a);
    const idxB = columnOrder.indexOf(b);
    if (idxA === -1 && idxB === -1) return a.localeCompare(b);
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });
};

const getColumnLabel = (key: string) => {
  if (columnLabels[key]) return columnLabels[key];
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

const calculateProductStock = (p: any) => {
  const normalizeVariants = (raw: any): any[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'object') return Object.values(raw);
    return [];
  };
  const combinations = normalizeVariants(p.variant_infos || p.variants).filter((v: any) => v && v.id !== null);
  const batches = (() => {
    const bs = p.batch_infos || p.batches;
    if (Array.isArray(bs)) return bs.filter((b: any) => b && b.id !== null);
    if (bs && typeof bs === 'object' && Object.keys(bs).length > 0) return [bs];
    return [];
  })();

  const hasVariants = !!(p.type_infos?.has_variant) || combinations.length > 0;
  const hasBatches = !!(p.type_infos?.has_batch) || batches.length > 0;

  const calculateVariantStock = (comb: any) => {
    const vBatches = comb.batch_infos ?? comb.batches ?? [];
    const vHasBatches = vBatches.length > 0;
    let vStock = Number(comb.stock_infos?.available_stocks ?? comb.stock_infos?.physical_stocks ?? comb.stocks ?? comb.stock ?? comb.datas?.stocks ?? comb.datas?.datas?.stocks ?? 0);
    if (vHasBatches && vStock === 0) {
      vStock = vBatches.reduce((acc: number, b: any) => acc + Number(b.stock_infos?.available_stocks ?? b.stock_infos?.physical_stocks ?? b.stocks ?? 0), 0);
    }
    return vStock;
  };

  let computedStock = Number(p.stock_infos?.available_stocks ?? p.stock_infos?.physical_stocks ?? p.stocks ?? p.quantity ?? 0);
  if (hasVariants) {
    computedStock = combinations.reduce((acc: number, comb: any) => acc + calculateVariantStock(comb), 0);
  } else if (hasBatches && computedStock === 0) {
    computedStock = batches.reduce((acc: number, b: any) => acc + Number(b.stock_infos?.available_stocks ?? b.stock_infos?.physical_stocks ?? b.stocks ?? 0), 0);
  }
  return computedStock;
};

const getStockStatus = (stock: number, reorderPoint?: number) => {
  const s = Number(stock) || 0;
  const rp = Number(reorderPoint) || 10;
  if (s <= 0)
    return {
      label: "Out of stock",
      color: "text-red-600 bg-red-50 border-red-100",
      dot: "bg-red-500",
    };
  if (s <= rp)
    return {
      label: "Low stock",
      color: "text-amber-600 bg-amber-50 border-amber-100",
      dot: "bg-amber-400",
    };
  return {
    label: "In stock",
    color: "text-emerald-700 bg-emerald-50 border-emerald-100",
    dot: "bg-emerald-500",
  };
};



// --- Compact pill ---
const Pill = ({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "blue" | "purple" | "indigo" | "emerald";
}) => {
  const styles: Record<string, string> = {
    default: "text-slate-500 bg-slate-50 border-slate-100",
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    purple: "text-purple-600 bg-purple-50 border-purple-100",
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border leading-none ${styles[variant]}`}
    >
      {children}
    </span>
  );
};

// --- Copy SKU Button with Micro-Animation ---
const CopySKUButton = ({ val }: { val: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center justify-center p-0.5 rounded transition-all duration-200 ${
        copied ? "text-emerald-500 bg-emerald-50" : "text-slate-350 hover:text-blue-600 hover:bg-slate-100/80"
      }`}
      title="Copy SKU"
    >
      {copied ? (
        <Check size={10} className="animate-in zoom-in duration-200" />
      ) : (
        <Copy size={10} className="transition-transform duration-200 active:scale-75" />
      )}
    </button>
  );
};

/* â”€â”€â”€ Product Row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const ProductRow = React.memo(
  ({
    p,
    isSelected,
    onSelect,
    isExpanded,
    toggleExpand,
    selectedKeys,
    onDelete,
  }: {
    p: InventoryRecord;
    isSelected: boolean;
    onSelect: (p: InventoryRecord) => void;
    isExpanded: boolean;
    toggleExpand: (id: string) => void;
    selectedKeys: string[];
    onDelete: (p: InventoryRecord) => void;
  }) => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const datas = (p.additional_infos as any) || (p.datas as any) || {};

    const extractSerials = (val: any): string[] => {
      if (!val) return [];
      const getNames = (arr: any[]): string[] => {
        return arr.map((v: any) => typeof v === 'object' && v !== null ? v.name || v.serial || "" : String(v)).filter(Boolean);
      };
      if (Array.isArray(val)) return getNames(val);
      if (val && typeof val === "object") {
        if (Array.isArray(val.serial_numbers)) return getNames(val.serial_numbers);
        if (Array.isArray(val.serialno_infos)) return getNames(val.serialno_infos);
      }
      return [];
    };

    // Normalize variants: backend may return a dict {id: {...}} or an array
    const normalizeVariants = (raw: any): any[] => {
      if (!raw) return [];
      if (Array.isArray(raw)) return raw;
      if (typeof raw === 'object') return Object.values(raw);
      return [];
    };

    const combinations = useMemo(
      () => normalizeVariants(p.variant_infos || p.variants).filter((v: any) => v && v.id !== null),
      [p.variant_infos, p.variants]
    );

    const batches = useMemo(
      () => {
        const bs = p.batch_infos || p.batches;
        if (Array.isArray(bs)) return bs.filter((b: any) => b && b.id !== null);
        if (bs && typeof bs === 'object' && Object.keys(bs).length > 0) return [bs];
        return [];
      },
      [p.batch_infos, p.batches]
    );

    const hasVariants = !!(p.type_infos?.has_variant) || combinations.length > 0;
    const hasBatches = !!(p.type_infos?.has_batch) || batches.length > 0;
    
    const rootSerials = extractSerials((p as any).serialno_infos || (p as any).serials || (p as any).serial_number);
    const hasSerials = !!(p.type_infos?.has_serialno) || rootSerials.length > 0;
    const isExpandable = hasVariants || hasBatches || hasSerials;

    let computedStock = calculateProductStock(p);

    let computedSellPrice = p.pricing_infos?.sell_price ?? (p as any).sell_price;
    let computedBuyPrice = p.pricing_infos?.buy_price ?? (p as any).buy_price;
    if (!hasVariants && hasBatches && (computedSellPrice === undefined || computedSellPrice === null)) {
      const firstBatch = batches[0];
      if (firstBatch) {
        computedSellPrice = firstBatch.pricing_infos?.sell_price ?? firstBatch.sell_price;
        computedBuyPrice = firstBatch.pricing_infos?.buy_price ?? firstBatch.buy_price;
      }
    }

    const { totalSerials, totalBatches } = useMemo(() => {
      let ts = rootSerials.length;
      let tb = batches.length;
      if (hasVariants) {
        combinations.forEach((c: any) => {
          const cDatas = c.additional_infos || c.datas || {};
          const cSerials = extractSerials(
            c.serialno_infos ||
            c.serial_numbers ||
            cDatas.serial_numbers ||
            (cDatas.datas && cDatas.datas.serial_numbers)
          );
          ts += cSerials.length;
          const cBatches = c.batch_infos || c.batches;
          const cBatchesList = Array.isArray(cBatches) ? cBatches : (cBatches && Object.keys(cBatches).length > 0 ? [cBatches] : []);
          tb += cBatchesList.length;
          cBatchesList.forEach((cb: any) => {
            ts += extractSerials(
              cb.serialno_infos || cb.serial_numbers || (cb.additional_infos && cb.additional_infos.serial_numbers)
            ).length;
          });
        });
      }
      return { totalSerials: ts, totalBatches: tb };
    }, [rootSerials, batches, hasVariants, combinations]);

    const [showAllBadges, setShowAllBadges] = useState(false);

    const badges: React.ReactNode[] = [];
    
    if ((p as any).visible_online) {
      badges.push(
        <Pill key="online" variant="emerald">
          <ExternalLink size={9} /> Online
        </Pill>
      );
    }
    
    const trackingInfo = [];
    if (hasVariants) trackingInfo.push({ label: `${combinations.length} variants`, icon: Layers, color: "blue", bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" });
    if (totalBatches > 0) trackingInfo.push({ label: `${totalBatches} batches`, icon: Calendar, color: "indigo", bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-200" });
    if (totalSerials > 0) trackingInfo.push({ label: `${totalSerials} serials`, icon: Hash, color: "purple", bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" });

    const visibleBadges = showAllBadges ? badges : badges.slice(0, 2);
    const remainingBadges = badges.length - 2;

    const productName = p.name || "N/A";
    const initial = String(productName[0]).toUpperCase();

    return (
      <Fragment key={p.id}>
        <tr
          className={`group border-b border-slate-50 transition-colors cursor-pointer ${
            isSelected ? "bg-blue-50 border-l-2 border-l-blue-500" : isExpanded ? "bg-slate-50/70" : "hover:bg-slate-50/60"
          }`}
          onClick={() => toggleExpand(p.id)}
        >
          {/* Checkbox */}
          <td className="px-3 py-2.5 w-10 text-center" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(p)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
            />
          </td>

          {/* Expand toggle */}
          <td className="px-3 py-2.5 text-center w-10">
            {isExpandable ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(p.id);
                }}
                className={`w-5 h-5 mx-auto rounded flex items-center justify-center transition-colors ${
                  isExpanded
                    ? "bg-blue-600 text-white"
                    : "text-blue-300 hover:text-blue-500"
                }`}
              >
                {isExpanded ? (
                  <ChevronDown size={12} />
                ) : (
                  <ChevronRight size={12} />
                )}
              </button>
            ) : (
              <div className="w-5 h-5 mx-auto flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-slate-200" />
              </div>
            )}
          </td>

          {/* Product identity */}
          <td className="px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center text-slate-600 text-[11px] font-semibold shrink-0 select-none overflow-hidden">
                {datas.images && datas.images.length > 0 ? (
                  <img src={datas.images[0]} alt={productName} className="w-full h-full object-cover" />
                ) : (
                  initial
                )}
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[13px] font-medium text-slate-800 truncate leading-none">
                    {productName}
                  </span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {visibleBadges}
                    {!showAllBadges && remainingBadges > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAllBadges(true);
                        }}
                        className="text-[10px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        +{remainingBadges}
                      </button>
                    )}
                  </div>
                </div>
                {trackingInfo.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(p.id);
                    }}
                    className={`mt-1 flex items-center gap-2 w-fit px-2 py-1.5 rounded-md border transition-all ${
                      isExpanded
                        ? "bg-slate-50 border-slate-200"
                        : "bg-white border-slate-200 hover:border-blue-300 shadow-sm"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tracking:</span>
                      {trackingInfo.map((info, idx) => {
                        const Icon = info.icon;
                        return (
                          <span
                            key={idx}
                            className={`flex items-center gap-1 text-[10px] font-bold ${info.text} ${info.bg} border ${info.border} px-1.5 py-0.5 rounded leading-none`}
                          >
                            <Icon size={10} />
                            {info.label}
                          </span>
                        );
                      })}
                    </div>
                    <div className={`ml-1 p-0.5 rounded transition-colors ${isExpanded ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500'}`}>
                      {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </div>
                  </button>
                )}
                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium leading-none mt-0.5">
                  {(() => {
                    const rawSku = p.ui_id ? String(p.ui_id) : "";
                    if (!rawSku) {
                      return <span className="font-mono tabular-nums">—</span>;
                    }
                    const trimmedSku = rawSku.length > 12 ? `${rawSku.slice(0, 8)}...` : rawSku;
                    return (
                      <span className="flex items-center gap-1">
                        <span className="font-mono tabular-nums" title={rawSku}>
                          {trimmedSku}
                        </span>
                        <CopySKUButton val={rawSku} />
                      </span>
                    );
                  })()}
                  <span className="text-slate-200">·</span>
                  <span>{datas.brand || (p as any).brand || "Generic"}</span>
                  {(p.gst || datas.gst || (p as any).gst) && (
                    <>
                      <span className="text-slate-200">·</span>
                      <span>GST {p.gst || datas.gst || (p as any).gst}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </td>

          {/* Dynamic columns */}
          {selectedKeys.map((key) => {
            let value = datas[key] !== undefined && datas[key] !== null ? datas[key] : (p as any)[key];
            
            // Map the nested backend schema properly
            if (key === "buy_price") value = computedBuyPrice;
            if (key === "sell_price") value = computedSellPrice;
            if (key === "stocks") value = computedStock;
            if (key === "reorder_point" && p.reorder_point_infos) value = p.reorder_point_infos.reorder_point;
            if (key === "category") value = (p as any).category_infos?.name || datas.category || p.category || p.category_id;
            if (key === "unit") value = (p as any).unit_infos?.name || datas.unit || p.unit || (p as any).unit_id;

            if (key === "buy_price" || key === "sell_price" || key === "price") {
              return (
                <td key={key} className="px-3 py-2.5 whitespace-nowrap">
                  <span
                    className={`tabular-nums ${
                      key === "sell_price"
                        ? "text-[13px] font-bold text-slate-800"
                        : "text-[13px] font-semibold text-slate-700"
                    }`}
                  >
                    {hasVariants ? "—" : formatCurrency(value)}
                  </span>
                </td>
              );
            }

            if (key === "stocks" || key === "quantity") {
              return (
                <td key={key} className="px-3 py-2.5 whitespace-nowrap">
                  <span className="text-[13px] font-semibold text-blue-600 tabular-nums">
                    {value}
                  </span>
                </td>
              );
            }

            if (key === "reorder_point") {
              return (
                <td key={key} className="px-3 py-2.5 whitespace-nowrap">
                  <span className="text-[13px] font-semibold text-slate-700 tabular-nums">
                    {hasVariants ? "—" : (value !== undefined && value !== null ? value : "—")}
                  </span>
                </td>
              );
            }

            if (key === "status") {
              const reorderPoint = Number(
                p.reorder_point_infos?.reorder_point ?? (p as any).reorder_point ?? datas.reorder_point ?? 0
              );
              const status = getStockStatus(computedStock, reorderPoint);
              return (
                <td key={key} className="px-3 py-2.5 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium border leading-none ${status.color}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                    {status.label}
                  </span>
                </td>
              );
            }

            if (key === "serial_number") {
              const sList = rootSerials;
              if (sList.length === 0 && totalSerials > 0) {
                return (
                  <td key={key} className="px-3 py-2.5 whitespace-nowrap">
                    <span className="text-[11px] text-slate-400">
                      See variants
                    </span>
                  </td>
                );
              }
              return (
                <td key={key} className="px-3 py-2.5 whitespace-nowrap">
                  {sList.length > 0 ? (
                    <div className="flex items-center gap-1">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-violet-50 text-violet-600 border border-violet-100 leading-none">
                        {sList[0]}
                      </span>
                      {sList.length > 1 && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          +{sList.length - 1}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-200 text-sm">—</span>
                  )}
                </td>
              );
            }

            if (key === "ui_id") {
              const actualSku = p.sku || datas.sku || "";
              const uiId = (p as any).ui_id || p.id || "";
              const displayLabel = actualSku ? "SKU" : "ID";
              const displayVal = actualSku ? actualSku : uiId;
              if (!displayVal) {
                return (
                  <td key={key} className="px-3 py-2.5 whitespace-nowrap">
                    <span className="text-[12px] font-medium text-slate-400">—</span>
                  </td>
                );
              }
              const trimmedSku = displayVal.length > 16 ? `${displayVal.slice(0, 12)}...` : displayVal;
              return (
                <td key={key} className="px-3 py-2.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <span className="flex items-center gap-1 text-[12px] font-medium text-slate-600">
                    <span className="font-mono tabular-nums" title={displayVal}>
                      {displayLabel}: {trimmedSku}
                    </span>
                    <CopySKUButton val={displayVal} />
                  </span>
                </td>
              );
            }

            if (key === "barcode") {
              const rawBarcode = p.barcode || datas.barcode || "";
              if (!rawBarcode) {
                return (
                  <td key={key} className="px-3 py-2.5 whitespace-nowrap">
                    <span className="text-[12px] font-medium text-slate-400">—</span>
                  </td>
                );
              }
              const textValue = String(rawBarcode);
              const trimmedBarcode = textValue.length > 16 ? `${textValue.slice(0, 12)}...` : textValue;
              return (
                <td key={key} className="px-3 py-2.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <span className="flex items-center gap-1 text-[12px] font-medium text-slate-600">
                    <span className="font-mono tabular-nums" title={textValue}>
                      {trimmedBarcode}
                    </span>
                    <CopySKUButton val={textValue} />
                  </span>
                </td>
              );
            }

            if (key === "category" || key === "supplier") {
              if (
                key === "category" &&
                selectedKeys.includes("supplier")
              ) {
                return (
                  <td key="cat_sup" className="px-3 py-2.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[12px] font-medium text-slate-700 leading-none">
                        {value || "Uncategorized"}
                      </span>
                      <span className="text-[11px] text-slate-400 leading-none">
                        {datas.supplier ||
                          (p as any).supplier ||
                          "No supplier"}
                      </span>
                    </div>
                  </td>
                );
              }
              if (
                key === "supplier" &&
                selectedKeys.includes("category")
              )
                return null;
              return (
                <td key={key} className="px-3 py-2.5 whitespace-nowrap">
                  <span className="text-[12px] font-medium text-slate-600">
                    {value || "—"}
                  </span>
                </td>
              );
            }

            const renderValue = () => {
              if (value === undefined || value === null) return "—";
              if (value === "") return "—";
              if (Array.isArray(value)) {
                if (value.length === 0) return "—";
                if (typeof value[0] === "object") {
                  return value.map((v: any) => {
                    if (v.name && v.values && Array.isArray(v.values)) {
                      return `${v.name} (${v.values.join('/')})`;
                    }
                    if (v.name) return v.name;
                    return JSON.stringify(v);
                  }).join(", ");
                }
                return value.join(", ");
              }
              if (typeof value === "object") return JSON.stringify(value);
              return String(value);
            };

            return (
              <td key={key} className="px-3 py-2.5 whitespace-nowrap">
                <span className="text-[12px] font-medium text-slate-600">
                  {renderValue()}
                </span>
              </td>
            );
          })}

          {/* Actions */}
          <td className="px-3 py-2.5 text-right whitespace-nowrap sticky right-0 bg-white group-hover:bg-slate-50 border-l border-slate-200 z-10 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.08)] transition-colors" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-end gap-2 relative">
              <button
                onClick={() => navigate(`/product/${p.id}`)}
                className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                title="View Product"
              >
                <Eye size={15} />
              </button>
              <button
                onClick={() => navigate(`/product/${p.id}/edit`)}
                className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                title="Edit Product"
              >
                <Pencil size={15} />
              </button>
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                  title="More actions"
                >
                  <MoreVertical size={15} />
                </button>
                {isMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                    <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 text-left font-sans animate-in fade-in slide-in-from-top-1 duration-150">
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          navigate(`/stock-adjustment`);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <RefreshCw size={13} />
                        Adjust Stock
                      </button>
                       <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          navigate(`/stock-movement`);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <History size={13} />
                        Stock Movements
                      </button>
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          navigate(`/purchase/add`);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Plus size={13} />
                        Add Purchase
                      </button>
                      <div className="border-t border-slate-100 my-1"></div>
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onDelete(p);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-red-650 hover:bg-red-50"
                      >
                        <Trash2 size={13} />
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </td>
        </tr>

        {/* Expanded tree area */}
        {isExpanded && (
          <tr key={`${p.id}-expand`} className="bg-slate-50/40">
            <td
              colSpan={selectedKeys.length + 4}
              className="px-0 py-0 border-b border-slate-50"
            >
              <div className="ml-10 mr-4 my-3 space-y-3 border-l border-slate-100 pl-6">
                {!hasVariants && rootSerials.length > 0 && (
                  <div className="bg-white border border-slate-100 rounded-lg p-3">
                    <p className="text-[10px] font-semibold text-slate-400 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                      <Hash size={10} className="text-slate-400" />
                      Serial numbers
                    </p>
                    <SerialBadgeList
                      serials={rootSerials}
                      title={`Serials: ${p.name}`}
                    />
                  </div>
                )}

                <div className="animate-in fade-in duration-300">
                  {hasVariants && (
                    <VariantRows
                      combinations={combinations}
                      baseSellPrice={p.pricing_infos?.sell_price || datas.sell_price || (p as any).sell_price}
                      baseBuyPrice={p.pricing_infos?.buy_price || datas.buy_price || (p as any).buy_price}
                    />
                  )}
                  {!hasVariants && hasBatches && (
                    <BatchCards batches={batches} />
                  )}
                </div>
              </div>
            </td>
          </tr>
        )}
      </Fragment>
    );
  }
);

/* â”€â”€â”€ Main ProductInfos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const ProductInfos = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isCleanMode = new URLSearchParams(location.search).get("mode") === "clean";

  const handleOpenNewTab = () => {
    window.open(`${window.location.pathname}?mode=clean`, "_blank", "noopener,noreferrer");
  };

  const { setActions, setBottomActions } = useHeader();
  const { getData, deleteData, error, clearError } = useApi();
  const loading = useApiLoading("products-list");
  const { showToast } = useToast();

  const [products, setProducts] = useState<InventoryRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [analyticsStats, setAnalyticsStats] = useState<any>(null);

  useEffect(() => {
    getData(ENDPOINTS.ANALYTICS_PRODINV_OVERALL, { shop_id: SHOP_ID })
      .then((res) => {
        const data = res?.data ?? res;
        if (data) {
          setAnalyticsStats({ overview: { inventory: data } });
        }
      })
      .catch(() => {});
  }, [getData]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<InventoryRecord | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  const [availableKeys, setAvailableKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() => {
    const saved = localStorage.getItem("product_table_columns");
    return saved
      ? sortKeys(JSON.parse(saved).filter((key: string) => !hiddenProductColumns.has(key)))
      : ["category", "status", "buy_price", "sell_price", "stocks", "reorder_point", "ui_id", "barcode", "serial_number"];
  });

  const sortedSelectedKeys = useMemo(() => sortKeys(selectedKeys), [selectedKeys]);

  useEffect(() => {
    setActions(
      <div className="flex items-center gap-2">
        {!isCleanMode && (
          <button
            onClick={handleOpenNewTab}
            className="h-8 w-8 flex items-center justify-center rounded-md border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 active:scale-95 transition-all shadow-sm shrink-0"
            title="Open in New Tab"
          >
            <ExternalLink size={13} />
          </button>
        )}
        <button
          onClick={() => navigate("/product/drafts")}
          className="h-8 px-3 rounded-md border border-slate-200 text-slate-600 font-medium text-[12px] bg-white hover:bg-slate-50 transition-colors flex items-center gap-1.5"
        >
          <Bookmark size={13} />
          Drafts
        </button>
        <GradientButton
          path="/product/add"
          className="h-8 flex items-center px-4 text-[12px] rounded-md"
        >
          + Add product
        </GradientButton>
      </div>
    );
    return () => setActions(null);
  }, [setActions, navigate, isCleanMode]);

  useEffect(() => {
    const params: Record<string, string> = {
      shop_id: SHOP_ID,
      limit: "100",
      offset: "1",
    };
    if (searchTerm) params.q = searchTerm;

    getData(`${ENDPOINTS.INVENTORIES}/by/shop/${SHOP_ID}`, params, { cacheKey: "products-list" }).then(
      (res) => {
        if (res) {
          const data: InventoryRecord[] = Array.isArray(res?.data) 
            ? res.data 
            : (res?.data?.inventories ?? (Array.isArray(res?.datas) ? res.datas : (res?.datas?.inventories ?? [])));
          setProducts(data);
          
          const keys = new Set<string>();
          data.forEach((p: any) => {
            const datas = p.additional_infos || p.datas;
            if (datas) {
              Object.keys(datas).forEach((k) => {
                if (
                  !["name", "id", "shop_id", "variantTypes", "is_active", "images"].includes(k) &&
                  !hiddenProductColumns.has(k)
                )
                  keys.add(k);
              });
            }
            ["category", "sell_price", "buy_price", "stocks", "reorder_point", "status", "ui_id", "barcode", "serial_number"].forEach((k) =>
              keys.add(k)
            );
          });
          setAvailableKeys(sortKeys(Array.from(keys).filter((key) => !hiddenProductColumns.has(key))));
        }
      }
    );
  }, [refreshKey, searchTerm, getData]);

  const toggleSelectProduct = (id: string) => {
    setSelectedProducts(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      await deleteData(
        `${ENDPOINTS.INVENTORIES}/${SHOP_ID}/${productToDelete.id}`
      );
      showToast("Product deleted successfully", "success");
      setRefreshKey((prev: number) => prev + 1);
    } catch {
      showToast("Failed to delete product", "error");
    } finally {
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
      setSelectedProducts(prev => {
        const next = new Set(prev);
        next.delete(productToDelete.id);
        return next;
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete these ${selectedProducts.size} products?`)) return;
    try {
      for (const id of Array.from(selectedProducts)) {
        await deleteData(`${ENDPOINTS.INVENTORIES}/${SHOP_ID}/${id}`);
      }
      showToast("Selected products deleted successfully", "success");
      setSelectedProducts(new Set());
      setRefreshKey((prev: number) => prev + 1);
    } catch {
      showToast("Failed to delete some products", "error");
    }
  };

  const toggleExpand = (id: string) => {
    const n = new Set(expandedRows);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    setExpandedRows(n);
  };

  useEffect(() => {
    if (selectedProducts.size > 1) {
      setBottomActions(
        <div className="flex items-center justify-between w-full animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-blue-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">
              <Package size={14} />
            </div>
            <div>
              <p className="text-[12px] font-bold text-slate-800 leading-tight">Selected {selectedProducts.size} Products</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/stock-adjustment`)}
              className="h-8 px-3 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[11px] transition-colors"
            >
              Adjust Stocks
            </button>
            <button
              onClick={() => navigate(`/stock-movement`)}
              className="h-8 px-3 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[11px] transition-colors"
            >
              Stock Movements
            </button>
            <button
              onClick={() => navigate(`/purchase/add`)}
              className="h-8 px-3 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[11px] transition-colors"
            >
              Add Purchase
            </button>
            <button
              onClick={handleBulkDelete}
              className="h-8 px-3 rounded-md border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[11px] transition-colors flex items-center gap-1.5"
            >
              <Trash2 size={13} />
              Delete All
            </button>
          </div>
        </div>
      );
    } else {
      setBottomActions(null);
    }
  }, [selectedProducts, setBottomActions, navigate]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const name = String(p.name || "").toLowerCase();
      const sku = String(
        p.barcode ||
          p.datas?.barcode ||
          (p as any).sku ||
          p.datas?.sku ||
          ""
      ).toLowerCase();
      const category = String(p.category || "").toLowerCase();
      const q = searchTerm.toLowerCase();
      return name.includes(q) || sku.includes(q) || category.includes(q);
    });
  }, [products, searchTerm]);



  const lowStockCount = useMemo(
    () =>
      products.filter((p: any) => {
        const stock = calculateProductStock(p);
        const rp = Number(
          p.reorder_point_infos?.reorder_point ?? (p as any).reorder_point ?? p.additional_infos?.reorder_point ?? p.datas?.reorder_point ?? 10
        );
        return stock <= rp;
      }).length,
    [products]
  );
  
  const outOfStockCount = useMemo(
    () => products.filter((p: any) => calculateProductStock(p) === 0).length,
    [products]
  );

  if (loading && products.length === 0) {
    return (
      <div className="flex-1 p-6">
        <SkeletonLoader variant="list" rows={8} showStats={true} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 font-sans w-full overflow-hidden relative">

      {/* Metric bar */}
      {!isCleanMode && (
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
          <StatCard
            icon={Package}
            label="Total Products"
            value={(analyticsStats?.overview?.inventory?.total_active_products ?? products.length).toString()}
            subValue="items"
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatCard
            icon={Package}
            label="Total Stocks"
            value={(analyticsStats?.overview?.inventory?.total_stocks ?? 0).toString()}
            subValue="in-stock count"
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <StatCard
            icon={AlertTriangle}
            label="Low Stock"
            value={analyticsStats?.overview?.inventory?.total_low_stocks?.toString() ?? lowStockCount.toString()}
            subValue="items need restock"
            iconBg="bg-amber-50"
            iconColor="text-amber-500"
          />
          <StatCard
            icon={AlertCircle}
            label="Out of Stock"
            value={analyticsStats?.overview?.inventory?.total_no_stocks?.toString() ?? outOfStockCount.toString()}
            subValue="items empty"
            iconBg="bg-red-50"
            iconColor="text-red-500"
          />
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-red-50 border border-red-100 rounded-lg text-red-600 text-[12px] font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={clearError}
            className="text-red-300 hover:text-red-500 transition-colors p-1 rounded"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="mt-2 bg-white border border-slate-100 rounded-lg p-2.5 px-3.5 flex flex-nowrap items-center gap-2 shadow-sm overflow-x-auto scrollbar-none">
        <div className="relative w-80 shrink-0">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search by name, SKU, category…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-[12px] font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md placeholder:text-slate-400 focus:outline-none focus:border-slate-300 focus:bg-white transition-colors"
          />
        </div>

        

        <button
          type="button"
          onClick={() => setIsFilterOpen(true)}
          className={`h-8 px-3 rounded-md border text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm shrink-0 ${
            statusFilter !== "All"
              ? "border-blue-200 text-blue-600 bg-blue-50/50"
              : "border-slate-200 text-slate-650 bg-white hover:bg-slate-50"
          }`}
          title="Filters"
        >
          <Filter size={13} />
          {statusFilter !== "All" && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          )}
        </button>
          <ColumnPicker
          availableKeys={availableKeys}
          selectedKeys={selectedKeys}
          onApply={(keys) => setSelectedKeys(sortKeys(keys.filter((key) => !hiddenProductColumns.has(key))))}
          storageKey="product_table_columns"
          labelMap={columnLabels}
          className="h-8 px-3 rounded-md border border-slate-200 text-slate-650 bg-white hover:bg-slate-50 active:scale-95 transition-all text-xs font-semibold shadow-sm shrink-0 flex items-center justify-center gap-1.5"
        />
        <div className="flex-1" />

        {searchTerm && (
          <span className="text-[11px] text-slate-400 font-medium shrink-0">
            {filteredProducts.length} result
            {filteredProducts.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <RightSidebarFilter
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={() => {}}
        onClear={() => setStatusFilter("All")}
        title="Product Filters"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stock Status</label>
            <ReusableSelect
              value={statusFilter}
              onValueChange={(val) => setStatusFilter(val)}
              options={[
                { label: "All levels", value: "All" },
                { label: "In stock", value: "In Stock" },
                { label: "Low stock", value: "Low Stock" },
                { label: "Out of stock", value: "Out of Stock" },
              ]}
              placeholder="Status"
            />
          </div>
        </div>
      </RightSidebarFilter>

      {/* Main table card */}
      <div className="bg-white border border-slate-100 rounded-lg shadow-sm min-w-0 overflow-hidden flex flex-col flex-1 min-h-0 mt-2">

        {/* Table */}
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse whitespace-nowrap text-sm">

            {/* Sticky header */}
            <thead className="sticky top-0 z-20 bg-white border-b border-slate-100">
              <tr>
                <th className="px-3 py-2.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredProducts.length > 0 && filteredProducts.every(p => selectedProducts.has(p.id))}
                    onChange={() => {
                      const allSelected = filteredProducts.length > 0 && filteredProducts.every(p => selectedProducts.has(p.id));
                      if (allSelected) {
                        setSelectedProducts(new Set());
                      } else {
                        setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
                      }
                    }}
                    className="rounded border-slate-350 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                  />
                </th>
                <th className="px-3 py-2.5 w-10" />
                <th className="px-3 py-2.5 min-w-[260px] text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                  Product
                </th>
                {sortedSelectedKeys.map((key) => {
                  if (
                    key === "category" &&
                    sortedSelectedKeys.includes("supplier")
                  ) {
                    return (
                      <th
                        key="cat_sup"
                        className="px-3 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide"
                      >
                        Category
                      </th>
                    );
                  }
                  if (
                    key === "supplier" &&
                    sortedSelectedKeys.includes("category")
                  )
                    return null;
                  return (
                    <th
                      key={key}
                      className="px-3 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide"
                    >
                      {getColumnLabel(key)}
                    </th>
                  );
                })}
                <th className="px-3 py-2.5 w-24 text-right text-[10px] font-semibold text-slate-400 uppercase tracking-wide sticky right-0 bg-slate-50 border-l border-slate-200 z-30 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.08)]">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y-0">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={selectedKeys.length + 4}
                    className="py-20 text-center"
                  >
                    <div className="flex flex-col items-center gap-2">
                      {searchTerm ? (
                        <>
                          <Search size={18} className="text-slate-300" />
                          <p className="text-[12px] font-medium text-slate-400">
                            No results for{" "}
                            <span className="text-slate-600">
                              "{searchTerm}"
                            </span>
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                            <Package size={18} className="text-slate-300" />
                          </div>
                          <p className="text-[12px] font-medium text-slate-500">
                            No products found
                          </p>
                          <p className="text-[11px] text-slate-400 max-w-[180px] leading-relaxed text-center">
                            Add your first product to get started.
                          </p>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <ProductRow
                    key={p.id}
                    p={p}
                    isSelected={selectedProducts.has(p.id)}
                    onSelect={(prod) => toggleSelectProduct(prod.id)}
                    isExpanded={expandedRows.has(p.id)}
                    toggleExpand={toggleExpand}
                    selectedKeys={sortedSelectedKeys}
                    onDelete={(prod) => {
                      setProductToDelete(prod);
                      setIsDeleteDialogOpen(true);
                    }}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!loading && products.length > 0 && (
          <div className="border-t border-slate-50 px-4 py-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">
              {filteredProducts.length} of {products.length} product
              {products.length !== 1 ? "s" : ""}
            </span>
            <span className="text-[11px] text-slate-300 font-medium">
              {expandedRows.size > 0 && `${expandedRows.size} expanded`}
            </span>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Remove product"
        description="This action cannot be undone. This will permanently remove the product and all associated data."
        confirmText="Remove product"
        type="danger"
      />
    </div>
  );
};

export default ProductInfos;
