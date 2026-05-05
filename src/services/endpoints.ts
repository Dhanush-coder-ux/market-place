export const ENDPOINTS = {
  PRODUCTS:      "/products",
  SUPPLIERS:     "/suppliers",
  EMPLOYEES:     "/employees",
  CUSTOMERS:     "/customers",
  INVENTORIES:   "/inventories/inventories",
  S_ADJUSTMENTS: "/inventories/s-adjustments",
  S_MOVEMENTS:   "/inventories/s_movements",
  PURCHASES:     "/inventories/purchases",
  ORDERS:        "/orders",
  SHOPS:         "/shops",
  OFFERS:        "/offers",
  COUPONS:       "/coupons",
} as const;

// Hardcoded until auth wires up shop_id from login session
export const SHOP_ID = "TEST-SHOP";
