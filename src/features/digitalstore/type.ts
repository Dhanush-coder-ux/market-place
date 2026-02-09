export interface StoreFormData {
  name: string;
  tagline?: string;
  address?: string;
  description?: string;
  contact?: string;
  logo?: File | null;
  logoPreview?: string;
}

export interface StoreSetupProps {
  existingData?: Partial<StoreFormData>;
}
