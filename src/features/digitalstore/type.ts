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
}

export interface StoreSetupProps {
  existingData?: Partial<StoreFormData>;
}

