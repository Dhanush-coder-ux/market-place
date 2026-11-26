import { getShopId } from "@/services/endpoints";
import {
  getBillingReceiptStorageKey,
  getInvoiceSettingsStorageKey,
  readScopedJson,
  BILLING_RECEIPT_CONFIG_KEY,
  INVOICE_SETTINGS_CONFIG_KEY,
} from "./printerService";

// market-place/src/features/billing/utils/customFieldsHelper.ts
export type FieldPlacement = "customer" | "item" | "below";
export type FieldType = "text" | "number" | "date" | "phone";
export type FieldMode = "fixed" | "ask";

export interface CustomFieldDefinition {
  id: string;
  label: string;
  placement: FieldPlacement;
  type: FieldType;
  mode: FieldMode;
  value: string;
  required: boolean;
  show: boolean;
  itemSource?: "product" | "ask";
  attr?: string;
  itemShow?: "column" | "under";
  source?: "receipt" | "invoice" | "both";
}

export interface ResolvedCustomField {
  id: string;
  label: string;
  placement: FieldPlacement;
  value: string;
  mode: FieldMode;
  required: boolean;
  type?: FieldType;
  show?: boolean;
  displayValue?: any;
  itemSource?: "product" | "ask";
  attr?: string;
  itemShow?: "column" | "under";
  source?: "receipt" | "invoice" | "both";
}

export const BILLING_RECEIPT_STORAGE_KEY = "inventq.billingReceiptSettings.v1";
export const INVOICE_SETTINGS_STORAGE_KEY = "inventq.invoiceSettings.v2";

export function inferItemAttr(label?: string, explicitAttr?: string): string {
  const l = (label || "").toLowerCase().trim();
  if (l.includes("mrp")) return "mrp";
  if (l.includes("hsn")) return "hsn";
  if (l.includes("expir") || l.includes("exp")) return "expiry";
  if (l.includes("batch")) return "batch";
  if (l.includes("mfr") || l.includes("manuf") || l.includes("brand") || l.includes("supplier")) return "mfr";
  if (l.includes("pack") || l.includes("unit")) return "pack";
  if (l.includes("size") || l.includes("color") || l.includes("colour")) return "size";
  if (explicitAttr && explicitAttr !== "batch") return explicitAttr;
  return explicitAttr || "batch";
}

/**
 * Loads custom fields specifically defined in Billing Receipt Template Settings (scoped by shop)
 */
export function getReceiptCustomFields(shopId?: string): CustomFieldDefinition[] {
  try {
    const sid = shopId || getShopId() || (typeof window !== "undefined" ? localStorage.getItem("shop_id") : "") || "default";
    const key = getBillingReceiptStorageKey(sid);
    const parsed = readScopedJson<any>(key, BILLING_RECEIPT_CONFIG_KEY, sid);
    if (parsed && Array.isArray(parsed.fields)) {
      return parsed.fields
        .filter((f: any) => f && f.show !== false && f.label && f.label.trim())
        .map((f: any) => ({
          id: f.id || `f_${f.label.trim().toLowerCase()}`,
          label: f.label.trim(),
          placement: f.placement || "customer",
          type: f.type || "text",
          mode: f.placement === "item" && f.itemSource !== "ask" ? "fixed" : (f.mode || "ask"),
          value: f.value || "",
          required: Boolean(f.required),
          show: true,
          itemSource: f.itemSource || (f.placement === "item" ? "product" : undefined),
          attr: f.placement === "item" ? inferItemAttr(f.label, f.attr) : f.attr,
          itemShow: f.itemShow || (f.placement === "item" ? "column" : undefined),
          source: "receipt",
        }));
    }
  } catch (e) {
    console.debug("Failed to read receipt custom fields:", e);
  }
  return [];
}

/**
 * Loads custom fields specifically defined in Invoice Template Settings (scoped by shop)
 */
