import { InstallmentCoupon } from "@/hooks/useInstallmentCoupons";
import couponBg from "@/assets/coupon-logo.png";
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
      month: "long",
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
          <div
            key={coupon.id}
            className="coupon-8x5-card"
            style={{ "--coupon-bg": `url(${couponBg})` } as React.CSSProperties}
          >
            {/* NO.Faktur */}
            <span className="coupon-8x5-data coupon-8x5-faktur">
              {truncateText(noFaktur, 25)}
            </span>

            {/* Nama */}
            <span className="coupon-8x5-data coupon-8x5-nama">
              {truncateText(contract.customers?.name || "-", 30)}
            </span>

            {/* Alamat */}
            <span className="coupon-8x5-data coupon-8x5-alamat">
              {truncateText(contract.customers?.address || "-", 30)}
            </span>

            {/* Jatuh Tempo */}
            <span className="coupon-8x5-data coupon-8x5-jatuhtempo">
              {formatDate(coupon.due_date)}
            </span>

            {/* Angsuran Ke */}
            <span className="coupon-8x5-data coupon-8x5-angsuran-ke">
              {coupon.installment_index}
            </span>

            {/* Besar Angsuran */}
            <span className="coupon-8x5-data coupon-8x5-nominal">
              {formatAmount(coupon.amount)}
            </span>

            {/* Kantor */}
            <span className="coupon-8x5-data coupon-8x5-kantor">
              0852 5882 5882
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
