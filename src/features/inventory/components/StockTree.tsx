import React, { useState, Fragment } from "react";
import {
  Layers,
  Tag,
  Clock,
  ChevronRight,
  ChevronDown,
  Hash,
  Package,
  Copy,
  Check,
  AlertCircle,
  AlertTriangle
} from "lucide-react";
import { AntBadge } from "@/components/ui/AntBadge";
import { isShopGstRegistered, calculateTaxSplit } from "@/utils/pricing";


/* ─── Helpers ────────────────────────────────────────────────────────────── */
const formatCurrency = (amount?: number | string) => {
  if (amount === undefined || amount === null) return '—';
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
};

export const parseDateOnly = (dateVal: any): { year: number; month: number; day: number } | null => {
  if (!dateVal) return null;
  if (dateVal instanceof Date) {
    if (isNaN(dateVal.getTime())) return null;
    return { year: dateVal.getFullYear(), month: dateVal.getMonth(), day: dateVal.getDate() };
  }
  const str = String(dateVal).trim();
  if (!str) return null;

  // 1. Check for YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
  const ymd = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymd) {
    const year = parseInt(ymd[1], 10);
    const month = parseInt(ymd[2], 10) - 1; // 0-based
    const day = parseInt(ymd[3], 10);
    return { year, month, day };
  }

  // 2. Check for DD-MM-YYYY or DD/MM/YYYY
  const dmy = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmy) {
    const day = parseInt(dmy[1], 10);
    const month = parseInt(dmy[2], 10) - 1; // 0-based
    const year = parseInt(dmy[3], 10);
    return { year, month, day };
  }

  // 3. Fallback: standard new Date(str)
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
  }
  return null;
};

export const calculateDaysToExpiry = (dateVal: any): number | null => {
  const parsed = parseDateOnly(dateVal);
  if (!parsed) return null;

  // Batch expiry date at local midnight (user's system timezone)
  const expMidnight = new Date(parsed.year, parsed.month, parsed.day, 0, 0, 0, 0);

  // User system current date at local midnight (user's system timezone)
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  const diffMs = expMidnight.getTime() - todayMidnight.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
};

