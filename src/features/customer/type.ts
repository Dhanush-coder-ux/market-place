// ── Nested sub-types matching backend Pydantic models ──────────────────────

export interface CustomerContactInfos {
  mobile_number?: string;
  email?: string;
}

export interface CustomerCreditInfos {
  limit: number;
  notes?: string;
  terms?: string; // e.g. "7_DAYS"
}

export interface CustomerLocationInfos {
  zipcode: string;
  country: string;
  state: string;
  full_address: string;
}

export interface CustomerOutstandingInfos {
  amount: number;
}

export interface CustomerPaymentInfo {
  method: "UPI" | "CASH" | "CARD" | "BANK";
  amount: number;
}

// ── Request payloads ───────────────────────────────────────────────────────

export interface CreateCustomerPayload {
  shop_id: string;
  name: string;
  contact_infos: CustomerContactInfos;
  credit_infos?: CustomerCreditInfos;
  location_infos: CustomerLocationInfos;
  can_have_credit: boolean;
  custom_fields?: Record<string, any>;
}

export interface UpdateCustomerPayload {
  id: string;
  shop_id: string;
  name?: string;
  contact_infos?: CustomerContactInfos;
  credit_infos?: CustomerCreditInfos;
  location_infos?: CustomerLocationInfos;
  can_have_credit: boolean;
  custom_fields?: Record<string, any>;
}

export interface AddOutstandingPayload {
  id: string;
  shop_id: string;
  outstanding_infos: CustomerOutstandingInfos;
  type: "INCREMENT" | "DECREMENT" | "DIRECT";
}

export interface ClearOutstandingPayload {
  shop_id: string;
  customer_id: string;
  payment_infos: CustomerPaymentInfo[];
}

// ── Custom Field types ─────────────────────────────────────────────────────

export interface CustomerCustomFieldDefinition {
  id: string;
  shop_id: string;
  field_name: string;
  label_name: string;
  type: string; // 'text' | 'number' | 'date' | 'boolean'
  required: boolean;
  visible_online: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerCustomFieldValue {
  id?: string;
  shop_id: string;
  customer_id: string;
  field_id: string;
  value: string;
}

// Merged view: field definition + its current value for a customer
export interface CustomerCustomFieldMerged {
  field: CustomerCustomFieldDefinition;
  value: string;
}
