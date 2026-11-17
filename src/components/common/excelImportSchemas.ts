/**
 * excelImportSchemas.ts
 *
 * Static column definitions for bulk-import Excel flows.
 * Derived from the OpenAPI JSON docs (customer.json, supplier.json, inventories.json).
 *
 * Each ImportColumnDef describes one FLAT column in the Excel sheet.
 * The `nested` field maps a flat column to a nested backend object (e.g. contact_infos.email).
 */

export type FieldType = "string" | "number" | "boolean";

export interface ImportColumnDef {
  /** Flat key used as the Excel column header */
  key: string;
  /** Human-readable label shown in the UI */
  label: string;
  /** Whether the field is required by the backend schema */
  required: boolean;
  /** Expected JS type */
  type: FieldType;
  /** Example value placed in the sample row */
  example?: string;
  /**
   * If set, the value should be nested under this key in the output payload.
   * Format: "parentKey"  →  { parentKey: { [key]: value } }
   * Format: "parentKey.childKey" for double nesting (not needed currently)
   */
  nested?: string;
}

// ────────────────────────────────────────────────────────────────────────────────
// Customer  (CreateCustomerSchema)
// ────────────────────────────────────────────────────────────────────────────────
export const CUSTOMER_IMPORT_COLUMNS: ImportColumnDef[] = [
  {
    key: "name",
    label: "Customer Name",
    required: true,
    type: "string",
    example: "John Doe",
  },
  {
    key: "mobile_number",
    label: "Mobile Number",
    required: false,
    type: "string",
    example: "9876543210",
    nested: "contact_infos",
  },
  {
    key: "email",
    label: "Email",
    required: false,
    type: "string",
    example: "john@example.com",
    nested: "contact_infos",
  },
  {
    key: "zipcode",
    label: "Zipcode",
    required: true,
    type: "string",
    example: "560001",
    nested: "location_infos",
  },
  {
    key: "country",
    label: "Country",
    required: true,
    type: "string",
    example: "India",
    nested: "location_infos",
  },
  {
    key: "state",
    label: "State",
    required: true,
    type: "string",
    example: "Karnataka",
    nested: "location_infos",
  },
  {
    key: "full_address",
    label: "Full Address",
    required: true,
    type: "string",
    example: "123 Main Street, Bengaluru",
    nested: "location_infos",
  },
  {
    key: "can_have_credit",
    label: "Can Have Credit (true/false)",
    required: false,
    type: "boolean",
    example: "false",
  },
  {
    key: "credit_limit",
    label: "Credit Limit",
    required: false,
    type: "number",
    example: "5000",
    nested: "credit_infos",
  },
];

// ────────────────────────────────────────────────────────────────────────────────
// Supplier  (CreateSupplierSchema)
// ────────────────────────────────────────────────────────────────────────────────
export const SUPPLIER_IMPORT_COLUMNS: ImportColumnDef[] = [
  {
    key: "name",
    label: "Supplier Name",
    required: true,
    type: "string",
    example: "ABC Supplies Pvt Ltd",
  },
  {
    key: "email",
    label: "Email",
    required: false,
    type: "string",
    example: "supplier@abc.com",
    nested: "contact_infos",
  },
  {
    key: "mobile_number",
    label: "Mobile Number",
    required: false,
    type: "string",
    example: "9123456780",
    nested: "contact_infos",
  },
  {
    key: "full_address",
    label: "Full Address",
    required: false,
    type: "string",
    example: "456 Industrial Area, Mumbai",
    nested: "location_infos",
  },
  {
    key: "zipcode",
    label: "Zipcode",
    required: false,
    type: "string",
    example: "400001",
    nested: "location_infos",
  },
  {
    key: "country",
    label: "Country",
    required: false,
    type: "string",
    example: "India",
    nested: "location_infos",
  },
  {
    key: "state",
    label: "State",
    required: false,
    type: "string",
    example: "Maharashtra",
    nested: "location_infos",
  },
  {
    key: "contact_person_name",
    label: "Contact Person Name",
    required: false,
    type: "string",
    example: "Ravi Kumar",
    nested: "contact_person_infos",
  },
  {
    key: "contact_person_email",
    label: "Contact Person Email",
    required: false,
    type: "string",
    example: "ravi@abc.com",
    nested: "contact_person_infos",
  },
  {
    key: "contact_person_mobile",
    label: "Contact Person Mobile",
    required: false,
    type: "string",
    example: "9988776655",
    nested: "contact_person_infos",
  },
  {
    key: "gst_no",
    label: "GST Number",
    required: false,
    type: "string",
    example: "27AAPFU0939F1ZV",
  },
];

