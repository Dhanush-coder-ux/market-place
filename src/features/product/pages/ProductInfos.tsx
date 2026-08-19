import React, { useRef, useState, useEffect, useMemo, Fragment } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Package, Search, Filter, Bookmark, Trash2,
  ChevronDown, ChevronRight, Layers,
  X, AlertCircle, Calendar, Hash, ExternalLink,
  Copy, Check, Pencil, Eye, MoreVertical, RefreshCw, History, Plus
} from "lucide-react";
import ActionMenu, { ActionMenuItem, ActionMenuDivider } from "@/components/common/ActionMenu";
import { VariantRows, BatchCards, SerialBadgeList } from "../../inventory/components/StockTree";
import { Modal } from "@/components/common/SuperUI";
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
import { AntBadge } from "@/components/ui/AntBadge";

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
  barcode: "Barcode",
  buy_price: "Buy Price",
  sell_price: "Sell Price",
  stocks: "Stock",
  status: "Status",
  category: "Category",
  unit: "Unit",
  supplier: "Supplier",
  serial_number: "Serials",
  reorder_point: "Reorder Point",
  storage_location: "Storage Location",
};

const columnOrder = [
  "category",
  "supplier",
  "unit",
  "buy_price",
  "sell_price",
  "stocks",
  "status",
  "reorder_point",
  "storage_location",
  "barcode",
  "serial_number"
];

