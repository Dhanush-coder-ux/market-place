/**
 * Indian Goods and Services Tax Identification Number (GSTIN) Utilities and Validation.
 * Format: 2 digits (State) + 10 chars (PAN) + 1 char (Entity) + 1 char ('Z') + 1 char (Checksum)
 * Example: 22AAAAA0000A1Z5
 */

export const GST_STATE_CODES: Record<string, string> = {
  "01": "Jammu & Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "25": "Daman & Diu",
  "26": "Dadra & Nagar Haveli",
  "27": "Maharashtra",
  "28": "Andhra Pradesh",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman & Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh (New)",
  "38": "Ladakh",
  "97": "Other Territory",
  "99": "Centre Jurisdiction",
};

export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export interface GstValidationResult {
  isValid: boolean;
  error?: string;
  stateCode?: string;
  stateName?: string;
  pan?: string;
  cleanGst: string;
}

/**
 * Clean & format raw GST input: uppercase and alphanumeric only, capped at 15 characters.
 */
export function sanitizeGstInput(value: string): string {
  return (value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 15);
}

/**
 * Validate a GST number according to Indian GSTIN specifications.
 */
export function validateGstNumber(gst: string): GstValidationResult {
  const cleanGst = sanitizeGstInput(gst);

  if (!cleanGst) {
    return {
      isValid: false,
      error: "GST number is required",
      cleanGst,
    };
  }

  const stateCode = cleanGst.length >= 2 ? cleanGst.substring(0, 2) : undefined;
  const stateName = stateCode ? GST_STATE_CODES[stateCode] : undefined;
  const pan = cleanGst.length >= 12 ? cleanGst.substring(2, 12) : undefined;

  if (cleanGst.length < 15) {
    return {
      isValid: false,
      error: `GSTIN must be 15 characters (currently ${cleanGst.length}/15)`,
      stateCode,
      stateName,
      pan,
      cleanGst,
    };
  }

  if (!stateName) {
    return {
      isValid: false,
      error: `Invalid state code "${stateCode}". Must be between 01 and 38`,
      stateCode,
      cleanGst,
    };
  }

  const panPart = cleanGst.substring(2, 12);
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panRegex.test(panPart)) {
    return {
      isValid: false,
      error: `Invalid PAN structure "${panPart}". Expected 5 letters, 4 numbers, 1 letter`,
      stateCode,
      stateName,
      pan: panPart,
      cleanGst,
    };
  }

  const entityCode = cleanGst.charAt(12);
  if (!/^[1-9A-Z]$/.test(entityCode)) {
    return {
      isValid: false,
      error: `Invalid entity code "${entityCode}" at 13th position (must be 1-9 or A-Z)`,
      stateCode,
      stateName,
      pan: panPart,
      cleanGst,
    };
  }

  const defaultZ = cleanGst.charAt(13);
  if (defaultZ !== "Z") {
    return {
      isValid: false,
      error: `14th character must be 'Z' (found '${defaultZ}')`,
      stateCode,
      stateName,
      pan: panPart,
      cleanGst,
    };
  }

  const checksumChar = cleanGst.charAt(14);
  if (!/^[0-9A-Z]$/.test(checksumChar)) {
    return {
      isValid: false,
      error: "15th character must be an alphanumeric check digit",
      stateCode,
      stateName,
      pan: panPart,
      cleanGst,
    };
  }

  if (!GSTIN_REGEX.test(cleanGst)) {
    return {
      isValid: false,
      error: "Invalid GST format (expected: 22AAAAA0000A1Z5)",
      stateCode,
      stateName,
      pan: panPart,
      cleanGst,
    };
  }

  return {
    isValid: true,
    stateCode,
    stateName,
    pan: panPart,
    cleanGst,
  };
}
