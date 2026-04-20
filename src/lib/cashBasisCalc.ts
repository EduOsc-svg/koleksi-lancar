/**
 * Cash-basis financial calculation helpers.
 * 
 * Setiap kontrak memiliki:
 *   - omset_field (di DB: kolom `omset`) = MODAL (capital)
 *   - total_loan_amount = OMSET (selling price)
 * 
 * Cash basis: nilai diakui PROPORSIONAL berdasarkan pembayaran yang sudah masuk.
 *   paid_ratio = total_dibayar / total_loan_amount  (clamped 0..1)
 *   omset_realized  = total_loan_amount * paid_ratio  (= total_dibayar)
 *   modal_realized  = omset_field * paid_ratio
 *   profit_realized = omset_realized - modal_realized
 */

export interface ContractFinanceInput {
  contract_id: string;
  modal_full: number;       // dari kolom `omset`
  omset_full: number;       // dari kolom `total_loan_amount`
  total_paid: number;       // sum payment_logs.amount_paid utk kontrak ini
}

export interface ContractRealized {
  contract_id: string;
  modal_realized: number;
  omset_realized: number;
  profit_realized: number;
  paid_ratio: number;
}

export const realizeContract = (c: ContractFinanceInput): ContractRealized => {
  const ratio = c.omset_full > 0 ? Math.min(1, Math.max(0, c.total_paid / c.omset_full)) : 0;
  const omset_realized = c.omset_full * ratio;
  const modal_realized = c.modal_full * ratio;
  return {
    contract_id: c.contract_id,
    modal_realized,
    omset_realized,
    profit_realized: omset_realized - modal_realized,
    paid_ratio: ratio,
  };
};

/**
 * Hitung total pembayaran per kontrak dari array payment_logs.
 * Bisa di-filter dengan predicate (mis. by date range).
 */
export const sumPaymentsByContract = <T extends { contract_id: string; amount_paid: number | string; payment_date?: string }>(
  payments: T[],
  predicate?: (p: T) => boolean,
): Map<string, number> => {
  const map = new Map<string, number>();
  payments.forEach((p) => {
    if (predicate && !predicate(p)) return;
    const cur = map.get(p.contract_id) || 0;
    map.set(p.contract_id, cur + Number(p.amount_paid || 0));
  });
  return map;
};
