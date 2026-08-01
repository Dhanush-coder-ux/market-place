export const ENDPOINTS = {
  SUPPLIERS: "/suppliers",
  SUPPLIER_CUSTOM_FIELDS: "/suppliers/custom-fields",
  EMPLOYEES: "/employees",
  CUSTOMERS: "/customers",
  CUSTOMER_CUSTOM_FIELDS: "/customers/custom-fields",    // gateway rewrites → /custom-fields on port 8007
  INVENTORIES: "/inventories/inventories",
  INVENTORY_CUSTOM_FIELDS: "/inventories/custom-fields",  // gateway rewrites → /custom-fields on port 8000
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
  UPLOAD_ASSETS: "/utilities/upload/assets",
  GENERATE_BARCODE: "/products/generate-barcode",

  // ── Utility Service: Shop Categories ─────────────────────────────
  SHOP_CATEGORIES: "/utilities/shop-categories",

  // ── Utility Service: Shop Units ──────────────────────────────────
  SHOP_UNITS: "/utilities/shop-units",

  // ── Utility Service: Shop UI IDs ─────────────────────────────────
  SHOP_UI_IDS: "/utilities/shop-ui-ids",

  // ── Utility Service: Shop ID Config ──────────────────────────────
  SHOP_ID_CONFIG: "/utilities/shop-id-config",


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
  AUTH_TOKEN_REFRESH: "/auth/refresh",

  // ── Analytics Service ────────────────────────────────────────────
  // Unified dashboard (dashboard screen only)
  ANALYTICS_DASHBOARD: "/analytics/analytics-dashboard/",

  // Product Inventory Analytics
  ANALYTICS_PRODINV:              "/analytics/prodinv",
  ANALYTICS_PRODINV_OVERALL:      "/analytics/prodinv/overall",
  ANALYTICS_PRODINV_TOP:          "/analytics/prodinv/top",
  ANALYTICS_PRODINV_LOW_STOCK:    "/analytics/prodinv/low-stock",
  ANALYTICS_PRODINV_OUT_OF_STOCK: "/analytics/prodinv/out-of-stock",
  ANALYTICS_PRODINV_DASHBOARD:    "/analytics/prodinv/dashboard",

  // Customer Analytics
  ANALYTICS_CUSTOMER:           "/analytics/customer",
  ANALYTICS_CUSTOMER_OVERALL:   "/analytics/customer/overall",
  ANALYTICS_CUSTOMER_TOP:       "/analytics/customer/top",
  ANALYTICS_CUSTOMER_TREND:     "/analytics/customer/trend",
  ANALYTICS_CUSTOMER_DASHBOARD: "/analytics/customer/dashboard",

  // Supplier Analytics
  ANALYTICS_SUPPLIER:           "/analytics/supplier",
  ANALYTICS_SUPPLIER_OVERALL:   "/analytics/supplier/overall",
  ANALYTICS_SUPPLIER_TOP:       "/analytics/supplier/top",
  ANALYTICS_SUPPLIER_TREND:     "/analytics/supplier/trend",
  ANALYTICS_SUPPLIER_DASHBOARD: "/analytics/supplier/dashboard",

  // Stock Movement / Adjustment Analytics
  ANALYTICS_STOCKMOVADJ:           "/analytics/stockmovadj",
  ANALYTICS_STOCKMOVADJ_OVERALL:   "/analytics/stockmovadj/overall",
  ANALYTICS_STOCKMOVADJ_DAILY:     "/analytics/stockmovadj/daily",
  ANALYTICS_STOCKMOVADJ_TREND:     "/analytics/stockmovadj/trend",
  ANALYTICS_STOCKMOVADJ_DASHBOARD: "/analytics/stockmovadj/dashboard",

  // Purchase Analytics
  ANALYTICS_PURCHASE:           "/analytics/purchase",
  ANALYTICS_PURCHASE_OVERALL:   "/analytics/purchase/overall",
  ANALYTICS_PURCHASE_DAILY:     "/analytics/purchase/daily",
  ANALYTICS_PURCHASE_TREND:     "/analytics/purchase/trend",
  ANALYTICS_PURCHASE_DASHBOARD: "/analytics/purchase/dashboard",

  // Sales Analytics
  ANALYTICS_SALES:           "/analytics/sales",
  ANALYTICS_SALES_OVERALL:   "/analytics/sales/overall",
  ANALYTICS_SALES_DAILY:     "/analytics/sales/daily",
  ANALYTICS_SALES_TREND:     "/analytics/sales/trend",
  ANALYTICS_SALES_DASHBOARD: "/analytics/sales/dashboard",

  // ── Notification Service ──────────────────────────────────────────
  NOTIFICATIONS: "/notifications",
} as const;

// Dynamically loaded from local storage or defaults to the actual shop in the DB
export let SHOP_ID = localStorage.getItem("shop_id") || "string";

export const setShopId = (id: string) => {
  SHOP_ID = id;
  localStorage.setItem("shop_id", id);
};
