export interface ProductData {
  id: string | number;
  name: string;
  describtion:string;
  sku: string;
  category: string;
  selling_price: number;
  unit: string;
  min_threshold: number;
  default_supplier: string;
  avg_buying_cost: number;
  current_stock: number;
}