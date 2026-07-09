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
  MY_SHOPS: "/shops/my-shops",
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

  // ── Auth Service ─────────────────────────────────────────────────

  AUTH_USER_CHECK: "/auth/user-check",
  AUTH_SHOP_CHECK: "/auth/shop-check",
  AUTH_VERIFY: "/auth/verify",
  AUTH_INIT: "/auth/init",
  AUTH_REDIRECT: "/auth/redirect",
  AUTH_TOKEN_CREATE: "/auth/token/create",
  AUTH_SHOP_CHECKIN: "/auth/shop-checkin",
  AUTH_TOKEN_REFRESH: "/auth/token/refresh",

  // ── Analytics Service ────────────────────────────────────────────
  ANALYTICS_DASHBOARD: "/analytics-dashboard/",
  ANALYTICS_PRODINV: "/analytics-dashboard/prodinv",
  ANALYTICS_CUSTOMER: "/analytics-dashboard/customer",
} as const;

// Dynamically loaded from local storage or defaults to the actual shop in the DB
export let SHOP_ID = localStorage.getItem("shop_id") || "8f6aeb11-d5ed-51de-b153-a3ad851ed275";

export const setShopId = (id: string) => {
  SHOP_ID = id;
  localStorage.setItem("shop_id", id);
};
