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
import { VariantRows, BatchCards, SerialBadgeList } from "../components/StockTree";
import { Modal } from "@/components/common/SuperUI";
import { useApi } from "@/context/ApiContext";
import { useHeader } from "@/context/HeaderContext";
import { useToast } from "@/context/ToastContext";
import { ENDPOINTS, SHOP_ID } from "@/services/endpoints";
import SkeletonLoader from "@/components/common/SkeletonLoader";
import { StatCard } from "@/components/common/StatsCard";
import { useNavigate, useLocation } from "react-router-dom";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { RightSidebarFilter } from "@/components/common/RightSidebarFilter";
import { ReusableSelect } from "@/components/ui/ReusableSelect";
import { AntBadge } from "@/components/ui/AntBadge";
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

const calculateProductStock = (item: any) => {
  const datas = item.datas || {};
  const parseDataLocal = (val: any) => {
    if (Array.isArray(val)) return val;
    if (val && typeof val === "object") {
      if (Array.isArray(val.serial_numbers)) return val.serial_numbers;
      return Object.values(val);
    }
    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val);
        if (parsed && typeof parsed === "object" && Array.isArray(parsed.serial_numbers)) return parsed.serial_numbers;
        return parsed;
      } catch (e) {
        return [];
      }
    }
    return [];
  };

  const combinations = (() => {
    const raw = parseDataLocal(item.variants || item.variant_infos || datas.combinations || datas.variants);
    return raw.filter((v: any) => v && v.id !== null);
  })();

  const batches = (() => {
    let raw: any[] = [];
    if (
      !(datas.has_variants || datas.has_varients || item.variants?.length || item.variant_infos?.length) &&
      ((item.variants?.length ?? 0) > 0 || (item.variant_infos?.length ?? 0) > 0)
    ) {
      const firstVar = item.variants?.[0] || item.variant_infos?.[0];
      raw = parseDataLocal(firstVar?.batches || firstVar?.batch_infos);
    } else {
      raw = parseDataLocal(item.batches || item.batch_infos || datas.batches);
    }
    return raw.filter((b: any) => b && b.id !== null);
  })();

  const hasVariants =
    (datas.has_variants ||
      datas.has_varients ||
      item.has_variant ||
      item.type_infos?.has_variant) &&
    combinations.length > 0;
  const hasBatches = batches.length > 0 || item.has_batch || item.type_infos?.has_batch;

  const calculateVariantStock = (comb: any) => {
    const vBatches = comb.batch_infos ?? comb.batches ?? [];
    const vHasBatches = vBatches.length > 0;
    let vStock = Number(comb.stock_infos?.available_stocks ?? comb.stock_infos?.physical_stocks ?? comb.stocks ?? comb.stock ?? comb.datas?.stocks ?? comb.datas?.datas?.stocks ?? 0);
    if (vHasBatches && vStock === 0) {
      vStock = vBatches.reduce((acc: number, b: any) => acc + Number(b.stock_infos?.available_stocks ?? b.stock_infos?.physical_stocks ?? b.stocks ?? 0), 0);
    }
    return vStock;
  };

  let stockNumber = Number(item.stock_infos?.available_stocks ?? item.stock_infos?.physical_stocks ?? item.stocks ?? item.quantity ?? 0);
  if (hasVariants) {
    stockNumber = combinations.reduce((acc: number, comb: any) => acc + calculateVariantStock(comb), 0);
  } else if (hasBatches && stockNumber === 0) {
    stockNumber = batches.reduce((acc, b) => {
      const bStock = Number(b.stock_infos?.available_stocks ?? b.stock_infos?.physical_stocks ?? b.stocks ?? 0);
      return acc + bStock;
    }, 0);
  }
  return stockNumber;
};

