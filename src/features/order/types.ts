import { ToggleOption } from "@/components/common/ToggleSelect";
import React from "react";

export type OrderType = {
  orderType: string;
};

export type OrderCardType = {
  billNo: string;
  customerName: string;
  phone: string;
  totalAmount: number;
  orderType: string;   
  status: string;
};


export type OrdersHeaderProps = {
  orderType: string;
  setOrderType: React.Dispatch<React.SetStateAction<string>>;

  orderTypeOptions: ToggleOption[];

  status: string;
  setStatus: React.Dispatch<React.SetStateAction<string>>;
};