export function getInvoiceCustomFields(shopId?: string): CustomFieldDefinition[] {
  try {
    const sid = shopId || getShopId() || (typeof window !== "undefined" ? localStorage.getItem("shop_id") : "") || "default";
    const key = getInvoiceSettingsStorageKey(sid);
    const parsed = readScopedJson<any>(key, INVOICE_SETTINGS_CONFIG_KEY, sid);
    if (parsed && Array.isArray(parsed.fields)) {
      return parsed.fields
        .filter((f: any) => f && f.show !== false && f.label && f.label.trim())
        .map((f: any) => ({
          id: f.id || `f_${f.label.trim().toLowerCase()}`,
          label: f.label.trim(),
          placement: f.placement || "customer",
          type: f.type || "text",
          mode: f.placement === "item" && f.itemSource !== "ask" ? "fixed" : (f.mode || "ask"),
          value: f.value || "",
          required: Boolean(f.required),
          show: true,
          itemSource: f.itemSource || (f.placement === "item" ? "product" : undefined),
          attr: f.placement === "item" ? inferItemAttr(f.label, f.attr) : f.attr,
          itemShow: f.itemShow || (f.placement === "item" ? "column" : undefined),
          source: "invoice",
        }));
    }
  } catch (e) {
    console.debug("Failed to read invoice custom fields:", e);
  }
  return [];
}

/**
 * Loads and consolidates all active custom fields from both Billing Receipt Template Settings
 * and Invoice Template Settings scoped by shop. If a field exists in both, it deduplicates by label while
 * ensuring that if either asks while billing ('ask'), mode 'ask' takes priority.
 */
export function getActiveCustomFields(shopId?: string): CustomFieldDefinition[] {
  const fieldsMap = new Map<string, CustomFieldDefinition>();
  const sid = shopId || getShopId() || (typeof window !== "undefined" ? localStorage.getItem("shop_id") : "") || "default";

  // 1. Read Receipt Template Settings
  try {
    const keyReceipt = getBillingReceiptStorageKey(sid);
    const parsed = readScopedJson<any>(keyReceipt, BILLING_RECEIPT_CONFIG_KEY, sid);
    if (parsed && Array.isArray(parsed.fields)) {
      parsed.fields.forEach((f: any) => {
        if (f && f.show !== false && f.label && f.label.trim()) {
          const key = f.label.trim().toLowerCase();
          const isItemProduct = f.placement === "item" && f.itemSource !== "ask";
          fieldsMap.set(key, {
            id: f.id || `f_${key}`,
            label: f.label.trim(),
            placement: f.placement || "customer",
            type: f.type || "text",
            mode: isItemProduct ? "fixed" : (f.mode || "ask"),
            value: f.value || "",
            required: Boolean(f.required),
            show: true,
            itemSource: f.itemSource || (f.placement === "item" ? "product" : undefined),
            attr: f.placement === "item" ? inferItemAttr(f.label, f.attr) : f.attr,
            itemShow: f.itemShow || (f.placement === "item" ? "column" : undefined),
            source: "receipt",
          });
        }
      });
    }
  } catch (e) {
    console.debug("Failed to read receipt custom fields:", e);
  }

  // 2. Read Invoice Template Settings
  try {
    const keyInvoice = getInvoiceSettingsStorageKey(sid);
    const parsed = readScopedJson<any>(keyInvoice, INVOICE_SETTINGS_CONFIG_KEY, sid);
    if (parsed && Array.isArray(parsed.fields)) {
      parsed.fields.forEach((f: any) => {
        if (f && f.show !== false && f.label && f.label.trim()) {
          const key = f.label.trim().toLowerCase();
          const existing = fieldsMap.get(key);
          const isItemProduct = f.placement === "item" && f.itemSource !== "ask";
          if (existing) {
            if (!isItemProduct && f.mode === "ask") existing.mode = "ask";
            if (f.required) existing.required = true;
            if (f.value && !existing.value) existing.value = f.value;
            if (f.attr && !existing.attr) existing.attr = f.placement === "item" ? inferItemAttr(f.label, f.attr) : f.attr;
            if (f.itemShow) existing.itemShow = f.itemShow;
            if (f.itemSource) existing.itemSource = f.itemSource;
            existing.source = "both";
          } else {
            fieldsMap.set(key, {
              id: f.id || `f_${key}`,
              label: f.label.trim(),
              placement: f.placement || "customer",
              type: f.type || "text",
              mode: isItemProduct ? "fixed" : (f.mode || "ask"),
              value: f.value || "",
              required: Boolean(f.required),
              show: true,
              itemSource: f.itemSource || (f.placement === "item" ? "product" : undefined),
              attr: f.placement === "item" ? inferItemAttr(f.label, f.attr) : f.attr,
              itemShow: f.itemShow || (f.placement === "item" ? "column" : undefined),
              source: "invoice",
            });
          }
        }
      });
    }
  } catch (e) {
    console.debug("Failed to read invoice custom fields:", e);
  }

  return Array.from(fieldsMap.values());
}

