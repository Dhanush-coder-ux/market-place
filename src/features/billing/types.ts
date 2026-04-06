// types.ts

export type PaymentMode = "cash" | "upi" | "credit";

export interface CustomerData {
  id:          string;
  name:        string;
  phone:       string;
  outstanding: number;
  creditLimit: number;
  totalSpent:  number;
}

export interface ProductVariant {
  id:    string;
  name:  string;
  price: number;
  stock: number;
}

export interface InventoryItem {
  product_barcode: string;
  product_name:    string;
  category:        "Electronics" | "Clothing" | "Other";
  variants:        ProductVariant[];
  requireSerial:   boolean;
  batchTracking?:      boolean;
  manufacturingDate?:  string;
  expiryDate?:         string;
}

export interface BillingItem {
  id:            string;
  code:          string;
  name:          string;
  qty:           number;
  price:         number;
  tprice:        number;
  serialNumber?: string; // For tracking specific items (e.g., Electronics)
  variantId?:    string; // For tracking selected variant
  batchTracking?:      boolean;
  manufacturingDate?:  string;
  expiryDate?:         string;
}

// Alias for convenience if used in shopping cart contexts
export type CartItem = BillingItem;

export type SelectOption = {
  value:   string;
  label:   string;
  payload: InventoryItem;
};

export interface InvoicePayload {
  customer:     CustomerData | null;
  customerName: string;
  phone:        string;
  items:        BillingItem[];
  totalQty:     number;
  totalAmount:  number;
  gstAmount:    number;
  finalAmount:  number;
  includeGst:   boolean;
  paymentMode:  PaymentMode;
  date:         string;
}