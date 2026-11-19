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
            mode: f.mode || "ask",
            value: f.value || "",
            required: Boolean(f.required),
            show: true,
            itemSource: f.itemSource || "product",
            attr: f.attr,
            itemShow: f.itemShow || "under",
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
            mode: f.mode || "ask",
            value: f.value || "",
            required: Boolean(f.required),
            show: true,
            itemSource: f.itemSource || "product",
            attr: f.attr,
            itemShow: f.itemShow || "under",
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
            fieldsMap.set(key, {
              id: f.id || `f_${key}`,
              label: f.label.trim(),
              placement: f.placement || "customer",
              type: f.type || "text",
              mode: f.mode || "ask",
              value: f.value || "",
              required: Boolean(f.required),
              show: true,
              itemSource: f.itemSource || "product",
              attr: f.attr,
              itemShow: f.itemShow || "under",
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
            if (existing) {
              // If either asks while billing, ensure staff is asked
              if (f.mode === "ask") existing.mode = "ask";
              if (f.required) existing.required = true;
              if (f.value && !existing.value) existing.value = f.value;
              existing.source = "both";
            } else {
              fieldsMap.set(key, {
                id: f.id || `f_${key}`,
                label: f.label.trim(),
                placement: f.placement || "customer",
                type: f.type || "text",
                mode: f.mode || "ask",
                value: f.value || "",
                required: Boolean(f.required),
                show: true,
                itemSource: f.itemSource || "product",
                attr: f.attr,
                itemShow: f.itemShow || "under",
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
    };
  });
}
