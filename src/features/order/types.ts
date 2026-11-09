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
  status: string;
  online_details?: any;
};


export type OrdersHeaderProps = {

  orderType: string;
  setOrderType: React.Dispatch<React.SetStateAction<string>>;

  orderTypeOptions: ToggleOption[];

  status: string;
  setStatus: React.Dispatch<React.SetStateAction<string>>;
  setIsDateFilterOpen: React.Dispatch<React.SetStateAction<boolean>>;
  counts?: Record<string, number>;
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
  unit?: string;
  status?: string;
}

export interface ExchangeInfo {
  exchanged_items: string[];
  replacement_order: OrderResponse;
}

export interface OrderResponse {
  id: string;
  ui_id: number;
  shop_id: string;
  customer_id: string;
  status: string;
  payment_method?: string;
  payments?: Record<string, number>;
  total_quantity: number;
  total_buyprice: number;
  total_sellprice: number;
  origin: string;
  type: string;
  customer?: {
    customer_id?: string;
    customer_name?: string;
    customer_mobile_number?: string;
  };
  online_details?: any;
  items?: OrderItemResponse[];
  exchanged_items?: ExchangeInfo[] | null;
  returns?: any[];
  calculations?: {
    gst_type?: string;
    distribute_by?: string;
    [key: string]: any;
  };
  gst_infos?: {
    type?: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

export interface ReturnRequestItem {
  order_item_id: string;
  product_id: string;
  product_name: string;
  variant_name?: string;
  quantity: number;
  price: number;
  total_amount: number;
  unit?: string;
  reason?: string;
}

export interface ReturnRequestRecord {
  id: string;
  order_id: string;
  order_ui_id: string;
  shop_id: string;
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  items: ReturnRequestItem[];
  description: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | string;
  admin_notes?: string;
  status_history?: {
    status: string;
    updated_by: string;
    timestamp: string;
    notes?: string;
  }[];
  created_at: string;
  updated_at: string;
}
