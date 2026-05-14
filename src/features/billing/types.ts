// types.ts

export type PaymentMode = "cash" | "upi" | "credit";

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
}

export interface BillingItem {
  id: string;
  inventoryId?: string;
  code: string;
  name: string;
  qty: number;
  price: number;
  tprice: number;
  serialNumbers?: string[]; // Multiple serials support
  variantId?: string | null;
  batchId?: string;
  serialnoId?: string;
  batchTracking?: boolean;
  manufacturingDate?: string;
  expiryDate?: string;
  requireSerial?: boolean;
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