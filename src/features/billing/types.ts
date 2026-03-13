
// ─── Billing module shared types ─────────────────────────────────────────────

export interface BillingItem {
  id:     string;
  code:   string;
  name:   string;
  qty:    number;
  price:  number;
  tprice: number;
}

export interface SelectOption {
  value:   string;
  label:   string;
  payload: {
    product_barcode: string;
    product_name:    string;
    product_price:   number;
  };
}

export type PaymentMode = "cash" | "upi" | "credit";

export interface CustomerData {
  id:          string;
  name:        string;
  phone:       string;
  outstanding: number;
  creditLimit: number;
  totalSpent:  number;
}

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

// In your types file
export interface CartItem {
  id: string;
  name: string;
  qty: number;
  tprice: number;
  code: string;   // add this
  price: number;  // add this
}