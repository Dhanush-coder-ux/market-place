import React, { useRef, useState, useEffect, Fragment, useMemo, useCallback } from "react";
import {
  X,
  Hash,
  ChevronDown,
  ChevronRight,
  Package,
  Layers,
  Calendar,
  Filter,
  Search,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Eye,
  Pencil,
  MoreVertical,
  RefreshCw,
  Plus,
  Trash2,
  History,
  FileUp
} from "lucide-react";
import ExcelImportModal from "@/components/common/ExcelImportModal";
import ActionMenu, { ActionMenuItem } from "@/components/common/ActionMenu";
import { VariantRows, BatchCards, SerialBadgeList, analyzeProductStock, calculateProductStock } from "../components/StockTree";
import { Modal } from "@/components/common/SuperUI";
import { useApi } from "@/context/ApiContext";
import { PriceCell } from "@/components/common/PriceCell";
import { useHeader } from "@/context/HeaderContext";
import { useToast } from "@/context/ToastContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import { shopApi } from "@/services/api/shop";
import SkeletonLoader from "@/components/common/SkeletonLoader";
import { StatCard } from "@/components/common/StatsCard";
import { useNavigate, useLocation } from "react-router-dom";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { RightSidebarFilter } from "@/components/common/RightSidebarFilter";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { AntBadge } from "@/components/ui/AntBadge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// --- Types (unchanged) ---
export interface VariantAttribute {
  [key: string]: string;
}

export interface Combination {
  id: string;
  price: string | number;
  stock: string | number;
  active: boolean;
  barcode: string;
  attributes: VariantAttribute;
}

export interface VariantType {
  id: string;
  name: string;
  values: string[];
}

export interface ProductDatas {
  name?: string;
  category?: string;
  supplier?: string;
  brand?: string;
  gst?: string;
  barcode?: string;
  sku?: string;
  hsn?: string;
  mrp?: string;
  unit?: string;
  reorder_point?: string;
  serial_number?: string;
  description?: string;
  has_variants?: boolean;
  has_varients?: boolean;
  variantTypes?: VariantType[];
  variant_types?: any[];
  combinations?: Combination[];
  variants?: any[];
  serial_numbers?: string[];
  batches?: any[];
  images?: string[];
}

export interface InventoryItem {
  id: string;
  barcode: string;
  buy_price: number;
  sell_price: number;
  stocks: number;
  date: string;
  datas?: ProductDatas;
  variants?: any[];
  serial_numbers?: string[];
  batches?: any[];
  name?: string;
  brand?: string;
  category?: string;
  supplier?: string;
  description?: string;
  gst?: string;
  serial_number?: any;
}

// --- Helpers (unchanged logic) ---
const formatDate = (dateStr?: string) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const parseObjects = (val: any): any[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === "object") return Object.values(parsed);
      return [];
    } catch (e) {
      return [];
    }
  }
  if (typeof val === "object") {
    return Object.values(val);
  }
  return [];
};

