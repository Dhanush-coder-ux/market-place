import { apiClient } from "./apiClient";
import { ENDPOINTS } from "../endpoints";
import type {
  SubscriptionCatalogResponse,
  SubscriptionData,
  TransactionItem,
  CreateOrderPayload,
  VerifyPaymentPayload,
} from "@/features/subscription/types";

export const subscriptionApi = {
  getPlans: async (): Promise<SubscriptionCatalogResponse> => {
    const res = await apiClient.get(`${ENDPOINTS.SUBSCRIPTIONS}/plans`);
    return (res as any)?.data ?? res;
  },

  getCurrentSubscription: async (shopId: string): Promise<SubscriptionData> => {
    const res = await apiClient.get(`${ENDPOINTS.SUBSCRIPTIONS}/current/${shopId}`);
    return (res as any)?.data ?? res;
  },

  startTrial: async (shopId: string, planId: string = "basic"): Promise<SubscriptionData> => {
    const res = await apiClient.post(`${ENDPOINTS.SUBSCRIPTIONS}/trial/start`, {
      shop_id: shopId,
      plan_id: planId,
    });
    return (res as any)?.data ?? res;
  },

  createRazorpayOrder: async (payload: CreateOrderPayload): Promise<any> => {
    const res = await apiClient.post(`${ENDPOINTS.SUBSCRIPTIONS}/razorpay/create-order`, payload);
    return (res as any)?.data ?? res;
  },

  verifyPayment: async (payload: VerifyPaymentPayload): Promise<SubscriptionData> => {
    const res = await apiClient.post(`${ENDPOINTS.SUBSCRIPTIONS}/razorpay/verify-payment`, payload);
    return (res as any)?.data ?? res;
  },

  cancelSubscription: async (shopId: string): Promise<any> => {
    const res = await apiClient.post(`${ENDPOINTS.SUBSCRIPTIONS}/cancel/${shopId}`, {});
    return (res as any)?.data ?? res;
  },

  getTransactions: async (shopId: string): Promise<TransactionItem[]> => {
    const res = await apiClient.get(`${ENDPOINTS.SUBSCRIPTIONS}/transactions/${shopId}`);
    return (res as any)?.data ?? res;
  },
};