/**
 * Returns initial field values state for Billing page based on active custom fields.
 * If mode is 'fixed', the preset template value is used.
 * If mode is 'ask', empty string is initialized for staff input.
 */
export function getInitialCustomFieldValues(fields: CustomFieldDefinition[]): Record<string, string> {
  const initial: Record<string, string> = {};
  fields.forEach((f) => {
    initial[f.id] = f.mode === "fixed" ? (f.value || "") : "";
  });
  return initial;
}

/**
 * Resolves definitions and user-entered values into an array ready for receipt & invoice renderers.
 */
export function resolveCustomFields(
  fields: CustomFieldDefinition[],
  values: Record<string, string>
): ResolvedCustomField[] {
  return fields.map((f) => {
    const rawVal = f.mode === "fixed" ? (f.value || values[f.id] || "") : (values[f.id] !== undefined ? values[f.id] : (f.value || ""));
    const val = typeof rawVal === "string" ? rawVal.trim() : String(rawVal || "");
    return {
      id: f.id,
      label: f.label,
      placement: f.placement,
      value: val,
      mode: f.mode,
      required: f.required,
      type: f.type,
      show: true,
      displayValue: val,
      itemSource: f.itemSource,
      attr: f.attr,
      itemShow: f.itemShow,
      source: f.source,
    };
  });
}

/**
 * Merges shop template configured custom fields with custom fields saved on an order.
 * Ensures template-defined item fields (Batch, Expiry, HSN, etc.) remain present while
 * preserving any values captured on the order (e.g. Doctor name, Table No).
 */
export function mergeOrderCustomFields(
  configuredFields: CustomFieldDefinition[] = [],
  orderCustomFields?: any[]
): CustomFieldDefinition[] {
  const fromOrder = Array.isArray(orderCustomFields) ? orderCustomFields : [];
  const mergedMap = new Map<string, any>();

  // 1. Populate from configured fields in shop template settings
  (configuredFields || []).forEach((f) => {
    if (!f || f.show === false || !f.label) return;
    const key = f.label.trim().toLowerCase();
    mergedMap.set(key, { ...f });
  });

  // 2. Overlay values captured on the order
  fromOrder.forEach((f: any) => {
    if (!f || !f.label) return;
    const key = f.label.trim().toLowerCase();
    const existing = mergedMap.get(key);
    if (existing) {
      if (f.value !== undefined && f.value !== "") existing.value = f.value;
      if (f.displayValue !== undefined && f.displayValue !== "") existing.displayValue = f.displayValue;
      if (f.attr) existing.attr = f.attr;
      if (f.itemShow) existing.itemShow = f.itemShow;
      if (f.itemSource) existing.itemSource = f.itemSource;
    } else {
      mergedMap.set(key, {
        id: f.id || `f_${key}`,
        label: f.label.trim(),
        placement: f.placement || "customer",
        type: f.type || "text",
        mode: f.mode || "fixed",
        value: f.value || "",
        displayValue: f.displayValue || f.value || "",
        required: Boolean(f.required),
        show: true,
        itemSource: f.itemSource || (f.placement === "item" ? "product" : undefined),
        attr: f.placement === "item" ? inferItemAttr(f.label, f.attr) : f.attr,
        itemShow: f.itemShow || (f.placement === "item" ? "column" : undefined),
      });
    }
  });

  return Array.from(mergedMap.values());
}

/**
 * Extracts a product's default HSN code from all common product/inventory schema locations.
 */
