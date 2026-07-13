export const SCHEMAS = {
  inventory_create: ['shop_id', 'name', 'category_id', 'unit_id', 'type_infos', 'have_tracking'],
  inventory_update: ['id', 'shop_id'],
  inventory_delete: ['id', 'shop_id'],
  
  customer_create: ['shop_id', 'name', 'contact_infos', 'location_infos', 'can_have_credit'],
  customer_update: ['id', 'shop_id'],
  customer_delete: ['id', 'shop_id'],
  
  purchase_create: ['shop_id', 'type', 'supplier_id', 'supplier_name', 'products'],
  purchase_update: ['id', 'shop_id', 'type', 'products'],
  
  stock_adjustment_create: ['shop_id', 'products'],
  stock_adjustment_update: ['id', 'shop_id', 'type'],
  
  employee_create: ['shop_id', 'name', 'role', 'joined_date', 'mobile_number', 'email', 'department'],
  employee_update: ['id', 'shop_id'],
  employee_delete: ['id', 'shop_id'],
  
  supplier_create: ['shop_id', 'name', 'contact_infos', 'location_infos'],
  supplier_update: ['id', 'shop_id'],
  supplier_delete: ['id', 'shop_id'],

  shop_create: ['name', 'categories', 'business_infos', 'address'],
  shop_update: ['id'],
  shop_delete: ['id'],

  operating_hours_create: ['open_at', 'close_at', 'day'],
  operating_hours_update: ['id'],
  delivery_create: ['type', 'speed', 'free_shipping_amount', 'delivery_by'],
  delivery_update: ['id'],
  announcement_create: ['type', 'message', 'send_to', 'status'],
  announcement_update: ['id'],
  auth_token_create: ['session_id', 'shop_id'],
  auth_token_refresh: ['refresh_token'],
  employee_verify_token: ['token'],
  employee_resend_verify: ['id', 'shop_id'],

  // ── Utility Service ──────────────────────────────────────────────
  shop_category_create: ['shop_id', 'name'],
  shop_category_update: ['id', 'shop_id'],
  shop_category_delete: ['id', 'shop_id'],

  shop_unit_create: ['shop_id', 'name', 'short_name'],
  shop_unit_update: ['id', 'shop_id'],
  shop_unit_delete: ['id', 'shop_id'],

  shop_ui_id_create: ['shop_id', 'entity_type', 'prefix', 'start_from', 'current_number'],
  shop_ui_id_update: ['id', 'shop_id'],
  shop_ui_id_delete: ['id', 'shop_id'],

  shop_id_config_upsert: ['shop_id', 'config'],


  activity_log_create: ['shop_id', 'user_name', 'service', 'action', 'entity_type', 'entity_id', 'description'],

  // ── StockAdjMov Service ──────────────────────────────────────────
  stock_mov_adj_create: ['shop_id', 'type', 'session_id', 'date'],
  stock_mov_adj_delete: ['id', 'shop_id'],

  cart_reserve: ['session_id', 'shop_id', 'product_id', 'qty', 'type'],
  cart_cancel: ['session_id'],
  cart_remove: ['session_id', 'product_id'],
};
