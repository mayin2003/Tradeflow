import { Product, Customer, Expense, Transaction, User, AppSettings, ActivityLogItem, TradeDocument } from '../types';

const STORAGE_KEYS = {
  USER: 'tradeflow_user',
  PRODUCTS: 'tradeflow_products',
  CUSTOMERS: 'tradeflow_customers',
  EXPENSES: 'tradeflow_expenses',
  TRANSACTIONS: 'tradeflow_transactions',
  SETTINGS: 'tradeflow_settings',
  ACTIVITY: 'tradeflow_activity',
  DOCUMENTS: 'tradeflow_documents',
};

export const storage = {
  getUser: (): User | null => {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
  },
  setUser: (user: User | null) => {
    if (user) localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEYS.USER);
  },

  getProducts: (userId: string): Product[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    const products: Product[] = data ? JSON.parse(data) : [];
    return products.filter(p => p.user_id === userId);
  },
  saveProduct: (product: Product) => {
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    let products: Product[] = data ? JSON.parse(data) : [];
    const index = products.findIndex(p => p.id === product.id);
    if (index >= 0) products[index] = product;
    else products.push(product);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  },
  deleteProduct: (id: string) => {
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    let products: Product[] = data ? JSON.parse(data) : [];
    products = products.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  },

  getCustomers: (userId: string): Customer[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    const customers: Customer[] = data ? JSON.parse(data) : [];
    return customers.filter(c => c.user_id === userId);
  },
  saveCustomer: (customer: Customer) => {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    let customers: Customer[] = data ? JSON.parse(data) : [];
    const index = customers.findIndex(c => c.id === customer.id);
    if (index >= 0) customers[index] = customer;
    else customers.push(customer);
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  },
  deleteCustomer: (id: string) => {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    let customers: Customer[] = data ? JSON.parse(data) : [];
    customers = customers.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  },

  getExpenses: (userId: string): Expense[] => {
    const data = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    const expenses: Expense[] = data ? JSON.parse(data) : [];
    return expenses.filter(e => e.user_id === userId);
  },
  saveExpense: (expense: Expense) => {
    const data = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    let expenses: Expense[] = data ? JSON.parse(data) : [];
    const index = expenses.findIndex(e => e.id === expense.id);
    if (index >= 0) expenses[index] = expense;
    else expenses.push(expense);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  },
  deleteExpense: (id: string) => {
    const data = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    let expenses: Expense[] = data ? JSON.parse(data) : [];
    expenses = expenses.filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  },

  getTransactions: (userId: string): Transaction[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    const transactions: Transaction[] = data ? JSON.parse(data) : [];
    return transactions.filter(t => t.user_id === userId);
  },
  saveTransaction: (transaction: Transaction) => {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    let transactions: Transaction[] = data ? JSON.parse(data) : [];
    const index = transactions.findIndex(t => t.id === transaction.id);
    if (index >= 0) transactions[index] = transaction;
    else transactions.push(transaction);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  },
  deleteTransaction: (id: string) => {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    let transactions: Transaction[] = data ? JSON.parse(data) : [];
    transactions = transactions.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  },

  getSettings: (userId: string): AppSettings => {
    const data = localStorage.getItem(`${STORAGE_KEYS.SETTINGS}_${userId}`);
    if (data) {
      const parsed = JSON.parse(data);
      // Merge with defaults to ensure all fields exist
      return {
        currency: parsed.currency || '৳',
        taxRate: parsed.taxRate ?? 15,
        theme: parsed.theme || 'light',
        shopProfile: {
          name: parsed.shopProfile?.name || 'Your Company Name',
          address: parsed.shopProfile?.address || '',
          phone: parsed.shopProfile?.phone || '',
          email: parsed.shopProfile?.email || '',
          website: parsed.shopProfile?.website || '',
          logoUrl: parsed.shopProfile?.logoUrl || '',
          ...parsed.shopProfile
        },
        buy: {
          enableShippingCost: true,
          enableCustomsDuty: true,
          enableOtherCosts: true,
          requireDate: true,
          ...parsed.buy
        },
        sell: {
          enableVat: true,
          enableCustomerName: true,
          enableMultipleProducts: true,
          defaultVat: 0,
          requireSaleDate: true,
          enableCurrencySelection: true,
          ...parsed.sell
        },
        invoice: {
          showLogo: true,
          termsAndConditions: 'Invoice was created on a computer and is valid without the signature and seal.',
          bankInfo: '',
          ...parsed.invoice
        },
        ...parsed
      };
    }
    return { 
      currency: '৳', 
      taxRate: 15, 
      theme: 'light',
      shopProfile: {
        name: 'Your Company Name',
        address: '',
        phone: '',
        email: '',
        website: '',
      },
      buy: {
        enableShippingCost: true,
        enableCustomsDuty: true,
        enableOtherCosts: true,
        requireDate: true,
      },
      sell: {
        enableVat: true,
        enableCustomerName: true,
        enableMultipleProducts: true,
        defaultVat: 0,
        requireSaleDate: true,
        enableCurrencySelection: true,
      },
      invoice: {
        showLogo: true,
        termsAndConditions: 'Invoice was created on a computer and is valid without the signature and seal.',
        bankInfo: '',
      }
    };
  },
  saveSettings: (userId: string, settings: AppSettings) => {
    localStorage.setItem(`${STORAGE_KEYS.SETTINGS}_${userId}`, JSON.stringify(settings));
  },

  getActivityLogs: (userId: string): ActivityLogItem[] => {
    const data = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
    const logs: ActivityLogItem[] = data ? JSON.parse(data) : [];
    return logs.filter((l: any) => l.user_id === userId);
  },
  saveActivityLog: (log: ActivityLogItem) => {
    const data = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
    let logs: ActivityLogItem[] = data ? JSON.parse(data) : [];
    logs.unshift(log); // Newest first
    if (logs.length > 500) logs = logs.slice(0, 500); // Keep last 500
    localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(logs));
  },
  clearAllData: (userId: string) => {
    // Products
    const products = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products.filter((p: any) => p.user_id !== userId)));
    
    // Customers
    const customers = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOMERS) || '[]');
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers.filter((c: any) => c.user_id !== userId)));
    
    // Expenses
    const expenses = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSES) || '[]');
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses.filter((e: any) => e.user_id !== userId)));
    
    // Transactions
    const transactions = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]');
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions.filter((t: any) => t.user_id !== userId)));
    
    // Activity
    const activity = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITY) || '[]');
    localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(activity.filter((a: any) => a.user_id !== userId)));
    
    // Documents
    const documents = JSON.parse(localStorage.getItem(STORAGE_KEYS.DOCUMENTS) || '[]');
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents.filter((d: any) => d.user_id !== userId)));
    
    // Don't clear settings unless requested, as it contains shop profile
  },
  clearActivityLogs: (userId: string) => {
    const data = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
    let logs: ActivityLogItem[] = data ? JSON.parse(data) : [];
    logs = logs.filter((l: any) => l.user_id !== userId);
    localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(logs));
  }
};
