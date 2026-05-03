export const SCHEMAS = {
  inventory_create: ['shop_id', 'barcode', 'name', 'category', 'description', 'buy_price', 'sell_price'],
  inventory_update: ['id', 'shop_id'],
  
  customer_create: ['shop_id', 'name', 'email', 'mobile_number', 'credit_limit', 'is_active'],
  customer_update: ['id', 'shop_id'],
  
  purchase_create: ['shop_id', 'type', 'supplier_id', 'supplier_name', 'products'],
  purchase_update: ['id', 'shop_id', 'type', 'products'],
  
  stock_adjustment_create: ['shop_id', 'products'],
  stock_adjustment_update: ['id', 'shop_id', 'type'],
  
  employee_create: ['shop_id', 'name', 'role', 'joined_date', 'mobile_number', 'email', 'department'],
  employee_update: ['id', 'shop_id'],
  
  supplier_create: ['shop_id', 'name', 'mobile_number', 'gst_no'],
  supplier_update: ['id', 'shop_id'],

  shop_create: ['name', 'category', 'business_infos', 'address'],
  shop_update: ['id']
};
