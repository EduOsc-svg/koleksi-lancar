/**
 * Translate audit log descriptions from English to Indonesian
 */

// Word/phrase translations for post-processing
const wordTranslations: { [key: string]: string } = {
  // Common English words/phrases found in descriptions
  'with loan amount': 'dengan jumlah pinjaman',
  'with amount': 'dengan jumlah',
  'with total': 'dengan total',
  'loan amount': 'jumlah pinjaman',
  'total amount': 'jumlah total',
  'for customer': 'untuk pelanggan',
  'for contract': 'untuk kontrak',
  'for coupon': 'untuk kupon',
  'for route': 'untuk jalur',
  'for agent': 'untuk agen',
  'amount': 'jumlah',
  'customer': 'pelanggan',
  'contract': 'kontrak',
  'coupon': 'kupon',
  'coupons': 'kupon',
  'route': 'jalur',
  'agent': 'agen',
  'sales agent': 'agen penjualan',
  'holiday': 'hari libur',
  'payment': 'pembayaran',
  'status': 'status',
  'updated': 'diperbarui',
  'created': 'dibuat',
  'deleted': 'dihapus',
  'added': 'ditambahkan',
  'removed': 'dihapus',
  'recorded': 'dicatat',
  'new': 'baru',
  'with': 'dengan',
  'for': 'untuk',
  'of': 'sebesar',
  'to': 'ke',
  'from': 'dari',
  'and': 'dan',
  'or': 'atau',
  'the': '',
  'a': '',
  'an': '',
};

