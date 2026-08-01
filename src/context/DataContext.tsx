import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Product, Customer, Expense, Transaction, AppSettings, ActivityLogItem, TradeDocument, EmployeePayroll, initialEmployees } from '../types';
import { storage } from '../services/storage';
import { documentDB } from '../services/db';
import { useAuth } from './AuthContext';
// import { initializeMockData } from '../services/mockData';
import { supabase, supabaseUrl } from '../lib/supabase';
import { ensureUuid } from '../lib/utils';

interface DataContextType {
  products: Product[];
  customers: Customer[];
  expenses: Expense[];
  transactions: Transaction[];
  activityLogs: ActivityLogItem[];
  documents: TradeDocument[];
  employees: EmployeePayroll[];
  setEmployees: React.Dispatch<React.SetStateAction<EmployeePayroll[]>>;
  settings: AppSettings;
  selectedInvoiceId: string | null;
  dbStatus: 'connected' | 'error' | 'loading' | 'offline';
  setSelectedInvoiceId: (id: string | null) => void;
  addProduct: (p: Omit<Product, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateProduct: (p: Product) => Promise<void>;
  deleteProduct: (id: string, name: string) => Promise<void>;
  addCustomer: (c: Omit<Customer, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  addExpense: (e: Omit<Expense, 'id' | 'user_id'>) => Promise<void>;
  addTransaction: (t: Omit<Transaction, 'id' | 'user_id'>) => Promise<void>;
  deleteTransaction: (id: string, name: string) => Promise<void>;
  addDocument: (d: Omit<TradeDocument, 'id' | 'user_id' | 'date'>) => Promise<void>;
  deleteDocument: (id: string, name: string) => Promise<void>;
  addActivityLog: (action: string, icon: string, color: string) => Promise<void>;
  clearActivityLogs: () => Promise<void>;
  updateSettings: (s: AppSettings) => Promise<void>;
  refreshData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const deduplicateProducts = (productList: Product[]): Product[] => {
  if (!productList || !Array.isArray(productList)) return [];

  const map = new Map<string, Product>();

  for (const p of productList) {
    if (!p || !p.name) continue;

    const normName = p.name.trim().toLowerCase();
    const normSku = p.sku ? p.sku.trim().toLowerCase() : '';
    const normBarcode = p.barcode ? p.barcode.trim().toLowerCase() : '';
    const pId = p.id;

    let existingKey: string | null = null;
    let existingProd: Product | null = null;

    for (const [k, item] of map.entries()) {
      const iName = item.name.trim().toLowerCase();
      const iSku = item.sku ? item.sku.trim().toLowerCase() : '';
      const iBarcode = item.barcode ? item.barcode.trim().toLowerCase() : '';
      const iId = item.id;

      if (
        (pId && iId === pId) ||
        (normSku && iSku && normSku === iSku) ||
        (normBarcode && iBarcode && normBarcode === iBarcode) ||
        (normName && iName === normName)
      ) {
        existingKey = k;
        existingProd = item;
        break;
      }
    }

    if (existingProd && existingKey) {
      const catA = existingProd.category;
      const catB = p.category;
      let finalCategory = catA;
      if (!catA || catA.toLowerCase() === 'uncategorized' || catA.toLowerCase() === 'others') {
        if (catB && catB.toLowerCase() !== 'uncategorized' && catB.toLowerCase() !== 'others') {
          finalCategory = catB;
        }
      }

      const merged: Product = {
        ...existingProd,
        id: existingProd.id || p.id,
        user_id: existingProd.user_id || p.user_id,
        name: existingProd.name || p.name,
        category: finalCategory || catA || catB || 'Others',
        hs_code: existingProd.hs_code || p.hs_code || '',
        barcode: existingProd.barcode || p.barcode || '',
        sku: existingProd.sku || p.sku || '',
        cost_price: existingProd.cost_price > 0 ? existingProd.cost_price : (p.cost_price || 0),
        sell_price: existingProd.sell_price > 0 ? existingProd.sell_price : (p.sell_price || 0),
        stock: typeof p.stock === 'number' ? p.stock : (existingProd.stock || 0),
        min_stock: Math.max(existingProd.min_stock || 10, p.min_stock || 10),
        unit: existingProd.unit || p.unit || 'pcs',
        brand: existingProd.brand || p.brand || '',
        supplier: existingProd.supplier || p.supplier || '',
        description: existingProd.description || p.description || '',
        created_at: existingProd.created_at || p.created_at || new Date().toISOString()
      };

      map.set(existingKey, merged);
    } else {
      const key = p.id || `name_${normName}`;
      map.set(key, { ...p });
    }
  }

  return Array.from(map.values());
};

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
  const [documents, setDocuments] = useState<TradeDocument[]>([]);
  const [employees, setEmployees] = useState<EmployeePayroll[]>(() => {
    const data = localStorage.getItem('tradeflow_employees');
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error(e);
      }
    }
    return initialEmployees;
  });

