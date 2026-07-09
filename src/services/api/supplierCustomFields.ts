/**
 * supplierCustomFields.ts
 *
 * Frontend service layer for the Hyperlocal-Supplier-Service custom-fields routes.
 *
 * Backend routes (all proxied via gateway → port 8003):
 *   POST   /custom-fields                              — Create a field definition
 *   PUT    /custom-fields                              — Update a field definition
 *   GET    /custom-fields/{shop_id}                   — Get all field definitions for a shop
 *   GET    /custom-fields/{shop_id}/{field_id}        — Get a single field definition
 *   DELETE /custom-fields/{shop_id}/{field_id}        — Delete a field definition
 *   POST   /custom-fields/values                      — Upsert a single field value for a supplier
 *   POST   /custom-fields/values/bulk                 — Bulk upsert field values for a supplier
 *   GET    /custom-fields/values/{shop_id}/{supplier_id} — Get all field values for a supplier
 */

import { apiClient } from './apiClient';
import { ENDPOINTS } from '../endpoints';

const BASE = ENDPOINTS.SUPPLIER_CUSTOM_FIELDS; // '/custom-fields'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CustomFieldDefinition {
  id: string;
  shop_id: string;
  field_name: string;
  label_name: string;
  type: string; // e.g. 'text', 'number', 'date', 'boolean'
  required: boolean;
  visible_online: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CustomFieldValue {
  id?: string;
  shop_id: string;
  supplier_id: string;
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
  label_name?: string;
  type?: string;
  required?: boolean;
  visible_online?: boolean;
}

export interface UpsertFieldValuePayload {
  shop_id: string;
  supplier_id: string;
  value_infos: Array<{
    field_id: string;
    value: string;
  }>;
}

// ─── API Service ──────────────────────────────────────────────────────────────

export const supplierCustomFieldsApi = {
  // POST /custom-fields — Create a custom field definition
  createField: async (data: CreateCustomFieldPayload) => {
    return await apiClient.post(`${BASE}`, data);
  },

  // PUT /custom-fields — Update an existing custom field definition
  updateField: async (data: UpdateCustomFieldPayload) => {
    return await apiClient.put(`${BASE}`, data);
  },

  // GET /custom-fields/{shop_id} — Fetch all field definitions for a shop
  getAllFields: async (shop_id: string): Promise<CustomFieldDefinition[]> => {
    try {
      const res = await apiClient.get(`${BASE}/${shop_id}`);
      const raw = res?.data ?? res;
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  },

  // GET /custom-fields/{shop_id}/{field_id} — Fetch a single field definition
  getField: async (shop_id: string, field_id: string): Promise<CustomFieldDefinition | null> => {
    try {
      const res = await apiClient.get(`${BASE}/${shop_id}/${field_id}`);
      return res?.data ?? null;
    } catch {
      return null;
    }
  },

  // DELETE /custom-fields/{shop_id}/{field_id} — Delete a field definition
  deleteField: async (shop_id: string, field_id: string) => {
    return await apiClient.delete(`${BASE}/${shop_id}/${field_id}`);
  },

  // POST /custom-fields/values — Upsert a single field value
  upsertValue: async (data: UpsertFieldValuePayload) => {
    return await apiClient.post(`${BASE}/values`, data);
  },

  // GET /custom-fields/values/{shop_id}/{supplier_id} — Get all field values for a supplier
  getValuesBySupplier: async (
    shop_id: string,
    supplier_id: string
  ): Promise<CustomFieldValue[]> => {
    try {
      const res = await apiClient.get(`${BASE}/values/${shop_id}/${supplier_id}`);
      const raw = res?.data ?? res;
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  },
};
