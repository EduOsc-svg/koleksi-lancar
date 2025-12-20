// Indonesian Rupiah formatter
export const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format date to Indonesian locale
export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
};

// Format percentage
export const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};