export function extractProductHsn(p: any): string {
  if (!p) return "";
  const cand =
    p.hsn_code ||
    p.hsn ||
    p.hsnCode ||
    p.hsn_no ||
    p.hsnNo ||
    p.hsn_number ||
    p.hsnNumber ||
    p.tax_infos?.hsn ||
    p.tax_infos?.hsn_code ||
    p.tax_info?.hsn ||
    p.tax_info?.hsn_code ||
    p.tax_identifiers?.hsn ||
    p.tax_identifiers?.hsn_code ||
    p.additional_infos?.hsn ||
    p.additional_infos?.hsn_code ||
    p.additional_infos?.hsn_no ||
    p.additional_infos?.custom_fields?.hsn ||
    p.additional_infos?.custom_fields?.hsn_code ||
    p.custom_fields?.hsn ||
    p.custom_fields?.hsn_code ||
    p.datas?.hsn ||
    p.datas?.hsn_code ||
    p.datas?.hsn_no ||
    p.datas?.hsnCode ||
    p.datas?.tax_infos?.hsn ||
    p.datas?.tax_infos?.hsn_code ||
    p.datas?.tax_identifiers?.hsn ||
    p.datas?.tax_identifiers?.hsn_code ||
    p.datas?.custom_fields?.hsn ||
    p.datas?.custom_fields?.hsn_code ||
    p.category_infos?.hsn ||
    p.category_infos?.hsn_code ||
    "";
  const s = String(cand).trim();
  return s !== "undefined" && s !== "null" && s !== "—" ? s : "";
}

/**
 * Extracts a product's GST or tax rate percentage as a number (e.g. 18, 5, 0).
 */
export function extractProductGstRate(p: any): number {
  if (!p) return 0;
  const cand =
    p.tax_rate ??
    p.gst ??
    p.gst_rate ??
    p.gstRate ??
    p.tax_infos?.gst_rate ??
    p.tax_infos?.tax_rate ??
    p.tax_infos?.rate ??
    p.tax_info?.gst_rate ??
    p.tax_info?.tax_rate ??
    p.tax_identifiers?.gst_rate ??
    p.pricing_infos?.tax_rate ??
    p.pricing_infos?.gst_rate ??
    p.pricing_infos?.gst ??
    p.additional_infos?.tax_rate ??
    p.additional_infos?.gst ??
    p.additional_infos?.gst_rate ??
    p.datas?.tax_rate ??
    p.datas?.gst ??
    p.datas?.gst_rate ??
    p.datas?.tax_infos?.gst_rate ??
    p.datas?.tax_infos?.tax_rate ??
    0;
  if (typeof cand === "number") return isNaN(cand) ? 0 : cand;
  const num = parseFloat(String(cand).replace(/[^0-9.]/g, ""));
  return isNaN(num) ? 0 : num;
}

/**
 * Extracts a product or batch MRP from all common product/inventory schema locations.
 * Supports batch-specific lookup if batchIdOrName is provided.
 */
export function extractProductMrp(p: any, batchIdOrName?: string): number | undefined {
  if (!p) return undefined;

  const getNum = (v: any) => {
    const num = Number(v);
    return !isNaN(num) && num > 0 ? num : undefined;
  };

  const batches: any[] = [
    ...(Array.isArray(p.batches) ? p.batches : []),
    ...(Array.isArray(p.batch_infos) ? p.batch_infos : []),
    ...(Array.isArray(p.datas?.batches) ? p.datas.batches : []),
    ...(Array.isArray(p.datas?.batch_infos) ? p.datas.batch_infos : []),
    ...(typeof p.batches === "object" && p.batches !== null ? Object.values(p.batches) : []),
    ...(typeof p.batch_infos === "object" && p.batch_infos !== null ? Object.values(p.batch_infos) : []),
  ];

  // 1. If batch identifier provided, search matching batch first
  if (batchIdOrName && batches.length > 0) {
    const term = String(batchIdOrName).trim().toLowerCase();
    const matched = batches.find((b: any) => {
      if (!b) return false;
      const bId = String(b.id || b._id || b.batchId || b.batch_id || "").toLowerCase();
      const bName = String(b.batch_name || b.name || b.batch_no || b.batch || "").toLowerCase();
      return (bId && bId === term) || (bName && bName === term);
    });
    if (matched) {
      const bMrp =
        getNum(matched.pricing_infos?.mrp) ??
        getNum(matched.mrp) ??
        getNum(matched.datas?.pricing_infos?.mrp) ??
        getNum(matched.datas?.mrp) ??
        getNum(matched.pricing_infos?.additional_infos?.mrp) ??
        getNum(matched.additional_infos?.mrp);
      if (bMrp !== undefined) return bMrp;
    }
  }

  // 2. Direct root MRP
  const rootMrp =
    getNum(p.mrp) ??
    getNum(p.pricing_infos?.mrp) ??
    getNum(p.additional_infos?.mrp) ??
    getNum(p.additional_infos?.custom_fields?.mrp) ??
    getNum(p.datas?.mrp) ??
    getNum(p.datas?.pricing_infos?.mrp) ??
    getNum(p.datas?.custom_fields?.mrp) ??
    getNum(p.custom_fields?.mrp);

  if (rootMrp !== undefined) return rootMrp;

  // 3. Fallback to any active batch MRP
  if (batches.length > 0) {
    for (const b of batches) {
      if (!b) continue;
      const bMrp =
        getNum(b.pricing_infos?.mrp) ??
        getNum(b.mrp) ??
        getNum(b.datas?.pricing_infos?.mrp) ??
        getNum(b.datas?.mrp) ??
        getNum(b.pricing_infos?.additional_infos?.mrp) ??
        getNum(b.additional_infos?.mrp);
      if (bMrp !== undefined) return bMrp;
    }
  }

  return undefined;
}

