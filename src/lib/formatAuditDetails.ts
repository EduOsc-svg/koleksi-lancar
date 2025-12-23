import type { Json } from '@/integrations/supabase/types';

// Keys that indicate monetary values
const MONETARY_KEYS = [
  'amount',
  'total',
  'price',
  'paid',
  'saldo',
  'balance',
  'loan',
  'installment',
  'payment',
  'fee',
  'cost',
  'value',
  'harga',
  'jumlah',
  'cicilan',
  'bayar',
  'pinjaman',
  'tagihan',
];

/**
 * Check if a key is likely a monetary field
 */
function isMonetaryKey(key: string): boolean {
  const lowerKey = key.toLowerCase();
  return MONETARY_KEYS.some(monetaryKey => lowerKey.includes(monetaryKey));
}

/**
 * Format a number as Indonesian Rupiah
 */
function formatAsRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format a single value, detecting if it's monetary
 */
function formatValue(key: string, value: unknown): string {
  // If it's a number and the key suggests money
  if (typeof value === 'number' && isMonetaryKey(key)) {
    return formatAsRupiah(value);
  }
  
  // If it's a string that looks like a number and the key suggests money
  if (typeof value === 'string' && isMonetaryKey(key)) {
    const numValue = parseFloat(value.replace(/[^\d.-]/g, ''));
    if (!isNaN(numValue) && numValue > 0) {
      return formatAsRupiah(numValue);
    }
  }
  
  // Return as-is for other types
  if (value === null || value === undefined) {
    return '-';
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  return String(value);
}

/**
 * Format audit log details JSONB for display
 * Detects monetary values and formats them as Rupiah
 */
export function formatAuditDetails(details: Json | null): { key: string; value: string }[] {
  if (!details || typeof details !== 'object' || Array.isArray(details)) {
    return [];
  }

  const result: { key: string; value: string }[] = [];
  
  for (const [key, value] of Object.entries(details)) {
    result.push({
      key: formatKeyLabel(key),
      value: formatValue(key, value),
    });
  }
  
  return result;
}

/**
 * Convert snake_case or camelCase keys to readable labels
 */
function formatKeyLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Render formatted details as a compact string
 */
export function formatAuditDetailsString(details: Json | null): string {
  const formatted = formatAuditDetails(details);
  if (formatted.length === 0) return '-';
  
  return formatted
    .map(({ key, value }) => `${key}: ${value}`)
    .join(' | ');
}
