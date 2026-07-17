/**
 * customer.ts
 *
 * Frontend API service layer for Hyperlocal-Customer-Service (port 8007 via gateway).
 *
 * Customer CRUD routes:
 *   POST   /customers                              — Create customer
 *   PUT    /customers                              — Update customer
 *   DELETE /customers/{shop_id}/{id}              — Delete customer
 *   GET    /customers                              — Get all customers (admin)
 *   GET    /customers/by/shop/{shop_id}           — Get customers for a shop
 *   GET    /customers/by/id/{shop_id}/{id}        — Get single customer
 *   GET    /customers/cleared-histories/by/shop/{shop_id}  — Clearing history by shop
 *   GET    /customers/cleared-histories/by/id/{shop_id}/{id} — Clearing history by id
 *   GET    /customers/cleared-histories           — All clearing history (admin)
 *   POST   /customers/outstanding/add             — Add/adjust outstanding
 *   POST   /customers/outstanding/clear           — Clear outstanding with payment
 *
 * Custom Fields routes (gateway rewrites /customer-fields/* → /custom-fields/* on port 8007):
 *   POST   /customer-fields                       — Create field definition
 *   PUT    /customer-fields                        — Update field definition
 *   GET    /customer-fields/{shop_id}             — Get all field definitions
 *   GET    /customer-fields/{shop_id}/{field_id}  — Get one field definition
 *   DELETE /customer-fields/{shop_id}/{field_id}  — Delete field definition
 *   POST   /customer-fields/values               — Upsert single field value
 *   POST   /customer-fields/values/bulk          — Bulk upsert field values
 *   GET    /customer-fields/values/{shop_id}/{customer_id} — Get values for customer
 */

import { apiClient } from './apiClient';
import { validateMandatory } from './validation';
import { SCHEMAS } from './schemas';
import { ENDPOINTS, SHOP_ID } from '../endpoints';

const CF = ENDPOINTS.CUSTOMER_CUSTOM_FIELDS; // '/customer-fields'

// ─── TypeScript Interfaces matching the OpenAPI spec ─────────────────────────

