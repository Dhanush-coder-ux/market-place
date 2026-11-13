// types.ts

export type PaymentMode = "cash" | "upi" | "credit" | "card";

export interface CustomerData {
  id: string;
  name: string;
  phone: string;
  outstanding: number;
  creditLimit: number;
  totalSpent: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  stock: number;
  serialnoId?: string;
  batchId?: string;
  availableSerials?: string[];
  expiryDate?: string;
  manufacturingDate?: string;
  batches?: any[];
  pricing_infos?: any;
  pricing_info?: any;
  discount_percent?: number;
  discount?: number;
  mrp?: number;
  buy_price?: number;
  costPrice?: number;
  [key: string]: any;
}

export interface InventoryItem {
  id: string;
  product_barcode: string;
  product_name: string;
  category: string;
  variants: ProductVariant[];
  requireSerial: boolean;
  batchTracking?: boolean;
  manufacturingDate?: string;
  expiryDate?: string;
  price?: number;
  stocks?: number;
  batchId?: string;
  serialnoId?: string;
  availableSerials?: string[];
  batches?: any[];
  gst?: number;
  unitInfos?: any;
  type_infos?: any;
}

export interface BillingItem {
  id: string;
  inventoryId?: string;
  code: string;
  name: string;
  qty: number;
  price: number; // Inclusive selling price per unit
  tprice: number; // Final inclusive line total after all discounts
  mrp?: number | null;
  productDiscountPercent?: number;
  productDiscountAmount?: number;
  lineDiscountMode?: '%' | '₹';
  lineDiscountValue?: number;
  lineDiscountAmount?: number;
  billDiscountShare?: number;
  finalInclusive?: number;
  taxableValue?: number;
  gstAmount?: number;
  cgst?: number;
  sgst?: number;
  costPrice?: number;
  serialNumbers?: string[]; // Multiple serials support
  variantId?: string | null;
  batchId?: string;
  serialnoId?: string;
  batchTracking?: boolean;
  manufacturingDate?: string;
  expiryDate?: string;
  requireSerial?: boolean;
  maxStock?: number;
  baseStock?: number;
  gst?: number;
  unitInfos?: any;
  selectedUnit?: string | null;
  factor?: number;
  basePrice?: number;
  _product?: any;
}

// Alias for convenience if used in shopping cart contexts
export type CartItem = BillingItem;

export interface SelectOption {
  value: string;
  label: string;
  payload: InventoryItem;
}

export interface InvoicePayload {
  customer: CustomerData | null;
  customerName: string;
  phone: string;
  items: BillingItem[];
  totalQty: number;
  totalAmount: number;
  gstAmount: number;
  finalAmount: number;
  includeGst: boolean;
  paymentMode: PaymentMode;
  date: string;
}

// ─── Backend Schema Interfaces ───────────────────────────────────────────────

export interface BillingProductSchema {
  id: string; // This usually refers to the inventory item ID
  variant_id?: string;
  batch_id?: string;
  serialno_id?: string;
  serial_numbers?: string[];
  quantity: number;
}

export interface CreateBillingSchema {
  products: BillingProductSchema[];
  shop_id: string;
  payment_method: string;
  customer_id: string;
  payments?: Record<string, number>;
}

// ─── Variant Name Formatting Utilities ──────────────────────────────────────────

/**
 * Cleans repetitive or redundant "variant :" / "varient :" prefixes from variant labels.
 * E.g. "variant : variant : color : White" -> "color : White"
 * E.g. "variant : White" -> "White"
 * E.g. "variant : size : XL / variant : color : Red" -> "size : XL / color : Red"
 */
export const cleanVariantLabel = (label?: string | null): string => {
  if (!label || typeof label !== "string") return "";
  const clean = label.trim();
  if (!clean) return "";

  const parts = clean.split(/\s*\/\s*/);
  const cleanedParts = parts
    .map((part) => {
      let p = part.trim();
      // Repeatedly strip leading "variant :" or "varient :" (case-insensitive)
      while (/^(variant|varient)\s*:\s*/i.test(p)) {
        p = p.replace(/^(variant|varient)\s*:\s*/i, "").trim();
      }
      // If the part is literally just "variant" or "varient", drop it
      if (/^(variant|varient)$/i.test(p)) {
        return "";
      }
      return p;
    })
    .filter(Boolean);

  const result = cleanedParts.join(" / ");
  return result || "Standard Variant";
};

/**
 * Formats a variant object's label cleanly from name, attributes, or barcode.
 * Strips duplicate/unwanted "variant :" prefixes while preserving actual attribute keys like "color : White".
 */
export const formatVariantLabel = (v: any, combDatas?: any): string => {
  const cData = combDatas || v?.datas || {};
  const rawName = v?.name || cData?.name;

  if (rawName && typeof rawName === "string" && rawName.trim()) {
    const cleaned = cleanVariantLabel(rawName);
    if (cleaned && cleaned.toLowerCase() !== "standard variant") {
      return cleaned;
    }
  }

  const attributes = v?.attributes || cData?.attributes || cData?.datas?.attributes;
  if (attributes && typeof attributes === "object" && Object.keys(attributes).length > 0) {
    const parts = Object.entries(attributes)
      .map(([k, val]) => {
        if (val === undefined || val === null) return "";
        const cleanVal = cleanVariantLabel(String(val));
        if (!cleanVal) return "";
        const cleanKey = k.trim().toLowerCase();
        // If attribute key is just "variant" or "varient", omit it to avoid "variant : White"
        if (cleanKey === "variant" || cleanKey === "varient") {
          return cleanVal;
        }
        // If the value already includes the key (e.g. key is "color" and val is "color : White")
        if (cleanVal.toLowerCase().startsWith(`${cleanKey} :`) || cleanVal.toLowerCase().startsWith(`${cleanKey}:`)) {
          return cleanVal;
        }
        return `${k} : ${cleanVal}`;
      })
      .filter(Boolean);

    if (parts.length > 0) {
      return cleanVariantLabel(parts.join(" / "));
    }
  }

  if (v?.barcode && cData?.barcode && v.barcode !== cData.barcode) {
    return String(v.barcode);
  }

  if (v?.barcode) {
    return String(v.barcode);
  }

  return "Standard Variant";
};

