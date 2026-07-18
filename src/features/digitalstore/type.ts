export interface StoreFormData {
  name: string;
  tagline?: string;
  address?: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  category?: string;
  themeColor?: string;
  website?: string;
  instagram?: string;
  twitter?: string;
  logo?: File | null;
  logoPreview?: string;
  banner?: File | null;
  bannerPreview?: string;
  gstRegistered?: boolean;
  gstNumber?: string;
  
  // Step 2 Additions
  operatingHours: any[];
  deliveryOptions: {
    instant: DeliveryConfig;
    standard: DeliveryConfig;
    nationwide: DeliveryConfig;
  };
  
  // Step 3 Additions
  selectedProducts: Record<string, SelectedProductConfig>;
}

export interface DeliveryConfig {
  enabled: boolean;
  speed: string;
  freeThreshold: number;
  manageStore: boolean;
  partners: boolean;
}

export interface SelectedProductConfig {
  id: string;
  inventory_id: string;
  online_selling_price?: number;
  online_reorder_point?: number;
  custom_fields: Record<string, any>;
  new_custom_fields: { key: string; value: string; visible_online: boolean }[];
}

export interface StoreSetupProps {
  existingData?: Partial<StoreFormData>;
}