// ────────────────────────────────────────────────────────────────────────────────
// Inventory  (CreateProdInvSchema)
// ────────────────────────────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────────────────────────
// Product Master (Without Stock Information)
// ────────────────────────────────────────────────────────────────────────────────
export const PRODUCT_IMPORT_COLUMNS: ImportColumnDef[] = [
  {
    key: "name",
    label: "Product Name",
    required: true,
    type: "string",
    example: "Premium Wireless Headphones",
  },
  {
    key: "description",
    label: "Description",
    required: false,
    type: "string",
    example: "High quality wireless headphones with noise cancellation",
  },
  {
    key: "brand",
    label: "Brand",
    required: false,
    type: "string",
    example: "Sony",
  },
  {
    key: "barcode",
    label: "Barcode",
    required: false,
    type: "string",
    example: "8901234567890",
  },
  {
    key: "sku",
    label: "SKU",
    required: false,
    type: "string",
    example: "WH-1000XM5-BLK",
  },
  {
    key: "buy_price",
    label: "Buy Price",
    required: false,
    type: "number",
    example: "8000",
  },
  {
    key: "sell_price",
    label: "Sell Price",
    required: false,
    type: "number",
    example: "12000",
  },
  {
    key: "mrp",
    label: "MRP",
    required: false,
    type: "number",
    example: "15000",
  },
  {
    key: "gst",
    label: "GST (%)",
    required: false,
    type: "string",
    example: "18%",
  },
  {
    key: "reorder_point",
    label: "Reorder Point",
    required: false,
    type: "number",
    example: "1",
  },
  {
    key: "storage_location",
    label: "Storage Location",
    required: false,
    type: "string",
    example: "Rack A - Shelf 2",
  },
  {
    key: "have_tracking",
    label: "Have Tracking (true/false)",
    required: false,
    type: "boolean",
    example: "true",
  },
];

export const INVENTORY_IMPORT_COLUMNS: ImportColumnDef[] = [
  {
    key: "name",
    label: "Product Name",
    required: true,
    type: "string",
    example: "Premium Wireless Headphones",
  },
  {
    key: "description",
    label: "Description",
    required: false,
    type: "string",
    example: "High quality wireless headphones with noise cancellation",
  },
  {
    key: "stocks",
    label: "Number of stocks",
    required: true,
    type: "number",
    example: "50",
  },
  {
    key: "brand",
    label: "Brand",
    required: false,
    type: "string",
    example: "Sony",
  },
  {
    key: "barcode",
    label: "Barcode",
    required: false,
    type: "string",
    example: "8901234567890",
  },
  {
    key: "sku",
    label: "SKU",
    required: false,
    type: "string",
    example: "WH-1000XM5-BLK",
  },
  {
    key: "buy_price",
    label: "Buy Price",
    required: true,
    type: "number",
    example: "8000",
  },
  {
    key: "sell_price",
    label: "Sell Price",
    required: true,
    type: "number",
    example: "12000",
  },
  {
    key: "mrp",
    label: "MRP",
    required: false,
    type: "number",
    example: "15000",
  },

  {
    key: "gst",
    label: "GST (%)",
    required: false,
    type: "string",
    example: "18%",
  },
  {
    key: "reorder_point",
    label: "Reorder Point",
    required: false,
    type: "number",
    example: "1",
  },
  {
    key: "storage_location",
    label: "Storage Location",
    required: false,
    type: "string",
    example: "Rack A - Shelf 2",
  },
  {
    key: "have_tracking",
    label: "Have Tracking (true/false)",
    required: false,
    type: "boolean",
    example: "false",
  },

];

// ────────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────────

export type EntityType = "inventory" | "product" | "customer" | "supplier";

export function getColumnsForEntity(entity: EntityType): ImportColumnDef[] {
  switch (entity) {
    case "customer":
      return CUSTOMER_IMPORT_COLUMNS;
    case "supplier":
      return SUPPLIER_IMPORT_COLUMNS;
    case "inventory":
      return INVENTORY_IMPORT_COLUMNS;
    case "product":
      return PRODUCT_IMPORT_COLUMNS;
  }
}

/**
 * Transforms a flat Excel row (Record<string, any>) into the
 * nested JSON payload expected by the backend bulk endpoint.
 */
