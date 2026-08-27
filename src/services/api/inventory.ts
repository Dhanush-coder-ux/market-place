/**
 * inventory.ts
 *
 * Frontend API service layer for Hyperlocal-Inventory-Service
 * Backend: port 8000 via gateway, root_path="/inventories"
 * Gateway prefix: /inventories (maps → http://127.0.0.1:8000)
 * Custom fields: /inventory-fields (gateway rewrites → /custom-fields on port 8000)
 *
 * ── Product + Inventory CRUD ─────────────────────────────────────────────────
 *   POST   /inventories/inventories              — Create product+inventory
 *   PUT    /inventories/inventories              — Update product+inventory
 *   DELETE /inventories/inventories/{shop_id}/{id} — Delete product+inventory
 *   GET    /inventories/inventories              — Get all (admin)
 *   GET    /inventories/inventories/by/shop/{shop_id} — Get by shop
 *   GET    /inventories/inventories/by/id/{shop_id}/{id} — Get by id
 *
 * ── Stock Reservations ───────────────────────────────────────────────────────
 *   POST   /inventories/inventories/reservations/reserve       — Reserve stock
 *   POST   /inventories/inventories/reservations/release       — Release all
 *   POST   /inventories/inventories/reservations/release-item  — Release one item
 *   POST   /inventories/inventories/reservations/commit        — Commit
 *
 * ── Custom Fields (via gateway rewrite) ──────────────────────────────────────
 *   POST   /inventory-fields              → /custom-fields       — Create field def
 *   PUT    /inventory-fields              → /custom-fields       — Update field def
 *   GET    /inventory-fields/{shop_id}   → /custom-fields/...   — All field defs
 *   GET    /inventory-fields/{shop_id}/{field_id}               — One field def
 *   DELETE /inventory-fields/{shop_id}/{field_id}               — Delete field def
 *   POST   /inventory-fields/values      → /custom-fields/values — Upsert value
 *   POST   /inventory-fields/values/bulk → /custom-fields/values/bulk — Bulk upsert
 *   GET    /inventory-fields/values/{shop_id}/{product_id}      — Get by product
 */

import { apiClient } from './apiClient';
import { validateMandatory } from './validation';
import { SCHEMAS } from './schemas';
import { ENDPOINTS, SHOP_ID } from '../endpoints';
import type {
  CreateInventoryPayload,
  UpdateInventoryPayload,
  ReserveStockPayload,
  ReleaseReservationsPayload,
  ReleaseReservationItemPayload,
  CommitReservationsPayload,
  InventoryCustomFieldDefinition,
  InventoryCustomFieldValue,
} from '../../features/inventory/types';

const INV = ENDPOINTS.INVENTORIES;       // "/inventories/inventories"
const CF = ENDPOINTS.INVENTORY_CUSTOM_FIELDS; // "/inventory-fields"

// ─── Custom Field Interface Re-exports (for convenience) ─────────────────────

export type { InventoryCustomFieldDefinition, InventoryCustomFieldValue };

// ─── Product + Inventory CRUD ─────────────────────────────────────────────────