export interface CustomerCustomFieldDefinition {
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

export interface CustomerCustomFieldValue {
  id?: string;
  shop_id: string;
  customer_id: string;
  field_id: string;
  value: string;
}

export interface CreateCustomFieldPayload {
  shop_id: string;
  field_infos: Array<{
    field_name: string;
    label_name: string;
    type: string;
    required?: boolean;
    visible_online?: boolean;
  }>;
}

export interface UpdateCustomFieldPayload {
  field_id: string;
  shop_id: string;
  label_name?: string | null;
  type?: string | null;
  required?: boolean | null;
  visible_online?: boolean | null;
}

export interface UpsertFieldValuePayload {
  shop_id: string;
  customer_id: string;
  value_infos: Array<{
    field_id: string;
    value: string;
  }>;
}

// ─── Customer CRUD ────────────────────────────────────────────────────────────

export const customerApi = {
  // ── Write methods ──────────────────────────────────────────────────────────

  createCustomer: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.customer_create);
    return await apiClient.post(ENDPOINTS.CUSTOMERS, data);
  },

  updateCustomer: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.customer_update);
    return await apiClient.put(ENDPOINTS.CUSTOMERS, data);
  },

  deleteCustomer: async (shopId: string, customerId: string) => {
    return await apiClient.delete(`${ENDPOINTS.CUSTOMERS}/${shopId}/${customerId}`);
  },

  // POST /customers/outstanding/add — INCREMENT | DECREMENT | DIRECT
  addOutstanding: async (data: {
    id: string;
    shop_id: string;
    outstanding_infos: { amount: number };
    type: 'INCREMENT' | 'DECREMENT' | 'DIRECT';
  }) => {
    return await apiClient.post(`${ENDPOINTS.CUSTOMERS}/outstanding/add`, data);
  },

  // POST /customers/outstanding/clear — Clear outstanding with payment records
  clearOutstanding: async (data: {
    shop_id: string;
    customer_id: string;
    id: string;
    payment_infos: Array<{ method: 'UPI' | 'CASH' | 'CARD' | 'BANK'; amount: number }>;
  }) => {
    return await apiClient.post(`${ENDPOINTS.CUSTOMERS}/outstanding/clear`, data);
  },

  // ── Read methods ───────────────────────────────────────────────────────────

  // GET /customers — Admin: get all customers (paginated + filterable)
  getCustomers: async (params?: Record<string, string>) => {
    return await apiClient.get(ENDPOINTS.CUSTOMERS, params);
  },

  // GET /customers/by/shop/{shop_id} — Primary list endpoint for frontend
  getCustomersByShopId: async (shopId: string, params?: Record<string, string>) => {
    return await apiClient.get(`${ENDPOINTS.CUSTOMERS}/by/shop/${shopId}`, params);
  },

  // GET /customers/by/id/{shop_id}/{id} — Get a single customer by ID
  getCustomerById: async (shopId: string, customerId: string) => {
    return await apiClient.get(`${ENDPOINTS.CUSTOMERS}/by/id/${shopId}/${customerId}`);
  },

  // ── Clearing history ───────────────────────────────────────────────────────

  // GET /customers/cleared-histories/by/shop/{shop_id} — History for a shop
  getClearingHistoryByShopId: async (shopId: string, params?: Record<string, string>) => {
    return await apiClient.get(`${ENDPOINTS.CUSTOMERS}/cleared-histories/by/shop/${shopId}`, params);
  },

  // GET /customers/cleared-histories/by/id/{shop_id}/{id} — Single history record
  getClearingHistoryById: async (shopId: string, historyId: string) => {
    return await apiClient.get(`${ENDPOINTS.CUSTOMERS}/cleared-histories/by/id/${shopId}/${historyId}`);
  },

  // ── Convenience helper for SearchSelect ───────────────────────────────────
  searchCustomers: async (query: string): Promise<any[]> => {
    try {
      const res = await apiClient.get(
        `${ENDPOINTS.CUSTOMERS}/by/shop/${SHOP_ID}`,
        { q: query, limit: '10', offset: '1' }
      );
      const raw = res?.data ?? [];
      const items = Array.isArray(raw) ? raw : (raw?.datas ?? []);
      return items.map((c: any) => ({
        ...c,
        id: c.id,
        name: c.name || 'Unknown Customer',
      }));
    } catch {
      return [];
    }
  },
};

// ─── Customer Custom Fields ───────────────────────────────────────────────────

export const customerCustomFieldsApi = {
  // POST /customer-fields (→ /custom-fields on customer service)
  createField: async (data: CreateCustomFieldPayload) => {
    return await apiClient.post(`${CF}`, data);
  },

  // PUT /customer-fields
  updateField: async (data: UpdateCustomFieldPayload) => {
    return await apiClient.put(`${CF}`, data);
  },

  // GET /customer-fields/{shop_id} — All field definitions for a shop
  getAllFields: async (shopId: string): Promise<CustomerCustomFieldDefinition[]> => {
    try {
      const res = await apiClient.get(`${CF}/${shopId}`);
      const raw = res?.data ?? res;
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  },

  // GET /customer-fields/{shop_id}/{field_id} — Single field definition
  getField: async (shopId: string, fieldId: string): Promise<CustomerCustomFieldDefinition | null> => {
    try {
      const res = await apiClient.get(`${CF}/${shopId}/${fieldId}`);
      return res?.data ?? null;
    } catch {
      return null;
    }
  },

  // DELETE /customer-fields/{shop_id}/{field_id}
  deleteField: async (shopId: string, fieldId: string) => {
    return await apiClient.delete(`${CF}/${shopId}/${fieldId}`);
  },

  // POST /customer-fields/values — Upsert a single field value
  upsertValue: async (data: UpsertFieldValuePayload) => {
    return await apiClient.post(`${CF}/values`, data);
  },

  // GET /customer-fields/values/{shop_id}/{customer_id} — Get all values for a customer
  getValuesByCustomer: async (
    shopId: string,
    customerId: string
  ): Promise<CustomerCustomFieldValue[]> => {
    try {
      const res = await apiClient.get(`${CF}/values/${shopId}/${customerId}`);
      const raw = res?.data ?? res;
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  },
};
