import { formatRupiah, formatDate } from "@/lib/format";

interface CouponData {
  contractRef: string;
  noFaktur: string;
  customerName: string;
  customerAddress: string;
  dueDate: string;
  installmentNumber: number;
  installmentAmount: number;
}

interface PrintableCouponProps {
  data: CouponData;
}

export function PrintableCoupon({ data }: PrintableCouponProps) {
  return (
    <div className="coupon-card">
      {/* Contract Reference - Top Right */}
      <div className="contract-ref">{data.contractRef}</div>

      {/* Header Branding */}
      <div className="header-branding">
        <svg className="house-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z" />
        </svg>
        <div className="company-name">UD MAHKOTA JAYA ELEKTRONIK</div>
      </div>

      {/* Address */}
      <div className="address">
        Komplek Mentari - Gunung Bahagia<br />
        Balikpapan - Kaltim
      </div>

      {/* Title */}
      <div className="voucher-title">VOUCHER ANGSURAN</div>

      {/* Data Container */}
      <div className="data-container">
        <div className="data-row">
          <span className="label">NO. Faktur</span>
          <span className="colon">:</span>
          <span className="value">{data.noFaktur}</span>
        </div>
        <div className="data-row">
          <span className="label">Nama</span>
          <span className="colon">:</span>
          <span className="value">{data.customerName}</span>
        </div>
        <div className="data-row">
          <span className="label">Alamat</span>
          <span className="colon">:</span>
          <span className="value">{data.customerAddress || "-"}</span>
        </div>
        <div className="data-row">
          <span className="label">Jatuh Tempo</span>
          <span className="colon">:</span>
          <span className="value">{data.dueDate}</span>
        </div>
        <div className="data-row">
          <span className="label">Angsuran Ke-</span>
          <span className="colon">:</span>
          <span className="value">{data.installmentNumber}</span>
        </div>
      </div>

      {/* Amount Section */}
      <div className="amount-section">
        <div className="amount-label">Besar Angsuran</div>
        <div className="amount-value-container">
          <span className="currency">Rp.</span>
          <span className="amount-number">
            {data.installmentAmount.toLocaleString("id-ID")}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="footer">KANTOR / 0852 5882 5882</div>
    </div>
  );
}

interface PrintableCouponsProps {
  contracts: Array<{
    id: string;
    contract_ref: string;
    current_installment_index: number;
    daily_installment_amount: number;
    customers?: {
      name: string;
      address?: string | null;
      routes?: {
        code: string;
      } | null;
      sales_agents?: {
        agent_code: string;
      } | null;
    } | null;
  }>;
}

export function PrintableCoupons({ contracts }: PrintableCouponsProps) {
  const today = new Date();
  const dueDate = today.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="print-coupons-container">
      {contracts.map((contract) => {
        // Generate No. Faktur: installmentIndex/RouteCode/AgentCode
        const routeCode = contract.customers?.routes?.code || "X";
        const agentCode = contract.customers?.sales_agents?.agent_code || "X";
        const installmentNumber = contract.current_installment_index + 1;
        const noFaktur = `${installmentNumber}/${routeCode}/${agentCode}`;

        return (
          <PrintableCoupon
            key={contract.id}
            data={{
              contractRef: contract.contract_ref,
              noFaktur,
              customerName: contract.customers?.name || "-",
              customerAddress: contract.customers?.address || "-",
              dueDate,
              installmentNumber,
              installmentAmount: contract.daily_installment_amount,
            }}
          />
        );
      })}
    </div>
  );
}