export const inventoryApi = {

  /**
   * Create a new product with inventory.
   * Backend: POST /inventories/inventories
   * Payload: CreateProdInvSchema — requires shop_id, category_id, unit_id,
   *          name, description, type_infos, have_tracking.
   *          Optional: barcode, buy_price, sell_price, gst, reorder_point,
   *                    storage_location, variant_infos, custom_fields.
   */
  createInventory: async (data: CreateInventoryPayload) => {
    validateMandatory(data as any, SCHEMAS.inventory_create);
    console.log('Create Inventory Payload:', data);
    return await apiClient.post(INV, data);
  },

  /**
   * Update an existing product+inventory.
   * Backend: PUT /inventories/inventories
   * Payload: UpdateProdInvSchema — requires id + shop_id; all others optional.
   */
  updateInventory: async (data: UpdateInventoryPayload) => {
    validateMandatory(data as any, SCHEMAS.inventory_update);
    console.log('Update Inventory Payload:', data);
    return await apiClient.put(INV, data);
  },

  /**
   * Delete a product+inventory.
   * Backend: DELETE /inventories/inventories/{shop_id}/{id}
   */
  deleteInventory: async (shopId: string, id: string) => {
    console.log('Delete Inventory:', shopId, id);
    return await apiClient.delete(`${INV}/${shopId}/${id}`);
  },

  // ── Read / Search ─────────────────────────────────────────────────────────

  /**
   * Get all inventories (admin, not shop-scoped).
   * Backend: GET /inventories/inventories
   * Params: query, limit, offset, active, include_serialno
   */
  getAllInventories: async (params?: {
    query?: string;
    limit?: string;
    offset?: string;
    active?: string;
    include_serialno?: string;
  }) => {
    return await apiClient.get(INV, params);
  },

  /**
   * Get inventories for a specific shop — main list endpoint.
   * Backend: GET /inventories/inventories/by/shop/{shop_id}
   * Params: query, limit, offset, active, include_serialno
   */
  getInventoriesByShop: async (shopId: string, params?: {
    query?: string;
    limit?: string;
    offset?: string;
    active?: string;
    include_serialno?: string;
  }) => {
    return await apiClient.get(`${INV}/by/shop/${shopId}`, params);
  },

  /**
   * Get a single product+inventory by id.
   * Backend: GET /inventories/inventories/by/id/{shop_id}/{id}
   * Params: include_serialno, active
   */
  getInventoryById: async (shopId: string, id: string, params?: {
    include_serialno?: string;
    active?: string;
  }) => {
    return await apiClient.get(`${INV}/by/id/${shopId}/${id}`, params);
  },

  /**
   * Search inventories for autocomplete / SearchSelect components.
   * API response shape: { detail: { msg, status_code, success }, data: [ ...items ] }
   * Returns a normalized list with {id, name, stocks, sell_price, buy_price, barcode, unit}.
   */
  searchInventories: async (query: string, isActive?: boolean): Promise<any[]> => {
    try {
      const params: Record<string, string> = { limit: '200', offset: '1' };
      if (query) params.q = query;
      if (isActive !== undefined) params.active = isActive ? 'true' : 'false';

      const response = await apiClient.get(`${INV}/by/shop/${SHOP_ID}`, params);

      // Response: { detail: {...}, data: [...] }  OR raw array
      const items: any[] = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : (response?.datas ?? response?.inventories ?? []);

      return items.map((i: any) => {
        const priceInfos  = i.pricing_infos  || i.price_infos  || {};
        const stockInfos  = i.stock_infos    || i.stocks_infos || {};
        const typeInfos   = i.type_infos     || {};

        // Resolve stock using the same comprehensive fallback chain as the rest of the codebase.
        // i.stocks can be 0 (and ?? won't fall through on 0), so we use || to also catch 0.
        const resolvedStocks = 
          stockInfos.available_stocks ??
          stockInfos.physical_stocks ??
          i.stocks_infos?.stocks ??
          i.stock_infos?.stocks ??
          i.stocks ??
          0;

        return {
          ...i,
          id:         i.id   || i._id,
          name:       i.name || 'Unknown Product',
          sell_price: i.sell_price  ?? priceInfos.sell_price  ?? priceInfos.online_sell_price ?? 0,
          buy_price:  i.buy_price   ?? priceInfos.buy_price   ?? 0,
          stocks:     resolvedStocks,
          barcode:    i.barcode     ?? '',
          unit:       i.unit || i.unit_infos?.name || 'pc',
          gst:        i.gst  || priceInfos.gst || '0%',
          has_variant:  typeInfos.has_variant  ?? false,
          has_batch:    typeInfos.has_batch    ?? false,
          has_serialno: typeInfos.has_serialno ?? false,
        };
      });
    } catch (err) {
      console.error('[searchInventories] error:', err);
      return [];
    }
  },


  // ── Stock Reservations ────────────────────────────────────────────────────
  // Used by StockAdjMov cart workflow to lock inventory during adjustments.
  // Flow: reserve → (commit | release); release-item removes a single product.

  /**
   * Reserve stock for a product (called internally during cart workflow).
   * Backend: POST /inventories/inventories/reservations/reserve
   */
  reserveStock: async (data: ReserveStockPayload) => {
    return await apiClient.post(`${INV}/reservations/reserve`, data);
  },

  /**
   * Release ALL reservations for a session.
   * Backend: POST /inventories/inventories/reservations/release
   */
  releaseReservations: async (data: ReleaseReservationsPayload) => {
    return await apiClient.post(`${INV}/reservations/release`, data);
  },

  /**
   * Release a single item's reservation from a session.
   * Backend: POST /inventories/inventories/reservations/release-item
   */
  releaseReservationItem: async (data: ReleaseReservationItemPayload) => {
    return await apiClient.post(`${INV}/reservations/release-item`, data);
  },

  /**
   * Commit all reservations for a session (finalizes stock changes).
   * Backend: POST /inventories/inventories/reservations/commit
   */
  commitReservations: async (data: CommitReservationsPayload) => {
    return await apiClient.post(`${INV}/reservations/commit`, data);
  },

  // ── Legacy wrappers kept for backward compatibility ───────────────────────

  createStockAdjustment: async (data: Record<string, any>) => {
    validateMandatory(data, SCHEMAS.stock_adjustment_create);
    return await apiClient.post(ENDPOINTS.S_ADJUSTMENTS, data);
  },

  createPurchase: async (data: Record<string, any>) => {
    if (!data.id) {
      validateMandatory(data, SCHEMAS.purchase_create);
      return await apiClient.post(ENDPOINTS.PURCHASES, { datas: data });
    } else {
      validateMandatory(data, SCHEMAS.purchase_update);
      return await apiClient.put(`${ENDPOINTS.PURCHASES}/${data.id}`, { datas: data });
    }
  },

  exchangeOrder: async (data: any) => {
    return await apiClient.post(ENDPOINTS.EXCHANGE, data);
  },

  bulkExchangeOrder: async (data: any) => {
    return await apiClient.post(ENDPOINTS.EXCHANGE, data);
  },

  returnOrderItem: async (data: { order_id: string; item_id: string }) => {
    return await apiClient.post(ENDPOINTS.RETURN, data);
  },

  bulkReturnOrder: async (data: any) => {
    return await apiClient.post(ENDPOINTS.RETURN, data);
  },
};

