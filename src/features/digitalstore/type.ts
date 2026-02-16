export interface StoreFormData {
  name: string;
  tagline?: string;
  address?: string;
  description?: string;
  contact?: string;
  logo?: File | null;
  logoPreview?: string;
  banner?: File | null;
  bannerPreview?: string;
}

export interface StoreSetupProps {
  existingData?: Partial<StoreFormData>;
}
