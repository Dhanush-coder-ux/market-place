import type React from "react"

export type ChartCardProp ={
    children:React.ReactNode
    title:string
}
export type keyMetricProp = {
    children:React.ReactNode
}
export type StatsCardProp = {
     headerTitle:string
     total:number
     currentMonth:number
     lastMonth:number
}

export type MonthKey = "jan" | "feb" | "mar" | "apr" | "may" | "jun" | 
                "jul" | "aug" | "sep" | "oct" | "nov" | "dec";

export interface DashboardMonthData {
  orders: { cur: number; last: number };
  revenue: { cur: number; last: number };
}

export type DashboardsType = Record<MonthKey, DashboardMonthData>;

export interface OrderStatusMonthData {
  online_orders: { cur: number; last: number };
  offline_orders: { cur: number; last: number };
}

export type OrdersByMonthType = Record<MonthKey, OrderStatusMonthData>;