/**
 * Extracts a product attribute value (Batch no, Expiry date, HSN, MRP, etc.) for a line item on an invoice.
 */
export function extractItemAttributeValue(
  field: { id?: string; label?: string; attr?: string; itemSource?: string; value?: string; displayValue?: any; itemShow?: string },
  line: any,
  _index?: number,
  item?: any
): string {
  if (!field) return "";

  // If staff was asked for input per item or fixed custom text
  if (field.itemSource === "ask") {
    const customVal =
      line?.customValues?.[field.id || ""] ??
      item?.customValues?.[field.id || ""] ??
      (line?.serialNumbers && field.label?.toLowerCase().includes("serial") ? line.serialNumbers.join(", ") : undefined) ??
      field.displayValue ??
      field.value;
    return customVal ? String(customVal) : "—";
  }

  // Determine attribute key robustly (label takes priority to avoid misconfigured defaults)
  const lbl = (field.label || "").toLowerCase().trim();
  let attr = inferItemAttr(field.label, field.attr);

  const prod = line?._product || item?._product || {};
  const batchId = line?.batchId || item?.batchId || line?.batch_id || item?.batch_id;
  const variantId = line?.variantId || item?.variantId;

  const batchNameCand =
    line?.batch_name ||
    line?.batchName ||
    line?.batch_no ||
    line?.batch_number ||
    line?.datas?.batch_number ||
    line?.datas?.batch_no ||
    line?.datas?.batch_name ||
    (typeof line?.batch === "string" ? line.batch : line?.batch?.batch_name || line?.batch?.name || line?.batch?.batch_no) ||
    item?.batch_name ||
    item?.batchName ||
    item?.batch_no ||
    item?.batch_number ||
    item?.datas?.batch_number ||
    item?.datas?.batch_no ||
    item?.datas?.batch_name ||
    (typeof item?.batch === "string" ? item.batch : item?.batch?.batch_name || item?.batch?.name || item?.batch?.batch_no);

  // Search batches in product or variant
  let matchedBatch: any = null;
  const allBatches = [
    ...(line?.selectedBatch ? [line.selectedBatch] : []),
    ...(item?.selectedBatch ? [item.selectedBatch] : []),
    ...(typeof line?.batch === "object" && line.batch !== null ? [line.batch] : []),
    ...(typeof item?.batch === "object" && item.batch !== null ? [item.batch] : []),
    ...(line?.batch_infos && typeof line.batch_infos === "object" ? (Array.isArray(line.batch_infos) ? line.batch_infos : [line.batch_infos]) : []),
    ...(item?.batch_infos && typeof item.batch_infos === "object" ? (Array.isArray(item.batch_infos) ? item.batch_infos : [item.batch_infos]) : []),
    ...(Array.isArray(line?.batches) ? line.batches : []),
    ...(Array.isArray(item?.batches) ? item.batches : []),
    ...(Array.isArray(prod?.batch_infos) ? prod.batch_infos : []),
    ...(Array.isArray(prod?.batches) ? prod.batches : []),
    ...(typeof prod?.batches === "object" && prod?.batches !== null ? Object.values(prod.batches) : []),
    ...(typeof prod?.batch_infos === "object" && prod?.batch_infos !== null ? Object.values(prod.batch_infos) : []),
    ...(Array.isArray(prod?.datas?.batch_infos) ? prod.datas.batch_infos : []),
    ...(typeof prod?.datas?.batch_infos === "object" && prod?.datas?.batch_infos !== null ? Object.values(prod.datas.batch_infos) : []),
  ];
  if (batchId) {
    matchedBatch = allBatches.find(
      (b: any) => b && (b.id === batchId || b._id === batchId || b.batchId === batchId || b.batch_id === batchId)
    );
  }
  if (!matchedBatch && batchNameCand) {
    const bStr = String(batchNameCand).trim().toLowerCase();
    matchedBatch = allBatches.find((b: any) => {
      if (!b) return false;
      const bId = String(b.id || b._id || b.batchId || b.batch_id || "").toLowerCase();
      const bName = String(b.batch_name || b.name || b.batch_no || b.batch || "").toLowerCase();
      return (bId && bId === bStr) || (bName && bName === bStr);
    });
  }
  if (!matchedBatch && allBatches.length === 1) {
    matchedBatch = allBatches[0];
  }

  const allVariants = [
    ...(Array.isArray(prod?.variants) ? prod.variants : []),
    ...(Array.isArray(prod?.variant_infos) ? prod.variant_infos : []),
  ];
  let matchedVariant: any = null;
  if (variantId) {
    matchedVariant = allVariants.find(
      (v: any) => v && (v.id === variantId || v._id === variantId || v.variant_id === variantId)
    );
    if (!matchedBatch && matchedVariant) {
      const vBatches = [
        ...(Array.isArray(matchedVariant.batch_infos) ? matchedVariant.batch_infos : []),
        ...(Array.isArray(matchedVariant.batches) ? matchedVariant.batches : []),
      ];
      if (batchId) {
        matchedBatch = vBatches.find(
          (b: any) => b && (b.id === batchId || b._id === batchId || b.batchId === batchId || b.batch_id === batchId)
        );
      }
      if (!matchedBatch && batchNameCand) {
        const bStr = String(batchNameCand).trim().toLowerCase();
        matchedBatch = vBatches.find((b: any) => {
          if (!b) return false;
          const bId = String(b.id || b._id || b.batchId || b.batch_id || "").toLowerCase();
          const bName = String(b.batch_name || b.name || b.batch_no || b.batch || "").toLowerCase();
          return (bId && bId === bStr) || (bName && bName === bStr);
        });
      }
      if (!matchedBatch && vBatches.length === 1) {
        matchedBatch = vBatches[0];
      }
    }
  }

  // 1. Batch no / Batch Name
  if (attr === "batch" && !lbl.includes("mrp") && !lbl.includes("hsn") && !lbl.includes("exp")) {
    const isRealBatchName = (val: any): boolean => {
      if (!val) return false;
      const s = String(val).trim();
      const l = s.toLowerCase();
      if (!s) return false;
      if (l === "standard" || l === "standard variant" || l === "default") return false;
      return true;
    };

    const candidateBatches = [
      line?.batch_infos?.batch_name,
      line?.batch_infos?.name,
      line?.batch_infos?.batch_no,
      line?.batch_infos?.batch,
      line?.batch_number,
      line?.batch_name,
      line?.batchName,
      line?.batch_no,
      line?.datas?.batch_number,
      line?.datas?.batch_no,
      line?.datas?.batch_name,
      typeof line?.batch === "string" ? line.batch : null,
      line?.batch?.batch_name,
      line?.batch?.name,
      line?.batch?.batch_no,
      line?.selectedBatch?.batch_name,
      line?.selectedBatch?.name,
      line?.selectedBatch?.batch_no,
      item?.batch_infos?.batch_name,
      item?.batch_infos?.name,
      item?.batch_infos?.batch_no,
      item?.batch_infos?.batch,
      item?.batch_number,
      item?.batch_name,
      item?.batchName,
      item?.batch_no,
      item?.datas?.batch_number,
      item?.datas?.batch_no,
      item?.datas?.batch_name,
      typeof item?.batch === "string" ? item.batch : null,
      item?.batch?.batch_name,
      item?.batch?.name,
      item?.batch?.batch_no,
      item?.selectedBatch?.batch_name,
      item?.selectedBatch?.name,
      item?.selectedBatch?.batch_no,
      matchedBatch?.batch_name,
      matchedBatch?.name,
      matchedBatch?.batch_no,
      matchedBatch?.batch,
      prod?.batch_infos?.batch_name,
      prod?.batch_infos?.name,
      prod?.batch_infos?.batch_no,
      prod?.batch_name,
      prod?.batch_no,
      prod?.batch,
    ];

    for (const cand of candidateBatches) {
      if (isRealBatchName(cand)) {
        return String(cand).trim();
      }
    }

    if (batchId && !batchId.startsWith("batch-") && batchId.length < 20 && isRealBatchName(batchId)) {
      return String(batchId).trim();
    }
    if (batchId) {
      const clean = String(batchId).replace(/^batch-/, "");
      return clean.length > 16 ? clean.slice(0, 8) : clean;
    }
    return "—";
  }

  // 2. Expiry date
  if (attr === "expiry") {
    const rawExp =
      line?.batch_infos?.exp_date ||
      line?.batch_infos?.expiry_date ||
      line?.batch_infos?.expiry ||
      line?.expiryDate ||
      line?.expiry_date ||
      line?.expiry ||
      line?.exp_date ||
      line?.datas?.expiry_date ||
      line?.datas?.expiryDate ||
      line?.datas?.expiry ||
      line?.datas?.exp_date ||
      item?.batch_infos?.exp_date ||
      item?.batch_infos?.expiry_date ||
      item?.batch_infos?.expiry ||
      item?.expiryDate ||
      item?.expiry_date ||
      item?.expiry ||
      item?.exp_date ||
      item?.datas?.expiry_date ||
      item?.datas?.expiryDate ||
      matchedBatch?.expiry_date ||
      matchedBatch?.expiryDate ||
      matchedBatch?.expiry ||
      matchedBatch?.exp_date ||
      prod?.expiryDate ||
      prod?.expiry_date ||
      prod?.exp_date ||
      prod?.datas?.expiry_date ||
      matchedVariant?.expiryDate ||
      matchedVariant?.expiry_date;
    if (rawExp) {
      const str = String(rawExp).trim();
      if (str.includes("T")) {
        const dPart = str.split("T")[0];
        const [y, m, d] = dPart.split("-");
        if (y && m && d) return `${d}/${m}/${y}`;
      } else if (str.includes("-") && str.length === 10) {
        const [y, m, d] = str.split("-");
        if (y && m && d) return `${d}/${m}/${y}`;
      }
      return str;
    }
    return "—";
  }

  // 3. HSN code
  if (attr === "hsn" || field.label?.toLowerCase().includes("hsn")) {
    const rawHsn =
      line?.hsn_code ||
      line?.hsn ||
      line?.hsnCode ||
      line?.hsn_no ||
      line?.hsnNo ||
      extractProductHsn(line) ||
      item?.hsn_code ||
      item?.hsn ||
      item?.hsnCode ||
      item?.hsn_no ||
      item?.hsnNo ||
      extractProductHsn(item) ||
      line?.tax_infos?.hsn ||
      line?.tax_infos?.hsn_code ||
      line?.tax_identifiers?.hsn ||
      line?.tax_identifiers?.hsn_code ||
      line?.additional_infos?.hsn ||
      line?.additional_infos?.hsn_code ||
      line?.additional_infos?.custom_fields?.hsn ||
      line?.additional_infos?.custom_fields?.hsn_code ||
      line?.custom_fields?.hsn ||
      line?.custom_fields?.hsn_code ||
      line?.datas?.hsn ||
      line?.datas?.hsn_code ||
      line?.datas?.tax_infos?.hsn ||
      line?.datas?.tax_infos?.hsn_code ||
      line?.datas?.tax_identifiers?.hsn ||
      line?.datas?.custom_fields?.hsn ||
      line?.snapshotItem?.hsnCode ||
      line?.snapshotItem?.hsn_code ||
      line?.snapshotItem?.hsn ||
      item?.tax_infos?.hsn ||
      item?.tax_infos?.hsn_code ||
      item?.tax_identifiers?.hsn ||
      item?.tax_identifiers?.hsn_code ||
      item?.additional_infos?.hsn ||
      item?.additional_infos?.hsn_code ||
      item?.additional_infos?.custom_fields?.hsn ||
      item?.additional_infos?.custom_fields?.hsn_code ||
      item?.custom_fields?.hsn ||
      item?.custom_fields?.hsn_code ||
      item?.datas?.hsn ||
      item?.datas?.hsn_code ||
      item?.datas?.tax_infos?.hsn ||
      item?.datas?.tax_infos?.hsn_code ||
      item?.datas?.tax_identifiers?.hsn ||
      item?.datas?.custom_fields?.hsn ||
      item?.snapshotItem?.hsnCode ||
      item?.snapshotItem?.hsn_code ||
      item?.snapshotItem?.hsn ||
      prod?.hsn_code ||
      prod?.hsn ||
      prod?.hsnCode ||
      extractProductHsn(prod) ||
      matchedVariant?.hsn_code ||
      matchedVariant?.hsn ||
      matchedVariant?.hsnCode ||
      extractProductHsn(matchedVariant) ||
      matchedBatch?.hsn_code ||
      matchedBatch?.hsn ||
      extractProductHsn(matchedBatch);
    if (rawHsn) {
      const s = String(rawHsn).trim();
      if (s !== "" && s !== "—" && s !== "undefined" && s !== "null") return s;
    }
    return "—";
  }

  // 4. MRP
  if (attr === "mrp" || lbl.includes("mrp")) {
    const rawMrp =
      line?.mrp ??
      line?.datas?.mrp ??
      line?.datas?.pricing_infos?.mrp ??
      line?.pricing_infos?.mrp ??
      line?.additional_infos?.mrp ??
      line?.snapshotItem?.mrp ??
      item?.mrp ??
      item?.datas?.mrp ??
      item?.datas?.pricing_infos?.mrp ??
      item?.pricing_infos?.mrp ??
      item?.additional_infos?.mrp ??
      item?.snapshotItem?.mrp ??
      matchedBatch?.pricing_infos?.mrp ??
      matchedBatch?.mrp ??
      matchedBatch?.datas?.pricing_infos?.mrp ??
      matchedBatch?.datas?.mrp ??
      matchedBatch?.pricing_infos?.additional_infos?.mrp ??
      matchedVariant?.pricing_infos?.mrp ??
      matchedVariant?.mrp ??
      prod?.mrp ??
      prod?.datas?.mrp ??
      prod?.datas?.pricing_infos?.mrp ??
      prod?.pricing_infos?.mrp ??
      prod?.additional_infos?.mrp ??
      prod?.additional_infos?.custom_fields?.mrp ??
      prod?.custom_fields?.mrp ??
      extractProductMrp(prod, batchId || batchNameCand);
    const num = Number(rawMrp);
    if (!isNaN(num) && num > 0) return `₹${num.toFixed(2)}`;
    return "—";
  }

  // 5. Manufacturer / Supplier
  if (attr === "mfr") {
    const rawMfr =
      line?.supplier ||
      line?.supplier_name ||
      line?.supplier_infos?.name ||
      line?.datas?.supplier ||
      line?.datas?.supplier_name ||
      line?.manufacturer ||
      line?.mfr ||
      item?.supplier ||
      item?.supplier_name ||
      item?.supplier_infos?.name ||
      item?.manufacturer ||
      prod?.supplier ||
      prod?.supplier_name ||
      prod?.supplier_infos?.name ||
      prod?.datas?.supplier ||
      prod?.datas?.supplier_name ||
      prod?.manufacturer ||
      prod?.mfr ||
      prod?.additional_infos?.manufacturer ||
      prod?.brand ||
      prod?.brand_infos?.name ||
      prod?.brand_name ||
      prod?.vendor ||
      prod?.vendor_name;
    if (rawMfr) return String(rawMfr);
    return "—";
  }

  // 6. Pack size
  if (attr === "pack") {
    const rawPack =
      line?.selectedUnit ||
      line?.unit ||
      item?.selectedUnit ||
      item?.unit ||
      prod?.unitInfos?.name ||
      prod?.unit_infos?.name ||
      prod?.unit ||
      prod?.pack_size;
    if (rawPack) return String(rawPack);
    return "1 pc";
  }

  // 7. Size / colour / variant
  if (attr === "size") {
    const rawSize =
      line?.variantName ||
      matchedVariant?.name ||
      matchedVariant?.size ||
      prod?.variant_infos?.size ||
      line?.size;
    if (rawSize) return String(rawSize);
    if (line?.name && line.name.includes(" - ")) {
      return line.name.split(" - ")[1].trim();
    }
    return "—";
  }

  return field.displayValue ?? field.value ?? "—";
}
