// ─── Profile Feature — Shared Types ─────────────────────────────────────────

export interface ShopProfile {
  // Identity
  shop_name?: string;
  name?: string;
  category?: string;
  tagline?: string;
  description?: string;
  about?: string;

  // Contact
  phone?: string;
  mobile?: string;
  email?: string;

  // Location
  address?: string;
  location?: string;
  landmark?: string;
  city?: string;
  zipcode?: string;
  pincode?: string;

  // Business
  gst_number?: string;
  gst?: string;
  business_type?: string;
  type?: string;
  currency?: string;
  open_time?: string;
  close_time?: string;

  // Online
  website?: string;
  instagram?: string;
  facebook?: string;
}

/** Normalised, always-defined shape consumed by components. */
export interface NormalisedShop {
  shopName: string;
  category: string;
  tagline: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  landmark: string;
  city: string;
  zipcode: string;
  gstNumber: string;
  businessType: string;
  currency: string;
  openTime: string;
  closeTime: string;
  website: string;
  instagram: string;
  facebook: string;
}

export function normaliseShop(raw: ShopProfile): NormalisedShop {
  return {
    shopName:     String(raw.shop_name    ?? raw.name          ?? "My Shop"),
    category:     String(raw.category                          ?? "Retail"),
    tagline:      String(raw.tagline                           ?? ""),
    description:  String(raw.description  ?? raw.about         ?? "No description has been added yet."),
    phone:        String(raw.phone        ?? raw.mobile         ?? "N/A"),
    email:        String(raw.email                             ?? "Not set"),
    address:      String(raw.address      ?? raw.location       ?? "Address not set"),
    landmark:     String(raw.landmark                          ?? "N/A"),
    city:         String(raw.city                              ?? "N/A"),
    zipcode:      String(raw.zipcode      ?? raw.pincode        ?? "N/A"),
    gstNumber:    String(raw.gst_number   ?? raw.gst            ?? "N/A"),
    businessType: String(raw.business_type ?? raw.type          ?? "N/A"),
    currency:     String(raw.currency                          ?? "INR"),
    openTime:     String(raw.open_time                         ?? "09:00"),
    closeTime:    String(raw.close_time                        ?? "21:00"),
    website:      String(raw.website                           ?? ""),
    instagram:    String(raw.instagram                         ?? ""),
    facebook:     String(raw.facebook                          ?? ""),
  };
}