const getStockStatus = (stock: number, reorderPoint?: number) => {
  const s = Number(stock) || 0;
  const rp = Number(reorderPoint) || 10;
  if (s <= 0)
    return {
      label: "Out of stock",
      variant: "stk-out-of-stock",
      icon: AlertCircle,
    };
  if (s <= rp)
    return {
      label: "Low stock",
      variant: "stk-low-stock",
      icon: AlertTriangle,
    };
  return {
    label: "In stock",
    variant: "stk-in-stock",
    icon: Package,
  };
};

const formatCurrency = (amount?: number | string) => {
  if (amount === undefined || amount === null) return "—";
  return `₹${Number(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const parseData = (val: any) => {
  if (!val) return [];
  const getNames = (arr: any[]): string[] => {
    return arr.map((v: any) => typeof v === 'object' && v !== null ? v.name || v.serial || "" : String(v)).filter(Boolean);
  };
  if (Array.isArray(val)) return getNames(val);
  if (val && typeof val === "object") {
    if (Array.isArray(val.serial_numbers)) return getNames(val.serial_numbers);
    if (Array.isArray(val.serialno_infos)) return getNames(val.serialno_infos);
    return Object.values(val);
  }
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (
        parsed &&
        typeof parsed === "object" &&
        Array.isArray(parsed.serial_numbers)
      )
        return getNames(parsed.serial_numbers);
      if (
        parsed &&
        typeof parsed === "object" &&
        Array.isArray(parsed.serialno_infos)
      )
        return getNames(parsed.serialno_infos);
      return Array.isArray(parsed) ? getNames(parsed) : parsed;
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
      className={`inline-flex items-center justify-center p-0.5 rounded transition-all duration-205 ${
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
      const raw = parseData(
        item.variants || (item as any).variant_infos || datas.combinations || datas.variants
      );
      return raw.filter((v: any) => v && v.id !== null);
    }, [item.variants, (item as any).variant_infos, datas.combinations, datas.variants]);

    const batches = useMemo(() => {
      let raw: any[] = [];
      if (
        !(datas.has_variants || datas.has_varients || item.variants?.length || (item as any).variant_infos?.length) &&
        ((item.variants?.length ?? 0) > 0 || ((item as any).variant_infos?.length ?? 0) > 0)
      ) {
        const firstVar = item.variants?.[0] || (item as any).variant_infos?.[0];
        raw = parseData(firstVar?.batches || firstVar?.batch_infos);
      } else {
        raw = parseData(item.batches || (item as any).batch_infos || datas.batches);
      }
      return raw.filter((b: any) => b && b.id !== null);
    }, [
      item.variants,
      (item as any).variant_infos,
      item.batches,
      (item as any).batch_infos,
      datas.batches,
      datas.has_variants,
      datas.has_varients,
    ]);

    const serials = parseData(
      datas.serial_numbers || item.serial_numbers || item.serial_number || (item as any).serialno_infos
    );

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
    const status = getStockStatus(stockNumber, reorderPoint);


    const { totalSerials, totalBatches } = useMemo(() => {
      let ts = serials.length;
      let tb = batches.length;
      if (hasVariants) {
        combinations.forEach((c: any) => {
          const cDatas = c.datas || {};
          const cSerials = parseData(
            cDatas.serial_numbers ||
              c.serial_numbers ||
              (cDatas.datas && cDatas.datas.serial_numbers)
          );
          ts += cSerials.length;
          const cBatches = parseData(c.batches);
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
          className={`group border-b border-slate-200 transition-colors cursor-pointer ${
            isSelected ? "bg-blue-50 border-l-2 border-l-blue-500" : isExpanded ? "bg-slate-50/70" : "hover:bg-slate-50/60"
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
                    className={`mt-1 flex items-center gap-2 w-fit px-2 py-1.5 rounded-xl border transition-all ${
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
            <span className="text-[13px] font-semibold text-slate-700 tabular-nums">
              {hasVariants ? "—" : formatCurrency(sellPrice)}
            </span>
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
            <span className="text-[13px] font-semibold text-slate-700 tabular-nums">
              {hasVariants ? "—" : (reorderPoint ?? "—")}
            </span>
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
                      parentStorageLocation={(item as any).storage_location_infos?.storage_location ?? (item as any).storage_location_infos?.name ?? (item as any).storage_location ?? (item as any).location ?? (datas as any).storage_location ?? null}
                      parentReorderPoint={(item as any).reorder_point_infos?.reorder_point ?? (item as any).reorder_point ?? datas.reorder_point ?? null}
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

  const [isImportOpen, setIsImportOpen] = useState(false);

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
          onClick={() => setIsImportOpen(true)}
          className="h-8 px-3 rounded-md border border-slate-200 text-slate-600 font-medium text-[12px] bg-white hover:bg-slate-50 transition-colors flex items-center gap-1.5"
        >
          <FileUp size={13} />
          Import
        </button>
      </div>
    );
    return () => setActions(null);
  }, [setActions, isCleanMode]);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);
  const [stockStatus, setStockStatus] = useState<string>("");
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
    } catch {
      showToast("Failed to delete some products", "error");
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
  
  const activeFiltersCount = [
    fromDate, 
    toDate, 
    stockStatus,
    Object.values(filtersState).some(v => v !== "All") ? "true" : ""
  ].filter(Boolean).length;
  
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
      is_active: "true",
      limit: limit.toString(),
      offset: offset.toString()
    };
    if (filters.search) params.q = filters.search;
    if (filters.fromDate) params.from_date = filters.fromDate;
    if (filters.toDate) params.to_date = filters.toDate;
    if (filters.stockStatus) params.stock_status = filters.stockStatus;

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

  const { items: inventory, loading, loadingMore, stats: overallStats, totalCount, lastElementRef } = useInfiniteScroll({
    fetchPage,
    filters,
    limit: 50
  });
  
  const categories = useMemo(() => {
    const s = new Set(inventory.map((item: any) => item.category_infos?.name || item.datas?.category || item.category).filter(Boolean));
    return ["All", ...Array.from(s)];
  }, [inventory]);

  const brands = useMemo(() => {
    const s = new Set(inventory.map((item: any) => item.brand || item.datas?.brand).filter(Boolean));
    return ["All", ...Array.from(s)];
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

    return result;
  }, [inventory, filtersState]);



  const stats = useMemo(() => {
    const total = filteredInventory.length;
    const lowStock = filteredInventory.filter((p: InventoryItem) => {
      const stock = calculateProductStock(p);
      const rp = Number(
        (p as any).reorder_point_infos?.reorder_point ?? (p as any).reorder_point ?? p.datas?.reorder_point ?? 10
      );
      return stock <= rp;
    }).length;
    const categories = new Set(
      inventory.map((i) => i.datas?.category || i.category)
    ).size;
    const barcodes = inventory.reduce(
      (acc, curr) => acc + (curr.variants?.length || 1),
      0
    );
    return { total, lowStock, categories, barcodes };
  }, [filteredInventory, inventory]);

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
            value={(analyticsStats?.overview?.inventory?.total_active_products ?? Math.max(Number(overallStats?.total_product_count || 0), stats.total)).toString()}
            subValue="All stocked products"
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            onClick={() => setStockStatus(prev => prev === "available" ? "" : "available")}
            className={stockStatus === "available" ? "ring-2 ring-blue-400 border-transparent shadow-sm" : ""}
          />
          <StatCard
            icon={AlertTriangle}
            label="Low Stock"
            value={(analyticsStats?.overview?.inventory?.total_low_stocks ?? overallStats?.low_stocks_count ?? stats.lowStock).toString()}
            subValue="Low stock only"
            iconBg="bg-amber-50"
            iconColor="text-amber-500"
            onClick={() => setStockStatus(prev => prev === "low" ? "" : "low")}
            className={stockStatus === "low" ? "ring-2 ring-amber-400 border-transparent shadow-sm" : ""}
          />
          <StatCard
            icon={AlertCircle}
            label="Out of Stock"
            value={(analyticsStats?.overview?.inventory?.total_no_stocks ?? overallStats?.no_stocks_count ?? inventory.filter((p: InventoryItem) => calculateProductStock(p) === 0).length).toString()}
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
          {activeFiltersCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
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
        onApply={() => {}}
        onClear={resetFilters}
        title="Inventory Filters"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="space-y-1.5 flex-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-750 focus:outline-none focus:border-slate-300 focus:bg-white transition-colors"
              />
            </div>
            <div className="space-y-1.5 flex-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">To</label>
              <input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-750 focus:outline-none focus:border-slate-300 focus:bg-white transition-colors"
              />
            </div>
          </div>
          
          <div className="space-y-1.5 pt-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stock Status</label>
            <div className="flex gap-2">
              <button 
                onClick={() => setStockStatus("")}
                className={`flex-1 h-9 rounded-md text-xs font-semibold border transition-all ${stockStatus === "" ? "border-slate-800 bg-slate-800 text-white" : "border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100"}`}
              >
                All
              </button>
              <button 
                onClick={() => setStockStatus("low")}
                className={`flex-1 h-9 rounded-md text-xs font-semibold border transition-all ${stockStatus === "low" ? "border-amber-500 bg-amber-50 text-amber-700" : "border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100"}`}
              >
                Low Stock
              </button>
              <button 
                onClick={() => setStockStatus("out_of_stock")}
                className={`flex-1 h-9 rounded-md text-xs font-semibold border transition-all ${stockStatus === "out_of_stock" ? "border-red-500 bg-red-50 text-red-700" : "border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100"}`}
              >
                Out of Stock
              </button>
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
            <ReusableSelect
              value={filtersState.category}
              onValueChange={(val: string) => setFiltersState(prev => ({ ...prev, category: val }))}
              options={categories.map(c => ({ label: String(c), value: String(c) }))}
              placeholder="Select Category"
            />
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Brand</label>
            <ReusableSelect
              value={filtersState.brand}
              onValueChange={(val: string) => setFiltersState(prev => ({ ...prev, brand: val }))}
              options={brands.map(b => ({ label: String(b), value: String(b) }))}
              placeholder="Select Brand"
            />
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Product Type</label>
            <ReusableSelect
              value={filtersState.type}
              onValueChange={(val: string) => setFiltersState(prev => ({ ...prev, type: val }))}
              options={[
                { label: "All", value: "All" },
                { label: "Simple Product", value: "Simple" },
                { label: "With Variants", value: "Variants" },
                { label: "With Batches", value: "Batches" },
                { label: "With Serials", value: "Serials" }
              ]}
              placeholder="Product Type"
            />
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Visibility</label>
            <div className="flex gap-2">
              <button 
                onClick={() => setFiltersState(prev => ({ ...prev, visibility: "All" }))}
                className={`flex-1 h-9 rounded-md text-xs font-semibold border transition-all ${filtersState.visibility === "All" ? "border-slate-800 bg-slate-800 text-white" : "border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100"}`}
              >
                All
              </button>
              <button 
                onClick={() => setFiltersState(prev => ({ ...prev, visibility: "Online" }))}
                className={`flex-1 h-9 rounded-md text-xs font-semibold border transition-all ${filtersState.visibility === "Online" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100"}`}
              >
                Online
              </button>
              <button 
                onClick={() => setFiltersState(prev => ({ ...prev, visibility: "Offline" }))}
                className={`flex-1 h-9 rounded-md text-xs font-semibold border transition-all ${filtersState.visibility === "Offline" ? "border-slate-400 bg-slate-100 text-slate-700" : "border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100"}`}
              >
                Offline
              </button>
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
        open={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={() => { setIsImportOpen(false); setRefreshKey((prev: number) => prev + 1); }}
        entityType="inventory"
      />
    </div>
  );
};

export default InventoryPage;
