import { AppError } from '../errors/app-error';

export const MAX_KYC_FILE_BYTES = 2 * 1024 * 1024; // 2 MB = 2,097,152 bytes

export interface DynamicFieldConfigInput {
  key?: string;
  fieldKey?: string;
  label?: string;
  type?: string;
  required?: boolean;
  options?: string[];
  minLength?: number;
  maxLength?: number;
}

export function normalizeEmail(raw: unknown): string {
  return typeof raw === 'string' ? raw.trim().toLowerCase() : '';
}

export function validateEmailFormat(raw: unknown): string {
  const normalized = normalizeEmail(raw);
  if (!normalized) {
    throw new AppError('Email address is required.', 400, 'EMAIL_REQUIRED');
  }
  if (normalized.length > 150 || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(normalized)) {
    throw new AppError('Please enter a valid email address.', 400, 'INVALID_EMAIL');
  }
  return normalized;
}

export function validateFullName(raw: unknown): string {
  const name = typeof raw === 'string' ? raw.trim().replace(/\s+/g, ' ') : '';
  if (!name) {
    throw new AppError('Full legal name is required.', 400, 'FULL_NAME_REQUIRED');
  }
  if (name.length < 2 || name.length > 80 || !/^[A-Za-z][A-Za-z\s.'-]{1,79}$/.test(name)) {
    throw new AppError(
      'Full Name must be 2–80 characters using valid letters and spaces only (numbers and symbols are not allowed).',
      400,
      'INVALID_FULL_NAME'
    );
  }
  return name;
}

export function validateIndianMobile(raw: unknown): string {
  const digits = typeof raw === 'string' ? raw.trim() : '';
  if (!digits) {
    throw new AppError('Mobile number is required.', 400, 'MOBILE_REQUIRED');
  }
  if (!/^[6-9]\d{9}$/.test(digits)) {
    throw new AppError(
      'Please enter a valid 10-digit Indian mobile number starting with 6–9.',
      400,
      'INVALID_MOBILE'
    );
  }
  return digits;
}

export function validatePasswordStrength(raw: unknown): string {
  const password = typeof raw === 'string' ? raw : '';
  if (!password) {
    throw new AppError('Password is required.', 400, 'PASSWORD_REQUIRED');
  }
  if (password.length < 8 || password.length > 128) {
    throw new AppError('Password must be between 8 and 128 characters long.', 400, 'WEAK_PASSWORD');
  }
  if (!/[A-Z]/.test(password)) {
    throw new AppError('Password must include at least one uppercase letter.', 400, 'WEAK_PASSWORD');
  }
  if (!/[a-z]/.test(password)) {
    throw new AppError('Password must include at least one lowercase letter.', 400, 'WEAK_PASSWORD');
  }
  if (!/[0-9]/.test(password)) {
    throw new AppError('Password must include at least one numeric digit.', 400, 'WEAK_PASSWORD');
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) {
    throw new AppError('Password must include at least one special character.', 400, 'WEAK_PASSWORD');
  }
  return password;
}

export function validatePinCode(raw: unknown): string {
  const pin = typeof raw === 'string' ? raw.trim() : '';
  if (!pin || !/^[1-9][0-9]{5}$/.test(pin)) {
    throw new AppError('Please enter a valid 6-digit Indian PIN Code.', 400, 'PINCODE_INVALID');
  }
  return pin;
}

export function validatePanNumber(raw: unknown): string {
  const pan = typeof raw === 'string' ? raw.trim().toUpperCase() : '';
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
    throw new AppError('Valid 10-character PAN number is required (format: ABCDE1234F).', 400, 'INVALID_PAN');
  }
  return pan;
}

export function validateAndMaskAadhaar(raw: unknown): { masked: string; last4: string } {
  const cleaned = typeof raw === 'string' ? raw.replace(/[\s-]/g, '').trim() : '';
  if (/^X{8}\d{4}$/i.test(cleaned)) {
    const last4 = cleaned.slice(-4);
    return { masked: `XXXX-XXXX-${last4}`, last4 };
  }
  if (!/^[2-9]\d{11}$/.test(cleaned) || /^(\d)\1{11}$/.test(cleaned)) {
    throw new AppError(
      'Valid 12-digit Aadhaar number is required (must start with 2–9).',
      400,
      'INVALID_AADHAAR'
    );
  }
  const last4 = cleaned.slice(-4);
  return { masked: `XXXX-XXXX-${last4}`, last4 };
}

