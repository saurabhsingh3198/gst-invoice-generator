/**
 * Indian State Codes and Names mapping under GST
 */
export const GST_STATE_MAP: Record<string, string> = {
  '01': 'Jammu & Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '26': 'Dadra & Nagar Haveli and Daman & Diu',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman & Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
  '97': 'Other Territory',
  '99': 'Centre Jurisdiction',
};

/**
 * Standard 15-character GSTIN regex format:
 * 2 digits (state code) + 10 chars PAN + 1 digit (entity number) + 'Z' + 1 checksum character
 */
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export interface GstinValidationResult {
  isValid: boolean;
  stateCode?: string;
  stateName?: string;
  pan?: string;
  errorMessage?: string;
}

/**
 * Validates GSTIN string and extracts state code and name
 */
export function analyzeGstin(gstinInput: string): GstinValidationResult {
  if (!gstinInput) {
    return { isValid: false, errorMessage: 'GSTIN is empty' };
  }

  const clean = gstinInput.trim().toUpperCase();

  let stateCode: string | undefined;
  let stateName: string | undefined;

  if (clean.length >= 2) {
    const code = clean.substring(0, 2);
    if (GST_STATE_MAP[code]) {
      stateCode = code;
      stateName = GST_STATE_MAP[code];
    }
  }

  const pan = clean.length >= 12 ? clean.substring(2, 12) : undefined;

  if (clean.length !== 15) {
    return {
      isValid: false,
      stateCode,
      stateName,
      pan,
      errorMessage: `GSTIN must be 15 characters (currently ${clean.length})`,
    };
  }

  if (!GSTIN_REGEX.test(clean)) {
    return {
      isValid: false,
      stateCode,
      stateName,
      pan,
      errorMessage: 'Invalid GSTIN format (Expected: 22AAAAA0000A1Z5)',
    };
  }

  return {
    isValid: true,
    stateCode,
    stateName,
    pan,
  };
}

/**
 * List of states for dropdowns
 */
export const GST_STATE_OPTIONS = Object.entries(GST_STATE_MAP).map(([code, name]) => ({
  code,
  name,
  label: `${code} - ${name}`,
}));