  useEffect(() => {
    try {
      localStorage.setItem('tradeflow_employees', JSON.stringify(employees));
    } catch (e) {
      console.error(e);
    }
  }, [employees]);

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<'connected' | 'error' | 'loading' | 'offline'>('loading');
  const [dbError, setDbError] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>({ 
    currency: '৳', 
    taxRate: 15, 
    theme: 'light',
    shopProfile: {
      name: 'Your Company Name',
      address: '',
      phone: '',
      email: '',
      secondaryEmail: '',
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
      cardPayment: 'Visa, Master Card, American Express',
      signatureName: 'Authorized Signature',
      signatureUrl: '',
      discount: 0,
      taxRate: 0,
      defaultClientName: '',
      defaultClientAddress: '',
      defaultClientEmail: '',
      defaultClientPhone: '',
      showNotes: true,
      templateId: 't1',
      shippingCharge: 0
    }
  });

  const syncLocalToCloud = useCallback(async (userId: string) => {
    console.log('Syncing local data to cloud...');
    const targetUserId = ensureUuid(userId);
    try {
      const localProducts = storage.getProducts(userId);
      const localCustomers = storage.getCustomers(userId);
      const localExpenses = storage.getExpenses(userId);
      const localTransactions = storage.getTransactions(userId);
      const localLogs = storage.getActivityLogs(userId);
      const localSettings = storage.getSettings(userId);
      const localDocs = await documentDB.getAll(userId);

      if (localProducts.length) {
        const cleanLocalProducts = localProducts.map((p: any) => {
          const { sku, image, unit, ...clean } = p;
          return { ...clean, user_id: ensureUuid(clean.user_id || targetUserId) };
        });
        await supabase.from('tf_products').upsert(cleanLocalProducts);
      }
      if (localCustomers.length) {
        const cleanCustomers = localCustomers.map((c: any) => ({ ...c, user_id: ensureUuid(c.user_id || targetUserId) }));
        await supabase.from('tf_customers').upsert(cleanCustomers);
      }
      if (localExpenses.length) {
        const cleanExpenses = localExpenses.map((e: any) => ({ ...e, user_id: ensureUuid(e.user_id || targetUserId) }));
        await supabase.from('tf_expenses').upsert(cleanExpenses);
      }
      if (localTransactions.length) {
        const cleanLocalTransactions = localTransactions.map((t: any) => {
          const { supplier, payment_method, exchange_rate, expiry_date, ...clean } = t;
          return { ...clean, user_id: ensureUuid(clean.user_id || targetUserId) };
        });
        await supabase.from('tf_transactions').upsert(cleanLocalTransactions);
      }
      if (localLogs.length) {
        const cleanLogs = localLogs.map((l: any) => ({ ...l, user_id: ensureUuid(l.user_id || targetUserId) }));
        await supabase.from('tf_activity_logs').upsert(cleanLogs);
      }
      if (localDocs.length) {
        const cleanDocs = localDocs.map((d: any) => ({ ...d, user_id: ensureUuid(d.user_id || targetUserId) }));
        await supabase.from('tf_documents').upsert(cleanDocs);
      }
      
      await supabase.from('tf_settings').upsert({ user_id: targetUserId, data: localSettings });
      
      console.log('Local data sync complete.');
    } catch (err) {
      console.error('Failed to sync local data to cloud:', err);
    }
  }, []);

