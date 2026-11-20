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

/**
 * Loads custom fields specifically defined in Billing Receipt Template Settings
 */
export function getReceiptCustomFields(): CustomFieldDefinition[] {
  try {
    const raw = localStorage.getItem(BILLING_RECEIPT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.fields)) {
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
            attr: f.attr || (f.placement === "item" ? "batch" : undefined),
            itemShow: f.itemShow || (f.placement === "item" ? "column" : undefined),
            source: "receipt",
          }));
      }
    }
  } catch (e) {
    console.debug("Failed to read receipt custom fields:", e);
  }
  return [];
}

/**
 * Loads custom fields specifically defined in Invoice Template Settings
 */
export function getInvoiceCustomFields(): CustomFieldDefinition[] {
  try {
    const raw = localStorage.getItem(INVOICE_SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.fields)) {
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
            attr: f.attr || (f.placement === "item" ? "batch" : undefined),
            itemShow: f.itemShow || (f.placement === "item" ? "column" : undefined),
            source: "invoice",
          }));
      }
    }
  } catch (e) {
    console.debug("Failed to read invoice custom fields:", e);
  }
  return [];
}

/**
 * Loads and consolidates all active custom fields from both Billing Receipt Template Settings
 * and Invoice Template Settings. If a field exists in both, it deduplicates by label while
 * ensuring that if either asks while billing ('ask'), mode 'ask' takes priority.
 */
export function getActiveCustomFields(): CustomFieldDefinition[] {
  const fieldsMap = new Map<string, CustomFieldDefinition>();

  // 1. Read Receipt Template Settings
  try {
    const rawReceipt = localStorage.getItem(BILLING_RECEIPT_STORAGE_KEY);
    if (rawReceipt) {
      const parsed = JSON.parse(rawReceipt);
      if (Array.isArray(parsed.fields)) {
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
              attr: f.attr || (f.placement === "item" ? "batch" : undefined),
              itemShow: f.itemShow || (f.placement === "item" ? "column" : undefined),
              source: "receipt",
            });
          }
        });
      }
    }
  } catch (e) {
    console.debug("Failed to read receipt custom fields:", e);
  }

  // 2. Read Invoice Template Settings
  try {
    const rawInvoice = localStorage.getItem(INVOICE_SETTINGS_STORAGE_KEY);
    if (rawInvoice) {
      const parsed = JSON.parse(rawInvoice);
      if (Array.isArray(parsed.fields)) {
        parsed.fields.forEach((f: any) => {
          if (f && f.show !== false && f.label && f.label.trim()) {
            const key = f.label.trim().toLowerCase();
            const existing = fieldsMap.get(key);
            const isItemProduct = f.placement === "item" && f.itemSource !== "ask";
            if (existing) {
              if (!isItemProduct && f.mode === "ask") existing.mode = "ask";
              if (f.required) existing.required = true;
              if (f.value && !existing.value) existing.value = f.value;
              if (f.attr && !existing.attr) existing.attr = f.attr;
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
                attr: f.attr || (f.placement === "item" ? "batch" : undefined),
                itemShow: f.itemShow || (f.placement === "item" ? "column" : undefined),
                source: "invoice",
              });
            }
          }
        });
      }
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

  // Determine attribute key
  let attr = field.attr;
  if (!attr && field.label) {
    const l = field.label.toLowerCase();
    if (l.includes("batch")) attr = "batch";
    else if (l.includes("expir") || l.includes("exp")) attr = "expiry";
    else if (l.includes("hsn")) attr = "hsn";
    else if (l.includes("mrp")) attr = "mrp";
    else if (l.includes("mfr") || l.includes("manuf") || l.includes("brand")) attr = "mfr";
    else if (l.includes("pack") || l.includes("unit")) attr = "pack";
    else if (l.includes("size") || l.includes("color") || l.includes("colour")) attr = "size";
  }

  const prod = line?._product || item?._product || {};
  const batchId = line?.batchId || item?.batchId;
  const variantId = line?.variantId || item?.variantId;

  // Search batches in product or variant
  let matchedBatch: any = null;
  const allBatches = [
    ...(Array.isArray(prod?.batch_infos) ? prod.batch_infos : []),
    ...(Array.isArray(prod?.batches) ? prod.batches : []),
    ...(typeof prod?.batches === "object" && prod?.batches !== null ? Object.values(prod.batches) : []),
    ...(typeof prod?.batch_infos === "object" && prod?.batch_infos !== null ? Object.values(prod.batch_infos) : []),
  ];
  if (batchId) {
    matchedBatch = allBatches.find(
      (b: any) => b && (b.id === batchId || b._id === batchId || b.batchId === batchId || b.batch_id === batchId)
    );
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
    }
  }

  // 1. Batch no
  if (attr === "batch") {
    const rawBatch =
      line?.batch_no ||
      line?.batchName ||
      line?.batch ||
      item?.batch_no ||
      item?.batchName ||
      item?.batch ||
      matchedBatch?.batch_no ||
      matchedBatch?.batch_name ||
      matchedBatch?.name ||
      matchedBatch?.batch ||
      prod?.batch_no ||
      prod?.batch_name ||
      prod?.batch ||
      (batchId && !batchId.startsWith("batch-") && batchId.length < 20 ? batchId : "");
    if (rawBatch) return String(rawBatch);
    if (batchId) {
      const clean = String(batchId).replace(/^batch-/, "");
      return clean.length > 16 ? clean.slice(0, 8) : clean;
    }
    return "—";
  }

  // 2. Expiry date
  if (attr === "expiry") {
    const rawExp =
      line?.expiryDate ||
      line?.expiry_date ||
      line?.expiry ||
      line?.exp_date ||
      item?.expiryDate ||
      item?.expiry_date ||
      item?.expiry ||
      item?.exp_date ||
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
  if (attr === "hsn") {
    const rawHsn =
      line?.hsn ||
      line?.hsn_code ||
      item?.hsn ||
      item?.hsn_code ||
      prod?.hsn ||
      prod?.hsn_code ||
      prod?.datas?.hsn ||
      prod?.datas?.hsn_code ||
      prod?.additional_infos?.hsn ||
      prod?.additional_infos?.hsn_code ||
      matchedVariant?.hsn ||
      matchedVariant?.hsn_code ||
      matchedVariant?.datas?.hsn ||
      matchedVariant?.additional_infos?.hsn;
    if (rawHsn) return String(rawHsn);
    return "—";
  }

  // 4. MRP
  if (attr === "mrp") {
    const rawMrp =
      line?.mrp ??
      item?.mrp ??
      matchedBatch?.mrp ??
      matchedVariant?.mrp ??
      prod?.mrp ??
      prod?.pricing_infos?.mrp;
    const num = Number(rawMrp);
    if (!isNaN(num) && num > 0) return `₹${num.toFixed(2)}`;
    return "—";
  }

  // 5. Manufacturer
  if (attr === "mfr") {
    const rawMfr =
      line?.manufacturer ||
      line?.mfr ||
      item?.manufacturer ||
      prod?.manufacturer ||
      prod?.mfr ||
      prod?.additional_infos?.manufacturer ||
      prod?.brand ||
      prod?.brand_infos?.name ||
      prod?.brand_name;
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
