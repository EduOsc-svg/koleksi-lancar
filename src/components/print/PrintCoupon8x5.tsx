import { InstallmentCoupon } from "@/hooks/useInstallmentCoupons";
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

  // Group coupons into pages of 9 (3x3 grid)
  const groupCouponsIntoPages = (coupons: InstallmentCoupon[], couponsPerPage: number = 9) => {
    const pages: InstallmentCoupon[][] = [];
    for (let i = 0; i < coupons.length; i += couponsPerPage) {
      pages.push(coupons.slice(i, i + couponsPerPage));
    }
    return pages;
  };

  const couponPages = groupCouponsIntoPages(coupons);

  console.log(`Printing ${coupons.length} coupons across ${couponPages.length} pages`);

  return (
    <>
      {couponPages.map((pageCoupons, pageIndex) => (
        <div key={`page-${pageIndex}`} className="print-coupon-8x5-container">
          <div className="coupon-8x5-grid">
            {/* Fill empty slots to maintain grid structure */}
            {Array.from({ length: 9 }, (_, index) => {
              const coupon = pageCoupons[index];
              if (!coupon) {
                return <div key={`empty-${index}`} className="coupon-8x5-card" style={{ visibility: 'hidden' }}></div>;
              }
              
              return (
                <div
                  key={coupon.id}
                  className="coupon-8x5-card"
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
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
