export interface SupplierLocationInfos {
  zipcode: string;
  country: string;
  state: string;
  full_address: string;
}

export interface SupplierContactInfos {
  email?: string;
  mobile_number?: string;
}

export interface SupplierContactPersonInfos {
  name: string;
  email?: string;
  mobile_number?: string;
}

export interface SupplierOutstandingInfos {
  amount: number;
}

export interface SupplierCustomFieldDefinition {
  id: string;
  shop_id: string;
  field_name: string;
  label_name: string;
  type: string;
  required: boolean;
  visible_online: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SupplierCustomFieldValue {
  id?: string;
  shop_id: string;
  supplier_id: string;
  field_id: string;
  value: string;
}

// Merged view: field definition + its current value for a supplier
export interface SupplierCustomFieldMerged {
  field: SupplierCustomFieldDefinition;
  value: string;
}
