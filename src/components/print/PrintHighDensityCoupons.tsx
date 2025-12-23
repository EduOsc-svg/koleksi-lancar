import { InstallmentCoupon } from "@/hooks/useInstallmentCoupons";
import "@/styles/print-high-density.css";

interface ContractInfo {
  contract_ref: string;
  tenor_days: number;
  daily_installment_amount: number;
  customers: {
    name: string;
    address: string | null;
    sales_agents?: { name: string; agent_code: string } | null;
  } | null;
}

interface PrintHighDensityCouponsProps {
  coupons: InstallmentCoupon[];
  contract: ContractInfo;
}

export function PrintHighDensityCoupons({ coupons, contract }: PrintHighDensityCouponsProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString("id-ID");
  };

  const truncateName = (name: string, maxLength: number = 20) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength - 2) + "..";
  };

  return (
    <div className="print-high-density-container">
      <div className="hd-coupon-grid">
        {coupons.map((coupon) => (
          <div key={coupon.id} className="hd-coupon-card">
            {/* Header */}
            <div className="hd-header">
              <p className="hd-company">CV MAHKOTA JAYA</p>
              <p className="hd-contract-ref">{contract.contract_ref}</p>
            </div>

            {/* Body */}
            <div className="hd-body">
              <p className="hd-customer">
                {truncateName(contract.customers?.name || "-")}
              </p>
              <p className="hd-due-date">{formatDate(coupon.due_date)}</p>
              <span className="hd-index">Ke-{coupon.installment_index}</span>
            </div>

            {/* Footer */}
            <div className="hd-footer">
              <p className="hd-amount-label">Angsuran</p>
              <p className="hd-amount">Rp {formatAmount(coupon.amount)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
