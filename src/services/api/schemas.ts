export const SCHEMAS = {
  inventory_create: ['shop_id', 'barcode', 'stocks', 'buy_price', 'sell_price', 'name', 'description', 'category'],
  inventory_update: ['id', 'shop_id', 'barcode', 'stocks', 'buy_price', 'sell_price', 'name', 'description', 'category'],
  
  customer_create: ['shop_id'],
  customer_update: ['id', 'shop_id'],
  
  purchase_create: ['shop_id', 'type', 'supplier_id', 'supplier_name', 'products'],
  purchase_update: ['id', 'shop_id', 'type', 'products'],
  
  stock_adjustment_create: ['shop_id', 'products'],
  stock_adjustment_update: ['id', 'shop_id', 'type'],
  
  employee_create: ['email', 'name', 'mobile_number', 'role', 'shop_id'],
  employee_update: ['id', 'account_id', 'shop_id', 'email', 'name', 'mobile_number', 'role'],
  
  supplier_create: ['shop_id'],
  supplier_update: ['id', 'shop_id'],

  shop_create: [], // dynamic
  shop_update: ['id']
};
