export const ENDPOINTS = {
  PRODUCTS:      "/products",
  SUPPLIERS:     "/suppliers",
  EMPLOYEES:     "/employees",
  CUSTOMERS:     "/customers",
  INVENTORIES:   "/inventories/inventories",
  S_ADJUSTMENTS: "/inventories/s-adjustments",
  PURCHASES:     "/inventories/purchases",
  ORDERS:        "/orders",
  SHOPS:         "/shops",
  OFFERS:        "/offers",
  COUPONS:       "/coupons",
} as const;

// Hardcoded until auth wires up shop_id from login session
export const SHOP_ID = "37d5519b-51a1-5854-982b-4d6524171017";