// ─── Inventory Custom Fields API ──────────────────────────────────────────────
// Routes via gateway path rewrite: /inventory-fields/* → /custom-fields/* on port 8000

export interface CreateInventoryCustomFieldPayload {
  shop_id: string;
  field_infos: Array<{
    field_name: string;
    label_name: string;
    type: string;          // 'text' | 'number' | 'date' | 'boolean'
    required?: boolean;
    visible_online?: boolean;
  }>;
}

export interface UpdateInventoryCustomFieldPayload {
  field_id: string;
  shop_id: string;
  label_name?: string | null;
  type?: string | null;
  required?: boolean | null;
  visible_online?: boolean | null;
}

export interface UpsertInventoryFieldValuePayload {
  shop_id: string;
  product_id: string;
  field_id: string;
  value: string;
}

export interface BulkUpsertInventoryFieldValuesPayload {
  shop_id: string;
  product_id: string;
  values: Array<{ field_id: string; value: string }>;
}

export const inventoryCustomFieldsApi = {

  /** POST /inventory-fields — Create a new field definition */
  createField: async (data: CreateInventoryCustomFieldPayload) => {
    return await apiClient.post(CF, data);
  },

  /** PUT /inventory-fields — Update an existing field definition */
  updateField: async (data: UpdateInventoryCustomFieldPayload) => {
    return await apiClient.put(CF, data);
  },

  /** GET /inventory-fields/{shop_id} — All field definitions for a shop */
  getAllFields: async (shopId: string): Promise<InventoryCustomFieldDefinition[]> => {
    try {
      const res = await apiClient.get(`${CF}/${shopId}`);
      const raw = res?.data ?? res;
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  },

  /** GET /inventory-fields/{shop_id}/{field_id} — Single field definition */
  getField: async (shopId: string, fieldId: string): Promise<InventoryCustomFieldDefinition | null> => {
    try {
      const res = await apiClient.get(`${CF}/${shopId}/${fieldId}`);
      return res?.data ?? null;
    } catch {
      return null;
    }
  },

  /** DELETE /inventory-fields/{shop_id}/{field_id} — Delete a field definition */
  deleteField: async (shopId: string, fieldId: string) => {
    return await apiClient.delete(`${CF}/${shopId}/${fieldId}`);
  },

  /** POST /inventory-fields/values — Upsert a single field value for a product */
  upsertValue: async (data: UpsertInventoryFieldValuePayload) => {
    return await apiClient.post(`${CF}/values`, data);
  },

  /** POST /inventory-fields/values/bulk — Bulk upsert field values */
  bulkUpsertValues: async (data: BulkUpsertInventoryFieldValuesPayload) => {
    return await apiClient.post(`${CF}/values/bulk`, data);
  },

  /** GET /inventory-fields/values/{shop_id}/{product_id} — All values for a product */
  getValuesByProduct: async (
    shopId: string,
    productId: string
  ): Promise<InventoryCustomFieldValue[]> => {
    try {
      const res = await apiClient.get(`${CF}/values/${shopId}/${productId}`);
      const raw = res?.data ?? res;
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  },
};