  const loadData = useCallback(async () => {
    if (!user) return;
    setDbStatus('loading');
    const targetUserId = ensureUuid(user.id);

    try {
      // Fetch all tables from Supabase
      const [
        resProducts,
        resCustomers,
        resExpenses,
        resTransactions,
        resLogs,
        resSettings,
        resDocs
      ] = await Promise.all([
        supabase.from('tf_products').select('*').eq('user_id', targetUserId).order('created_at', { ascending: false }),
        supabase.from('tf_customers').select('*').eq('user_id', targetUserId).order('created_at', { ascending: false }),
        supabase.from('tf_expenses').select('*').eq('user_id', targetUserId).order('date', { ascending: false }),
        supabase.from('tf_transactions').select('*').eq('user_id', targetUserId).order('date', { ascending: false }),
        supabase.from('tf_activity_logs').select('*').eq('user_id', targetUserId).order('timestamp', { ascending: false }).limit(50),
        supabase.from('tf_settings').select('data').eq('user_id', targetUserId).maybeSingle(),
        supabase.from('tf_documents').select('*').eq('user_id', targetUserId).order('date', { ascending: false })
      ]);

      // Detect common issues (e.g. missing tables or connection failure)
      const anyError = [resProducts, resCustomers, resExpenses, resTransactions, resLogs, resDocs].find(r => r.error);
      
      if (anyError) {
        const msg = anyError.error.message || '';
        const isDefaultUrl = supabaseUrl === 'https://qerbogtxvdqsihhuadzl.supabase.co';
        
        let errorMsg = msg;
        const lowerMsg = msg.toLowerCase();
        
        const isFetchError = lowerMsg.includes('failed to fetch') || 
                             lowerMsg.includes('fetch failed') || 
                             lowerMsg.includes('load failed') || 
                             lowerMsg.includes('networkerror') || 
                             lowerMsg.includes('network') || 
                             lowerMsg.includes('typeerror') ||
                             lowerMsg.includes('cors') ||
                             lowerMsg.includes('uuid') ||
                             lowerMsg.includes('invalid input syntax');

        if (isFetchError) {
          setDbStatus('offline');
          errorMsg = 'Connected in Local Mode. Data will be saved to your browser.';
          console.info('Switching to offline/local storage due to fetch failure.');
        } else if (msg.includes('schema cache') || msg.includes('does not exist') || msg.includes('not found')) {
          setDbStatus('error');
          errorMsg = 'Schema Error: Table missing in Supabase. Run SQL in supabase_schema.sql.';
          console.error(errorMsg);
          if (isDefaultUrl) {
            console.warn('NOTE: You are using the default Supabase project. You should connect your own Supabase project in .env');
          }
        } else {
          setDbStatus('error');
          console.error('Database connection error:', msg);
        }
        setDbError(errorMsg);

        // Fallback to local storage on error
        setProducts(deduplicateProducts(storage.getProducts(user.id)));
        setCustomers(storage.getCustomers(user.id));
        setExpenses(storage.getExpenses(user.id));
        setTransactions(storage.getTransactions(user.id));
        setActivityLogs(storage.getActivityLogs(user.id));
        setSettings(storage.getSettings(user.id));
        const docs = await documentDB.getAll(user.id);
        setDocuments(docs);
      } else {
        setDbStatus('connected');
        setDbError(null);
        
        // Only set data if no error
        if (resProducts.data) setProducts(deduplicateProducts(resProducts.data));
        if (resCustomers.data) setCustomers(resCustomers.data);
        if (resExpenses.data) setExpenses(resExpenses.data);
        if (resTransactions.data) {
          // Merge local storage transactions to retain fields like base64 invoice file data
          const localTrans = storage.getTransactions(user.id);
          const cloudIds = new Set(resTransactions.data.map((ct: any) => ct.id));
          const onlyLocalTrans = localTrans.filter((lt: any) => !cloudIds.has(lt.id));
          
          const mergedTrans = [
            ...resTransactions.data.map((cloudT: any) => {
              const localT = localTrans.find((lt: any) => lt.id === cloudT.id);
              if (localT) {
                return {
                  ...cloudT,
                  invoice_file_data: localT.invoice_file_data || cloudT.invoice_file_data,
                  invoice_file_name: localT.invoice_file_name || cloudT.invoice_file_name,
                  invoice_file_type: localT.invoice_file_type || cloudT.invoice_file_type,
                  supplier: cloudT.supplier || localT.supplier,
                  payment_method: cloudT.payment_method || localT.payment_method,
                  exchange_rate: cloudT.exchange_rate || localT.exchange_rate,
                  expiry_date: cloudT.expiry_date || localT.expiry_date,
                };
              }
              return cloudT;
            }),
            ...onlyLocalTrans
          ];
          setTransactions(mergedTrans);
        }
        if (resLogs.data) setActivityLogs(resLogs.data);
        
        if (resSettings.data?.data) {
          setSettings(resSettings.data.data);
        } else if (user) {
          // Initialize settings with user data if not in DB
          const initialSettings: AppSettings = {
            ...settings,
            shopProfile: {
              ...settings.shopProfile,
              name: user.companyName || 'TradeFlow Business',
              email: user.email || '',
            }
          };
          setSettings(initialSettings);
          // Silently save it to DB so it persists
          supabase.from('tf_settings').upsert({ user_id: targetUserId, data: initialSettings })
            .then(({ error }) => {
              if (error) console.warn('Notice initializing settings in Supabase:', error.message);
            });
          
          // If cloud is empty, check for local data to sync
          const isCloudEmpty = !resProducts.data?.length && !resTransactions.data?.length;
          if (isCloudEmpty) {
            const localProducts = storage.getProducts(user.id);
            if (localProducts.length > 0) {
              syncLocalToCloud(user.id);
            }
          }
        }

        if (resDocs.data) setDocuments(resDocs.data);
      }
    } catch (error: any) {
      console.warn('Supabase fetch critical failure, using local storage fallback', error);
      setProducts(storage.getProducts(user.id));
      setCustomers(storage.getCustomers(user.id));
      setExpenses(storage.getExpenses(user.id));
      setTransactions(storage.getTransactions(user.id));
      setActivityLogs(storage.getActivityLogs(user.id));
      setSettings(storage.getSettings(user.id));
      
      const docs = await documentDB.getAll(user.id);
      setDocuments(docs);
      
      const caughtMsg = error?.message || String(error || '');
      const lowerCaught = caughtMsg.toLowerCase();
      
      if (lowerCaught.includes('fetch') || lowerCaught.includes('network') || lowerCaught.includes('typeerror') || lowerCaught.includes('load failed') || lowerCaught.includes('cors') || lowerCaught.includes('uuid') || lowerCaught.includes('invalid input syntax')) {
        setDbStatus('offline');
        setDbError('Connected in Local Mode. Data will be saved to your browser.');
      } else {
        setDbStatus('error');
        setDbError(caughtMsg);
      }
    }
  }, [user, syncLocalToCloud]);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user, loadData]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  const addActivityLog = useCallback(async (action: string, icon: string, color: string) => {
    if (!user) return;
    const log: ActivityLogItem = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      user_id: user.id,
      action,
      icon,
      color,
      timestamp: new Date().toISOString()
    };
    
    setActivityLogs(prev => [log, ...prev].slice(0, 50));
    storage.saveActivityLog(log);
    
    (async () => {
      try {
        await supabase.from('tf_activity_logs').insert([{ ...log, user_id: ensureUuid(log.user_id) }]);
      } catch (err) {
        console.warn('Notice adding activity log to Supabase:', err);
      }
    })();
  }, [user]);

  const clearActivityLogs = useCallback(async () => {
    if (!user) return;
    setActivityLogs([]);
    storage.clearActivityLogs(user.id);
    (async () => {
      try {
        await supabase.from('tf_activity_logs').delete().eq('user_id', ensureUuid(user.id));
      } catch (err) {
        console.warn('Notice clearing activity logs in Supabase:', err);
      }
    })();
  }, [user]);

  const addProduct = useCallback(async (p: any) => {
    if (!user) return;
    const targetUserId = ensureUuid(user.id);
    let finalProductForSync: Product | null = null;
    
    setProducts(prevProducts => {
      const targetName = (p.name || '').trim().toLowerCase();
      const targetSku = p.sku ? p.sku.trim().toLowerCase() : '';
      const targetBarcode = p.barcode ? p.barcode.trim().toLowerCase() : '';
      const targetId = p.id;

      const existingIndex = prevProducts.findIndex(item => 
        (targetId && item.id === targetId) ||
        (targetSku && item.sku && item.sku.trim().toLowerCase() === targetSku) ||
        (targetBarcode && item.barcode && item.barcode.trim().toLowerCase() === targetBarcode) ||
        (targetName && item.name.trim().toLowerCase() === targetName)
      );

      if (existingIndex >= 0) {
        const existing = prevProducts[existingIndex];
        const updatedProduct: Product = {
          ...existing,
          ...p,
          stock: p.stock !== undefined ? p.stock : existing.stock,
          cost_price: p.cost_price || existing.cost_price,
          sell_price: p.sell_price || existing.sell_price,
          category: (p.category && p.category !== 'Uncategorized' && p.category !== 'Others') ? p.category : existing.category
        };
        finalProductForSync = updatedProduct;
        const updatedList = [...prevProducts];
        updatedList[existingIndex] = updatedProduct;
        storage.saveProduct(updatedProduct);
        return deduplicateProducts(updatedList);
      } else {
        const newProduct: Product = { 
          ...p, 
          id: p.id || `p_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, 
          user_id: targetUserId, 
          created_at: p.created_at || new Date().toISOString() 
        };
        finalProductForSync = newProduct;
        storage.saveProduct(newProduct);
        return deduplicateProducts([newProduct, ...prevProducts]);
      }
    });

    if (finalProductForSync) {
      const prodToSync = finalProductForSync as Product;
      (async () => {
        try {
          const { sku, image, unit, ...cleanProduct } = prodToSync as any;
          const { error } = await supabase.from('tf_products').upsert({ ...cleanProduct, user_id: targetUserId });
          if (error) console.warn('Supabase notice adding product:', error.message);
          addActivityLog(`Product added/updated: ${p.name}`, '📦', 'var(--purple-light)');
        } catch (err) {
          console.warn('Notice during background product adding sync:', err);
        }
      })();
    }
  }, [user, addActivityLog]);

  const updateProduct = useCallback(async (p: Product) => {
    setProducts(prev => deduplicateProducts(prev.map(item => item.id === p.id ? p : item)));
    storage.saveProduct(p);
    
    // Create a clean version for Supabase
    const { sku, image, unit, ...cleanProduct } = p as any;
    
    (async () => {
      try {
        const { error } = await supabase.from('tf_products').upsert({ ...cleanProduct, user_id: ensureUuid(cleanProduct.user_id) });
        if (error) console.warn('Supabase notice updating product:', error.message);
        addActivityLog(`Product updated: ${p.name}`, '📦', 'var(--accent-light)');
      } catch (err) {
        console.warn('Notice during background product updating sync:', err);
      }
    })();
  }, [addActivityLog]);

  const deleteProduct = useCallback(async (id: string, name: string) => {
    setProducts(prev => prev.filter(item => item.id !== id));
    storage.deleteProduct(id);
    
    (async () => {
      try {
        const { error } = await supabase.from('tf_products').delete().eq('id', id);
        if (error) console.warn('Supabase notice deleting product:', error.message);
        addActivityLog(`Product deleted: ${name}`, '🗑️', 'var(--danger-light)');
      } catch (err) {
        console.warn('Notice during background product deletion sync:', err);
      }
    })();
  }, [addActivityLog]);

  const addCustomer = useCallback(async (c: any) => {
    if (!user) return;
    const targetUserId = ensureUuid(user.id);
    const newCustomer: Customer = { 
      ...c, 
      id: c.id || `c_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, 
      user_id: targetUserId, 
      loyalty_points: c.loyalty_points || 0,
      membership_tier: c.membership_tier || 'Bronze',
      created_at: new Date().toISOString() 
    };
    
    setCustomers(prev => [newCustomer, ...prev]);
    storage.saveCustomer(newCustomer);
    
    (async () => {
      try {
        const { error } = await supabase.from('tf_customers').insert([{ ...newCustomer, user_id: targetUserId }]);
        if (error) console.warn('Supabase notice adding customer:', error.message);
        addActivityLog(`Customer added: ${c.name}`, '👤', 'var(--accent-light)');
      } catch (err) {
        console.warn('Notice during background customer addition sync:', err);
      }
    })();
  }, [user, addActivityLog]);

  const addExpense = useCallback(async (e: any) => {
    if (!user) return;
    const targetUserId = ensureUuid(user.id);
    const newExpense: Expense = { ...e, id: `e_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, user_id: targetUserId };
    
    setExpenses(prev => [newExpense, ...prev]);
    storage.saveExpense(newExpense);
    
    (async () => {
      try {
        const { error } = await supabase.from('tf_expenses').insert([{ ...newExpense, user_id: targetUserId }]);
        if (error) console.warn('Supabase notice adding expense:', error.message);
        addActivityLog(`Expense recorded: ${e.title}`, '💸', 'var(--danger-light)');
      } catch (err) {
        console.warn('Notice during background expense addition sync:', err);
      }
    })();
  }, [user, addActivityLog]);

  const addTransaction = useCallback(async (t: any) => {
    if (!user) return;
    const targetUserId = ensureUuid(user.id);
    const newTransaction: Transaction = { 
      ...t, 
      id: t.id || `tr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, 
      user_id: targetUserId 
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
    storage.saveTransaction(newTransaction);

    const updatedProductsForSync: Product[] = [];
    const customerUpdatesToTrigger: Customer[] = [];

    setProducts(prevProducts => {
      const currentProducts = [...prevProducts];
      const itemsToProcess = (t.items && t.items.length > 0) 
        ? t.items 
        : [{
            product_id: t.product_id,
            product_name: t.product_name,
            quantity: t.quantity || 0,
            unit_price: t.unit_price || 0,
            sell_price: t.sell_price || t.unit_price || 0,
            category: t.category,
            supplier: t.supplier,
            barcode: t.barcode,
            sku: t.sku,
            hs_code: t.hs_code,
            unit: t.unit,
            brand: t.brand
          }];

      for (const item of itemsToProcess) {
        const targetName = (item.product_name || t.product_name || '').trim().toLowerCase();
        const targetId = item.product_id || t.product_id;
        const targetSku = item.sku || t.sku ? (item.sku || t.sku).trim().toLowerCase() : '';
        const targetBarcode = item.barcode || t.barcode ? (item.barcode || t.barcode).trim().toLowerCase() : '';

        const existingIndex = currentProducts.findIndex(p => 
          (targetId && p.id === targetId) ||
          (targetSku && p.sku && p.sku.trim().toLowerCase() === targetSku) ||
          (targetBarcode && p.barcode && p.barcode.trim().toLowerCase() === targetBarcode) ||
          (targetName && p.name.trim().toLowerCase() === targetName)
        );

        if (existingIndex >= 0) {
          const existing = currentProducts[existingIndex];
          const updatedStock = t.type === 'sale' 
            ? Math.max(0, (existing.stock || 0) - (item.quantity || 0))
            : (existing.stock || 0) + (item.quantity || 0);

          const itemCat = item.category || t.category;
          const updatedCat = (itemCat && itemCat !== 'Uncategorized' && itemCat !== 'Others')
            ? itemCat
            : existing.category;

          const updatedProduct: Product = {
            ...existing,
            stock: updatedStock,
            cost_price: t.type === 'purchase' ? (item.unit_price || existing.cost_price) : existing.cost_price,
            sell_price: item.sell_price || (t.type === 'sale' ? item.unit_price : 0) || existing.sell_price,
            category: updatedCat || existing.category || 'Others',
            supplier: t.supplier || existing.supplier || '',
            barcode: item.barcode || t.barcode || existing.barcode || '',
            sku: item.sku || t.sku || existing.sku || '',
            hs_code: item.hs_code || t.hs_code || existing.hs_code || '',
            unit: item.unit || t.unit || existing.unit || 'pcs',
            brand: item.brand || t.brand || (existing as any).brand || ''
          };

          currentProducts[existingIndex] = updatedProduct;
          updatedProductsForSync.push(updatedProduct);
          storage.saveProduct(updatedProduct);
        } else {
          let initialPurchaseQty = 0;
          transactions.forEach(prevT => {
            if (prevT.type === 'purchase') {
              if (prevT.items && prevT.items.length > 0) {
                prevT.items.forEach(pi => {
                  if ((targetId && pi.product_id === targetId) || (targetName && pi.product_name && pi.product_name.trim().toLowerCase() === targetName)) {
                    initialPurchaseQty += (pi.quantity || 0);
                  }
                });
              } else if ((targetId && prevT.product_id === targetId) || (targetName && prevT.product_name && prevT.product_name.trim().toLowerCase() === targetName)) {
                initialPurchaseQty += (prevT.quantity || 0);
              }
            }
          });

          const baseStock = initialPurchaseQty > 0 ? initialPurchaseQty : (t.type === 'purchase' ? (item.quantity || 0) : 100);
          const finalStock = t.type === 'sale'
            ? Math.max(0, baseStock - (item.quantity || 0))
            : baseStock + (item.quantity || 0);

          const newProduct: Product = {
            id: targetId || `p_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            user_id: targetUserId,
            name: item.product_name || t.product_name,
            category: item.category || t.category || 'Others',
            stock: finalStock,
            cost_price: t.type === 'purchase' ? (item.unit_price || 0) : 0,
            sell_price: item.sell_price || item.unit_price || 0,
            supplier: t.supplier || '',
            barcode: item.barcode || t.barcode || '',
            sku: item.sku || t.sku || `SKU-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            hs_code: item.hs_code || t.hs_code || '',
            unit: item.unit || t.unit || 'pcs',
            brand: item.brand || t.brand || '',
            min_stock: 10,
            created_at: t.date || new Date().toISOString()
          };

          currentProducts.unshift(newProduct);
          updatedProductsForSync.push(newProduct);
          storage.saveProduct(newProduct);
        }
      }

      return deduplicateProducts(currentProducts);
    });

    // Auto-add customer if not exists
    if (t.type === 'sale' && t.customer_name && t.customer_name.trim() !== '' && t.customer_name.toLowerCase() !== 'walk-in') {
      const customerExists = customers.some(c => c.name.toLowerCase() === t.customer_name.toLowerCase());
      if (!customerExists) {
        const newCustomer: Customer = { 
          id: `c_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, 
          user_id: targetUserId, 
          name: t.customer_name,
          email: '',
          phone: '',
          address: '',
          loyalty_points: 0,
          membership_tier: 'Bronze',
          created_at: new Date().toISOString() 
        };
        setCustomers(prev => [newCustomer, ...prev]);
        storage.saveCustomer(newCustomer);
        customerUpdatesToTrigger.push(newCustomer);
      }
    }

    (async () => {
      try {
        for (const p of updatedProductsForSync) {
          const { sku, image, unit, ...cleanProduct } = p as any;
          await supabase.from('tf_products').upsert({ ...cleanProduct, user_id: ensureUuid(cleanProduct.user_id) });
        }

        for (const c of customerUpdatesToTrigger) {
          await supabase.from('tf_customers').insert([{ ...c, user_id: ensureUuid(c.user_id) }]);
        }

        const { supplier, payment_method, exchange_rate, expiry_date, invoice_file_data, invoice_file_name, invoice_file_type, category, barcode, sku, hs_code, unit, brand, ...cleanTransaction } = newTransaction as any;
        const { error } = await supabase.from('tf_transactions').insert([{ ...cleanTransaction, user_id: targetUserId }]);
        if (error) console.warn('Supabase notice adding transaction:', error.message);
        
        const typeLabel = t.type === 'sale' ? 'Sale recorded' : 'Purchase recorded';
        addActivityLog(`${typeLabel}: ${t.product_name || 'Multiple'}`, t.type === 'sale' ? '💰' : '🛒', t.type === 'sale' ? 'var(--success-light)' : 'var(--purple-light)');
      } catch (err) {
        console.warn('Notice during background transaction addition sync:', err);
      }
    })();
  }, [user, customers, addActivityLog]);

  const deleteTransaction = useCallback(async (id: string, name: string) => {
    const t = transactions.find(item => item.id === id);
    let productToSync: Product | null = null;

    setTransactions(prev => prev.filter(item => item.id !== id));
    storage.deleteTransaction(id);

    if (t) {
      setProducts(prevProducts => {
        const targetName = (t.product_name || name || '').trim().toLowerCase();
        const targetId = t.product_id;

        const updatedList = prevProducts.map(p => {
          if ((targetId && p.id === targetId) || (targetName && p.name.trim().toLowerCase() === targetName)) {
            let newStock = p.stock;
            if (t.type === 'purchase') {
              newStock = Math.max(0, (p.stock || 0) - (t.quantity || 0));
            } else if (t.type === 'sale') {
              newStock = (p.stock || 0) + (t.quantity || 0);
            }
            const updated = { ...p, stock: newStock };
            productToSync = updated;
            storage.saveProduct(updated);
            return updated;
          }
          return p;
        });

        return deduplicateProducts(updatedList);
      });
    }

    (async () => {
      try {
        if (productToSync) {
          const { sku, image, unit, ...cleanProduct } = productToSync as any;
          const { error: pError } = await supabase.from('tf_products').upsert(cleanProduct);
          if (pError) console.warn('Supabase notice updating product:', pError.message);
        }
        
        const { error: tError } = await supabase.from('tf_transactions').delete().eq('id', id);
        if (tError) console.warn('Supabase notice deleting transaction:', tError.message);
        
        addActivityLog(`Transaction deleted: ${name}`, '🗑️', 'var(--danger-light)');
      } catch (err) {
        console.warn('Notice during background transaction deletion sync:', err);
      }
    })();
  }, [transactions, addActivityLog]);

  const addDocument = useCallback(async (d: any) => {
    if (!user) return;
    const targetUserId = ensureUuid(user.id);
    const newDoc: TradeDocument = { 
      ...d, 
      id: `doc_${Date.now()}`, 
      user_id: targetUserId, 
      date: new Date().toISOString() 
    };
    
    setDocuments(prev => [newDoc, ...prev]);
    await documentDB.save(newDoc);
    
    (async () => {
      try {
        const { error } = await supabase.from('tf_documents').insert([{ ...newDoc, user_id: targetUserId }]);
        if (error) console.warn('Supabase notice adding document:', error.message);
        addActivityLog(`Document uploaded: ${d.name}`, '📄', 'var(--accent-light)');
      } catch (err) {
        console.warn('Notice during background document upload sync:', err);
      }
    })();
  }, [user, addActivityLog]);

  const deleteDocument = useCallback(async (id: string, name: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    await documentDB.delete(id);
    
    (async () => {
      try {
        const { error } = await supabase.from('tf_documents').delete().eq('id', id);
        if (error) console.warn('Supabase notice deleting document:', error.message);
        addActivityLog(`Document deleted: ${name}`, '🗑️', 'var(--danger-light)');
      } catch (err) {
        console.warn('Notice during background document deletion sync:', err);
      }
    })();
  }, [addActivityLog]);

  const updateSettings = useCallback(async (s: AppSettings) => {
    if (!user) return;
    const targetUserId = ensureUuid(user.id);
    setSettings(s);
    storage.saveSettings(user.id, s);
    
    (async () => {
      try {
        await supabase.from('tf_settings').upsert({ user_id: targetUserId, data: s });
      } catch (err) {
        console.warn('Supabase notice updating settings:', err);
      }
    })();
  }, [user]);

  const contextValue = useMemo(() => ({
    products, customers, expenses, transactions, activityLogs, documents, employees, setEmployees, settings,
    selectedInvoiceId, dbStatus, setSelectedInvoiceId,
    addProduct, updateProduct, deleteProduct,
    addCustomer, addExpense, addTransaction, deleteTransaction, 
    addDocument, deleteDocument,
    addActivityLog, clearActivityLogs, updateSettings,
    refreshData: loadData
  }), [
    products, customers, expenses, transactions, activityLogs, documents, employees, setEmployees, settings,
    selectedInvoiceId, dbStatus, setSelectedInvoiceId,
    addProduct, updateProduct, deleteProduct,
    addCustomer, addExpense, addTransaction, deleteTransaction, 
    addDocument, deleteDocument,
    addActivityLog, clearActivityLogs, updateSettings,
    loadData
  ]);

  return (
    <DataContext.Provider value={contextValue}>
      {children}
      {(dbStatus === 'error' || dbStatus === 'offline') && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: dbStatus === 'offline' ? 'rgba(255, 255, 255, 0.9)' : '#fee2e2',
          border: `1px solid ${dbStatus === 'offline' ? '#e2e8f0' : '#fecaca'}`,
          color: dbStatus === 'offline' ? '#64748b' : '#991b1b',
          backdropFilter: 'blur(8px)',
          padding: '10px 16px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 600,
          zIndex: 9999,
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.3s ease'
        }}>
          <span>{dbStatus === 'offline' ? '📡' : '⚠️'}</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span>{dbStatus === 'offline' ? 'Local Mode' : 'System Notice'}</span>
            <span style={{ fontSize: '10px', opacity: 0.7, fontWeight: 400 }}>
              {dbError || 'Running on local database'}
            </span>
          </div>
          {dbStatus === 'error' && (
            <button 
              onClick={() => loadData()}
              style={{ 
                background: '#ef4444', 
                color: 'white', 
                border: 'none', 
                padding: '4px 10px', 
                borderRadius: '6px', 
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          )}
        </div>
      )}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
