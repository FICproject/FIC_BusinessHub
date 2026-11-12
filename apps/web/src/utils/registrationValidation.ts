export const MAX_KYC_FILE_BYTES = 2 * 1024 * 1024; // 2 MB = 2,097,152 bytes

export function validateFullNameClient(raw: string): string | null {
  const name = raw.trim().replace(/\s+/g, ' ');
  if (!name) return 'Full legal name is required.';
  if (name.length < 2 || name.length > 80 || !/^[A-Za-z][A-Za-z\s.'-]{1,79}$/.test(name)) {
    return 'Full Name must be 2–80 characters using valid letters and spaces only.';
  }
  return null;
}

export function validateEmailClient(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  if (!email) return 'Email address is required.';
  if (email.length > 150 || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
    return 'Please enter a valid email address.';
  }
  return null;
}

export function validateMobileClient(raw: string): string | null {
  const digits = raw.trim();
  if (!digits) return '10-digit mobile number is required.';
  if (!/^[6-9]\d{9}$/.test(digits)) {
    return 'Please enter a valid 10-digit Indian mobile number starting with 6–9.';
  }
  return null;
}

export interface PasswordChecks {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasDigit: boolean;
  hasSpecial: boolean;
}

export function evaluatePasswordStrength(password: string): {
  checks: PasswordChecks;
  error: string | null;
} {
  const checks: PasswordChecks = {
    minLength: password.length >= 8 && password.length <= 128,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasDigit: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)
  };
  if (!password) return { checks, error: 'Password is required.' };
  if (!checks.minLength) return { checks, error: 'Password must be between 8 and 128 characters.' };
  if (!checks.hasUpper) return { checks, error: 'Include at least 1 uppercase letter (A–Z).' };
  if (!checks.hasLower) return { checks, error: 'Include at least 1 lowercase letter (a–z).' };
  if (!checks.hasDigit) return { checks, error: 'Include at least 1 numeric digit (0–9).' };
  if (!checks.hasSpecial) return { checks, error: 'Include at least 1 special character (e.g., @, #, !).' };
  return { checks, error: null };
}

export function validatePanClient(raw: string): string | null {
  const pan = raw.trim().toUpperCase();
  if (!pan) return 'PAN number is required.';
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
    return 'Enter a valid 10-character PAN (e.g., ABCDE1234F).';
  }
  return null;
}

export function validateAadhaarClient(raw: string): string | null {
  const digits = raw.replace(/[\s-]/g, '').trim();
  if (!digits) return '12-digit Aadhaar number is required.';
  if (!/^[2-9]\d{11}$/.test(digits) || /^(\d)\1{11}$/.test(digits)) {
    return 'Enter a valid 12-digit Aadhaar number (cannot start with 0 or 1).';
  }
  return null;
}

export function maskAadhaarDisplay(raw: string): string {
  const digits = raw.replace(/[\s-]/g, '').trim();
  if (digits.length < 4) return 'XXXX-XXXX-XXXX';
  return `XXXX-XXXX-${digits.slice(-4)}`;
}

export function validateAlternativeGovtIdClient(kind: string, raw: string): string | null {
  const val = raw.trim().toUpperCase();
  if (!val) return 'Government ID number is required.';
  if (kind === 'PASSPORT') {
    return /^[A-Z][0-9]{7}$/.test(val) ? null : 'Enter a valid Passport number (e.g., A1234567).';
  }
  if (kind === 'VOTER_ID') {
    return /^[A-Z]{3}[0-9]{7}$/.test(val) ? null : 'Enter a valid Voter ID / EPIC number (e.g., ABC1234567).';
  }
  if (kind === 'DRIVING_LICENCE') {
    return /^[A-Z]{2}[0-9]{2}[\s-]?[0-9]{4,11}$/.test(val)
      ? null
      : 'Enter a valid Driving Licence number (e.g., TN0120200012345).';
  }
  return val.length >= 4 && val.length <= 40 ? null : 'Enter a valid ID number (4–40 characters).';
}

export function validateGstinClient(raw: string): string | null {
  const gst = raw.trim().toUpperCase();
  if (!gst) return null;
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst)) {
    return 'Enter a valid 15-character GSTIN (e.g., 33AAAAA0000A1Z5).';
  }
  return null;
}

export function validateHttpUrlClient(raw: string): string | null {
  const val = raw.trim();
  if (!val) return null;
  try {
    const parsed = new URL(val);
    if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname.includes('.')) {
      return 'Enter a valid URL starting with http:// or https://.';
    }
    return null;
  } catch {
    return 'Enter a valid URL starting with http:// or https://.';
  }
}

export function validateDynamicFieldClient(
  field: { key: string; label: string; type?: string; required?: boolean; options?: string[] },
  rawValue: any
): string | null {
  const val = typeof rawValue === 'string' ? rawValue.trim() : rawValue !== undefined && rawValue !== null ? String(rawValue).trim() : '';
  if (field.required && !val) {
    return `"${field.label}" is required.`;
  }
  if (!val) return null;

  const keyLower = field.key.toLowerCase();
  const fieldType = String(field.type || 'text').toLowerCase();

  if (fieldType === 'select' && Array.isArray(field.options) && field.options.length > 0) {
    if (!field.options.includes(val)) {
      return `Please select a valid option for "${field.label}".`;
    }
    return null;
  }

  if (fieldType === 'email' || keyLower.includes('email')) {
    return validateEmailClient(val);
  }
  if (fieldType === 'url' || keyLower.includes('url') || keyLower.includes('website') || keyLower.includes('portfolio')) {
    return validateHttpUrlClient(val);
  }
  if (keyLower.includes('gst')) {
    return validateGstinClient(val);
  }
  if (fieldType === 'number' || keyLower.includes('amount')) {
    const n = Number(val);
    if (!Number.isFinite(n) || n < 0) {
      return `"${field.label}" must be a valid non-negative number.`;
    }
    return null;
  }
  if (fieldType === 'date') {
    const d = new Date(val);
    if (isNaN(d.getTime())) {
      return `"${field.label}" must be a valid date.`;
    }
    return null;
  }
  if (val.length < 2 || val.length > 300) {
    return `"${field.label}" must be between 2 and 300 characters.`;
  }
  return null;
}

export function validateCityClient(raw: string): string | null {
  const city = raw.trim();
  if (!city) return 'City / Town / Village is required.';
  if (city.length < 2 || city.length > 80 || !/^[A-Za-z][A-Za-z\s.'-]{1,79}$/.test(city)) {
    return 'City / Town must contain 2–80 alphabetic characters.';
  }
  return null;
}

export async function computeFileSha256(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback fingerprint if subtle crypto unavailable (still enforces backend SHA-256)
  return `${file.name}:${file.size}:${file.lastModified}`;
}