export const formatDate = (dateVal?: any) => {
  if (!dateVal) return '—';
  const parsed = parseDateOnly(dateVal);
  if (!parsed) {
    try {
      const date = new Date(dateVal);
      if (isNaN(date.getTime())) return String(dateVal);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return String(dateVal);
    }
  }
  const d = new Date(parsed.year, parsed.month, parsed.day);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const extractBatchExpiry = (batch: any): string | null => {
  if (!batch || typeof batch !== 'object') return null;
  return (
    batch.expiry_date ||
    batch.exp_date ||
    batch.expiry ||
    batch.expiry_data ||
    batch.expiration_infos?.expiry_date ||
    batch.expiration_infos?.exp_date ||
    batch.expiration_infos?.expiry_data ||
    batch.datas?.expiry_date ||
    batch.datas?.exp_date ||
    batch.datas?.expiry ||
    batch.datas?.expiry_data ||
    batch.additional_infos?.expiry_date ||
    batch.additional_infos?.exp_date ||
    batch.additional_infos?.expiry_data ||
    null
  );
};

export const extractBatchMfg = (batch: any): string | null => {
  if (!batch || typeof batch !== 'object') return null;
  return (
    batch.manufacturing_date ||
    batch.mfg_date ||
    batch.mfg ||
    batch.expiration_infos?.manufacturing_date ||
    batch.expiration_infos?.mfg_date ||
    batch.datas?.manufacturing_date ||
    batch.datas?.mfg_date ||
    batch.datas?.mfg ||
    batch.additional_infos?.manufacturing_date ||
    batch.additional_infos?.mfg_date ||
    null
  );
};

const getStockStatus = (stock: number | string, reorderPoint?: number | string) => {
  const stockNum = Number(stock) || 0;
  const rp = Number(reorderPoint) || 10;
  if (stockNum <= 0) return { label: '0 In Stock', variant: 'stk-out-of-stock' };
  if (stockNum <= rp) return { label: `${stockNum} Low Stock`, variant: 'stk-low-stock' };
  return { label: `${stockNum} In Stock`, variant: 'stk-in-stock' };
};

/* ─── Shared Components ──────────────────────────────────────────────────── */

export const BatchBadge = ({ expDate, qty }: { expDate?: string; qty: number }) => {
  const days = calculateDaysToExpiry(expDate);
  if (qty <= 0) {
    return (
      <AntBadge variant="mv-sales" type="tag">
        Depleted
      </AntBadge>
    );
  }
  if (days === null) return null;
  if (days < 0) {
    return (
      <AntBadge variant="ps-cancelled" type="tag">
        Expired ({Math.abs(days)}d ago)
      </AntBadge>
    );
  }
  if (days === 0) {
    return (
      <AntBadge variant="at-batch" type="tag" icon={<Clock size={10} />}>
        Expires Today
      </AntBadge>
    );
  }
  if (days <= 90) {
    return (
      <AntBadge variant="at-batch" type="tag" icon={<Clock size={10} />}>
        {days} {days === 1 ? 'day' : 'days'} left
      </AntBadge>
    );
  }
  return (
    <AntBadge variant="ps-completed" type="tag" dot>
      {days} {days === 1 ? 'day' : 'days'} left
    </AntBadge>
  );
};

export const SerialBadgeList = ({ serials }: { serials: string[] }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!serials || serials.length === 0) return null;

  const limit = 12;
  const showAll = isExpanded || serials.length <= limit;
  const visibleSerials = showAll ? serials : serials.slice(0, limit);
  const remaining = serials.length - limit;

  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {visibleSerials.map((s, i) => (
        <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xl text-[10px] font-mono font-bold bg-[var(--mv-sales-bg)] text-badge-rose-text border border-badge-rose-text/20">
          <Hash size={8} /> {s}
        </span>
      ))}
      {!showAll && remaining > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xl text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-colors"
        >
          + Show {remaining} more
        </button>
      )}
      {isExpanded && serials.length > limit && (
        <button
          onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xl text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 transition-colors"
        >
          Show Less
        </button>
      )}
    </div>
  );
};
export const parseObjects = (val: any): any[] => {
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

const parseBatches = parseObjects;

const extractSerials = (val: any): string[] => {
  if (!val) return [];
  const getNames = (arr: any[]): string[] => {
    return arr.map((v: any) => typeof v === 'object' && v !== null ? v.name || v.serial || "" : String(v)).filter(Boolean);
  };
  if (Array.isArray(val)) return getNames(val);
  if (val.serial_numbers && Array.isArray(val.serial_numbers)) return getNames(val.serial_numbers);
  if (val.serialno_infos && Array.isArray(val.serialno_infos)) return getNames(val.serialno_infos);
  return [];
};

export const extractReorderPoint = (comb: any, parentReorderPoint?: number | null): number | null => {
  if (!comb) return parentReorderPoint ?? null;
  const combDatas = comb.datas || {};
  const addInfos = comb.additional_infos || combDatas.additional_infos || {};
  const nestedDatas = combDatas.datas || {};
  const batches = comb.batch_infos || comb.batches || combDatas.batch_infos || combDatas.batches || [];

  const parseVal = (val: any): number | null => {
    if (val === undefined || val === null || val === "") return null;
    if (typeof val === 'object') {
      const numVal = val.reorder_point ?? val.point ?? val.value;
      if (numVal !== undefined && numVal !== null && numVal !== "") {
        const n = Number(numVal);
        return isNaN(n) ? null : n;
      }
      return null;
    }
    const n = Number(val);
    return isNaN(n) ? null : n;
  };

  const getFromBatches = (arr: any[]): number | null => {
    if (!Array.isArray(arr) || arr.length === 0) return null;
    for (const b of arr) {
      const v = parseVal(b.reorder_point_infos) ?? parseVal(b.reorder_point) ?? parseVal(b.additional_infos?.reorder_point);
      if (v !== null) return v;
    }
    return null;
  };

  const val =
    parseVal(comb.reorder_point_infos) ??
    parseVal(comb.reorder_point) ??
    parseVal(addInfos.reorder_point_infos) ??
    parseVal(addInfos.reorder_point) ??
    getFromBatches(batches) ??
    parseVal(combDatas.reorder_point_infos) ??
    parseVal(combDatas.reorder_point) ??
    parseVal(nestedDatas.reorder_point_infos) ??
    parseVal(nestedDatas.reorder_point);

  if (val !== null) return val;
  return parentReorderPoint ?? null;
};

const extractStorageLocation = (comb: any, parentStorageLocation?: string | null): string | null => {
  if (!comb) return parentStorageLocation || null;
  const combDatas = comb.datas || {};
  const addInfos = comb.additional_infos || combDatas.additional_infos || {};
  const nestedDatas = combDatas.datas || {};
  const batches = comb.batch_infos || comb.batches || combDatas.batch_infos || combDatas.batches || [];

  const getFromObj = (obj: any): string | null => {
    if (!obj) return null;
    if (typeof obj === 'string' && obj.trim() !== '' && obj.trim() !== '{}') return obj.trim();
    if (typeof obj === 'number') return String(obj);
    if (typeof obj === 'object') {
      const name = obj.storage_location || obj.name || obj.location || obj.storage_location_name;
      if (name && typeof name === 'string' && name.trim() !== '' && name.trim() !== '{}') return name.trim();
      if (typeof name === 'number') return String(name);
    }
    return null;
  };

  const getFromArray = (arr: any): string | null => {
    if (!Array.isArray(arr) || arr.length === 0) return null;
    for (const item of arr) {
      const res = getFromObj(item) || getFromObj(item?.storage_location_infos) || getFromObj(item?.additional_infos?.storage_location_infos);
      if (res) return res;
    }
    return null;
  };

  const candidate =
    getFromObj(comb.storage_location_infos) ||
    getFromObj(comb.storage_location) ||
    getFromObj(comb.location) ||
    getFromArray(comb.storage_locations) ||
    getFromObj(addInfos.storage_location_infos) ||
    getFromObj(addInfos.storage_location) ||
    getFromObj(addInfos.location) ||
    getFromArray(addInfos.storage_locations) ||
    getFromArray(batches) ||
    getFromObj(combDatas.storage_location_infos) ||
    getFromObj(combDatas.storage_location) ||
    getFromObj(combDatas.location) ||
    getFromArray(combDatas.storage_locations) ||
    getFromObj(nestedDatas.storage_location_infos) ||
    getFromObj(nestedDatas.storage_location) ||
    getFromObj(nestedDatas.location) ||
    getFromArray(nestedDatas.storage_locations);

  if (candidate && candidate !== '—' && candidate !== 'null' && candidate !== 'undefined') {
    return candidate;
  }

  return parentStorageLocation || null;
};

export const calculateProductStock = (item: any): number => {
  if (!item) return 0;
  const datas = item.datas || {};

  const combinations = (() => {
    const raw = parseObjects(item.variants || item.variant_infos || datas.combinations || datas.variants);
    return raw.filter((v: any) => v && typeof v === "object");
  })();

  const batches = (() => {
    let raw: any[] = [];
    if (
      !(datas.has_variants || datas.has_varients || item.variants?.length || item.variant_infos?.length) &&
      ((item.variants?.length ?? 0) > 0 || (item.variant_infos?.length ?? 0) > 0)
    ) {
      const firstVar = item.variants?.[0] || item.variant_infos?.[0];
      raw = parseObjects(firstVar?.batches || firstVar?.batch_infos);
    } else {
      raw = parseObjects(item.batches || item.batch_infos || datas.batches || item.type_infos?.batch_infos);
    }
    return raw.filter((b: any) => b && typeof b === "object");
  })();

  const hasVariants =
    (datas.has_variants ||
      datas.has_varients ||
      item.has_variant ||
      item.type_infos?.has_variant) &&
    combinations.length > 0;
  const hasBatches = batches.length > 0 || item.has_batch || item.type_infos?.has_batch;

  const calculateVariantStock = (comb: any) => {
    const vBatches = parseObjects(comb.batch_infos ?? comb.batches ?? comb.datas?.batch_infos ?? comb.datas?.batches ?? []);
    const vHasBatches = vBatches.length > 0;
    let vStock = Number(comb.stock_infos?.available_stocks ?? comb.stock_infos?.physical_stocks ?? comb.stocks ?? comb.stock ?? comb.datas?.stocks ?? comb.datas?.datas?.stocks ?? 0);
    if (vHasBatches || vStock === 0) {
      const bSum = vBatches.reduce((acc: number, b: any) => acc + Number(b.stock_infos?.available_stocks ?? b.stock_infos?.physical_stocks ?? b.stocks ?? b.stock ?? b.quantity ?? b.qty ?? b.available_stocks ?? 0), 0);
      if (bSum > 0) vStock = bSum;
    }
    return vStock;
  };

  let stockNumber = Number(item.stock_infos?.available_stocks ?? item.stock_infos?.physical_stocks ?? item.stocks ?? item.quantity ?? 0);
  if (hasVariants) {
    stockNumber = combinations.reduce((acc: number, comb: any) => acc + calculateVariantStock(comb), 0);
  } else if (hasBatches) {
    const bSum = batches.reduce((acc: number, b: any) => {
      const bStock = Number(b.stock_infos?.available_stocks ?? b.stock_infos?.physical_stocks ?? b.stocks ?? b.stock ?? b.quantity ?? b.qty ?? b.available_stocks ?? 0);
      return acc + bStock;
    }, 0);
    if (bSum > 0 || stockNumber === 0) {
      stockNumber = bSum;
    }
  }
  return stockNumber;
};

export interface ProductStockAnalysis {
  status: {
    label: string;
    variant: string;
    icon: any;
    statusKey: "out_of_stock" | "low" | "in_stock" | "not_tracked";
  };
  hasOutOfStock: boolean;
  hasLowStock: boolean;
  hasInStock: boolean;
  totalStock: number;
}

export const analyzeProductStock = (item: any): ProductStockAnalysis => {
  if (!item) {
    return {
      status: { label: "In stock", variant: "stk-in-stock", icon: Package, statusKey: "in_stock" },
      hasOutOfStock: false,
      hasLowStock: false,
      hasInStock: true,
      totalStock: 0,
    };
  }
  const datas = item.datas || {};
  const haveTracking = (item as any).have_tracking !== false && (datas as any).have_tracking !== false;
  if (!haveTracking) {
    return {
      status: {
        label: "Stock Not Tracked",
        variant: "stk-in-stock",
        icon: Package,
        statusKey: "not_tracked",
      },
      hasOutOfStock: false,
      hasLowStock: false,
      hasInStock: true,
      totalStock: 0,
    };
  }

  const combinations = (() => {
    const raw = parseObjects(item.variants || item.variant_infos || datas.combinations || datas.variants);
    return raw.filter((v: any) => v && typeof v === "object");
  })();

  const batches = (() => {
    let raw: any[] = [];
    if (
      !(datas.has_variants || datas.has_varients || item.variants?.length || item.variant_infos?.length) &&
      ((item.variants?.length ?? 0) > 0 || (item.variant_infos?.length ?? 0) > 0)
    ) {
      const firstVar = item.variants?.[0] || item.variant_infos?.[0];
      raw = parseObjects(firstVar?.batches || firstVar?.batch_infos);
    } else {
      raw = parseObjects(item.batches || item.batch_infos || datas.batches || item.type_infos?.batch_infos);
    }
    return raw.filter((b: any) => b && typeof b === "object");
  })();

  const hasVariants =
    (datas.has_variants ||
      datas.has_varients ||
      item.has_variant ||
      item.type_infos?.has_variant) &&
    combinations.length > 0;
  const hasBatches = batches.length > 0 || item.has_batch || item.type_infos?.has_batch;

  const parentRpRaw = (item as any).reorder_point_infos?.reorder_point ?? (item as any).reorder_point ?? datas.reorder_point ?? null;
  const parentRp = parentRpRaw !== null && parentRpRaw !== undefined && parentRpRaw !== "" && !isNaN(Number(parentRpRaw)) ? Number(parentRpRaw) : null;

  if (hasVariants) {
    let hasOutOfStock = false;
    let hasLowStock = false;
    let hasInStock = false;
    let totalStock = 0;

    combinations.forEach((comb: any) => {
      const combDatas = comb.datas || {};
      const vBatches = parseObjects(comb.batch_infos ?? comb.batches ?? combDatas.batch_infos ?? combDatas.batches ?? []).filter((b: any) => b && typeof b === "object");
      let stockNum = Number(comb.stock_infos?.available_stocks ?? comb.stock_infos?.physical_stocks ?? comb.stocks ?? comb.stock ?? combDatas.stocks ?? combDatas.datas?.stocks ?? 0);
      if (vBatches.length > 0 && stockNum === 0) {
        stockNum = vBatches.reduce((acc: number, b: any) => {
          return acc + Number(b.stock_infos?.available_stocks ?? b.stock_infos?.physical_stocks ?? b.stocks ?? b.stock ?? b.quantity ?? b.qty ?? b.available_stocks ?? 0);
        }, 0);
      }
      totalStock += stockNum;
      const rp = extractReorderPoint(comb, parentRp);

      if (stockNum <= 0) {
        hasOutOfStock = true;
      } else if (rp !== null && stockNum <= rp) {
        hasLowStock = true;
      } else {
        hasInStock = true;
      }
    });

    // Priority 1: Out of stock, Priority 2: Low stock, Priority 3: In stock
    let statusKey: "out_of_stock" | "low" | "in_stock" = "in_stock";
    let label = "In stock";
    let variant = "stk-in-stock";
    let icon = Package;

    if (hasOutOfStock) {
      statusKey = "out_of_stock";
      label = "Out of stock";
      variant = "stk-out-of-stock";
      icon = AlertCircle;
    } else if (hasLowStock) {
      statusKey = "low";
      label = "Low stock";
      variant = "stk-low-stock";
      icon = AlertTriangle;
    }

    return {
      status: { label, variant, icon, statusKey },
      hasOutOfStock,
      hasLowStock,
      hasInStock,
      totalStock,
    };
  }

  if (hasBatches) {
    let hasOutOfStock = false;
    let hasLowStock = false;
    let hasInStock = false;
    let totalStock = 0;

    batches.forEach((b: any) => {
      const bStock = Number(b.stock_infos?.available_stocks ?? b.stock_infos?.physical_stocks ?? b.stocks ?? b.stock ?? b.quantity ?? b.qty ?? b.available_stocks ?? 0);
      totalStock += bStock;
      const bRpRaw = b.reorder_point_infos?.reorder_point ?? b.reorder_point ?? parentRp;
      const bRp = bRpRaw !== null && bRpRaw !== undefined && bRpRaw !== "" && !isNaN(Number(bRpRaw)) ? Number(bRpRaw) : null;

      if (bStock <= 0) {
        hasOutOfStock = true;
      } else if (bRp !== null && bStock <= bRp) {
        hasLowStock = true;
      } else {
        hasInStock = true;
      }
    });

    let statusKey: "out_of_stock" | "low" | "in_stock" = "in_stock";
    let label = "In stock";
    let variant = "stk-in-stock";
    let icon = Package;

    if (hasOutOfStock) {
      statusKey = "out_of_stock";
      label = "Out of stock";
      variant = "stk-out-of-stock";
      icon = AlertCircle;
    } else if (hasLowStock) {
      statusKey = "low";
      label = "Low stock";
      variant = "stk-low-stock";
      icon = AlertTriangle;
    }

    return {
      status: { label, variant, icon, statusKey },
      hasOutOfStock,
      hasLowStock,
      hasInStock,
      totalStock,
    };
  }

  // Simple product
  const totalStock = calculateProductStock(item);
  const rp = parentRp !== null ? parentRp : 10;
  const hasOutOfStock = totalStock <= 0;
  const hasLowStock = totalStock > 0 && totalStock <= rp;
  const hasInStock = totalStock > rp;

  let statusKey: "out_of_stock" | "low" | "in_stock" = "in_stock";
  let label = "In stock";
  let variant = "stk-in-stock";
  let icon = Package;

  if (hasOutOfStock) {
    statusKey = "out_of_stock";
    label = "Out of stock";
    variant = "stk-out-of-stock";
    icon = AlertCircle;
  } else if (hasLowStock) {
    statusKey = "low";
    label = "Low stock";
    variant = "stk-low-stock";
    icon = AlertTriangle;
  }

  return {
    status: { label, variant, icon, statusKey },
    hasOutOfStock,
    hasLowStock,
    hasInStock,
    totalStock,
  };
};

export const BatchCards = ({ batches, parentGst, parentBuyPrice, parentSellPrice }: { batches: any | any[]; parentGst?: any; parentBuyPrice?: any; parentSellPrice?: any }) => {
  const safeBatches = parseBatches(batches);
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? safeBatches : safeBatches.slice(0, 4);
  const remaining = safeBatches.length - 4;

  return (
    <div className="animate-in fade-in slide-in-from-top-1 duration-300 pt-1 pb-2">
      <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
        <div className="w-6 h-6 rounded-md bg-amber-50 flex items-center justify-center text-amber-600">
          <Tag size={14} className="fill-amber-600/10" />
        </div>
        <p className="text-[13px] font-bold text-slate-800 tracking-tight">Product Batches</p>
        <span className="ml-auto text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
          {safeBatches.length} {safeBatches.length === 1 ? 'batch' : 'batches'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {visible.map((batch: any, idx: number) => {
          const physicalQty = Number(batch.stock_infos?.physical_stocks ?? batch.stocks ?? batch.stock ?? batch.quantity ?? batch.qty ?? batch.available_stocks ?? 0);
          const availableQty = Number(batch.stock_infos?.available_stocks ?? batch.available_stocks ?? physicalQty);
          const reservedQty = Number(batch.stock_infos?.reserved_stocks ?? 0);
          const serials = extractSerials(batch.serialno_infos ?? batch.serial_numbers ?? batch.datas?.serial_numbers);
          const batchExpiry = extractBatchExpiry(batch);
          const batchMfg = extractBatchMfg(batch);
          const daysToExpiry = calculateDaysToExpiry(batchExpiry);
          const storageLoc = batch.storage_location_infos?.storage_location ?? batch.storage_location ?? null;
          const reorderPt = batch.reorder_point_infos?.reorder_point ?? batch.reorder_point ?? null;

          const stockStatus = availableQty <= 0
            ? { label: 'Out of Stock', variant: 'stk-out-of-stock' }
            : reorderPt !== null && availableQty <= reorderPt
              ? { label: 'Low Stock', variant: 'stk-low-stock' }
              : { label: 'In Stock', variant: 'stk-in-stock' };

          const isGstReg = isShopGstRegistered();
          const batchSellPrice = batch.pricing_infos?.sell_price ?? batch.sell_price ?? batch.price ?? parentSellPrice;
          const batchBuyPrice = batch.pricing_infos?.buy_price ?? batch.buy_price ?? batch.cost_price ?? parentBuyPrice;
          const gstValue = batch.gst ?? parentGst ?? 0;
          const gstRate = parseFloat(String(gstValue).replace(/[^0-9.]/g, '')) || 0;

          let displaySellPrice = Number(batchSellPrice);
          let sellTaxable = displaySellPrice;
          let sellGstAmt = 0;
          if (isGstReg && gstRate > 0 && !isNaN(displaySellPrice)) {
            const taxSplit = calculateTaxSplit(displaySellPrice, gstRate);
            sellTaxable = taxSplit.taxableValue;
            sellGstAmt = taxSplit.gstAmount;
          }

          let displayBuyPrice = Number(batchBuyPrice);
          let buyGstAmt = 0;
          if (gstRate > 0 && !isNaN(displayBuyPrice)) {
            buyGstAmt = Math.round((displayBuyPrice * (gstRate / 100)) * 100) / 100;
            displayBuyPrice = Math.round((displayBuyPrice + buyGstAmt) * 100) / 100;
          }

          return (
            <div key={batch.id || idx} className="flex flex-col border border-slate-200 rounded-xl bg-white shadow-sm hover:shadow-md hover:border-blue-200 transition-all p-3.5 relative gap-3">
              {/* Header: Name and Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-50/50 border border-blue-100/50 flex items-center justify-center text-blue-500 shrink-0">
                    <Package size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-slate-800 truncate" title={batch.name || batch.batch || `BAT-${String(idx + 1).padStart(3, '0')}`}>
                      {batch.name || batch.batch || `BAT-${String(idx + 1).padStart(3, '0')}`}
                    </p>
                    {batch.id && (
                      <p className="text-[9px] font-mono text-slate-400 font-medium">{batch.id.slice(0, 8)}</p>
                    )}
                  </div>
                </div>
                <AntBadge variant={stockStatus.variant} type="pill" dot>
                  {stockStatus.label}
                </AntBadge>
              </div>

              {/* Tags (Loc, Reorder, Exp) */}
              <div className="flex flex-wrap gap-1.5">
                {storageLoc && (
                  <AntBadge variant="at-variant" type="tag">LOC: {storageLoc}</AntBadge>
                )}
                {reorderPt !== null && (
                  <AntBadge variant="at-batch" type="tag">REORDER: {reorderPt}</AntBadge>
                )}
                {daysToExpiry !== null && (
                  <AntBadge variant={daysToExpiry <= 0 ? 'ps-cancelled' : daysToExpiry <= 7 ? 'at-batch' : 'ps-completed'} type="tag">
                    {daysToExpiry < 0
                      ? `EXP ${Math.abs(daysToExpiry)} ${Math.abs(daysToExpiry) === 1 ? 'DAY' : 'DAYS'} AGO`
                      : daysToExpiry === 0
                        ? 'EXPIRES TODAY'
                        : `EXP IN ${daysToExpiry} ${daysToExpiry === 1 ? 'DAY' : 'DAYS'}`}
                  </AntBadge>
                )}
              </div>

              {/* Grid for Stock and Prices */}
              <div className="flex flex-col gap-2 bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Avail. Stock</span>
                    <span className="text-sm font-black text-blue-600 tabular-nums">{availableQty}</span>
                  </div>
                  {(physicalQty !== availableQty || reservedQty > 0) && (
                    <div className="flex flex-col border-l border-slate-200 pl-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Physical / Res.</span>
                      <span className="text-xs font-bold text-slate-600 tabular-nums">{physicalQty} <span className="text-amber-500">({reservedQty})</span></span>
                    </div>
                  )}
                </div>
                {(batchBuyPrice !== undefined || batchSellPrice !== undefined) && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Buy Price</span>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-800 tabular-nums flex items-baseline gap-1">
                          {formatCurrency(displayBuyPrice)}
                        </span>
                        {buyGstAmt > 0 && (
                          <span className="text-[8px] font-bold text-slate-500">{formatCurrency(batchBuyPrice)} + {formatCurrency(buyGstAmt)} GST</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col border-l border-slate-200 pl-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Sell Price</span>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-800 tabular-nums flex items-baseline gap-1">
                          {formatCurrency(displaySellPrice)}
                        </span>
                        {isGstReg && sellGstAmt > 0 && (
                          <span className="text-[8px] font-bold text-slate-500">
                            {formatCurrency(sellTaxable)} + {formatCurrency(sellGstAmt)} GST {gstRate}%
                          </span>
                        )}
                        {displaySellPrice > 0 && displayBuyPrice > 0 && (() => {
                          const bProfit = Math.round((sellTaxable - displayBuyPrice) * 100) / 100;
                          const bMargin = sellTaxable > 0 ? ((bProfit / sellTaxable) * 100) : 0;
                          return (
                            <span className="text-[8px] font-medium leading-tight mt-0.5">
                              Margin: <span className={bProfit >= 0 ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold"}>
                                {bMargin.toFixed(1)}% ({bProfit >= 0 ? "+" : ""}₹{bProfit.toFixed(2)})
                              </span>
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Dates */}
              {(batchMfg || batchExpiry) && (
                <div className="flex items-center justify-between text-[10px] bg-white border border-slate-100 rounded-md p-1.5 px-2">
                  {batchMfg && <div><span className="text-slate-400">MFG:</span> <span className="font-bold text-slate-700">{formatDate(batchMfg)}</span></div>}
                  {batchExpiry && <div><span className="text-slate-400">EXP:</span> <span className="font-bold text-slate-700">{formatDate(batchExpiry)}</span></div>}
                </div>
              )}

              {/* Serials */}
              {serials.length > 0 && (
                <div className="pt-1.5 border-t border-slate-100/60">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                      <Hash size={9} /> Serials ({serials.length})
                    </p>
                  </div>
                  <SerialBadgeList serials={serials} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {remaining > 0 && !showAll && (
        <div className="mt-3 flex justify-center">
          <button
            onClick={() => setShowAll(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-white border border-slate-200 text-slate-600 font-bold text-[10px] rounded-xl hover:bg-slate-50 hover:border-blue-200 transition-all shadow-sm"
          >
            Show All {safeBatches.length} Batches
            <ChevronDown size={12} />
          </button>
        </div>
      )}
    </div>
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

export const VariantRows = ({
  combinations,
  baseSellPrice,
  baseBuyPrice,
  parentGst,
  parentStorageLocation,
  parentReorderPoint,
  hideReorderPoint = false,
  parentMrp,
  parentDiscountPercent,
  parentHsn,
}: {
  combinations: any[];
  baseSellPrice: any;
  baseBuyPrice?: any;
  parentGst?: any;
  parentStorageLocation?: string | null;
  parentReorderPoint?: number | null;
  hideReorderPoint?: boolean;
  parentMrp?: any;
  parentDiscountPercent?: any;
  parentHsn?: string | null;
}) => {
  const [expandedVariant, setExpandedVariant] = useState<string | null>(null);
  const isGstReg = isShopGstRegistered();

  return (
    <div className="animate-in fade-in slide-in-from-top-2 duration-300 pt-1 pb-2">
      <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
        <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center text-blue-600">
          <Layers size={14} className="fill-blue-600/10" />
        </div>
        <p className="text-[13px] font-bold text-slate-800 tracking-tight">Product Variants</p>
      </div>
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[950px]">
          <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left">Variant</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left">SKU</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left">Barcode</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left">HSN</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Stock</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Buy Price</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Sell Price</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Discount</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left">Batch Count</th>

              {!hideReorderPoint && (
                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Reorder Point</th>
              )}
              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left">Location</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
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

              const variantId = comb.id || String(idx);
              const isVarExpanded = expandedVariant === variantId;
              const batches = comb.batch_infos ?? comb.batches ?? [];
              const serials = extractSerials(comb.serialno_infos ?? comb.serial_numbers ?? combDatas.serial_numbers ?? combDatas.datas?.serial_numbers);
              const hasBatches = batches.length > 0;
              const hasSerials = serials.length > 0;
              let stockNum = Number(comb.stock_infos?.available_stocks ?? comb.stock_infos?.physical_stocks ?? comb.stocks ?? comb.stock ?? combDatas.stocks ?? combDatas.datas?.stocks ?? 0);
              if (hasBatches && stockNum === 0) {
                stockNum = batches.reduce((acc: number, b: any) => acc + Number(b.stock_infos?.available_stocks ?? b.stock_infos?.physical_stocks ?? b.stocks ?? 0), 0);
              }
              const reorderPoint = extractReorderPoint(comb, parentReorderPoint);
              const storageLoc = extractStorageLocation(comb, parentStorageLocation);
              const stockStatus = getStockStatus(stockNum, reorderPoint ?? 0);
              const statusLabel = stockNum <= 0 ? "Out of Stock" : (reorderPoint !== null && stockNum <= reorderPoint) ? "Low Stock" : "In Stock";
              const sellPrice = comb.pricing_infos?.sell_price ?? comb.sell_price ?? comb.price ?? combDatas.sell_price ?? combDatas.datas?.sell_price ?? baseSellPrice;
              const buyPrice = comb.pricing_infos?.buy_price ?? comb.buy_price ?? combDatas.buy_price ?? combDatas.datas?.buy_price ?? baseBuyPrice;
              
              const gstValue = comb.gst ?? combDatas.gst ?? parentGst ?? 0;
              const gstRate = parseFloat(String(gstValue).replace(/[^0-9.]/g, '')) || 0;

              let displaySellPrice = Number(sellPrice);
              let sellTaxable = displaySellPrice;
              let sellGstAmt = 0;
              if (isGstReg && gstRate > 0 && !isNaN(displaySellPrice)) {
                const taxSplit = calculateTaxSplit(displaySellPrice, gstRate);
                sellTaxable = taxSplit.taxableValue;
                sellGstAmt = taxSplit.gstAmount;
              }

              let displayBuyPrice = Number(buyPrice);
              let buyGstAmt = 0;
              if (gstRate > 0 && !isNaN(displayBuyPrice)) {
                buyGstAmt = Math.round((displayBuyPrice * (gstRate / 100)) * 100) / 100;
                displayBuyPrice = Math.round((displayBuyPrice + buyGstAmt) * 100) / 100;
              }

              const varMrp = Number(
                comb.pricing_infos?.mrp ??
                comb.mrp ??
                combDatas.mrp ??
                comb.additional_infos?.mrp ??
                combDatas.additional_infos?.mrp ??
                (parentMrp ? Number(parentMrp) : 0)
              );

              const varDiscPct = Number(
                comb.pricing_infos?.discount_percent ??
                comb.discount_percent ??
                combDatas.discount_percent ??
                comb.additional_infos?.discount_percent ??
                combDatas.additional_infos?.discount_percent ??
                (parentDiscountPercent ? Number(parentDiscountPercent) : 0)
              );

              const varDiscVal = Number(
                comb.pricing_infos?.discount_value ??
                comb.discount_value ??
                comb.discount ??
                combDatas.discount_value ??
                comb.additional_infos?.discount_value ??
                combDatas.additional_infos?.discount_value ??
                0
              );

              const offerExpiry = comb.pricing_infos?.offer_valid_until || comb.offer_valid_until || combDatas.offer_valid_until;
              let isExpired = false;
              if (offerExpiry) {
                const d = new Date(offerExpiry);
                d.setHours(23, 59, 59, 999);
                if (d < new Date()) isExpired = true;
              }

              const computedDiffPct = (varMrp > 0 && displaySellPrice > 0 && varMrp > displaySellPrice)
                ? ((varMrp - displaySellPrice) / varMrp) * 100
                : 0;

              return (
                <Fragment key={variantId}>
                  <tr
                    className={`group transition-colors h-[56px] ${isVarExpanded ? 'bg-slate-50/80 shadow-inner' : 'bg-white hover:bg-slate-50/50'}`}
                  >
                    {/* Variant */}
                    <td className="px-4 py-2 align-middle">
                      <div className="flex items-center gap-2.5">
                        {hasBatches ? (
                          <button
                            onClick={() => setExpandedVariant(isVarExpanded ? null : variantId)}
                            className={`w-5 h-5 rounded flex items-center justify-center transition-colors shrink-0 ${isVarExpanded ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                          >
                            {isVarExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                          </button>
                        ) : (
                          <div className="w-5 h-5 rounded bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 shrink-0">
                            <Layers size={11} />
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-[13px] font-bold text-slate-800 tracking-tight">{variantLabel}</span>
                        </div>
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="px-4 py-2 align-middle">
                      {(() => {
                        const rawSku = comb.sku || comb.additional_infos?.sku || combDatas.sku || combDatas.datas?.sku || "";
                        if (!rawSku) {
                          return <span className="text-[12px] font-mono text-slate-400 font-medium">—</span>;
                        }
                        const trimmedSku = rawSku.length > 16 ? `${rawSku.slice(0, 14)}...` : rawSku;
                        return (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[12px] font-mono font-medium text-slate-700 tracking-tight" title={rawSku}>
                              {trimmedSku}
                            </span>
                            <CopySKUButton val={rawSku} />
                          </div>
                        );
                      })()}
                    </td>

                    {/* Barcode */}
                    <td className="px-4 py-2 align-middle">
                      {(() => {
                        const rawBarcode = comb.barcode || comb.additional_infos?.barcode || combDatas.barcode || combDatas.datas?.barcode || "";
                        if (!rawBarcode) {
                          return <span className="text-[12px] font-mono text-slate-400 font-medium">—</span>;
                        }
                        const trimmedBc = rawBarcode.length > 16 ? `${rawBarcode.slice(0, 14)}...` : rawBarcode;
                        return (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[12px] font-mono font-medium text-slate-700 tracking-tight" title={rawBarcode}>
                              {trimmedBc}
                            </span>
                            <CopySKUButton val={rawBarcode} />
                          </div>
                        );
                      })()}
                    </td>

                    {/* HSN */}
                    <td className="px-4 py-2 align-middle">
                      {(() => {
                        const rawHsn = comb.hsn_code || comb.hsn || comb.additional_infos?.hsn_code || comb.additional_infos?.hsn || combDatas.hsn_code || combDatas.hsn || combDatas.datas?.hsn_code || combDatas.datas?.hsn || parentHsn || "";
                        if (!rawHsn) {
                          return <span className="text-[12px] font-mono text-slate-400 font-medium">—</span>;
                        }
                        return (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[12px] font-mono font-medium text-slate-700 tracking-tight" title={rawHsn}>
                              {rawHsn}
                            </span>
                            <CopySKUButton val={rawHsn} />
                          </div>
                        );
                      })()}
                    </td>

                    {/* Stock */}
                    <td className="px-4 py-2 align-middle text-right">
                      <span className={`text-[14px] font-bold tabular-nums ${stockNum > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {stockNum}
                      </span>
                    </td>

                    {/* Buy Price */}
                    <td className="px-4 py-2 align-middle text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-[13px] font-bold text-slate-800 tabular-nums flex items-baseline gap-1 justify-end">
                          {formatCurrency(displayBuyPrice)}
                        </span>
                        {buyGstAmt > 0 && (
                          <span className="text-[9px] text-slate-500 font-medium">
                            {formatCurrency(buyPrice)} + {formatCurrency(buyGstAmt)} GST
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Sell Price */}
                    <td className="px-4 py-2 align-middle text-right">
                      <div className="flex flex-col items-end">
                        <div className="flex items-baseline gap-1.5 justify-end flex-wrap">
                          <span className="text-[13px] font-bold text-slate-800 tabular-nums">
                            {formatCurrency(displaySellPrice)}
                          </span>
                          {varMrp > 0 && varMrp > displaySellPrice && (
                            <span className="text-[10px] text-slate-400 line-through tabular-nums font-normal" title={`MRP: ${formatCurrency(varMrp)}`}>
                              MRP {formatCurrency(varMrp)}
                            </span>
                          )}
                        </div>
                        {isGstReg && sellGstAmt > 0 && (
                          <span className="text-[9px] text-slate-500 font-medium">
                            {formatCurrency(sellTaxable)} + {formatCurrency(sellGstAmt)} GST {gstRate}%
                          </span>
                        )}
                        {displaySellPrice > 0 && displayBuyPrice > 0 && (() => {
                          const varProfit = Math.round((sellTaxable - displayBuyPrice) * 100) / 100;
                          const varMargin = sellTaxable > 0 ? ((varProfit / sellTaxable) * 100) : 0;
                          return (
                            <span className="text-[9px] font-medium leading-tight mt-0.5">
                              Margin: <span className={varProfit >= 0 ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold"}>
                                {varMargin.toFixed(1)}% ({varProfit >= 0 ? "+" : ""}₹{varProfit.toFixed(2)})
                              </span>
                            </span>
                          );
                        })()}
                      </div>
                    </td>

                    {/* Discount */}
                    <td className="px-4 py-2 align-middle text-center">
                      {!isExpired && (varDiscPct > 0 || varDiscVal > 0 || computedDiffPct > 0) ? (
                        <div className="inline-flex flex-col items-center gap-0.5">
                          {varDiscPct > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {varDiscPct}% OFF
                            </span>
                          ) : varDiscVal > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ₹{varDiscVal} OFF
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {Math.round(computedDiffPct)}% OFF
                            </span>
                          )}
                        </div>
                      ) : isExpired ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-400">
                          Expired
                        </span>
                      ) : (
                        <span className="text-[12px] text-slate-400 font-medium">—</span>
                      )}
                    </td>

                    {/* Batch Count */}
                    <td className="px-4 py-2 align-middle">
                      {hasBatches ? (
                        <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-xl whitespace-nowrap">
                          {batches.length} {batches.length === 1 ? 'Batch' : 'Batches'}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </td>


                    {/* Reorder Point */}
                    {!hideReorderPoint && (
                      <td className="px-4 py-2 align-middle text-center">
                        <span className="text-[13px] font-semibold text-slate-700 tabular-nums">
                          {reorderPoint ?? "—"}
                        </span>
                      </td>
                    )}

                    {/* Location */}
                    <td className="px-4 py-2 align-middle">
                      {storageLoc ? (
                        <span className="text-[12px] font-medium text-slate-700">{storageLoc}</span>
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-2 align-middle text-center">
                      <AntBadge variant={stockStatus.variant} type="pill" dot>
                        {statusLabel}
                      </AntBadge>
                    </td>

                  </tr>

                  {/* Serials Area */}
                  {hasSerials && (
                    <tr className="bg-indigo-50/10">
                      <td colSpan={hideReorderPoint ? 12 : 13} className="p-0 border-t border-slate-50/50">
                        <div className="px-4 pb-2 pt-1.5 flex flex-col">
                          <p className="text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1 uppercase">
                            <Hash size={10} className="text-indigo-400" /> Serial Numbers ({serials.length})
                          </p>
                          <SerialBadgeList serials={serials} />
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Nested Batches Area */}
                  {isVarExpanded && hasBatches && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={hideReorderPoint ? 12 : 13} className="p-0 border-t border-slate-100">
                        <div className="p-3 md:pl-10 pl-6 border-l-2 border-slate-200 ml-4 my-2">
                          <BatchCards batches={batches} parentGst={gstValue} parentBuyPrice={buyPrice} parentSellPrice={sellPrice} />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

