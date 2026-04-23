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
  datas: Record<string, unknown>;
}

export interface SupplierRecord {
  id: string;
  shop_id: string;
  datas: Record<string, unknown>;
  [key: string]: unknown;
}

// Employee API returns FLAT fields — no datas wrapper
export interface EmployeeRecord {
  employee_id: string;
  account_id: string;
  shop_id: string;
  name: string;
  email: string;
  mobile_number: string;
  is_accepted: boolean;
  added_by: string;
  role: string;
  id?: string;
  datas?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface CustomerRecord {
  id: string;
  shop_id: string;
  datas: Record<string, unknown>;
  [key: string]: unknown;
}

export interface InventoryDatas {
  name?: string;
  description?: string;
  variants?: Array<{
    id: string;
    name: string;
    sku: string;
    buyPrice: number;
    sellPrice: number;
    stock: number;
    batchTracking?: boolean;
    batches?: Array<{
      id: string;
      batchNo: string;
      mfgDate: string;
      expDate: string;
      stock: number;
    }>;
  }>;
  batches?: Array<{
    id: string;
    batchNo: string;
    mfgDate: string;
    expDate: string;
    stock: number;
  }>;
  [key: string]: unknown; // allow any extra fields from the API
}

export interface InventoryRecord {
  id: string;
  shop_id: string;
  barcode: string;
  stocks: number;
  buy_price: number;
  sell_price: number;
  datas?: InventoryDatas;
}

export interface OrderRecord {
  id: string;
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
  shop_id: string;
  type: "DIRECT" | "PO_CREATE" | "PO_UPDATE" | "PRODUCTION";
  datas: Record<string, unknown>;
  date?: string;
}

export interface StockAdjRecord {
  id: string;
  shop_id: string;
  datas: Record<string, unknown>;
  date?: string;
}

export interface ShopRecord {
  id: string;
  account_id?: string;
  datas: Record<string, unknown>;
  date?: string;
}
