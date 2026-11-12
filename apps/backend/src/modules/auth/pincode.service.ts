import { AppError } from '../../common/errors/app-error';

export interface IndianPinCodeLocation {
  pinCode: string;
  country: 'India';
  state: string;
  district: string;
  city: string;
  postOffice?: string;
}

const VERIFIED_INDIAN_PIN_FALLBACK: Record<string, Omit<IndianPinCodeLocation, 'pinCode' | 'country'>> = {
  '600028': { state: 'Tamil Nadu', district: 'Chennai', city: 'Chennai', postOffice: 'Mylapore' },
  '600001': { state: 'Tamil Nadu', district: 'Chennai', city: 'Chennai', postOffice: 'Chennai G.P.O.' },
  '600006': { state: 'Tamil Nadu', district: 'Chennai', city: 'Chennai', postOffice: 'Greams Road' },
  '600018': { state: 'Tamil Nadu', district: 'Chennai', city: 'Chennai', postOffice: 'Teynampet' },
  '600032': { state: 'Tamil Nadu', district: 'Chennai', city: 'Chennai', postOffice: 'Guindy' },
  '600040': { state: 'Tamil Nadu', district: 'Chennai', city: 'Chennai', postOffice: 'Anna Nagar' },
  '641001': { state: 'Tamil Nadu', district: 'Coimbatore', city: 'Coimbatore', postOffice: 'Coimbatore H.O' },
  '625001': { state: 'Tamil Nadu', district: 'Madurai', city: 'Madurai', postOffice: 'Madurai H.O' },
  '620001': { state: 'Tamil Nadu', district: 'Tiruchirappalli', city: 'Tiruchirappalli', postOffice: 'Tiruchirappalli H.O' },
  '560001': { state: 'Karnataka', district: 'Bengaluru Urban', city: 'Bengaluru', postOffice: 'Bengaluru G.P.O.' },
  '560034': { state: 'Karnataka', district: 'Bengaluru Urban', city: 'Bengaluru', postOffice: 'Koramangala' },
  '682001': { state: 'Kerala', district: 'Ernakulam (Kochi)', city: 'Kochi', postOffice: 'Fort Kochi' },
  '695001': { state: 'Kerala', district: 'Thiruvananthapuram', city: 'Thiruvananthapuram', postOffice: 'Thiruvananthapuram G.P.O.' },
  '500001': { state: 'Telangana', district: 'Hyderabad', city: 'Hyderabad', postOffice: 'Hyderabad G.P.O.' },
  '530001': { state: 'Andhra Pradesh', district: 'Visakhapatnam', city: 'Visakhapatnam', postOffice: 'Visakhapatnam H.O' },
  '605001': { state: 'Puducherry', district: 'Puducherry', city: 'Puducherry', postOffice: 'Puducherry H.O' },
  '400001': { state: 'Maharashtra', district: 'Mumbai City', city: 'Mumbai', postOffice: 'Mumbai G.P.O.' },
  '411001': { state: 'Maharashtra', district: 'Pune', city: 'Pune', postOffice: 'Pune H.O' },
  '110001': { state: 'Delhi (NCT)', district: 'New Delhi', city: 'New Delhi', postOffice: 'Sansad Marg' },
  '380001': { state: 'Gujarat', district: 'Ahmedabad', city: 'Ahmedabad', postOffice: 'Ahmedabad G.P.O.' },
  '302001': { state: 'Rajasthan', district: 'Jaipur', city: 'Jaipur', postOffice: 'Jaipur G.P.O.' },
  '226001': { state: 'Uttar Pradesh', district: 'Lucknow', city: 'Lucknow', postOffice: 'Lucknow G.P.O.' },
  '700001': { state: 'West Bengal', district: 'Kolkata', city: 'Kolkata', postOffice: 'Kolkata G.P.O.' }
};

function cleanPostOfficeCity(office: any): string {
  const candidates = [office?.Block, office?.Taluk, office?.Division, office?.Name, office?.District];
  for (const c of candidates) {
    const val = typeof c === 'string' ? c.trim() : '';
    if (val && val.toUpperCase() !== 'NA') {
      return val;
    }
  }
  return '';
}

/**
 * Validates and resolves an Indian 6-digit PIN code via India Post Directory.
 * Rejects non-Indian, malformed, or unrecognized postal codes.
 */
export async function lookupIndianPinCode(rawPinCode: string): Promise<IndianPinCodeLocation> {
  const pin = String(rawPinCode || '').trim();

  // Indian civilian residential PIN codes are strictly 6 digits starting with 1-8
  if (!/^[1-8][0-9]{5}$/.test(pin)) {
    throw new AppError(
      'Invalid or non-Indian postal code. Please enter a valid 6-digit Indian PIN code (e.g., 600028).',
      400,
      'INVALID_INDIAN_PINCODE'
    );
  }

  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      const payload = (await response.json()) as any[];
      const entry = Array.isArray(payload) ? payload[0] : null;
      const postOffices = Array.isArray(entry?.PostOffice) ? entry.PostOffice : [];

      if (!entry || entry.Status !== 'Success' || postOffices.length === 0) {
        throw new AppError(
          `PIN code "${pin}" is not a valid Indian PIN code. Please verify and try again.`,
          404,
          'PINCODE_NOT_FOUND'
        );
      }

      const indianOffices = postOffices.filter(
        (po: any) => String(po?.Country || '').trim().toLowerCase() === 'india'
      );
      if (indianOffices.length === 0) {
        throw new AppError(
          `Postal code "${pin}" does not belong to India. Only Indian residential addresses are supported.`,
          400,
          'NON_INDIAN_PINCODE'
        );
      }

      const preferred =
        indianOffices.find((po: any) => String(po?.DeliveryStatus || '').toLowerCase() === 'delivery') ||
        indianOffices[0];

      return {
        pinCode: pin,
        country: 'India',
        state: String(preferred.State || '').trim(),
        district: String(preferred.District || '').trim(),
        city: cleanPostOfficeCity(preferred) || String(preferred.District || '').trim(),
        postOffice: String(preferred.Name || '').trim() || undefined
      };
    }
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    // Network unreachable fallback only for known verified Indian PINs
    const fallback = VERIFIED_INDIAN_PIN_FALLBACK[pin];
    if (fallback) {
      return {
        pinCode: pin,
        country: 'India',
        ...fallback
      };
    }
    throw new AppError(
      'Unable to verify PIN code right now. Please enter a verified Indian PIN code or retry shortly.',
      503,
      'PINCODE_LOOKUP_UNAVAILABLE'
    );
  }

  const fallback = VERIFIED_INDIAN_PIN_FALLBACK[pin];
  if (fallback) {
    return {
      pinCode: pin,
      country: 'India',
      ...fallback
    };
  }

  throw new AppError(
    `PIN code "${pin}" is not recognized as a valid Indian PIN code.`,
    404,
    'PINCODE_NOT_FOUND'
  );
}
