// -------------------- TYPES --------------------
export interface BillingItem {
  id: string;
  code: string;
  name: string;
  qty: number;
  price: number;
  tprice: number;
}

export interface SelectOption {
  value: string;
  label: string;
  payload: any;
}