// Common patterns and their Indonesian translations
const descriptionPatterns: { pattern: RegExp; translate: (matches: RegExpMatchArray) => string }[] = [
  // Payment related
  {
    pattern: /^Payment of ([\d,\.]+) recorded for coupon #(\d+)$/i,
    translate: (m) => `Pembayaran sebesar ${m[1]} dicatat untuk kupon #${m[2]}`
  },
  {
    pattern: /^Payment recorded for coupon #(\d+)$/i,
    translate: (m) => `Pembayaran dicatat untuk kupon #${m[1]}`
  },
  {
    pattern: /^Recorded payment for contract (.+)$/i,
    translate: (m) => `Mencatat pembayaran untuk kontrak ${m[1]}`
  },
  {
    pattern: /^Payment of (.+) for coupon #(\d+)$/i,
    translate: (m) => `Pembayaran sebesar ${m[1]} untuk kupon #${m[2]}`
  },
  
  // Contract related with loan amount
  {
    pattern: /^Created contract (.+) with loan amount (.+)$/i,
    translate: (m) => `Membuat kontrak ${m[1]} dengan jumlah pinjaman ${m[2]}`
  },
  {
    pattern: /^Created new contract (.+) with loan amount (.+)$/i,
    translate: (m) => `Membuat kontrak baru ${m[1]} dengan jumlah pinjaman ${m[2]}`
  },
  {
    pattern: /^Created new contract (.+) for customer (.+) with loan amount (.+)$/i,
    translate: (m) => `Membuat kontrak baru ${m[1]} untuk pelanggan ${m[2]} dengan jumlah pinjaman ${m[3]}`
  },
  {
    pattern: /^Created new contract (.+) for customer (.+)$/i,
    translate: (m) => `Membuat kontrak baru ${m[1]} untuk pelanggan ${m[2]}`
  },
  {
    pattern: /^Created contract (.+)$/i,
    translate: (m) => `Membuat kontrak ${m[1]}`
  },
  {
    pattern: /^Updated contract (.+)$/i,
    translate: (m) => `Memperbarui kontrak ${m[1]}`
  },
  {
    pattern: /^Deleted contract (.+)$/i,
    translate: (m) => `Menghapus kontrak ${m[1]}`
  },
  {
    pattern: /^Contract (.+) created with (\d+) coupons$/i,
    translate: (m) => `Kontrak ${m[1]} dibuat dengan ${m[2]} kupon`
  },
  
  // Customer related
  {
    pattern: /^Created new customer (.+)$/i,
    translate: (m) => `Membuat pelanggan baru ${m[1]}`
  },
  {
    pattern: /^Created customer (.+)$/i,
    translate: (m) => `Membuat pelanggan ${m[1]}`
  },
  {
    pattern: /^Updated customer (.+)$/i,
    translate: (m) => `Memperbarui pelanggan ${m[1]}`
  },
  {
    pattern: /^Deleted customer (.+)$/i,
    translate: (m) => `Menghapus pelanggan ${m[1]}`
  },
  
  // Sales agent related
  {
    pattern: /^Created new sales agent (.+)$/i,
    translate: (m) => `Membuat agen penjualan baru ${m[1]}`
  },
  {
    pattern: /^Created sales agent (.+)$/i,
    translate: (m) => `Membuat agen penjualan ${m[1]}`
  },
  {
    pattern: /^Updated sales agent (.+)$/i,
    translate: (m) => `Memperbarui agen penjualan ${m[1]}`
  },
  {
    pattern: /^Deleted sales agent (.+)$/i,
    translate: (m) => `Menghapus agen penjualan ${m[1]}`
  },
  
  // Route related
  {
    pattern: /^Created new route (.+)$/i,
    translate: (m) => `Membuat jalur baru ${m[1]}`
  },
  {
    pattern: /^Created route (.+)$/i,
    translate: (m) => `Membuat jalur ${m[1]}`
  },
  {
    pattern: /^Updated route (.+)$/i,
    translate: (m) => `Memperbarui jalur ${m[1]}`
  },
  {
    pattern: /^Deleted route (.+)$/i,
    translate: (m) => `Menghapus jalur ${m[1]}`
  },
  
  // Holiday related
  {
    pattern: /^Created new holiday (.+)$/i,
    translate: (m) => `Membuat hari libur baru ${m[1]}`
  },
  {
    pattern: /^Created holiday (.+)$/i,
    translate: (m) => `Membuat hari libur ${m[1]}`
  },
  {
    pattern: /^Updated holiday (.+)$/i,
    translate: (m) => `Memperbarui hari libur ${m[1]}`
  },
  {
    pattern: /^Deleted holiday (.+)$/i,
    translate: (m) => `Menghapus hari libur ${m[1]}`
  },
  
  // Generic CRUD operations (placed at the end as fallback)
  {
    pattern: /^Created (.+)$/i,
    translate: (m) => `Membuat ${m[1]}`
  },
  {
    pattern: /^Updated (.+)$/i,
    translate: (m) => `Memperbarui ${m[1]}`
  },
  {
    pattern: /^Deleted (.+)$/i,
    translate: (m) => `Menghapus ${m[1]}`
  },
  {
    pattern: /^Added (.+)$/i,
    translate: (m) => `Menambahkan ${m[1]}`
  },
  {
    pattern: /^Removed (.+)$/i,
    translate: (m) => `Menghapus ${m[1]}`
  },
  
  // Login/logout
  {
    pattern: /^User logged in$/i,
    translate: () => `Pengguna masuk`
  },
  {
    pattern: /^User logged out$/i,
    translate: () => `Pengguna keluar`
  },
  {
    pattern: /^(.+) logged in$/i,
    translate: (m) => `${m[1]} masuk`
  },
  {
    pattern: /^(.+) logged out$/i,
    translate: (m) => `${m[1]} keluar`
  },
];

/**
 * Post-process translation to clean up any remaining English words
 */
function postProcessTranslation(text: string): string {
  let result = text;
  
  // Sort by length (longest first) to avoid partial replacements
  const sortedTranslations = Object.entries(wordTranslations)
    .sort((a, b) => b[0].length - a[0].length);
  
  for (const [english, indonesian] of sortedTranslations) {
    // Case-insensitive replacement, but preserve the original case structure
    const regex = new RegExp(`\\b${english}\\b`, 'gi');
    result = result.replace(regex, indonesian);
  }
  
  // Clean up extra spaces
  result = result.replace(/\s+/g, ' ').trim();
  
  return result;
}

/**
 * Translate an audit description to Indonesian
 * Returns the original if no translation pattern matches
 */
export function translateAuditDescription(description: string, language: string): string {
  // Only translate if language is Indonesian
  if (language !== 'id') {
    return description;
  }
  
  // Try to match each pattern
  for (const { pattern, translate } of descriptionPatterns) {
    const matches = description.match(pattern);
    if (matches) {
      // Apply pattern translation then post-process for any remaining English words
      return postProcessTranslation(translate(matches));
    }
  }
  
  // If no pattern matches, try post-processing the entire string
  // This catches cases where the description is partially in English
  return postProcessTranslation(description);
}
