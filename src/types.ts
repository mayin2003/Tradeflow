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
  // Extra for purchase
  shipping_cost?: number;
  customs_duty?: number;
  vat?: number;
  other_cost?: number;
  sell_price?: number;
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
