// ─── UI Component Prop Types ─────────────────────────────────────────────────

export type InventoryInfoCardProps = {
  value: number;
  label: string;
  subvalue: string;
};

export type InventoryHeaderProps = {
  totalCount: number;
  lowestStockValue: number;
  searchValue: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export type HelperFunction = {
  label: string;
  onClick?: () => void;
};

export type LowStockNotificationProps = {
  lowestStockValue: number;
  show: boolean;
  onClose: () => void;
};

// ─── Inventory Item (legacy state management) ─────────────────────────────────

export interface InventoryItem {
  id: string;
  name: string;
  barcode: string;
  description: string;
  currentStock: number;
  category: string;
  sellingPrice: number;
  costPrice: number;
  lowStockThreshold: number;
}

export interface InventoryState {
  loading: boolean;
  error: string | null;
  ids: string[];
  entities: Record<string, InventoryItem>;
}

// ─── Backend Schema Types (matching Hyperlocal-Inventory-Service) ─────────────

/** ProductTypeInfosType — maps to backend Pydantic model */
export interface ProductTypeInfos {
  has_batch: boolean;
  has_variant: boolean;
  has_serialno: boolean;
}

/** Expiry/manufacturing dates for batch tracking */
export interface ProductBatchExpirationInfos {
  manufacturing_date: string; // ISO date string "YYYY-MM-DD"
  expiry_date: string;
}

// ─── Variant Types ───────────────────────────────────────────────────────────

/** Variant entry for CreateProdInvSchema */
export interface CreateProdInvVariant {
  name: string;
  storage_location?: string | null;
  reorder_point?: number;
  buy_price?: number | null;
  sell_price?: number | null;
  additional_infos?: any;
  datas?: any;
}

/** Variant entry for UpdateProdInvSchema — includes IDs for partial updates */
export interface UpdateProdInvVariant {
  id?: string | null;
  pricing_id?: string | null;
  storage_location_id?: string | null;
  reorder_point_id?: string | null;
  name: string;
  storage_location?: string | null;
  reorder_point?: number;
  buy_price: number;
  sell_price: number;
}

// ─── Create / Update Request Payloads ────────────────────────────────────────

/**
 * CreateProdInvSchema — payload for POST /inventories/inventories
 * All fields except shop_id, category_id, unit_id, name, description, type_infos, have_tracking are optional.
 */
export interface CreateInventoryPayload {
  shop_id: string;
  category_id: string;
  unit_id: string;
  name: string;
  description: string;
  barcode?: string | null;
  type_infos: ProductTypeInfos;
  have_tracking: boolean;
  variant_infos?: CreateProdInvVariant[] | null;
  storage_location?: string | null;
  buy_price?: number | null;
  gst?: string;          // default "0%"
  sell_price?: number | null;
  online_sell_price?: number | null;
  reorder_point?: number; // default 5
  online_reorder_point?: number;
  custom_fields?: Record<string, any>;
  datas?: Record<string, any>;
  additional_infos?: Record<string, any>;
  visible_online?: boolean;
}

/**
 * UpdateProdInvSchema — payload for PUT /inventories/inventories
 * id + shop_id are required; all other fields are optional.
 */
export interface UpdateInventoryPayload {
  id: string;
  shop_id: string;
  category_id?: string | null;
  unit_id?: string | null;
  name?: string | null;
  description?: string | null;
  type_infos?: ProductTypeInfos | null;
  have_tracking?: boolean | null;
  variant_infos?: UpdateProdInvVariant[] | null;
  storage_location?: string | null;
  buy_price?: number | null;
  sell_price?: number | null;
  online_sell_price?: number | null;
  pricing_id?: string | null;
  storage_location_id?: string | null;
  reorder_point_id?: string | null;
  reorder_point?: number;
  online_reorder_point?: number;
  custom_fields?: Record<string, any>;
  visible_online?: boolean;
}

// ─── Inventory Sub-Level Updates (granular) ───────────────────────────────────

export interface InvStocksInfos {
  id?: string | null;
  type?: 'DIRECT' | 'INCREMENT' | 'DECREMENT';
  physical_stocks: number;
  reserved_stocks?: number | null;
}

export interface InvPricingInfos {
  id?: string | null;
  buy_price: number;
  sell_price: number;
}

export interface InvStorageLocationInfos {
  id?: string | null;
  name?: string | null;
}

export interface InvReorderPointInfos {
  id?: string | null;
  reorder_point: number;
}

/** CreateInventoryAll — granular upsert for stocks/pricing/location/reorder per variant/batch */
export interface CreateInventoryAll {
  shop_id: string;
  product_id: string;
  gst?: string;
  variant_id?: string | null;
  batch_id?: string | null;
  stocks_infos?: InvStocksInfos | null;
  pricing_infos?: InvPricingInfos | null;
  storage_location_infos?: InvStorageLocationInfos | null;
  reorder_point_infos?: InvReorderPointInfos | null;
}

/** UpdateAllProdInvSchema — stock adjustment style update (used by StockAdjMov flow) */
export interface UpdateAllInventoryPayload {
  product_id: string;
  shop_id: string;
  variant_id?: string | null;
  batch_infos?: {
    id?: string | null;
    name?: string | null;
    expiry_date?: string | null;
    manufacturing_date?: string | null;
  } | null;
  serialno_infos?: Array<{ id?: string | null; name: string }> | null;
  stocks: number;
  storage_location?: string | null;
  reorder_point?: number | null;
  name?: string | null;
  gst?: string | null;
  description?: string | null;
  buy_price?: number | null;
  sell_price?: number | null;
  type: string;         // e.g. "DIRECT" | "INCREMENT" | "DECREMENT"
  entity_name: string;
  create_stock_mov_adj?: boolean;
}

// ─── Stock Reservation Types ─────────────────────────────────────────────────

export interface ReserveStockPayload {
  session_id: string;
  product_id: string;
  shop_id: string;
  qty: number;
  expires_at: string;   // ISO datetime string
  variant_id?: string | null;
  batch_id?: string | null;
  serialno_infos?: Array<{ id?: string | null; name: string }> | null;
}

export interface ReleaseReservationsPayload {
  session_id: string;
}

export interface ReleaseReservationItemPayload {
  session_id: string;
  product_id: string;
  variant_id?: string | null;
  batch_id?: string | null;
}

export interface CommitReservationsPayload {
  session_id: string;
  entity_name: string;
  record_stock?: boolean;
}

// ─── Custom Field Types ───────────────────────────────────────────────────────

export interface InventoryCustomFieldDefinition {
  id: string;
  shop_id: string;
  field_name: string;
  label_name: string;
  type: string;     // 'text' | 'number' | 'date' | 'boolean'
  required: boolean;
  visible_online: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryCustomFieldValue {
  id?: string;
  shop_id: string;
  product_id: string;
  field_id: string;
  value: string;
}

export interface InventoryCustomFieldMerged {
  field: InventoryCustomFieldDefinition;
  value: string;
}