export function transformRowToPayload(
  row: Record<string, any>,
  columns: ImportColumnDef[],
  shopId: string,
  entity: EntityType
): Record<string, any> {
  const payload: Record<string, any> = { shop_id: shopId };
  const nestedGroups: Record<string, Record<string, any>> = {};

  for (const col of columns) {
    const rawVal = row[col.key];
    if (rawVal === undefined || rawVal === null || rawVal === "") continue;

    // Coerce types
    let value: any = rawVal;
    if (col.type === "number") {
      value = Number(rawVal);
      if (isNaN(value)) continue;
    } else if (col.type === "boolean") {
      if (typeof rawVal === "boolean") {
        value = rawVal;
      } else {
        const s = String(rawVal).trim().toLowerCase();
        value = s === "true" || s === "1" || s === "yes";
      }
    } else {
      value = String(rawVal).trim();
    }

    if (col.nested) {
      if (!nestedGroups[col.nested]) nestedGroups[col.nested] = {};
      // Handle contact_person_infos sub-keys  (key = "contact_person_email" → "email")
      const subKey = col.key
        .replace(/^contact_person_/, "")
        .replace(/^credit_/, "");
      nestedGroups[col.nested][subKey] = value;
    } else {
      payload[col.key] = value;
    }
  }

  // Merge nested groups
  for (const [group, values] of Object.entries(nestedGroups)) {
    if (group === "credit_infos") {
      // credit_infos requires at least { limit }
      if (values.limit !== undefined) {
        payload.credit_infos = values;
      }
    } else {
      payload[group] = values;
    }
  }

  // Entity-specific defaults / required fields
  if (entity === "customer") {
    if (!payload.contact_infos) payload.contact_infos = {};
    if (!payload.location_infos)
      payload.location_infos = {
        zipcode: "",
        country: "",
        state: "",
        full_address: "",
      };
    if (payload.can_have_credit === undefined)
      payload.can_have_credit = false;
  }

  if (entity === "supplier") {
    if (!payload.contact_infos) payload.contact_infos = {};
    if (!payload.location_infos) payload.location_infos = {};
    // Remove contact_person_infos if empty
    if (
      payload.contact_person_infos &&
      Object.keys(payload.contact_person_infos).length === 0
    ) {
      delete payload.contact_person_infos;
    }
  }

  if (entity === "product" || entity === "inventory") {
    if (payload.brand && payload.name && !payload.name.toLowerCase().includes(payload.brand.toLowerCase())) {
      payload.name = `${payload.brand} ${payload.name}`;
    }
    // Required fields defaults
    if (!payload.description) payload.description = payload.name || "";
    if (!payload.category_id) payload.category_id = "";
    if (!payload.unit_id) payload.unit_id = "";
    if (entity === "product") {
      if (payload.have_tracking === undefined) payload.have_tracking = true;
      payload.stocks = 0;
      payload.is_active = false; // Product list import: always inactive
    } else {
      const trackingEnabled = isStockTrackingEnabled(row, entity);
      payload.have_tracking = trackingEnabled;
      if (!trackingEnabled) {
        // If stock tracking is false, stock is not needed and ignored even if given
        payload.stocks = 0;
      } else {
        const numStock = Number(payload.stocks);
        payload.stocks = !isNaN(numStock) && numStock >= 0 ? numStock : 0;
      }
      payload.is_active = true; // Live stock list import: always active
    }
    if (!payload.type_infos)
      payload.type_infos = {
        has_variant: false,
        has_batch: false,
        has_serialno: false,
      };
    if (!payload.gst) payload.gst = "0%";
    if (payload.reorder_point === undefined) payload.reorder_point = 1;
    if (payload.mrp === undefined || payload.mrp === null || Number(payload.mrp) <= 0) {
      if (payload.sell_price && Number(payload.sell_price) > 0) {
        payload.mrp = Number(payload.sell_price);
      }
    } else if (payload.sell_price && Number(payload.sell_price) > Number(payload.mrp)) {
      payload.mrp = Number(payload.sell_price);
    }
  }

  return payload;
}

export function isStockTrackingEnabled(row: Record<string, any>, entity?: EntityType): boolean {
  if (entity === "product") return true;
  const rawTracking = row["have_tracking"];
  if (rawTracking === undefined || rawTracking === null || String(rawTracking).trim() === "") {
    // Default to true for inventory stocks if not specified
    return true;
  }
  const str = String(rawTracking).trim().toLowerCase();
  return ["true", "1", "yes"].includes(str);
}

export interface RowValidationError {
  rowIndex: number;
  errors: Record<string, string>;
}

function normalizeTokens(name: string): string[] {
  return name.toLowerCase().replace(/[^a-z0-9]/g, " ").split(/\s+/).filter(Boolean);
}

