import { ToggleOption } from "@/components/common/ToggleSelect";
import React from "react"

export type OrderType = {
  orderType: string;
};

export type OrderCardType = {
  billNo: string;
  customerName: string;
  phone: string
  totalAmount: number;
  orderType: string;
  status: string
};


export type OrdersHeaderProps = {

  orderType: string;
  setOrderType: React.Dispatch<React.SetStateAction<string>>;

  orderTypeOptions: ToggleOption[];

  status: string;
  setStatus: React.Dispatch<React.SetStateAction<string>>;
  setIsDateFilterOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

// Backend response schemas
export interface OrderItemResponse {
  id: string;
  inventory_id: string;
  variant_id?: string | null;
  batch_id?: string | null;
  serialno_id?: string | null;
  barcode?: string | null;
  serial_numbers?: string[] | null;
  buy_price: number;
  sell_price: number;
  gst?: string | null;
  quantity: number;
  status?: string;
}

export interface OrderResponse {
  id: string;
  ui_id: number;
  shop_id: string;
  customer_id: string;
  status: string;
  payment_method: string;
  total_quantity: number;
  total_buyprice: number;
  total_sellprice: number;
  origin: string;
  items?: OrderItemResponse[];
  exchanged_items?: Array<{
    exchange_id: string;
    exchanged_item_id: string;
    replacement_order: OrderResponse;
  }>;
  created_at: string;
  updated_at: string;
}
