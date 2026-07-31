export interface User {
  id: string;
  name: string;
  email: string;
  companyName: string;
  avatar?: string;
}

export interface Product {
  id: string;
  user_id: string;
  name: string;
  category: string;
  hs_code: string;
  cost_price: number;
  sell_price: number;
  stock: number;
  min_stock: number;
  barcode?: string;
  sku?: string;
  image?: string;
  unit?: string;
  brand?: string;
  supplier?: string;
  description?: string;
  created_at: string;
}

export interface Customer {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  loyalty_points: number;
  membership_tier?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  created_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  note?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'sale' | 'purchase';
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  date: string;
  customer_id?: string;
  customer_name?: string;
  status: 'completed' | 'pending' | 'cancelled';
  currency?: string;
  vat_percent?: number;
  vat_amount?: number;
  items?: TransactionItem[];
  loyalty_points_earned?: number;
  loyalty_points_used?: number;
  // Extra for purchase & sync
  category?: string;
  barcode?: string;
  sku?: string;
  hs_code?: string;
  unit?: string;
  brand?: string;
  shipping_cost?: number;
  customs_duty?: number;
  vat?: number;
  other_cost?: number;
  sell_price?: number;
  supplier?: string;
  payment_method?: string;
  exchange_rate?: number;
  expiry_date?: string;
  invoice_file_data?: string | null;
  invoice_file_name?: string | null;
  invoice_file_type?: string | null;
}

export interface ActivityLogItem {
  id: string;
  user_id: string;
  action: string;
  icon: string;
  color: string;
  timestamp: string;
}

export interface TransactionItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface AppSettings {
  currency: string;
  taxRate: number;
  theme: 'light' | 'dark';
  shopProfile: {
    name: string;
    logoUrl?: string;
    address: string;
    phone: string;
    email: string;
    secondaryEmail?: string;
    website: string;
    taxId?: string;
    additionalInfo?: string;
  };
  buy: {
    enableShippingCost: boolean;
    enableCustomsDuty: boolean;
    enableOtherCosts: boolean;
    requireDate: boolean;
  };
  sell: {
    enableVat: boolean;
    enableCustomerName: boolean;
    enableMultipleProducts: boolean;
    defaultVat: number;
    requireSaleDate: boolean;
    enableCurrencySelection: boolean;
  };
  invoice: {
    showLogo: boolean;
    termsAndConditions: string;
    bankInfo: string;
    cardPayment?: string;
    signatureName?: string;
    signatureUrl?: string;
    discount?: number;
    taxRate?: number;
    showNotes?: boolean;
    templateId?: 't1' | 't2' | 't3' | 't4';
    shippingCharge?: number;
    // Default client info for the sample
    defaultClientName?: string;
    defaultClientAddress?: string;
    defaultClientEmail?: string;
    defaultClientPhone?: string;
  };
}

export interface TradeDocument {
  id: string;
  user_id: string;
  name: string;
  type: string;
  ref?: string;
  date: string;
  size: string;
  file_data: string; // Base64 or Blob URL
  file_type: string;
}

export interface EmployeePayroll {
  id: string;
  name: string;
  role: string;
  baseSalary: number;
  allowanceOvertime: number;
  allowanceBonus: number;
  deductionAdvance: number;
  deductionTax: number;
  paymentMethod: 'Bank Transfer' | 'Cash' | 'Mobile Wallet';
  status: 'Paid' | 'Pending' | string;
  avatarInitials: string;
  avatarBg: string;
  payoutDate?: string;
  active?: boolean;
}

export const initialEmployees: EmployeePayroll[] = [
  {
    id: "EMP-102",
    name: "Alex Sterling",
    role: "Customs Agent & Compliance Officer",
    baseSalary: 4500,
    allowanceOvertime: 250,
    allowanceBonus: 500,
    deductionAdvance: 0,
    deductionTax: 675,
    paymentMethod: "Bank Transfer",
    status: "Paid",
    avatarInitials: "AS",
    avatarBg: "from-cyan-500 to-blue-600",
    payoutDate: "2026-05-15",
    active: true
  },
  {
    id: "EMP-108",
    name: "Marcus Vance",
    role: "Global Logistics Director",
    baseSalary: 5800,
    allowanceOvertime: 0,
    allowanceBonus: 800,
    deductionAdvance: 300,
    deductionTax: 870,
    paymentMethod: "Bank Transfer",
    status: "Paid",
    avatarInitials: "MV",
    avatarBg: "from-indigo-500 to-purple-600",
    payoutDate: "2026-05-15",
    active: true
  },
  {
    id: "EMP-115",
    name: "Sarah Rahman",
    role: "Supply Chain Analyst",
    baseSalary: 3800,
    allowanceOvertime: 150,
    allowanceBonus: 200,
    deductionAdvance: 0,
    deductionTax: 570,
    paymentMethod: "Mobile Wallet",
    status: "Pending",
    avatarInitials: "SR",
    avatarBg: "from-emerald-400 to-teal-600",
    active: true
  },
  {
    id: "EMP-120",
    name: "Tariq Mahmood",
    role: "Warehouse Operations Supervisor",
    baseSalary: 3200,
    allowanceOvertime: 480,
    allowanceBonus: 0,
    deductionAdvance: 150,
    deductionTax: 480,
    paymentMethod: "Mobile Wallet",
    status: "Pending",
    avatarInitials: "TM",
    avatarBg: "from-amber-400 to-orange-600",
    active: true
  },
  {
    id: "EMP-134",
    name: "Helena Rostova",
    role: "Freight Procurement Specialist",
    baseSalary: 4100,
    allowanceOvertime: 120,
    allowanceBonus: 300,
    deductionAdvance: 0,
    deductionTax: 615,
    paymentMethod: "Bank Transfer",
    status: "Paid",
    avatarInitials: "HR",
    avatarBg: "from-pink-500 to-rose-600",
    payoutDate: "2026-05-15",
    active: true
  },
  {
    id: "EMP-149",
    name: "Devon Carter",
    role: "Port Operations Coordinator",
    baseSalary: 3000,
    allowanceOvertime: 320,
    allowanceBonus: 100,
    deductionAdvance: 0,
    deductionTax: 450,
    paymentMethod: "Cash",
    status: "Pending",
    avatarInitials: "DC",
    avatarBg: "from-violet-500 to-fuchsia-600",
    active: true
  }
];

