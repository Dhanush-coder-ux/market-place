import { apiClient } from "./apiClient";
import { ENDPOINTS } from "../endpoints";

const CF = ENDPOINTS.PURCHASE_CUSTOM_FIELDS; // '/purchase-fields'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PurchaseCustomFieldDefinition {
  id: string;
  shop_id: string;
  field_name: string;
  label_name: string;
  type: string;  // 'text' | 'number' | 'date' | 'boolean'
  required: boolean;
  visible_online: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PurchaseCustomFieldValue {
  id?: string;
  shop_id: string;
  purchase_id: string;
  field_id: string;
  value: string;
}

export interface CreatePurchaseCustomFieldPayload {
  shop_id: string;
  field_infos: Array<{
    field_name: string;
    label_name: string;
    type: string;
    required?: boolean;
    visible_online?: boolean;
  }>;
}

export interface UpdatePurchaseCustomFieldPayload {
  field_id: string;
  shop_id: string;
  label_name?: string | null;
  type?: string | null;
  required?: boolean | null;
  visible_online?: boolean | null;
}

export interface UpsertPurchaseFieldValuePayload {
  shop_id: string;
  purchase_id: string;
  value_infos: Array<{
    field_id: string;
    value: string;
  }>;
}

// ─── Purchase Custom Fields API ───────────────────────────────────────────────

export const purchaseCustomFieldsApi = {
  // POST /purchase-fields
  createField: async (data: CreatePurchaseCustomFieldPayload) => {
    return await apiClient.post(`${CF}`, data);
  },

  // PUT /purchase-fields
  updateField: async (data: UpdatePurchaseCustomFieldPayload) => {
    return await apiClient.put(`${CF}`, data);
  },

  // GET /purchase-fields/{shop_id} — All field definitions for a shop
  getAllFields: async (shopId: string): Promise<PurchaseCustomFieldDefinition[]> => {
    try {
      const res = await apiClient.get(`${CF}/${shopId}`);
      const raw = res?.data ?? res;
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  },

  // GET /purchase-fields/{shop_id}/{field_id} — Single field definition
  getField: async (shopId: string, fieldId: string): Promise<PurchaseCustomFieldDefinition | null> => {
    try {
      const res = await apiClient.get(`${CF}/${shopId}/${fieldId}`);
      return res?.data ?? null;
    } catch {
      return null;
    }
  },

  // DELETE /purchase-fields/{shop_id}/{field_id}
  deleteField: async (shopId: string, fieldId: string) => {
    return await apiClient.delete(`${CF}/${shopId}/${fieldId}`);
  },

  // POST /purchase-fields/values — Upsert custom field values
  upsertValue: async (data: UpsertPurchaseFieldValuePayload) => {
    return await apiClient.post(`${CF}/values`, data);
  },

  // GET /purchase-fields/values/{shop_id}/{purchase_id} — Get all values for a purchase
  getValuesByPurchase: async (
    shopId: string,
    purchaseId: string
  ): Promise<PurchaseCustomFieldValue[]> => {
    try {
      const res = await apiClient.get(`${CF}/values/${shopId}/${purchaseId}`);
      const raw = res?.data ?? res;
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  },
};