const parseSerials = (val: any): string[] => {
  if (!val) return [];
  const getNames = (arr: any[]): string[] => {
    return arr.map((v: any) => typeof v === 'object' && v !== null ? v.name || v.serial || v.serial_number || String(v) : String(v)).filter(Boolean);
  };
  if (Array.isArray(val)) return getNames(val);
  if (typeof val === "object") {
    if (Array.isArray(val.serial_numbers)) return getNames(val.serial_numbers);
    if (Array.isArray(val.serialno_infos)) return getNames(val.serialno_infos);
    return getNames(Object.values(val));
  }
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (parsed && typeof parsed === "object" && Array.isArray(parsed.serial_numbers))
        return getNames(parsed.serial_numbers);
      if (parsed && typeof parsed === "object" && Array.isArray(parsed.serialno_infos))
        return getNames(parsed.serialno_infos);
      return Array.isArray(parsed) ? getNames(parsed) : [];
    } catch (e) {
      return [];
    }
  }
  return [];
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
      className={`inline-flex items-center justify-center p-0.5 rounded transition-all duration-205 ${copied ? "text-emerald-500 bg-emerald-50" : "text-slate-350 hover:text-blue-600 hover:bg-slate-100/80"
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

const formatCurrency = (amount?: any) => {
  if (amount === undefined || amount === null || amount === "—") return "—";
  const num = Number(amount);
  if (isNaN(num)) return amount;
  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// --- Dropdown for Variant / Batch Product Columns (replaces "—") ---
interface VariantColumnDropdownProps {
  columnKey: "buy_price" | "sell_price" | "price" | "mrp" | "barcode" | "sku" | "hsn" | "reorder_point" | "storage_location";
  columnLabel: string;
  items: any[];
  isVariant: boolean;
  gstRate: number | string;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const VariantColumnDropdown: React.FC<VariantColumnDropdownProps> = ({
  columnKey,
  columnLabel,
  items,
  isVariant,
  gstRate,
  isExpanded,
  onToggleExpand,
}) => {
  const cleanGstRate = typeof gstRate === "string"
    ? parseFloat(gstRate.replace(/[^0-9.]/g, "")) || 0
    : Number(gstRate) || 0;

  const details = useMemo(() => {
    return items.map((it, idx) => {
      const name =
        it.variant_name ||
        it.name ||
        it.batch_number ||
        it.batch_name ||
        it.batch ||
        (it.combination ? Object.values(it.combination).join(" / ") : null) ||
        `${isVariant ? "Variant" : "Batch"} ${idx + 1}`;

      const pInfo = it.pricing_infos || it;

      if (columnKey === "buy_price") {
        const rawBuy = pInfo.buy_price ?? it.buy_price ?? it.cost_price;
        const numBuy = rawBuy !== undefined && rawBuy !== null && !isNaN(Number(rawBuy)) && Number(rawBuy) > 0 ? Number(rawBuy) : null;
        if (numBuy !== null) {
          const gstAmt = cleanGstRate > 0 ? Math.round((numBuy * (cleanGstRate / 100)) * 100) / 100 : 0;
          const totalBuy = Math.round((numBuy + gstAmt) * 100) / 100;
          return {
            name,
            numVal: totalBuy,
            display: formatCurrency(totalBuy),
            subDisplay: gstAmt > 0 ? `${formatCurrency(numBuy)} + ${formatCurrency(gstAmt)} GST` : null,
            hasValue: true,
          };
        }
        return { name, numVal: null, display: "Set on purchase", subDisplay: null, hasValue: false };
      }

      if (columnKey === "sell_price" || columnKey === "price") {
        const rawSell = pInfo.sell_price ?? it.sell_price ?? it.price;
        const numSell = rawSell !== undefined && rawSell !== null && !isNaN(Number(rawSell)) && Number(rawSell) > 0 ? Number(rawSell) : null;
        if (numSell !== null) {
          return {
            name,
            numVal: numSell,
            display: formatCurrency(numSell),
            subDisplay: null,
            hasValue: true,
          };
        }
        return { name, numVal: null, display: "Set on purchase", subDisplay: null, hasValue: false };
      }

      if (columnKey === "mrp") {
        const rawMrp = pInfo.mrp ?? it.mrp ?? it.additional_infos?.mrp;
        const numMrp = rawMrp !== undefined && rawMrp !== null && !isNaN(Number(rawMrp)) && Number(rawMrp) > 0 ? Number(rawMrp) : null;
        if (numMrp !== null) {
          return {
            name,
            numVal: numMrp,
            display: formatCurrency(numMrp),
            subDisplay: null,
            hasValue: true,
          };
        }
        return { name, numVal: null, display: "—", subDisplay: null, hasValue: false };
      }

      if (columnKey === "hsn") {
        const hsnVal = it.hsn || it.hsn_code || it.additional_infos?.hsn || it.additional_infos?.hsn_code || "";
        if (hsnVal) {
          return {
            name,
            numVal: null,
            display: String(hsnVal),
            subDisplay: null,
            hasValue: true,
          };
        }
        return { name, numVal: null, display: "—", subDisplay: null, hasValue: false };
      }

      if (columnKey === "barcode") {
        const bc = it.barcode || it.additional_infos?.barcode || "";
        if (bc) {
          return {
            name,
            numVal: null,
            display: String(bc),
            subDisplay: null,
            hasValue: true,
          };
        }
        return { name, numVal: null, display: "—", subDisplay: null, hasValue: false };
      }

      if (columnKey === "sku") {
        const skuVal = it.sku || it.additional_infos?.sku || "";
        if (skuVal) {
          return {
            name,
            numVal: null,
            display: String(skuVal),
            subDisplay: null,
            hasValue: true,
          };
        }
        return { name, numVal: null, display: "—", subDisplay: null, hasValue: false };
      }

      if (columnKey === "reorder_point") {
        const rp = it.reorder_point_infos?.reorder_point ?? it.reorder_point ?? it.additional_infos?.reorder_point;
        if (rp !== undefined && rp !== null) {
          return {
            name,
            numVal: null,
            display: String(rp),
            subDisplay: null,
            hasValue: true,
          };
        }
        return { name, numVal: null, display: "—", subDisplay: null, hasValue: false };
      }

      if (columnKey === "storage_location") {
        const sl = it.storage_location_infos?.storage_location ?? it.storage_location ?? it.additional_infos?.storage_location;
        if (sl) {
          return {
            name,
            numVal: null,
            display: String(sl),
            subDisplay: null,
            hasValue: true,
          };
        }
        return { name, numVal: null, display: "—", subDisplay: null, hasValue: false };
      }

      return { name, numVal: null, display: "—", subDisplay: null, hasValue: false };
    });
  }, [items, columnKey, isVariant, cleanGstRate]);

  // Compute summary for button
  const validNumbers = details.map((d) => d.numVal).filter((v): v is number => v !== null && v > 0);
  let summaryText = "";

  if (validNumbers.length > 0) {
    const min = Math.min(...validNumbers);
    const max = Math.max(...validNumbers);
    if (min === max) {
      summaryText = formatCurrency(min);
    } else {
      summaryText = `${formatCurrency(min)} – ${formatCurrency(max)}`;
    }
  }

  const defaultBadgeText = isVariant ? "Available in variant tab" : "Available in batch tab";
  const buttonLabel = (summaryText && (columnKey === "buy_price" || columnKey === "sell_price")) ? summaryText : defaultBadgeText;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg text-indigo-600 transition-colors cursor-pointer group shadow-2xs"
          title={`Available in ${isVariant ? "variant" : "batch"} tab - click to view ${columnLabel}`}
        >
          <Layers size={11} className="text-indigo-500 shrink-0" />
          <span className="text-[11px] font-bold text-indigo-600 truncate max-w-[155px]">
            {buttonLabel}
          </span>
          <ChevronDown
            size={11}
            className="text-indigo-400 group-hover:text-indigo-600 transition-transform group-data-[state=open]:rotate-180 shrink-0"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-72 p-0 rounded-xl bg-white shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-slate-50 px-3 py-2 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Layers size={13} className="text-blue-600" />
            <span className="text-[11px] font-bold text-slate-700">
              {columnLabel} · {isVariant ? `${items.length} Variants` : `${items.length} Batches`}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Breakdown</span>
        </div>

        <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 p-1">
          {details.map((it, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between px-2.5 py-1.5 hover:bg-slate-50 rounded-lg transition-colors text-[11px]"
            >
              <span className="font-medium text-slate-700 truncate mr-2" title={it.name}>
                {it.name}
              </span>
              <div className="flex flex-col items-end shrink-0">
                <span
                  className={`tabular-nums ${
                    it.hasValue ? "font-bold text-slate-800" : "font-medium text-slate-400 text-[10.5px]"
                  }`}
                >
                  {it.display}
                </span>
                {it.subDisplay && (
                  <span className="text-[9.5px] text-slate-400 font-medium">
                    {it.subDisplay}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="p-1.5 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              onToggleExpand();
            }}
            className="w-full flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-100/50 transition-colors"
          >
            <Layers size={12} />
            {isExpanded ? "Collapse in table" : "Expand all in table"}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// --- Product Row ---
const ProductRow = React.memo(
  ({
    item,
    isSelected,
    onSelect,
    isExpanded,
    toggleExpand,
    innerRef,
  }: {
    item: InventoryItem;
    isSelected: boolean;
    onSelect: (item: InventoryItem) => void;
    isExpanded: boolean;
    toggleExpand: (id: string) => void;
    innerRef?: any;
  }) => {
    const datas = item.datas || {};

    const combinations = useMemo(() => {
      const raw = parseObjects(
        item.variants || (item as any).variant_infos || datas.combinations || datas.variants
      );
      return raw.filter((v: any) => v && typeof v === "object");
    }, [item.variants, (item as any).variant_infos, datas.combinations, datas.variants]);

    const batches = useMemo(() => {
      let raw: any[] = [];
      if (
        !(datas.has_variants || datas.has_varients || item.variants?.length || (item as any).variant_infos?.length) &&
        ((item.variants?.length ?? 0) > 0 || ((item as any).variant_infos?.length ?? 0) > 0)
      ) {
        const firstVar = item.variants?.[0] || (item as any).variant_infos?.[0];
        raw = parseObjects(firstVar?.batches || firstVar?.batch_infos);
      } else {
        raw = parseObjects(item.batches || (item as any).batch_infos || datas.batches || (item as any).type_infos?.batch_infos);
      }
      return raw.filter((b: any) => b && typeof b === "object");
    }, [
      item.variants,
      (item as any).variant_infos,
      item.batches,
      (item as any).batch_infos,
      datas.batches,
      (item as any).type_infos?.batch_infos,
      datas.has_variants,
      datas.has_varients,
    ]);

    const serials = useMemo(() => {
      return parseSerials(
        datas.serial_numbers || item.serial_numbers || item.serial_number || (item as any).serialno_infos
      );
    }, [datas.serial_numbers, item.serial_numbers, item.serial_number, (item as any).serialno_infos]);

    const hasVariants = !!(datas.has_variants || datas.has_varients || (item as any).has_variant || (item as any).type_infos?.has_variant) || combinations.length > 0;
    const hasBatches = batches.length > 0 || !!((item as any).has_batch || (item as any).type_infos?.has_batch);
    const hasSerials = serials.length > 0 || !!((item as any).has_serialno || (item as any).type_infos?.has_serialno);
    const isExpandable = hasVariants || hasBatches || hasSerials;

    let stockNumber = calculateProductStock(item);

    let sellPrice = (item as any).pricing_infos?.sell_price ?? item.sell_price;
    if (!hasVariants && hasBatches && (sellPrice === undefined || sellPrice === null)) {
      const firstBatch = batches[0];
      if (firstBatch) {
        sellPrice = firstBatch.pricing_infos?.sell_price ?? firstBatch.sell_price;
      }
    }

    const reorderPoint = Number(
      (item as any).reorder_point_infos?.reorder_point ?? (item as any).reorder_point ?? datas.reorder_point ?? 0
    );
    const stockAnalysis = analyzeProductStock(item);
    const status = stockAnalysis.status;


    const { totalSerials, totalBatches } = useMemo(() => {
      let ts = serials.length;
      let tb = batches.length;
      if (hasVariants) {
        combinations.forEach((c: any) => {
          const cDatas = c.datas || {};
          const cSerials = parseSerials(
            cDatas.serial_numbers ||
            c.serial_numbers ||
            (cDatas.datas && cDatas.datas.serial_numbers)
          );
          ts += cSerials.length;
          const cBatches = parseObjects(c.batches || c.batch_infos);
          tb += cBatches.length;
        });
      }
      return { totalSerials: ts, totalBatches: tb };
    }, [serials, batches, hasVariants, combinations]);

    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showVariantModal, setShowVariantModal] = useState(false);
    const menuTriggerRef = useRef<HTMLButtonElement>(null);
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

    const productName = datas.name || item.name || "N/A";
    const initial = String(productName[0]).toUpperCase();

    return (
      <Fragment>
        <tr
          ref={innerRef}
          onClick={() => toggleExpand(item.id)}
          className={`group border-b border-slate-200 transition-colors cursor-pointer ${isSelected ? "bg-blue-50 border-l-2 border-l-blue-500" : isExpanded ? "bg-slate-50/70" : "hover:bg-slate-50/60"
            }`}
        >
          {/* Checkbox */}
          <td className="px-4 py-4 w-10 text-center" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(item)}
              className="rounded border-slate-350 text-blue-600 focus:ring-blue-500/20"
            />
          </td>

          {/* Expand toggle */}
          <td className="px-4 py-4 text-center w-10">
            {isExpandable ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(item.id);
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
          <td className="px-4 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const uiId = (item as any).ui_id || item.id || "";
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
          <td className="px-4 py-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center text-slate-600 text-[11px] font-semibold shrink-0 select-none overflow-hidden">
                {(() => {
                  const imgUrl = (item as any).image_url || (item as any).image || (datas as any).image_url || (datas as any).image || datas.images;
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
                  {visibleBadges.length > 0 && (
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
                  )}
                </div>
                {trackingInfo.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(item.id);
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
                  {Boolean(item.brand || datas.brand || (item as any).brand) && (
                    <span className="text-[11px] font-medium text-[#38414F] bg-[#EEF1F5] px-2.5 py-0.5 rounded-full border border-[#CBD3DE]">
                      {item.brand || datas.brand || (item as any).brand}
                    </span>
                  )}
                  {(item.gst || datas.gst || (item as any).gst) && (
                    <span className="text-[10px] font-semibold text-[var(--lb-gst-tx)] bg-[var(--lb-gst-bg)] px-1.5 py-0.5 rounded-md border border-[var(--lb-gst-bd)] uppercase">
                      GST {item.gst || datas.gst || (item as any).gst}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </td>

          {/* SKU */}
          <td className="px-4 py-4 whitespace-nowrap">
            {(() => {
              const actualSku = (item as any).sku || datas.sku || "";
              if (!actualSku && hasVariants) {
                return (
                  <VariantColumnDropdown
                    columnKey="sku"
                    columnLabel="SKU"
                    items={combinations}
                    isVariant={true}
                    gstRate={0}
                    isExpanded={isExpanded}
                    onToggleExpand={() => toggleExpand(item.id)}
                  />
                );
              }
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

          {/* Barcode */}
          <td className="px-4 py-4 whitespace-nowrap">
            {(() => {
              const barcode = item.barcode || datas.barcode || "";
              if (!barcode && hasVariants) {
                return (
                  <VariantColumnDropdown
                    columnKey="barcode"
                    columnLabel="Barcode"
                    items={combinations}
                    isVariant={true}
                    gstRate={0}
                    isExpanded={isExpanded}
                    onToggleExpand={() => toggleExpand(item.id)}
                  />
                );
              }
              if (!barcode) return <span className="text-[12px] font-medium text-slate-400">—</span>;
              return (
                <span className="text-[12px] font-medium text-slate-700 font-mono tabular-nums" title={barcode}>
                  {barcode}
                </span>
              );
            })()}
          </td>

          {/* Category */}
          <td className="px-4 py-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-[12px] font-medium text-slate-700 leading-none">
                {(item as any).category_infos?.name || datas.category || item.category || "Uncategorized"}
              </span>
              {(() => {
                const supplier = datas.supplier || item.supplier || "";
                if (!supplier || supplier.toLowerCase() === "no supplier") {
                  return null;
                }
                return (
                  <span className="text-[11px] text-slate-400 leading-none">
                    {supplier}
                  </span>
                );
              })()}
            </div>
          </td>




          {/* Unit */}
          <td className="px-4 py-4">
            <span className="text-[12px] font-medium text-slate-600">
              {(item as any).unit_infos?.name || datas.unit || (item as any).unit || "—"}
            </span>
          </td>



          {/* Sell price */}
          <td className="px-4 py-4 text-right">
            <div className="flex flex-col items-end">
              {(() => {
                let numericPrice = sellPrice;
                if (hasBatches && batches.length > 0) {
                  const prices = batches.map((b: any) => b.pricing_infos?.sell_price ?? b.sell_price)
                    .filter((pr: any) => pr !== undefined && pr !== null && !isNaN(Number(pr)) && Number(pr) > 0);
                  if (prices.length > 0) {
                    numericPrice = prices[0];
                  }
                }

                if (hasVariants) {
                  return (
                    <VariantColumnDropdown
                      columnKey="sell_price"
                      columnLabel="Sell Price"
                      items={combinations}
                      isVariant={true}
                      gstRate={item.gst || datas.gst || (item as any).gst || 0}
                      isExpanded={isExpanded}
                      onToggleExpand={() => toggleExpand(item.id)}
                    />
                  );
                }

                const mrpValue = (datas as any).mrp || (item as any).mrp || (item as any).additional_infos?.mrp;
                const gstValue = item.gst || datas.gst || (item as any).gst || "18";
                const discountValue = (datas as any).discount_percent || (item as any).discount_percent || (item as any).additional_infos?.discount_percent || 0;
                const offerExpiry = (datas as any).offer_valid_until || (item as any).offer_valid_until || (item as any).additional_infos?.offer_valid_until;

                return (
                  <PriceCell
                    sellingPrice={numericPrice}
                    mrp={mrpValue}
                    gstRate={gstValue}
                    discountPercent={discountValue}
                    offerValidUntil={offerExpiry}
                    size="sm"
                    className="items-end text-right"
                  />
                );
              })()}
            </div>
          </td>

          {/* Stock */}
          <td className="px-4 py-4 text-right">
            <span className="text-[13px] font-semibold text-blue-600 tabular-nums">
              {stockNumber}
            </span>
          </td>

          {/* Status */}
          <td className="px-4 py-4">
            <AntBadge variant={status.variant} type="pill" dot>
              {status.label}
            </AntBadge>
          </td>



          {/* Reorder point */}
          <td className="px-4 py-4 text-center">
            {hasVariants ? (
              <VariantColumnDropdown
                columnKey="reorder_point"
                columnLabel="Reorder Point"
                items={combinations}
                isVariant={true}
                gstRate={0}
                isExpanded={isExpanded}
                onToggleExpand={() => toggleExpand(item.id)}
              />
            ) : (
              <span className="text-[13px] font-semibold text-slate-700 tabular-nums">
                {reorderPoint ?? "—"}
              </span>
            )}
          </td>

          {/* Storage Location */}
          <td className="px-4 py-4">
            {(() => {
              const sl = (item as any).storage_location_infos || (datas as any).storage_location_infos;
              let displayText = "—";
              if (sl && typeof sl === 'object' && Object.keys(sl).length > 0) {
                displayText = sl.name || sl.storage_location || sl.location || "—";
              } else if ((item as any).storage_location || (datas as any).storage_location) {
                displayText = (item as any).storage_location || (datas as any).storage_location;
              }
              return (
                <span className="text-[12px] font-medium text-slate-700">
                  {displayText}
                </span>
              );
            })()}
          </td>

          {/* Updated */}
          <td className="px-4 py-4 text-right">
            <span className="text-[11px] text-slate-400 font-medium tabular-nums">
              {formatDate(item.date || (item as any).updated_at)}
            </span>
          </td>

          {/* Actions */}
          <td className="px-4 py-4 text-right whitespace-nowrap sticky right-0 bg-white group-hover:bg-slate-50 border-l border-slate-200 z-10 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.08)] transition-colors" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-end gap-2 relative">
              <button
                onClick={() => navigate(`/product/${item.id}`)}
                className="text-emerald-500 hover:text-emerald-600 transition-colors p-1"
                title="View Product"
              >
                <Eye size={15} />
              </button>
              <button
                onClick={() => navigate(`/product/${item.id}/edit`)}
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
                  width={160}
                >
                  <ActionMenuItem icon={<RefreshCw size={13} />} onClick={() => { setIsMenuOpen(false); navigate(`/stock-adjustment`, { state: { product: item } }); }}>
                    Adjust Stock
                  </ActionMenuItem>
                  <ActionMenuItem icon={<History size={13} />} onClick={() => { setIsMenuOpen(false); navigate(`/stock-movement`, { state: { product: item } }); }}>
                    Stock Movements
                  </ActionMenuItem>
                  <ActionMenuItem icon={<Plus size={13} />} onClick={() => {
                    setIsMenuOpen(false);
                    if (hasVariants) {
                      setShowVariantModal(true);
                    } else {
                      navigate(`/purchase/add`, { state: { product: item } });
                    }
                  }}>
                    Add Purchase
                  </ActionMenuItem>
                </ActionMenu>
              </div>
            </div>
          </td>
        </tr>

        {/* Expanded row */}
        {isExpanded && isExpandable && (
          <tr className="bg-slate-50/40">
            <td colSpan={14} className="px-0 py-0">
              <div className="ml-8 mr-3 my-2 space-y-2 border-l-2 border-slate-200 pl-4">



                {/* Serial numbers */}
                {!hasVariants && !hasBatches && hasSerials && (
                  <div className="bg-white border border-slate-100 rounded-lg p-3">
                    <p className="text-[10px] font-semibold text-slate-400 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                      <Hash size={10} className="text-slate-400" />
                      Serial numbers
                    </p>
                    <SerialBadgeList
                      serials={serials}
                    />
                  </div>
                )}

                {/* Variants / Batches */}
                <div className="animate-in fade-in duration-300">
                  {hasVariants && (
                    <VariantRows
                      combinations={combinations}
                      baseSellPrice={item.sell_price}
                      baseBuyPrice={item.buy_price}
                      parentGst={item.gst ?? (datas as any).gst}
                      parentStorageLocation={(item as any).storage_location_infos?.storage_location ?? (item as any).storage_location_infos?.name ?? (item as any).storage_location ?? (item as any).location ?? (datas as any).storage_location ?? null}
                      parentReorderPoint={(item as any).reorder_point_infos?.reorder_point ?? (item as any).reorder_point ?? datas.reorder_point ?? null}
                      parentMrp={(datas as any).mrp || (item as any).mrp || (item as any).additional_infos?.mrp}
                      parentDiscountPercent={(datas as any).discount_percent || (item as any).discount_percent || (item as any).additional_infos?.discount_percent || 0}
                      parentHsn={(item as any).hsn_code || (datas as any).hsn_code || (item as any).hsn || (datas as any).hsn}
                    />
                  )}
                  {!hasVariants && hasBatches && (
                    <BatchCards 
                      batches={batches} 
                      parentGst={item.gst ?? (datas as any).gst}
                      parentBuyPrice={item.buy_price}
                      parentSellPrice={item.sell_price}
                    />
                  )}
                </div>
              </div>
            </td>
          </tr>
        )}

        <Modal
          show={showVariantModal}
          onClose={() => setShowVariantModal(false)}
          title={`Select Variant for ${productName}`}
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
                      ...item,
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
      </Fragment>
    );
  }
);

const InventoryPage = () => {
  const { getData, deleteData, error, clearError } = useApi();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const isCleanMode = new URLSearchParams(location.search).get("mode") === "clean";
  const { setActions, setBottomActions } = useHeader();

  const handleOpenNewTab = () => {
    window.open(`${window.location.pathname}?mode=clean`, "_blank", "noopener,noreferrer");
  };

  const [refreshKey, setRefreshKey] = useState(0);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isStockImportCompleted, setIsStockImportCompleted] = useState<boolean>(() => {
    return localStorage.getItem(`stock_import_completed_${SHOP_ID}`) === "true";
  });

  useEffect(() => {
    // Check DB-level initial stock import completion
    shopApi.getShopById(SHOP_ID).then((res: any) => {
      const shopData = res?.data || res;
      const isImported = Boolean(
        shopData?.initial_stock_imported ||
        shopData?.additional_infos?.initial_stock_imported ||
        shopData?.datas?.initial_stock_imported
      );
      if (isImported) {
        setIsStockImportCompleted(true);
        localStorage.setItem(`stock_import_completed_${SHOP_ID}`, "true");
      }
    }).catch(err => {
      console.error("Failed to fetch shop import status:", err);
    });
  }, [refreshKey]);

  useEffect(() => {
    setActions(
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('clear-api-cache'));
            setRefreshKey(prev => prev + 1);
          }}
          className="h-8 w-8 flex items-center justify-center rounded-md border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 active:scale-95 transition-all shadow-sm shrink-0"
          title="Refresh"
        >
          <RefreshCw size={13} />
        </button>
        {!isCleanMode && (
          <button
            onClick={handleOpenNewTab}
            className="h-8 w-8 flex items-center justify-center rounded-md border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 active:scale-95 transition-all shadow-sm shrink-0"
            title="Open in New Tab"
          >
            <ExternalLink size={13} />
          </button>
        )}
        {!isStockImportCompleted && (
          <button
            onClick={() => setIsImportOpen(true)}
            className="h-8 px-3 rounded-md border border-slate-200 text-slate-600 font-medium text-[12px] bg-white hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <FileUp size={13} />
            Import
          </button>
        )}
      </div>
    );
    return () => setActions(null);
  }, [setActions, isCleanMode, setRefreshKey, isStockImportCompleted]);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    getData(`${ENDPOINTS.INVENTORIES}/by/shop/${SHOP_ID}`, {
      active: "true",
      limit: "100",
      offset: "1",
      exclude_non_tracking: "true"
    }).then((res) => {
      if (res && res.data) {
        const itemsRaw: any[] = Array.isArray(res.data) ? res.data : (res.data.inventories || res.data.datas || []);
        const available = itemsRaw.length;
        let low = 0;
        let outOfStock = 0;
        itemsRaw.forEach((p: InventoryItem) => {
          const analysis = analyzeProductStock(p);
          if (analysis.hasOutOfStock) outOfStock++;
          if (analysis.hasLowStock) low++;
        });
        setSummaryStats({ available, low, outOfStock });
      }
    }).catch(() => {});
  }, [getData, refreshKey]);

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [stockStatus, setStockStatus] = useState<string>("");
  const [summaryStats, setSummaryStats] = useState<{ available: number; low: number; outOfStock: number }>({
    available: 0,
    low: 0,
    outOfStock: 0,
  });
  const [filtersState, setFiltersState] = useState({
    category: "All",
    brand: "All",
    type: "All",
    visibility: "All"
  });

  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };




  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete these ${selectedItems.size} products?`)) return;
    try {
      for (const id of Array.from(selectedItems)) {
        await deleteData(`${ENDPOINTS.INVENTORIES}/${SHOP_ID}/${id}`);
      }
      showToast("Selected products deleted successfully", "success");
      setSelectedItems(new Set());
      setRefreshKey((prev: number) => prev + 1);
    } catch (e: any) {
      showToast(e?.message || "Failed to delete some products", "error");
    }
  };

  useEffect(() => {
    if (selectedItems.size > 1) {
      setBottomActions(
        <div className="flex items-center justify-between w-full animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-blue-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">
              <Package size={14} />
            </div>
            <div>
              <p className="text-[12px] font-bold text-slate-800 leading-tight">Selected {selectedItems.size} Products</p>
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
              onClick={() => navigate(`/purchase/add`)}
              className="h-8 px-3 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[11px] transition-colors"
            >
              Add Purchase
            </button>
            <button
              onClick={handleBulkDelete}
              className="h-8 px-3 rounded-md border border-red-200 bg-red-50 hover:bg-red-100 text-red-650 font-bold text-[11px] transition-colors flex items-center gap-1.5"
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
  }, [selectedItems, setBottomActions, navigate]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (fromDate) count++;
    if (toDate) count++;
    if (stockStatus) count++;
    if (filtersState.category !== "All") count++;
    if (filtersState.brand !== "All") count++;
    if (filtersState.type !== "All") count++;
    if (filtersState.visibility !== "All") count++;
    return count;
  }, [fromDate, toDate, stockStatus, filtersState]);

  const resetFilters = () => {
    setFromDate("");
    setToDate("");
    setSearchQuery("");
    setStockStatus("");
    setFiltersState({
      category: "All",
      brand: "All",
      type: "All",
      visibility: "All"
    });
  };

  const fetchPage = useCallback(async (limit: number, offset: number, filters: any) => {
    const params: any = {
      active: "true",
      limit: limit.toString(),
      offset: offset.toString(),
      exclude_non_tracking: "true"
    };
    if (filters.search) params.q = filters.search;
    if (filters.fromDate) params.from_date = filters.fromDate;
    if (filters.toDate) params.to_date = filters.toDate;
    if (filters.stockStatus && filters.stockStatus !== "available") {
      if (filters.stockStatus === "low") {
        params.stock_status = "low";
        params.exclude_outofstock = "true";
        params.exclude_stock = "true";
      } else if (filters.stockStatus === "out_of_stock") {
        params.stock_status = "out_of_stock";
        params.exclude_lowstock = "true";
        params.exclude_stock = "true";
      }
    }

    const res = await getData(`${ENDPOINTS.INVENTORIES}/by/shop/${SHOP_ID}`, params);

    let itemsRaw: any[] = [];
    let fetchedStats = null;
    let total = 0;

    if (res && res.data) {
      itemsRaw = Array.isArray(res.data) ? res.data : (res.data.inventories || res.data.datas || []);
      if (res.data.overall_stats) {
        fetchedStats = res.data.overall_stats;
      } else if (res.datas?.overall_stats) {
        fetchedStats = res.datas.overall_stats;
      }
      total = res.data.total_count || 0;
    }

    return {
      items: itemsRaw,
      hasMore: itemsRaw.length === limit,
      stats: fetchedStats,
      total
    };
  }, [getData]);

  const filters = useMemo(() => ({
    search: debouncedSearch,
    fromDate,
    toDate,
    stockStatus,
    refreshKey
  }), [debouncedSearch, fromDate, toDate, stockStatus, refreshKey]);

  const { items: inventory, loading, loadingMore, totalCount, lastElementRef } = useInfiniteScroll({
    fetchPage,
    filters,
    limit: 50
  });

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    (inventory || []).forEach((item: any) => {
      const cat = item.category_infos?.name || item.datas?.category || item.category;
      if (cat && typeof cat === 'string') set.add(cat.trim());
    });
    return Array.from(set).sort();
  }, [inventory]);

  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    (inventory || []).forEach((item: any) => {
      const b = item.brand || item.datas?.brand;
      if (b && typeof b === 'string') set.add(b.trim());
    });
    return Array.from(set).sort();
  }, [inventory]);

  const filteredInventory = useMemo(() => {
    let result = inventory as InventoryItem[];

    if (filtersState.category !== "All") {
      result = result.filter((item: any) => {
        const cat = item.category_infos?.name || item.datas?.category || item.category;
        return cat === filtersState.category;
      });
    }

    if (filtersState.brand !== "All") {
      result = result.filter((item: any) => {
        const brand = item.brand || item.datas?.brand;
        return brand === filtersState.brand;
      });
    }

    if (filtersState.type !== "All") {
      result = result.filter((item: any) => {
        const hasVariant = item.type_infos?.has_variant || item.has_variant;
        const hasBatch = item.type_infos?.has_batch || item.has_batch;
        const hasSerial = item.type_infos?.has_serialno || item.has_serialno;
        const isSimple = !hasVariant && !hasBatch && !hasSerial;

        if (filtersState.type === "Simple") return isSimple;
        if (filtersState.type === "Variants") return hasVariant;
        if (filtersState.type === "Batches") return hasBatch;
        if (filtersState.type === "Serials") return hasSerial;
        return true;
      });
    }

    if (filtersState.visibility !== "All") {
      result = result.filter((item: any) => {
        const isOnline = item.visible_online === true;
        if (filtersState.visibility === "Online") return isOnline;
        if (filtersState.visibility === "Offline") return !isOnline;
        return true;
      });
    }

    if (stockStatus) {
      if (stockStatus === "out_of_stock") {
        result = result.filter((item: any) => analyzeProductStock(item).hasOutOfStock);
      } else if (stockStatus === "low") {
        result = result.filter((item: any) => analyzeProductStock(item).hasLowStock);
      } else if (stockStatus === "available") {
        result = result.filter((item: any) => analyzeProductStock(item).hasInStock);
      }
    }

    return result;
  }, [inventory, filtersState, stockStatus]);





  const toggleExpand = useCallback((id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  if (loading && inventory.length === 0 && !searchQuery) {
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
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none mt-2">
          <StatCard
            icon={Package}
            label="Available Stock"
            value={summaryStats.available.toString()}
            subValue="All stocked products"
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            onClick={() => setStockStatus(prev => prev === "available" ? "" : "available")}
            className={stockStatus === "available" ? "ring-2 ring-blue-400 border-transparent shadow-sm" : ""}
          />
          <StatCard
            icon={AlertTriangle}
            label="Low Stock"
            value={summaryStats.low.toString()}
            subValue="Low stock only"
            iconBg="bg-amber-50"
            iconColor="text-amber-500"
            onClick={() => setStockStatus(prev => prev === "low" ? "" : "low")}
            className={stockStatus === "low" ? "ring-2 ring-amber-400 border-transparent shadow-sm" : ""}
          />
          <StatCard
            icon={AlertCircle}
            label="Out of Stock"
            value={summaryStats.outOfStock.toString()}
            subValue="Zero stock only"
            iconBg="bg-red-50"
            iconColor="text-red-500"
            onClick={() => setStockStatus(prev => prev === "out_of_stock" ? "" : "out_of_stock")}
            className={stockStatus === "out_of_stock" ? "ring-2 ring-red-400 border-transparent shadow-sm" : ""}
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
      <div className="bg-white border border-slate-100 rounded-lg p-2.5 px-3.5 flex flex-wrap items-center gap-2 shadow-sm mt-2">
        <div className="relative w-80 shrink-0">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search by name, barcode, category…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-[12px] font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-md placeholder:text-slate-400 focus:outline-none focus:border-slate-300 focus:bg-white transition-colors"
          />
        </div>
        <button
          onClick={() => setIsFilterOpen(true)}
          className={`h-8 px-3 rounded-md border text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm shrink-0 ${activeFiltersCount > 0 ? "border-blue-200 text-blue-600 bg-blue-50/50" : "border-slate-200 text-slate-650 bg-white hover:bg-slate-50"}`}
        >
          <Filter size={13} />
          Filters
          {activeFiltersCount > 0 && <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white rounded-full text-[9px] font-black">{activeFiltersCount}</span>}
        </button>

        {searchQuery && (
          <span className="text-[11px] text-slate-400 font-medium ml-1 shrink-0">
            {filteredInventory.length} result
            {filteredInventory.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <RightSidebarFilter
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={() => setIsFilterOpen(false)}
        onClear={resetFilters}
        title="Inventory Filters"
      >
        <div className="space-y-4">
          {/* Date Range */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Date Range</label>
            <div className="flex items-center gap-2">
              <div className="space-y-1 flex-1">
                <span className="text-[10px] text-slate-400 font-medium">From</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-750 focus:outline-none focus:border-slate-300 focus:bg-white transition-colors"
                />
              </div>
              <div className="space-y-1 flex-1">
                <span className="text-[10px] text-slate-400 font-medium">To</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-750 focus:outline-none focus:border-slate-300 focus:bg-white transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Stock Status */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stock Status</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "All", value: "" },
                { label: "Low Stock", value: "low" },
                { label: "Out of Stock", value: "out_of_stock" }
              ].map(opt => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setStockStatus(opt.value)}
                  className={`h-9 px-2 rounded-md text-xs font-semibold border transition-all ${stockStatus === opt.value ? "border-blue-600 bg-blue-50 text-blue-700 font-bold" : "border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Type */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Product Type</label>
            <div className="grid grid-cols-3 gap-1.5">
              {["All", "Simple", "Variants", "Batches", "Serials"].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFiltersState(prev => ({ ...prev, type }))}
                  className={`h-8 px-2 rounded-md text-xs font-semibold border transition-all ${filtersState.type === type ? "border-blue-600 bg-blue-50 text-blue-700 font-bold" : "border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100"}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
            <ReusableSelect
              value={filtersState.category}
              onValueChange={val => setFiltersState(prev => ({ ...prev, category: val }))}
              options={[
                { label: "All Categories", value: "All" },
                ...availableCategories.map(cat => ({ label: cat, value: cat }))
              ]}
              placeholder="All Categories"
              className="h-9 py-2 px-3 text-xs bg-slate-50 border-slate-200 rounded-lg font-semibold text-slate-750 hover:bg-white focus:bg-white shadow-none transition-colors"
            />
          </div>

          {/* Brand */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Brand</label>
            <ReusableSelect
              value={filtersState.brand}
              onValueChange={val => setFiltersState(prev => ({ ...prev, brand: val }))}
              options={[
                { label: "All Brands", value: "All" },
                ...availableBrands.map(b => ({ label: b, value: b }))
              ]}
              placeholder="All Brands"
              className="h-9 py-2 px-3 text-xs bg-slate-50 border-slate-200 rounded-lg font-semibold text-slate-750 hover:bg-white focus:bg-white shadow-none transition-colors"
            />
          </div>

          {/* Store Visibility */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Store Visibility</label>
            <div className="grid grid-cols-3 gap-2">
              {["All", "Online", "Offline"].map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setFiltersState(prev => ({ ...prev, visibility: v }))}
                  className={`h-9 px-2 rounded-md text-xs font-semibold border transition-all ${filtersState.visibility === v ? "border-blue-600 bg-blue-50 text-blue-700 font-bold" : "border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100"}`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>
      </RightSidebarFilter>

      {/* Main table card */}
      <div className="bg-white border border-slate-100 rounded-lg shadow-sm min-w-0 overflow-hidden flex flex-col flex-1 min-h-0 mt-2">

        {/* Table */}
        {inventory.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
              <Package size={22} className="text-slate-300" />
            </div>
            <div className="text-center">
              <p className="text-[13px] font-semibold text-slate-600">
                No inventory records
              </p>
              <p className="text-[11px] text-slate-400 font-medium mt-1 max-w-[200px] leading-relaxed">
                Add products to your catalog to start tracking stock.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto flex-1">
            <table className="w-full text-left border-collapse whitespace-nowrap text-sm">

              {/* Sticky header */}
              <thead className="sticky top-0 z-20 bg-white shadow-[0_1px_0_0_#e2e8f0]">
                <tr>
                  <th className="px-4 py-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={filteredInventory.length > 0 && filteredInventory.every(item => selectedItems.has(item.id))}
                      onChange={() => {
                        const allSelected = filteredInventory.length > 0 && filteredInventory.every(item => selectedItems.has(item.id));
                        if (allSelected) {
                          setSelectedItems(new Set());
                        } else {
                          setSelectedItems(new Set(filteredInventory.map(item => item.id)));
                        }
                      }}
                      className="rounded border-slate-350 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3 w-10" />
                  <th className="px-4 py-3 w-40 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Product ID
                  </th>
                  <th className="px-4 py-3 min-w-[280px] text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Barcode
                  </th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-right">
                    Sell Price
                  </th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-right">
                    Stock
                  </th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center">
                    Reorder Point
                  </th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-right">
                    Last Updated
                  </th>
                  <th className="px-4 py-3 w-24 text-right text-[10px] font-semibold text-slate-500 uppercase tracking-wider sticky right-0 bg-white shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.08)]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredInventory.map((item: InventoryItem, index) => (
                  <ProductRow
                    key={item.id}
                    item={item}
                    isSelected={selectedItems.has(item.id)}
                    onSelect={(prod) => toggleSelectItem(prod.id)}
                    isExpanded={expandedRows.has(item.id)}
                    toggleExpand={toggleExpand}
                    innerRef={index === filteredInventory.length - 1 ? lastElementRef : null}
                  />
                ))}
              </tbody>
            </table>
            {loadingMore && <div className="py-4 text-center text-xs text-slate-500">Loading more...</div>}

            {/* Empty search result */}
            {filteredInventory.length === 0 && searchQuery && (
              <div className="py-16 flex flex-col items-center gap-2 text-center">
                <Search size={18} className="text-slate-300" />
                <p className="text-[12px] font-medium text-slate-400">
                  No results for{" "}
                  <span className="text-slate-600">"{searchQuery}"</span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer row count */}
        {!loading && inventory.length > 0 && (
          <div className="border-t border-slate-50 px-4 py-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">
              {inventory.length} {totalCount > 0 ? `of ${totalCount}` : ''} item
              {inventory.length !== 1 ? "s" : ""}
            </span>
            <span className="text-[11px] text-slate-300 font-medium">
              {expandedRows.size > 0 && `${expandedRows.size} expanded`}
            </span>
          </div>
        )}
      </div>

      {/* ── Excel Import Modal ── */}
      <ExcelImportModal
        open={isImportOpen && !isStockImportCompleted}
        onClose={() => setIsImportOpen(false)}
        onSuccess={() => { setIsImportOpen(false); setRefreshKey((prev: number) => prev + 1); }}
        entityType="inventory"
        onCompleteStockImport={() => {
          setIsStockImportCompleted(true);
          setIsImportOpen(false);
          showToast("All stocks marked as imported successfully. Stock import option has been removed.", "success");
        }}
      />
    </div>
  );
};

export default InventoryPage;
