export interface PurchaseHistoryData {
  id: number;
  date: string;
  time: string;
  supplier: string;
  product_name: string;
  extra_product?: string;
  quantity: number;
  total_cost: number;
  invoice_no: string;
  status: "Paid" | "Due";
}