export function validateAlternativeGovtId(docType: string, rawNumber: unknown): string {
  const num = typeof rawNumber === 'string' ? rawNumber.trim().toUpperCase() : '';
  const kind = String(docType || '').toUpperCase();
  if (kind === 'PASSPORT') {
    if (!/^[A-Z][0-9]{7}$/.test(num)) {
      throw new AppError('Valid Indian Passport number is required (e.g., A1234567).', 400, 'INVALID_ID_NUMBER');
    }
    return num;
  }
  if (kind === 'VOTER_ID') {
    if (!/^[A-Z]{3}[0-9]{7}$/.test(num)) {
      throw new AppError('Valid Voter ID (EPIC) number is required (e.g., ABC1234567).', 400, 'INVALID_ID_NUMBER');
    }
    return num;
  }
  if (kind === 'DRIVING_LICENCE') {
    if (!/^[A-Z]{2}[0-9]{2}[\s-]?[0-9]{4,11}$/.test(num)) {
      throw new AppError('Valid Indian Driving Licence number is required.', 400, 'INVALID_ID_NUMBER');
    }
    return num;
  }
  if (num.length < 4 || num.length > 40) {
    throw new AppError('Valid government ID number (4–40 characters) is required.', 400, 'INVALID_ID_NUMBER');
  }
  return num;
}

export function validateGstin(raw: unknown): string {
  const gstin = typeof raw === 'string' ? raw.trim().toUpperCase() : '';
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)) {
    throw new AppError('Valid 15-character GSTIN is required (e.g., 33AAAAA0000A1Z5).', 400, 'INVALID_GSTIN');
  }
  return gstin;
}

export function validateHttpUrl(raw: unknown): string {
  const value = typeof raw === 'string' ? raw.trim() : '';
  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname.includes('.')) {
      throw new Error('bad protocol');
    }
    return value;
  } catch {
    throw new AppError('Please enter a valid URL starting with http:// or https://.', 400, 'INVALID_URL');
  }
}

