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
  email?: string;
  mobile_number: string;
  gst_no: string;
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
  email?: string;
  mobile_number: string;
  credit_limit: number;
  outstanding?: number;
  is_active: boolean;
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
  is_active: boolean;
  variants?: any[];
  batches?: any[];
  batch?: InventoryBatch;
  serial_number?: any;
  serial_numbers?: string[];
  reorder_point?: number;
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

export interface OutstandingClearedCustomerSchema {
  shop_id: string;
  customer_id: string;
  payments: Partial<Record<CustomerOutstandingClearedPaymentMethods, number>>;
  cleared_amount: number;
}
