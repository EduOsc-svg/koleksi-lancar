import { InstallmentCoupon } from "@/hooks/useInstallmentCoupons";
import couponLogo from "@/assets/coupon-logo.png";
import "@/styles/print-coupon-8x5.css";

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

interface PrintCoupon8x5Props {
  coupons: InstallmentCoupon[];
  contract: ContractInfo;
}

export function PrintCoupon8x5({ coupons, contract }: PrintCoupon8x5Props) {
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

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Generate No. Faktur format: tenor/agent_code/agent_name
  const noFaktur = `${contract.tenor_days}/${contract.customers?.sales_agents?.agent_code || "-"}/${contract.customers?.sales_agents?.name || "-"}`;

  return (
    <div className="print-coupon-8x5-container">
      <div className="coupon-8x5-grid">
        {coupons.map((coupon) => (
          <div key={coupon.id} className="coupon-8x5-card">
            {/* Header with Logo */}
            <div className="coupon-8x5-header">
              <img src={couponLogo} alt="Logo" className="coupon-8x5-logo" />
              <div className="coupon-8x5-header-text">
                <p className="coupon-8x5-company-name">
                  <span>CV</span> MAHKOTA JAYA ELEKTRONIK
                </p>
                <p className="coupon-8x5-warning">
                  Jangan dibayar tanpa bukti kupon<br />
                  kami tidak bertanggung jawab
                </p>
              </div>
            </div>

            {/* Title */}
            <div className="coupon-8x5-title">VOUCER ANGSURAN</div>

            {/* Data Section */}
            <div className="coupon-8x5-data">
              <div className="coupon-8x5-data-row">
                <span className="coupon-8x5-data-label">NO.Faktur</span>
                <span className="coupon-8x5-data-colon">:</span>
                <span className="coupon-8x5-data-value">{truncateText(noFaktur, 25)}</span>
              </div>
              <div className="coupon-8x5-data-row">
                <span className="coupon-8x5-data-label">Nama</span>
                <span className="coupon-8x5-data-colon">:</span>
                <span className="coupon-8x5-data-value">{truncateText(contract.customers?.name || "-", 30)}</span>
              </div>
              <div className="coupon-8x5-data-row">
                <span className="coupon-8x5-data-label">Alamat</span>
                <span className="coupon-8x5-data-colon">:</span>
                <span className="coupon-8x5-data-value">{truncateText(contract.customers?.address || "-", 30)}</span>
              </div>
              <div className="coupon-8x5-data-row">
                <span className="coupon-8x5-data-label">Jatuh Tempo</span>
                <span className="coupon-8x5-data-colon">:</span>
                <span className="coupon-8x5-data-value">{formatDate(coupon.due_date)}</span>
              </div>
              <div className="coupon-8x5-data-row">
                <span className="coupon-8x5-data-label">Angsuran Ke-</span>
                <span className="coupon-8x5-data-colon">:</span>
                <span className="coupon-8x5-data-value">{coupon.installment_index}</span>
              </div>
            </div>

            {/* Amount Section */}
            <div className="coupon-8x5-amount-section">
              <div className="coupon-8x5-amount-label">Besar Angsuran</div>
              <div className="coupon-8x5-amount-value">Rp. {formatAmount(coupon.amount)}</div>
            </div>

            {/* Footer */}
            <div className="coupon-8x5-footer">KANTOR / 0852 5882 5882</div>
          </div>
        ))}
      </div>
    </div>
  );
}