export function validateAddressPayload(address: any) {
  if (!address || typeof address !== 'object') {
    throw new AppError('Residential address details are required.', 400, 'ADDRESS_REQUIRED');
  }

  const allowedTypes = new Set(['Residential', 'Business', 'Other']);
  const addressType = String(address.addressType || 'Residential').trim();
  if (!allowedTypes.has(addressType)) {
    throw new AppError('Invalid address type.', 400, 'INVALID_ADDRESS_TYPE');
  }

  const addressLine1 = typeof address.addressLine1 === 'string' ? address.addressLine1.trim() : '';
  if (addressLine1.length < 5 || addressLine1.length > 200) {
    throw new AppError('Address Line 1 must be between 5 and 200 characters.', 400, 'ADDRESS_LINE1_INVALID');
  }

  const addressLine2 = typeof address.addressLine2 === 'string' ? address.addressLine2.trim() : '';
  if (addressLine2.length > 200) {
    throw new AppError('Address Line 2 cannot exceed 200 characters.', 400, 'ADDRESS_LINE2_INVALID');
  }

  const landmark = typeof address.landmark === 'string' ? address.landmark.trim() : '';
  if (landmark.length > 120) {
    throw new AppError('Landmark cannot exceed 120 characters.', 400, 'LANDMARK_INVALID');
  }

  const state = typeof address.state === 'string' ? address.state.trim() : '';
  if (state.length < 2 || state.length > 80 || !/^[A-Za-z0-9\s./&()-]+$/.test(state)) {
    throw new AppError('Please select a valid State.', 400, 'STATE_REQUIRED');
  }

  const district = typeof address.district === 'string' ? address.district.trim() : '';
  if (district.length < 2 || district.length > 80 || !/^[A-Za-z0-9\s./&()-]+$/.test(district)) {
    throw new AppError('Please select a valid District.', 400, 'DISTRICT_REQUIRED');
  }

  const city = typeof address.city === 'string' ? address.city.trim() : '';
  if (city.length < 2 || city.length > 80 || !/^[A-Za-z][A-Za-z\s.'-]{1,79}$/.test(city)) {
    throw new AppError('City / Town must be 2–80 alphabetic characters.', 400, 'CITY_INVALID');
  }

  const pinCode = validatePinCode(address.pinCode);

  return {
    addressLine1,
    addressLine2,
    landmark,
    country: 'India',
    state,
    district,
    city,
    pinCode,
    addressType
  };
}

export function validateDynamicProfileValues(
  rawProfile: Record<string, any> | undefined,
  configuredFields: DynamicFieldConfigInput[] = []
): Record<string, any> {
  const input = rawProfile && typeof rawProfile === 'object' ? rawProfile : {};
  const sanitized: Record<string, any> = {};
  const configuredMap = new Map<string, DynamicFieldConfigInput>();

  for (const field of configuredFields) {
    const key = String(field.key || field.fieldKey || '').trim();
    if (!key) continue;
    configuredMap.set(key, field);

    const rawVal = input[key];
    const strVal = typeof rawVal === 'string' ? rawVal.trim() : rawVal !== undefined && rawVal !== null ? String(rawVal).trim() : '';
    const label = field.label || key;

    if (field.required && !strVal) {
      throw new AppError(`"${label}" is required.`, 400, 'DYNAMIC_FIELD_REQUIRED');
    }
    if (!strVal) continue;

    if (/<script\b/i.test(strVal)) {
      throw new AppError(`Invalid characters detected in "${label}".`, 400, 'INVALID_DYNAMIC_FIELD');
    }

    const fieldType = String(field.type || 'text').toLowerCase();
    const keyLower = key.toLowerCase();

    if (fieldType === 'select' && Array.isArray(field.options) && field.options.length > 0) {
      if (!field.options.includes(strVal)) {
        throw new AppError(`Invalid selection for "${label}".`, 400, 'INVALID_OPTION');
      }
      sanitized[key] = strVal;
      continue;
    }

    if (fieldType === 'email' || keyLower.includes('email')) {
      sanitized[key] = validateEmailFormat(strVal);
      continue;
    }

    if (fieldType === 'url' || keyLower.includes('url') || keyLower.includes('website') || keyLower.includes('portfolio')) {
      sanitized[key] = validateHttpUrl(strVal);
      continue;
    }

    if (keyLower.includes('gst')) {
      sanitized[key] = validateGstin(strVal);
      continue;
    }

    if (fieldType === 'number' || keyLower.includes('amount')) {
      const n = Number(strVal);
      if (!Number.isFinite(n) || n < 0) {
        throw new AppError(`"${label}" must be a valid non-negative number.`, 400, 'INVALID_NUMBER_FIELD');
      }
      sanitized[key] = n;
      continue;
    }

    if (fieldType === 'date') {
      const dt = new Date(strVal);
      if (isNaN(dt.getTime())) {
        throw new AppError(`"${label}" must be a valid date.`, 400, 'INVALID_DATE_FIELD');
      }
      sanitized[key] = strVal;
      continue;
    }

    if (strVal.length < 2 || strVal.length > 300) {
      throw new AppError(`"${label}" must be between 2 and 300 characters.`, 400, 'INVALID_DYNAMIC_FIELD');
    }
    sanitized[key] = strVal;
  }

  // Preserve extra sanitized non-empty properties when no Admin customFields conflict
  for (const [k, v] of Object.entries(input)) {
    if (configuredMap.has(k) || v === undefined || v === null) continue;
    const strVal = typeof v === 'string' ? v.trim() : String(v).trim();
    if (!strVal) continue;
    if (/<script\b/i.test(strVal) || strVal.length > 300) {
      throw new AppError(`Invalid value supplied for "${k}".`, 400, 'INVALID_DYNAMIC_FIELD');
    }
    const lowerKey = k.toLowerCase();
    if (lowerKey.includes('gst')) {
      sanitized[k] = validateGstin(strVal);
    } else if (lowerKey.includes('url') || lowerKey.includes('website') || lowerKey.includes('portfolio')) {
      sanitized[k] = validateHttpUrl(strVal);
    } else {
      sanitized[k] = strVal;
    }
  }

  return sanitized;
}

