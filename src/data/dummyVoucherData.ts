// Dummy Data untuk Testing Voucher System
// Digunakan untuk simulasi dan development testing

export interface DummyContractData {
  id: string;
  contract_ref: string;
  current_installment_index: number;
  daily_installment_amount: number;
  tenor_days: number;
  customers?: {
    name: string;
    address?: string | null;
    routes?: {
      code: string;
    } | null;
    sales_agents?: {
      agent_code: string;
      name: string;
    } | null;
  } | null;
}

export const dummyData: DummyContractData[] = [
  {
    id: "1",
    contract_ref: "CTR001",
    current_installment_index: 0,
    daily_installment_amount: 50000,
    tenor_days: 100,
    customers: {
      name: "Ahmad Wijaya",
      address: "Jl. Merdeka No. 123, Jakarta Pusat",
      routes: {
        code: "RT001"
      },
      sales_agents: {
        agent_code: "AG001",
        name: "BUDI"
      }
    }
  },
  {
    id: "2",
    contract_ref: "CTR002",
    current_installment_index: 5,
    daily_installment_amount: 75000,
    tenor_days: 90,
    customers: {
      name: "Siti Rahayu",
      address: "Jl. Sudirman No. 456, Jakarta Selatan",
      routes: {
        code: "RT002"
      },
      sales_agents: {
        agent_code: "AG002",
        name: "SARI"
      }
    }
  },
  {
    id: "3",
    contract_ref: "CTR003",
    current_installment_index: 10,
    daily_installment_amount: 100000,
    tenor_days: 120,
    customers: {
      name: "Rudi Hartono",
      address: "Jl. Gatot Subroto No. 789, Jakarta Barat",
      routes: {
        code: "RT003"
      },
      sales_agents: {
        agent_code: "AG003",
        name: "INDRA"
      }
    }
  },
  {
    id: "4",
    contract_ref: "CTR004",
    current_installment_index: 2,
    daily_installment_amount: 60000,
    tenor_days: 80,
    customers: {
      name: "Maria Gonzalez",
      address: "Jl. Thamrin No. 321, Jakarta Utara",
      routes: {
        code: "RT004"
      },
      sales_agents: {
        agent_code: "AG004",
        name: "DEWI"
      }
    }
  },
  {
    id: "5",
    contract_ref: "CTR005",
    current_installment_index: 8,
    daily_installment_amount: 85000,
    tenor_days: 110,
    customers: {
      name: "Bambang Sutrisno",
      address: "Jl. HR Rasuna Said No. 654, Jakarta Timur",
      routes: {
        code: "RT005"
      },
      sales_agents: {
        agent_code: "AG005",
        name: "AGUS"
      }
    }
  }
];

// Usage example:
// import { dummyData } from '@/data/dummyVoucherData';
// <PrintA4LandscapeCoupons contracts={dummyData} />