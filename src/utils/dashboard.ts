import { MonthKey } from "@/features/dashboard/types";
import { dashboards, ordersByMonth } from "./constants";

export const currentMonth = new Date().toLocaleString('en-US', {
    month: 'long',
}).toLowerCase().slice(0, 3) as MonthKey;


export const getDashboardDataByMonth = (chartMonth: MonthKey) => {
  if (!chartMonth) return {};

  const dashboardData = dashboards[chartMonth]; // ✅ PERFECT

  return {
    orders: dashboardData.orders,
    revenue: dashboardData.revenue,
  };
};

export const getOrderStatusByMonth = (onlineMonth: MonthKey, offlineMonth: MonthKey) => {
  const onlineOrdersData = ordersByMonth[onlineMonth];
  const offlineOrdersData = ordersByMonth[offlineMonth];

  return {
    onlineOrders: onlineOrdersData.online_orders,
    offlineOrders: offlineOrdersData.offline_orders,
  };
};


export const calculateTrendPercentage = (
    countOfThisMonth:any,
    countOfLastMonth:any
) => {
 
    const current = Number(countOfThisMonth) || 0;
    const last = Number(countOfLastMonth) || 0;

    if (last === 0) {
        return current === 0
            ? { trend: "no change", percentage: 0 }
            : { trend: "increment", percentage: 100 };
    }

    const change = current - last;
    const percentage = Math.abs((change / last) * 100);


    if (change > 0) {
        return { trend: "increment", percentage };
    } else if (change < 0) {
        return { trend: "decrement", percentage };
    } else {
        return { trend: "no change", percentage: 0 };
    }
};


export const getMonthData = (month: MonthKey) => {
  return ordersByMonth[month] ?? null;
};
