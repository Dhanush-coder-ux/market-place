export interface PlanLimits {
  max_locations: number;
  max_users: number;
  max_skus: number;
  max_digital_stores: number;
  is_verified_badge?: boolean;
}

export interface PlanItem {
  id: "digital_store" | "basic" | "pro";
  name: string;
  monthly_price: number;
  annual_price: number;
  currency: string;
  badge?: string | null;
  description: string;
  button_text: string;
  limits: PlanLimits;
  included_features: string[];
}

export interface AddonItem {
  id: "extra_store" | "extra_user" | "sku_expansion" | "verified_badge";
  name: string;
  price: number;
  billing_cycle: "monthly" | "year";
  description: string;
  type: string;
}

export interface ActiveAddon {
  addon_id: string;
  name: string;
  quantity: number;
  price: number;
  billing_cycle: string;
}

export interface PlanUsage {
  current_users: number;
  current_locations: number;
  current_skus: number;
  current_digital_stores: number;
}

export interface SubscriptionData {
  has_subscription: boolean;
  id?: string;
  shop_id?: string;
  plan_id: string;
  plan_name: string;
  billing_cycle: "monthly" | "annual";
  status: "trialing" | "active" | "past_due" | "cancelled" | "expired" | "trial_available";
  trial_days_remaining?: number;
  trial_started_at?: string;
  trial_ends_at?: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  base_price?: number;
  total_price?: number;
  addons: ActiveAddon[];
  limits: PlanLimits;
  usage: PlanUsage;
}

export interface SubscriptionCatalogResponse {
  plans: PlanItem[];
  addons: AddonItem[];
  trial_days: number;
  razorpay_key_id: string;
  currency: string;
  marketplace_policy: string;
}

export interface TransactionItem {
  id: string;
  razorpay_order_id: string;
  razorpay_payment_id?: string;
  amount: number;
  currency: string;
  status: string;
  plan_id: string;
  billing_cycle: string;
  addons: ActiveAddon[];
  receipt?: string;
  created_at?: string;
}

export interface CreateOrderPayload {
  shop_id: string;
  plan_id: string;
  billing_cycle: "monthly" | "annual";
  addons: { addon_id: string; quantity: number }[];
}

export interface VerifyPaymentPayload {
  shop_id: string;
  plan_id: string;
  billing_cycle: "monthly" | "annual";
  addons: { addon_id: string; quantity: number }[];
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
