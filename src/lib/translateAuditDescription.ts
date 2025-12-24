/**
 * Translate audit log descriptions from English to Indonesian
 */

// Common patterns and their Indonesian translations
const descriptionPatterns: { pattern: RegExp; translate: (matches: RegExpMatchArray) => string }[] = [
  // Payment related
  {
    pattern: /^Payment of ([\d,]+) recorded for coupon #(\d+)$/i,
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
  
  // Contract related
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
  
  // Generic CRUD operations
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
      return translate(matches);
    }
  }
  
  // Return original if no pattern matches
  return description;
}
