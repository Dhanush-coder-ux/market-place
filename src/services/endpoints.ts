export const ENDPOINTS = {
  SUPPLIERS: "/suppliers",
  SUPPLIER_CUSTOM_FIELDS: "/custom-fields",
  EMPLOYEES: "/employees",
  CUSTOMERS: "/customers",
  CUSTOMER_CUSTOM_FIELDS: "/customer-fields",    // gateway rewrites → /custom-fields on port 8007
  INVENTORIES: "/inventories/inventories",
  INVENTORY_CUSTOM_FIELDS: "/inventory-fields",  // gateway rewrites → /custom-fields on port 8000
  S_ADJUSTMENTS: "/stockmovadj",
  S_MOVEMENTS: "/stockmovadj",
  PURCHASES: "/purchases",
  PURCHASE_CUSTOM_FIELDS: "/purchase-fields",
  ORDERS: "/orders",
  BILLING: "/inventories/billing",
  EXCHANGE: "/exchanges",
  RETURN: "/returns",
  SHOPS: "/shops",
  OFFERS: "/offers",
  COUPONS: "/coupons",
  UTILITIES: "/utilities",
  UPLOAD_IMAGES: "/utilities/upload/images",
  GENERATE_BARCODE: "/products/generate-barcode",

  // ── Utility Service: Shop Categories ─────────────────────────────
  SHOP_CATEGORIES: "/utilities/shop-categories",

  // ── Utility Service: Shop Units ──────────────────────────────────
  SHOP_UNITS: "/utilities/shop-units",

  // ── Utility Service: Shop UI IDs ─────────────────────────────────
  SHOP_UI_IDS: "/utilities/shop-ui-ids",

  // ── Utility Service: Shop ID Config ──────────────────────────────
  SHOP_ID_CONFIG: "/utilities/shop-id-config",

  // ── Utility Service: Base Fields ─────────────────────────────────
  BASE_FIELDS: "/utilities/fields/base",

  // ── Utility Service: Custom Fields ───────────────────────────────
  CUSTOM_FIELDS: "/utilities/fields/custom",

  // ── Utility Service: Base Dropdowns ──────────────────────────────
  BASE_DROPDOWNS: "/utilities/dropdowns/base",

  // ── Utility Service: Custom Dropdowns ────────────────────────────
  CUSTOM_DROPDOWNS: "/utilities/dropdowns/custom",

  // ── Utility Service: Activity Logs ───────────────────────────────
  ACTIVITY_LOGS: "/utilities/activity-logs",

  // ── StockAdjMov Service: Stock Movements / Adjustments ───────────
  STOCK_MOV_ADJ: "/stockmovadj",
  STOCK_MOV_ADJ_CART: "/stockmovadj/cart",

  // ── Order Service: Orders + Cart ─────────────────────────────────
  ORDER_CART: "/cart",
} as const;

// Hardcoded until auth wires up shop_id from login session
export const SHOP_ID = "string";
