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
  const rawAddr = raw.address ?? raw.location;
  let addrStr = "Address not set";
  if (typeof rawAddr === "string") {
    addrStr = rawAddr;
  } else if (rawAddr && typeof rawAddr === "object") {
    addrStr = (rawAddr as any).full_address || (rawAddr as any).address || "Address not set";
  }

  const rawLandmark = raw.landmark ?? (raw.address && typeof raw.address === "object" ? (raw.address as any).landmark : null);
  const rawCity = raw.city ?? (raw.address && typeof raw.address === "object" ? (raw.address as any).city : null);
  const rawZipcode = raw.zipcode ?? raw.pincode ?? (raw.address && typeof raw.address === "object" ? (raw.address as any).zip_code : null);

  return {
    shopName:     String(raw.shop_name    ?? raw.name          ?? "My Shop"),
    category:     String(raw.category                          ?? "Retail"),
    tagline:      String(raw.tagline                           ?? ""),
    description:  String(raw.description  ?? raw.about         ?? "No description has been added yet."),
    phone:        String(raw.phone        ?? raw.mobile         ?? "N/A"),
    email:        String(raw.email                             ?? "Not set"),
    address:      addrStr,
    landmark:     String(rawLandmark ?? "N/A"),
    city:         String(rawCity ?? "N/A"),
    zipcode:      String(rawZipcode ?? "N/A"),
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