const hiddenProductColumns = new Set(["cost_to_make", "stocks", "status", "reorder_point"]);

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
      variant: "ps-cancelled",
    };
  if (s <= rp)
    return {
      label: "Low stock",
      variant: "ps-draft",
    };
  return {
    label: "In stock",
    variant: "ps-completed",
  };
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
      className={`inline-flex items-center justify-center p-0.5 rounded transition-all duration-200 ${copied ? "text-emerald-500 bg-emerald-50" : "text-slate-350 hover:text-blue-600 hover:bg-slate-100/80"
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
    const [showVariantModal, setShowVariantModal] = useState(false);
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [showSerialModal, setShowSerialModal] = useState(false);
    const menuTriggerRef = useRef<HTMLButtonElement>(null);
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
      () => normalizeVariants(p.variant_infos || p.variants || datas.variant_infos || datas.variants || datas.combinations).filter((v: any) => v && v.id !== null),
      [p.variant_infos, p.variants, datas.variant_infos, datas.variants, datas.combinations]
    );

    const batches = useMemo(
      () => {
        const bs = p.batch_infos || p.batches || datas.batch_infos || datas.batches;
        if (Array.isArray(bs)) return bs.filter((b: any) => b && b.id !== null);
        if (bs && typeof bs === 'object' && Object.keys(bs).length > 0) return [bs];
        return [];
      },
      [p.batch_infos, p.batches, datas.batch_infos, datas.batches]
    );

    const hasVariants = !!(p.type_infos?.has_variant || datas.has_variants || datas.has_varients) || combinations.length > 0;
    const hasBatches = !!(p.type_infos?.has_batch || datas.has_batch) || batches.length > 0;

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



    if (hasVariants) {
      badges.push(
        <AntBadge key="var" variant="at-variant" type="tag" icon={<Layers size={9} />}>
          {combinations.length} variants
        </AntBadge>
      );
    }

    const trackingInfo: any[] = [];
    if (!hasVariants) {
      if (totalBatches > 0) trackingInfo.push({ label: `${totalBatches} batches`, icon: Calendar, color: "coral", bg: "bg-[var(--at-batch-bg)]", text: "text-[var(--at-batch-tx)] border-[var(--at-batch-bd)]" });
      if (totalSerials > 0) trackingInfo.push({ label: `${totalSerials} serials`, icon: Hash, color: "rose", bg: "bg-[var(--at-serial-bg)]", text: "text-[var(--at-serial-tx)] border-[var(--at-serial-bd)]" });
    }

    const visibleBadges = showAllBadges ? badges : badges.slice(0, 2);
    const remainingBadges = badges.length - 2;

    const productName = p.name || "N/A";
    const initial = String(productName[0]).toUpperCase();

    return (
      <Fragment key={p.id}>
        <tr
          className={`group border-b border-slate-50 transition-colors cursor-pointer ${isSelected ? "bg-blue-50 border-l-2 border-l-blue-500" : isExpanded ? "bg-slate-50/70" : "hover:bg-slate-50/60"
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
                className={`w-5 h-5 mx-auto rounded flex items-center justify-center transition-colors ${isExpanded
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

          {/* Product ID */}
          <td className="px-3 py-2.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const uiId = (p as any).ui_id || p.id || "";
              if (!uiId) return <span className="text-[12px] font-medium text-slate-400">—</span>;
              const trimmedId = uiId.length > 16 ? `${uiId.slice(0, 12)}...` : uiId;
              return (
                <span className="flex items-center gap-1 text-[12px] font-medium text-slate-600">
                  <span className="font-mono tabular-nums" title={uiId}>
                    {trimmedId}
                  </span>
                  <CopySKUButton val={uiId} />
                </span>
              );
            })()}
          </td>

          {/* Product identity */}
          <td className="px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center text-slate-600 text-[11px] font-semibold shrink-0 select-none overflow-hidden">
                {(() => {
                  const imgUrl = (p as any).image_url || (p as any).image || datas.image_url || datas.image || datas.images;
                  const singleUrl = Array.isArray(imgUrl) ? imgUrl[0] : imgUrl;
                  return typeof singleUrl === "string" && singleUrl ? (
                    <img src={singleUrl} alt={productName} className="w-full h-full object-cover" />
                  ) : (
                    initial
                  );
                })()}
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
                    className={`mt-1 flex items-center gap-2 w-fit px-2 py-1.5 rounded-xl border transition-all ${isExpanded
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
                            className={`flex items-center gap-1 text-[10px] font-bold ${info.text} ${info.bg} border ${info.border} px-1.5 py-0.5 rounded-xl leading-none`}
                          >
                            <Icon size={10} />
                            {info.label}
                          </span>
                        );
                      })}
                    </div>
                    <div className={`ml-1 p-0.5 rounded-xl transition-colors ${isExpanded ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500'}`}>
                      {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </div>
                  </button>
                )}
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  {Boolean(p.brand || datas.brand || (p as any).brand) && (
                    <span className="text-[11px] font-medium text-[#38414F] bg-[#EEF1F5] px-2.5 py-0.5 rounded-full border border-[#CBD3DE]">
                      {p.brand || datas.brand || (p as any).brand}
                    </span>
                  )}
                  {(p.gst || datas.gst || (p as any).gst) && (
                    <span className="text-[10px] font-semibold text-[var(--lb-gst-tx)] bg-[var(--lb-gst-bg)] px-1.5 py-0.5 rounded-md border border-[var(--lb-gst-bd)] uppercase">
                      GST {p.gst || datas.gst || (p as any).gst}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </td>

          {/* SKU */}
          <td className="px-3 py-2.5 whitespace-nowrap">
            {(() => {
              const actualSku = p.sku || datas.sku || "";
              if (!actualSku) return <span className="text-[12px] font-medium text-slate-400">—</span>;
              return (
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-medium text-slate-700 font-mono" title={actualSku}>
                    {actualSku}
                  </span>
                  <CopySKUButton val={actualSku} />
                </div>
              );
            })()}
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
                    className={`tabular-nums ${key === "sell_price"
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

            if (key === "storage_location") {
              const sl = (p as any).storage_location_infos || (datas as any).storage_location_infos;
              let displayText = "—";
              if (sl && typeof sl === 'object' && Object.keys(sl).length > 0) {
                displayText = sl.name || sl.storage_location || sl.location || "—";
              }
              return (
                <td key={key} className="px-3 py-2.5 whitespace-nowrap">
                  <span className="text-[12px] font-medium text-slate-700">
                    {displayText}
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
                  <AntBadge variant={status.variant} type="pill" dot>
                    {status.label}
                  </AntBadge>
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
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-xl text-[10px] font-mono font-medium bg-violet-50 text-violet-600 border border-violet-100 leading-none">
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
                className="text-emerald-500 hover:text-emerald-600 transition-colors p-1"
                title="View Product"
              >
                <Eye size={15} />
              </button>
              <button
                onClick={() => navigate(`/product/${p.id}/edit`)}
                className="text-amber-400 hover:text-amber-500 transition-colors p-1"
                title="Edit Product"
              >
                <Pencil size={15} />
              </button>
              <div className="relative">
                <button
                  ref={menuTriggerRef}
                  onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                  className="text-slate-800 hover:text-slate-900 transition-colors p-1"
                  title="More actions"
                >
                  <MoreVertical size={15} />
                </button>
                <ActionMenu
                  triggerRef={menuTriggerRef}
                  open={isMenuOpen}
                  onClose={() => setIsMenuOpen(false)}
                  width={164}
                >
                  <ActionMenuItem icon={<RefreshCw size={13} />} onClick={() => { setIsMenuOpen(false); navigate(`/stock-adjustment`, { state: { product: p } }); }}>
                    Adjust Stock
                  </ActionMenuItem>
                  <ActionMenuItem icon={<History size={13} />} onClick={() => { setIsMenuOpen(false); navigate(`/stock-movement`, { state: { product: p } }); }}>
                    Stock Movements
                  </ActionMenuItem>
                  <ActionMenuItem icon={<Plus size={13} />} onClick={() => {
                    setIsMenuOpen(false);
                    if (hasVariants && combinations.length > 0) {
                      setShowVariantModal(true);
                    } else if (hasBatches && batches.length > 0) {
                      setShowBatchModal(true);
                    } else if (hasSerials && rootSerials.length > 0) {
                      setShowSerialModal(true);
                    } else {
                      navigate(`/purchase/add`, { state: { product: p } });
                    }
                  }}>
                    Add Purchase
                  </ActionMenuItem>
                  <ActionMenuDivider />
                  <ActionMenuItem icon={<Trash2 size={13} />} danger onClick={() => { setIsMenuOpen(false); onDelete(p); }}>
                    Delete
                  </ActionMenuItem>
                </ActionMenu>
              </div>
            </div>
          </td>
        </tr>

        {/* Expanded tree area */}
        {isExpanded && (
          <tr key={`${p.id}-expand`} className="bg-slate-50/40">
            <td
              colSpan={selectedKeys.length + 5}
              className="px-0 py-0 border-b border-slate-50"
            >
              <div className="ml-8 mr-3 my-2 space-y-2 border-l-2 border-slate-200 pl-4">
                {!hasVariants && rootSerials.length > 0 && (
                  <div className="bg-white border border-slate-100 rounded-lg p-3">
                    <p className="text-[10px] font-semibold text-slate-400 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                      <Hash size={10} className="text-slate-400" />
                      Serial numbers
                    </p>
                    <SerialBadgeList
                      serials={rootSerials}
                    />
                  </div>
                )}

                <div className="animate-in fade-in duration-300">
                  {hasVariants && (
                    <VariantRows
                      combinations={combinations}
                      baseSellPrice={p.pricing_infos?.sell_price || datas.sell_price || (p as any).sell_price}
                      parentStorageLocation={(p as any).storage_location_infos?.storage_location ?? (p as any).storage_location_infos?.name ?? (p as any).storage_location ?? (p as any).location ?? datas.storage_location ?? null}
                      parentReorderPoint={p.reorder_point_infos?.reorder_point ?? (p as any).reorder_point ?? datas.reorder_point ?? null}
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

        <Modal
          show={showVariantModal}
          onClose={() => setShowVariantModal(false)}
          title={`Select Variant for ${p.name}`}
        >
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {combinations.map((comb: any, idx: number) => {
              const combDatas = comb.datas || {};
              const attributes = comb.attributes || combDatas.attributes || combDatas.datas?.attributes || {};
              let variantLabel = "";
              if (attributes && Object.keys(attributes).length > 0) {
                const entries = Object.entries(attributes);
                if (entries.length === 1) {
                  variantLabel = String(entries[0][1]);
                } else {
                  variantLabel = entries.map(([k, v]) => `${k}: ${v}`).join(' · ');
                }
              } else {
                const rawName = comb.variant_name || comb.name || combDatas.variant_name || combDatas.name;
                if (rawName && typeof rawName === 'string' && rawName.trim() !== '' && rawName !== comb.barcode && rawName !== comb.sku) {
                  variantLabel = rawName;
                } else {
                  variantLabel = `Variant ${idx + 1}`;
                }
              }
              const stockNum = Number(comb.stock_infos?.available_stocks ?? comb.stock_infos?.physical_stocks ?? comb.stocks ?? comb.stock ?? combDatas.stocks ?? combDatas.datas?.stocks ?? 0);
              return (
                <div
                  key={comb.id || idx}
                  className="p-3 border border-slate-200 rounded-lg hover:border-blue-500 cursor-pointer flex justify-between items-center bg-white transition-all shadow-sm hover:shadow-md"
                  onClick={() => {
                    setShowVariantModal(false);
                    const productWithVariant = {
                      ...p,
                      variant_id: comb.id || String(idx),
                      variant: variantLabel,
                      chosen_variant: comb
                    };
                    navigate(`/purchase/add`, { state: { product: productWithVariant } });
                  }}
                >
                  <div>
                    <p className="font-bold text-sm text-slate-800">{variantLabel}</p>
                    <p className="text-xs text-slate-500 font-semibold mt-1">Stock: {stockNum}</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>
              );
            })}
          </div>
        </Modal>

        {/* Batch Selection Modal */}
        <Modal
          show={showBatchModal}
          onClose={() => setShowBatchModal(false)}
          title={`Select Batch for ${p.name}`}
        >
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {batches.map((batch: any, idx: number) => {
              const batchLabel = batch.name || batch.batch || `BAT-${String(idx + 1).padStart(3, '0')}`;
              const stockNum = Number(batch.stock_infos?.available_stocks ?? batch.stock_infos?.physical_stocks ?? batch.stocks ?? batch.quantity ?? batch.qty ?? 0);
              return (
                <div
                  key={batch.id || idx}
                  className="p-3 border border-slate-200 rounded-lg hover:border-amber-500 cursor-pointer flex justify-between items-center bg-white transition-all shadow-sm hover:shadow-md"
                  onClick={() => {
                    setShowBatchModal(false);
                    const productWithBatch = {
                      ...p,
                      chosen_batch: { ...batch, name: batchLabel }
                    };
                    navigate(`/purchase/add`, { state: { product: productWithBatch } });
                  }}
                >
                  <div>
                    <p className="font-bold text-sm text-slate-800">{batchLabel}</p>
                    <p className="text-xs text-slate-500 font-semibold mt-1">Stock: {stockNum}</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>
              );
            })}
          </div>
        </Modal>

        {/* Serial Selection Modal */}
        <Modal
          show={showSerialModal}
          onClose={() => setShowSerialModal(false)}
          title={`Select Serial Number for ${p.name}`}
        >
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {rootSerials.map((serial: string, idx: number) => {
              return (
                <div
                  key={idx}
                  className="p-3 border border-slate-200 rounded-lg hover:border-emerald-500 cursor-pointer flex justify-between items-center bg-white transition-all shadow-sm hover:shadow-md"
                  onClick={() => {
                    setShowSerialModal(false);
                    const productWithSerial = {
                      ...p,
                      chosen_serial: { name: serial }
                    };
                    navigate(`/purchase/add`, { state: { product: productWithSerial } });
                  }}
                >
                  <div>
                    <p className="font-bold text-sm text-slate-800">{serial}</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>
              );
            })}
          </div>
        </Modal>
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
  const [activeKpi, setActiveKpi] = useState("All Products");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState({
    status: "All",
    category: "All",
    brand: "All",
    type: "All",
    visibility: "All"
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);


  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<InventoryRecord | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  const [availableKeys, setAvailableKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() => {
    const saved = localStorage.getItem("product_table_columns");
    return saved
      ? sortKeys(JSON.parse(saved).filter((key: string) => !hiddenProductColumns.has(key)))
      : ["category", "buy_price", "sell_price", "barcode"];
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
    if (debouncedSearch) params.q = debouncedSearch;
    if (filters.status === "Low stock") params.stock_status = "low";
    if (filters.status === "Out of stock") params.stock_status = "out_of_stock";

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
            ["category", "sell_price", "buy_price", "stocks", "reorder_point", "status", "barcode", "serial_number"].forEach((k) =>
              keys.add(k)
            );
          });
          setAvailableKeys(sortKeys(Array.from(keys).filter((key) => !hiddenProductColumns.has(key))));
        }
      }
    );
  }, [refreshKey, debouncedSearch, filters.status, getData]);

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

  const categories = useMemo(() => {
    const cats = new Set(products.map((p: any) => p.category_infos?.name || p.additional_infos?.category || p.datas?.category || p.category || p.category_id).filter(Boolean));
    return ["All", ...Array.from(cats)];
  }, [products]);

  const brands = useMemo(() => {
    const brs = new Set(products.map((p: any) => p.brand || p.additional_infos?.brand || p.datas?.brand || p.brand).filter(Boolean));
    return ["All", ...Array.from(brs)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products;

    if (activeKpi === "Inactive Products") {
      result = result.filter((p: any) => p.is_active === false);
    } else if (activeKpi === "Stock Not Tracking") {
      result = result.filter((p: any) => p.track_stock === false || p.is_stock_tracked === false || p.type === "service");
    }

    if (debouncedSearch) {
      const lowerSearch = debouncedSearch.toLowerCase();
      result = result.filter((p: any) => {
        const name = p.name?.toLowerCase() || "";
        const sku = p.sku?.toLowerCase() || p.ui_id?.toLowerCase() || "";
        const category = (p.category_infos?.name || p.additional_infos?.category || p.datas?.category || p.category || "")?.toLowerCase() || "";
        const brand = (p.brand || p.additional_infos?.brand || p.datas?.brand || "")?.toLowerCase() || "";
        const barcode = p.barcode?.toLowerCase() || "";

        return (
          name.includes(lowerSearch) ||
          sku.includes(lowerSearch) ||
          category.includes(lowerSearch) ||
          brand.includes(lowerSearch) ||
          barcode.includes(lowerSearch)
        );
      });
    }

    if (filters.status !== "All") {
      result = result.filter((p: any) => {
        const stock = calculateProductStock(p);
        const reorderPoint = Number(
          p.reorder_point_infos?.reorder_point ?? p.reorder_point ?? p.additional_infos?.reorder_point ?? p.datas?.reorder_point ?? 10
        );
        const status = getStockStatus(stock, reorderPoint);
        return status.label === filters.status;
      });
    }

    if (filters.category !== "All") {
      result = result.filter((p: any) => {
        const cat = p.category_infos?.name || p.additional_infos?.category || p.datas?.category || p.category || p.category_id;
        return cat === filters.category;
      });
    }

    if (filters.brand !== "All") {
      result = result.filter((p: any) => {
        const br = p.brand || p.additional_infos?.brand || p.datas?.brand || p.brand;
        return br === filters.brand;
      });
    }

    if (filters.type !== "All") {
      result = result.filter((p: any) => {
        if (filters.type === "Has Variants") return p.type_infos?.has_variant;
        if (filters.type === "Has Batches") return p.type_infos?.has_batch;
        if (filters.type === "Has Serials") return p.type_infos?.has_serialno;
        if (filters.type === "Simple") return !p.type_infos?.has_variant && !p.type_infos?.has_batch && !p.type_infos?.has_serialno;
        return true;
      });
    }

    if (filters.visibility !== "All") {
      result = result.filter((p: any) => {
        const isOnline = p.visible_online === true;
        if (filters.visibility === "Online") return isOnline;
        if (filters.visibility === "Offline") return !isOnline;
        return true;
      });
    }

    return result;
  }, [products, debouncedSearch, filters, activeKpi]);

  if (loading && products.length === 0 && !searchTerm && !debouncedSearch) {
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
            label="All Products"
            value={products.length.toString()}
            subValue="total records"
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            onClick={() => setActiveKpi("All Products")}
            className={activeKpi === "All Products" ? "ring-2 ring-blue-400 border-transparent shadow-sm" : ""}
          />
          <StatCard
            icon={Package}
            label="Inactive Products"
            value={(products.filter((p: any) => p.is_active === false).length).toString()}
            subValue="disabled items"
            iconBg="bg-slate-100"
            iconColor="text-slate-600"
            onClick={() => setActiveKpi("Inactive Products")}
            className={activeKpi === "Inactive Products" ? "ring-2 ring-slate-400 border-transparent shadow-sm" : ""}
          />
          <StatCard
            icon={AlertCircle}
            label="Stock Not Tracking"
            value={(products.filter((p: any) => p.track_stock === false || p.is_stock_tracked === false || p.type === "service").length).toString()}
            subValue="untracked items"
            iconBg="bg-amber-50"
            iconColor="text-amber-500"
            onClick={() => setActiveKpi("Stock Not Tracking")}
            className={activeKpi === "Stock Not Tracking" ? "ring-2 ring-amber-400 border-transparent shadow-sm" : ""}
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
          className={`h-8 px-3 rounded-md border text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm shrink-0 ${Object.values(filters).some(v => v !== "All")
            ? "border-blue-200 text-blue-600 bg-blue-50/50"
            : "border-slate-200 text-slate-650 bg-white hover:bg-slate-50"
            }`}
          title="Filters"
        >
          <Filter size={13} />
          {Object.values(filters).some(v => v !== "All") && (
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
        onApply={() => setIsFilterOpen(false)}
        onClear={() => setFilters({
          status: "All",
          category: "All",
          brand: "All",
          type: "All",
          visibility: "All"
        })}
        title="Product Filters"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stock Status</label>
            <ReusableSelect
              value={filters.status}
              onValueChange={(val) => setFilters(prev => ({ ...prev, status: val }))}
              options={[
                { label: "All levels", value: "All" },
                { label: "In stock", value: "In stock" },
                { label: "Low stock", value: "Low stock" },
                { label: "Out of stock", value: "Out of stock" },
              ]}
              placeholder="Status"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
            <ReusableSelect
              value={filters.category}
              onValueChange={(val) => setFilters(prev => ({ ...prev, category: val }))}
              options={categories.map(c => ({ label: String(c), value: String(c) }))}
              placeholder="Category"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Brand</label>
            <ReusableSelect
              value={filters.brand}
              onValueChange={(val) => setFilters(prev => ({ ...prev, brand: val }))}
              options={brands.map(b => ({ label: String(b), value: String(b) }))}
              placeholder="Brand"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Product Type</label>
            <ReusableSelect
              value={filters.type}
              onValueChange={(val) => setFilters(prev => ({ ...prev, type: val }))}
              options={[
                { label: "All Types", value: "All" },
                { label: "Has Variants", value: "Has Variants" },
                { label: "Has Batches", value: "Has Batches" },
                { label: "Has Serials", value: "Has Serials" },
                { label: "Simple Product", value: "Simple" },
              ]}
              placeholder="Product Type"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Visibility</label>
            <ReusableSelect
              value={filters.visibility}
              onValueChange={(val) => setFilters(prev => ({ ...prev, visibility: val }))}
              options={[
                { label: "All Visibility", value: "All" },
                { label: "Online Only", value: "Online" },
                { label: "Offline Only", value: "Offline" },
              ]}
              placeholder="Visibility"
            />
          </div>
        </div>
      </RightSidebarFilter>

      {/* Main table card */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 min-w-0 overflow-hidden flex flex-col flex-1 min-h-0 mt-2">

        {/* Table */}
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse whitespace-nowrap text-sm">

            {/* Sticky header */}
            <thead className="sticky top-0 z-20 bg-white shadow-[0_1px_0_0_#e2e8f0]">
              <tr>
                <th className="px-4 py-3 w-10 text-center">
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
                <th className="px-4 py-3 w-10" />
                <th className="px-4 py-3 w-40 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Product ID
                </th>
                <th className="px-4 py-3 min-w-[260px] text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  SKU
                </th>
                {sortedSelectedKeys.map((key) => {
                  if (
                    key === "category" &&
                    sortedSelectedKeys.includes("supplier")
                  ) {
                    return (
                      <th
                        key="cat_sup"
                        className="px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider"
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
                      className="px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider"
                    >
                      {getColumnLabel(key)}
                    </th>
                  );
                })}
                <th className="px-4 py-3 w-24 text-right text-[10px] font-semibold text-slate-500 uppercase tracking-wider sticky right-0 bg-white shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.08)]">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={selectedKeys.length + 5}
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
