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
    example: "5",
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

export type EntityType = "inventory" | "customer" | "supplier";

export function getColumnsForEntity(entity: EntityType): ImportColumnDef[] {
  switch (entity) {
    case "customer":
      return CUSTOMER_IMPORT_COLUMNS;
    case "supplier":
      return SUPPLIER_IMPORT_COLUMNS;
    case "inventory":
      return INVENTORY_IMPORT_COLUMNS;
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

  if (entity === "inventory") {
    if (payload.brand && payload.name && !payload.name.toLowerCase().includes(payload.brand.toLowerCase())) {
      payload.name = `${payload.brand} ${payload.name}`;
    }
    // Required fields defaults
    if (!payload.description) payload.description = payload.name || "";
    if (!payload.category_id) payload.category_id = "";
    if (!payload.unit_id) payload.unit_id = "";
    if (payload.have_tracking === undefined) payload.have_tracking = false;
    if (!payload.type_infos)
      payload.type_infos = {
        has_variant: false,
        has_batch: false,
        has_serialno: false,
      };
    if (!payload.gst) payload.gst = "0%";
    if (payload.reorder_point === undefined) payload.reorder_point = 5;
  }

  return payload;
}

/**
 * Validates a single flat row against the column definitions.
 * Returns a map of { columnKey: errorMessage } or an empty map if valid.
 */
export function validateRow(
  row: Record<string, any>,
  columns: ImportColumnDef[]
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const col of columns) {
    const val = row[col.key];
    const isEmpty =
      val === undefined ||
      val === null ||
      String(val).trim() === "";

    if (col.required && isEmpty) {
      errors[col.key] = `"${col.label}" is required`;
      continue;
    }

    if (!isEmpty) {
      if (col.type === "number") {
        const numVal = Number(val);
        if (isNaN(numVal)) {
          errors[col.key] = `"${col.label}" must be a number`;
        } else if (col.key === "stocks" && numVal <= 0) {
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
    }
  }

  return errors;
}