export function isSimilarName(name1: string, name2: string): boolean {
  if (!name1 || !name2) return false;
  const n1 = name1.toLowerCase().trim();
  const n2 = name2.toLowerCase().trim();
  if (n1 === n2) return true;
  const t1 = normalizeTokens(name1);
  const t2 = normalizeTokens(name2);
  if (t1.length === 0 || t2.length === 0) return false;
  if (t1.slice().sort().join(" ") === t2.slice().sort().join(" ")) return true;
  return false;
}

/**
 * Validates a single flat row against the column definitions.
 * Returns a map of { columnKey: errorMessage } or an empty map if valid.
 */
export function validateRow(
  row: Record<string, any>,
  columns: ImportColumnDef[],
  entity?: EntityType,
  existingProductNames?: string[],
  seenBatchNames?: Set<string>
): Record<string, string> {
  const errors: Record<string, string> = {};
  const trackingEnabled = isStockTrackingEnabled(row, entity);

  for (const col of columns) {
    const val = row[col.key];
    const isEmpty =
      val === undefined ||
      val === null ||
      String(val).trim() === "";

    // Specific rule for stock list / inventory import:
    // When stock tracking is True -> stock is mandatory
    // When stock tracking is False -> stock is not needed (and ignored even if given)
    if (col.key === "stocks" && (entity === "inventory" || columns.some(c => c.key === "stocks"))) {
      if (trackingEnabled) {
        if (isEmpty) {
          errors[col.key] = `"${col.label}" is required when stock tracking is enabled`;
          continue;
        }
      } else {
        // Stock tracking is disabled: stock is not needed and ignored
        continue;
      }
    }

    if (col.required && isEmpty) {
      errors[col.key] = `"${col.label}" is required`;
      continue;
    }

    if (!isEmpty) {
      if (col.type === "number") {
        const numVal = Number(val);
        if (isNaN(numVal)) {
          errors[col.key] = `"${col.label}" must be a number`;
        } else if ((col.key === "stocks" || col.key === "buy_price" || col.key === "sell_price") && numVal < 0) {
          errors[col.key] = `"${col.label}" cannot be negative`;
        } else if (col.required && (col.key === "buy_price" || col.key === "sell_price") && numVal <= 0) {
          errors[col.key] = `"${col.label}" must be greater than 0`;
        }
      }
      if (
        col.type === "boolean" &&
        typeof val !== "boolean" &&
        !["true", "false", "1", "0", "yes", "no"].includes(
          String(val).trim().toLowerCase()
        )
      ) {
        errors[col.key] = `"${col.label}" must be true or false`;
      }

      // Check product name uniqueness against existing products and in-batch duplicates
      if (col.key === "name" && (entity === "inventory" || entity === "product")) {
        const cleanVal = String(val).trim().toLowerCase();
        if (cleanVal) {
          if (existingProductNames && existingProductNames.length > 0) {
            const existingMatch = existingProductNames.find(
              (en) => en && (en.trim().toLowerCase() === cleanVal || isSimilarName(val, en))
            );
            if (existingMatch) {
              errors[col.key] = `Product "${val}" already exists in this shop${
                existingMatch.trim().toLowerCase() !== cleanVal ? ` (similar to "${existingMatch}")` : ""
              }`;
            }
          }
          if (!errors[col.key] && seenBatchNames && seenBatchNames.has(cleanVal)) {
            errors[col.key] = `Duplicate product "${val}" in file`;
          }
        }
      }
    }
  }

  // Cross-field validation: Sell Price vs MRP
  const sellPrice = Number(row["sell_price"]);
  const mrp = Number(row["mrp"]);
  if (!isNaN(sellPrice) && !isNaN(mrp) && mrp > 0 && sellPrice > mrp) {
    errors["sell_price"] = `Selling price (${sellPrice}) cannot exceed MRP (${mrp})`;
  }

  return errors;
}

/**
 * Validates an entire list of rows, checking field validations, shop-level existing names,
 * and within-file batch duplicate names sequentially.
 */
export function validateAllRows(
  rows: Record<string, any>[],
  columns: ImportColumnDef[],
  entity?: EntityType,
  existingProductNames?: string[]
): RowValidationError[] {
  const errs: RowValidationError[] = [];
  const seenBatchNames = new Set<string>();

  rows.forEach((row) => {
    const e = validateRow(row, columns, entity, existingProductNames, seenBatchNames);
    if (row.name && String(row.name).trim()) {
      seenBatchNames.add(String(row.name).trim().toLowerCase());
    }
    if (Object.keys(e).length > 0) {
      errs.push({ rowIndex: row._rowIndex, errors: e });
    }
  });

  return errs;
}
