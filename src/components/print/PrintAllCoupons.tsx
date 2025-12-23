import { InstallmentCoupon } from "@/hooks/useInstallmentCoupons";
import "@/styles/print-a4-coupons.css";

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

interface PrintAllCouponsProps {
  coupons: InstallmentCoupon[];
  contract: ContractInfo;
}

export function PrintAllCoupons({ coupons, contract }: PrintAllCouponsProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const noFaktur = `${contract.tenor_days}/${contract.customers?.sales_agents?.agent_code || "X"}/${contract.customers?.sales_agents?.name || "X"}`;

  return (
    <div className="print-all-coupons-container">
      <div className="coupon-grid">
        {coupons.map((coupon) => (
          <div key={coupon.id} className="a4-coupon-card">
            {/* Contract Reference */}
            <div className="a4-contract-ref">{contract.contract_ref}</div>

            {/* Header */}
            <div className="a4-coupon-header">
              <div className="a4-company-name">CV MAHKOTA JAYA ELEKTRONIK</div>
              <div className="a4-company-address">Komplek Mentari - Gunung Bahagia, Balikpapan</div>
            </div>

            {/* Title */}
            <div className="a4-coupon-title">VOUCHER ANGSURAN</div>

            {/* Data Section */}
            <div className="a4-data-section">
              <div className="a4-data-row">
                <span className="a4-data-label">No. Faktur:</span>
                <span className="a4-data-value">{noFaktur}</span>
              </div>
              <div className="a4-data-row">
                <span className="a4-data-label">Jatuh Tempo:</span>
                <span className="a4-data-value">{formatDate(coupon.due_date)}</span>
              </div>
              <div className="a4-data-row full-width">
                <span className="a4-data-label">Nama:</span>
                <span className="a4-data-value">{contract.customers?.name || "-"}</span>
              </div>
              <div className="a4-data-row full-width">
                <span className="a4-data-label">Alamat:</span>
                <span className="a4-data-value">{contract.customers?.address || "-"}</span>
              </div>
            </div>

            {/* Installment Index Box */}
            <div className="a4-installment-box">Ke-{coupon.installment_index}</div>

            {/* Amount Section */}
            <div className="a4-amount-section">
              <div className="a4-amount-label">Besar Angsuran</div>
              <div className="a4-amount-value">
                Rp {coupon.amount.toLocaleString("id-ID")}
              </div>
            </div>

            {/* Footer */}
            <div className="a4-coupon-footer">0852 5882 5882</div>
          </div>
        ))}
      </div>
    </div>
  );
}
