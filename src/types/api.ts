export interface ApiDetail {
  msg: string;
  status_code: number;
  success: boolean;
}

export interface ApiResponse<T> {
  detail: ApiDetail;
  data: T | T[];
}

export interface ProductRecord {
  id: string;
  barcode: string;
  date?: string;
  datas: Record<string, any>;
  variants?: any[];
  batches?: any[];
}

export interface SupplierRecord {
  id: string;
  shop_id: string;
  ui_id: number;
  name: string;
  gst_no: string;
  
  // New nested schema fields
  contact_infos?: {
    email?: string;
    mobile_number?: string;
  };
  location_infos?: {
    zipcode?: string;
    country?: string;
    state?: string;
    full_address?: string;
    city?: string; // Some legacy or transitional fields might have this
  };
  contact_person_infos?: {
    name?: string;
    email?: string;
    mobile_number?: string;
  };
  additional_infos?: {
    city?: string;
    [key: string]: any;
  };

  // Legacy flat fields
  email?: string;
  mobile_number?: string;
  contact_info?: {
    contact_person?: string;
    type?: string;
    address?: string;
    city?: string;
    [key: string]: any;
  };
  datas?: {
    internal_notes?: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

// Employee API returns FLAT fields — no datas wrapper
export interface EmployeeRecord {
  id: string;
  shop_id: string;
  ui_id: number;
  name: string;
  email: string;
  mobile_number: string;
  role: string;
  department: string;
  created_at: string;
  updated_at: string;
  joined_date: string;
  datas?: {
    salary_range?: number;
    address?: {
      full_address?: string;
      zip_code?: string;
    };
  };
  [key: string]: unknown;
}

export interface CustomerRecord {
  id: string;
  shop_id: string;
  ui_id: number;
  name: string;
  // New nested schema fields
  contact_infos?: {
    mobile_number?: string;
    email?: string;
  };
  credit_infos?: {
    limit?: number;
    notes?: string;
    terms?: string;
  };
  location_infos?: {
    zipcode?: string;
    country?: string;
    state?: string;
    full_address?: string;
  };
  can_have_credit?: boolean;
  outstanding?: number;
  // Legacy flat fields (kept for backward-compatible reads)
  email?: string;
  mobile_number?: string;
  credit_limit?: number;
  is_active?: boolean;
  datas?: {
    address?: {
      full_address?: string;
      zip_code?: string;
    };
    additional_notes?: string;
    payment_cycle?: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface InventoryBatch {
  name: string;
  expiry_date: string;
  manufacturing_date: string;
}

export interface InventoryBatchResponse {
  id: string;
  name: string;
  stocks: number;
  expiry_date: string;
  manufacturing_date: string;
  serial_numbers?: string[];
}

export interface InventoryVariant {
  name: string;
  sell_price: number;
  buy_price: number;
  stocks: number;
  serial_numbers?: string[];
  batch?: InventoryBatch;
  datas?: Record<string, any>;
}

export interface InventoryResponseVariant {
  name: string;
  sell_price: number;
  buy_price: number;
  stocks: number;
  serial_numbers?: string[];
  batches?: InventoryBatch[];
  datas?: Record<string, any>;
}

export interface InventoryBatch {
  name: string;
  expiry_date: string;
  manufacturing_date: string;
}

export interface InventoryVariant {
  name: string;
  sell_price: number;
  buy_price: number;
  stocks: number;
  serial_numbers?: string[];
  batch?: InventoryBatch;
  datas?: Record<string, any>;
}

export interface InventoryRecord {
  id: string;
  ui_id: number;
  name: string;
  description: string;
  category: string;
  sell_price: number;
  buy_price: number;
  stocks: number;
  barcode: string;
  sku?: string;
  shop_id: string;
  added_by: string;
  datas?: Record<string, any>;
  created_at: string;
  updated_at: string;
  has_variant: boolean;
  has_batch: boolean;
  has_serialno: boolean;
  is_active?: boolean;
  variants?: any[];
  batches?: any[];
  batch?: InventoryBatch;
  serial_number?: any;
  serial_numbers?: string[];
  reorder_point?: number;
  
  // Properties required for ProductDetail and ProductInfos matching ProdInvReadModel
  additional_infos?: Record<string, any>;
  custom_fields?: Record<string, any>;
  reorder_point_infos?: { reorder_point: number };
  category_id?: string;
  pricing_infos?: { buy_price: number; sell_price: number };
  stock_infos?: { available_stocks: number };
  unit_id?: string;
  unit?: string;
  variant_infos?: any[];
  batch_infos?: any;
  serialno_infos?: any;
  type_infos?: { has_batch: boolean; has_variant: boolean; has_serialno: boolean };
  gst?: string;
}

export interface OrderRecord {
  id: string;
  ui_id?: string;
  shop_id: string;
  status: string;
  origin: string;
  orders: string[];
  customer_number?: string;
  customer_name?: string;
  datas?: Record<string, unknown>;
}

// Purchase types: DIRECT | PO_CREATE | PO_UPDATE | PRODUCTION
export interface PurchaseRecord {
  id: string;
  ui_id?: string;
  shop_id: string;
  type: "DIRECT" | "PO_CREATE" | "PO_UPDATE" | "PRODUCTION";
  datas: Record<string, unknown>;
  date?: string;
  total_items:number,
  additional_charges?: {
    delivery_charge?: number;
    other_charge?: number;
    [key: string]: any;
  };
}

export interface StockAdjRecord {
  id: string;
  shop_id: string;
  datas: Record<string, unknown>;
  date?: string;
}

export interface ShopRecord {
  id: string;
  ui_id: number;
  name: string;
  category: string;
  address: {
    street: string;
    city: string;
    pincode: string;
    [key: string]: any;
  };
  business_infos: {
    business_type: string;
    gst?: string;
    currency: string;
    open_time?: string;
    close_time?: string;
    [key: string]: any;
  };
  datas: {
    description?: string;
    emails?: string[];
    mobile_numbers?: string[];
    website?: string;
    [key: string]: any;
  };
  image_urls: string[];
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export enum CustomerOutstandingClearedPaymentMethods {
  UPI = "UPI",
  CASH = "CASH",
  CARD = "CARD",
  BANK = "BANK"
}

export interface CustomerPaymentInfoItem {
  method: CustomerOutstandingClearedPaymentMethods;
  amount: number;
}

export interface OutstandingClearedCustomerSchema {
  shop_id: string;
  customer_id: string;
  payment_infos: CustomerPaymentInfoItem[];
}

// ── Utility Service: Shop Categories ──────────────────────────────────────────

export interface ShopCategory {
  id: string;
  shop_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// ── Utility Service: Shop Units ───────────────────────────────────────────────

export interface ShopUnit {
  id: string;
  shop_id: string;
  name: string;
  short_name: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// ── Utility Service: Shop UI IDs ──────────────────────────────────────────────

export interface ShopUiId {
  id: string;
  shop_id: string;
  entity_type: string;
  prefix: string;
  start_from: number;
  current_number: number;
  created_at?: string;
  updated_at?: string;
}

// ── Utility Service: Shop ID Config ───────────────────────────────────────────

export interface ModuleIdConfig {
  prefix: string;
  start_from: number;
}

export interface ShopIdConfig {
  shop_id: string;
  config: Record<string, ModuleIdConfig>;
}

// ── Utility Service: Fields ───────────────────────────────────────────────────

export interface FieldModel {
  field_name: string;
  field_type: string;
  is_required?: boolean;
  default_value?: unknown;
  options?: string[];
  [key: string]: unknown;
}

export interface BaseField {
  id: string;
  service_name: string;
  fields: FieldModel[];
  created_at?: string;
  updated_at?: string;
}

export interface CustomField {
  id: string;
  shop_id: string;
  service_name: string;
  fields: FieldModel[];
  created_at?: string;
  updated_at?: string;
}

// ── Utility Service: Dropdowns ────────────────────────────────────────────────

export interface BaseDropdown {
  id: string;
  dd_name: string;
  values: string[];
  created_at?: string;
  updated_at?: string;
}

export interface CustomDropdown {
  id: string;
  shop_id: string;
  dd_name: string;
  values: string[];
  created_at?: string;
  updated_at?: string;
}

// ── Utility Service: Activity Logs ────────────────────────────────────────────

export interface ActivityLog {
  id?: string;
  shop_id: string;
  user_name: string;
  service: string;
  action: string;
  entity_type: string;
  entity_id: string;
  description: string;
  changes?: Record<string, unknown>[];
  created_at?: string;
}

// ── StockAdjMov Service: Stock Movement / Adjustment ──────────────────────────

export interface StockMovAdjRecord {
  id: string;
  ui_id?: string;
  shop_id: string;
  type: "ADJUSTMENT" | "MOVEMENT" | string;
  description?: string;
  session_id?: string;
  date?: string;
  items?: StockMovAdjItem[];
  datas?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface StockMovAdjItem {
  product_id: string;
  name?: string;
  ui_id?: string;
  variant_id?: string;
  variant_name?: string;
  batch_id?: string;
  batch_name?: string;
  mfg_date?: string;
  exp_date?: string;
  serial_numbers?: Record<string, unknown>[];
  type: "INCREMENT" | "DECREMENT";
  stocks_before: number;
  stocks_adjusted: number;
  stocks_after: number;
}

// ── StockAdjMov Service: Cart Request Types ───────────────────────────────────

export interface CartSerialNoInfos {
  id: string;
  name: string;
}

export interface CartReserveRequest {
  session_id: string;
  shop_id: string;
  product_id: string;
  variant_id?: string;
  batch_id?: string;
  serialno_infos?: CartSerialNoInfos;
  qty: number;
  type: string;
}

export interface CartCancelRequest {
  session_id: string;
}

export interface CartRemoveRequest {
  session_id: string;
  product_id: string;
  variant_id?: string;
  batch_id?: string;
}
