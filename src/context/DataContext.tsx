import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Product, Customer, Expense, Transaction, AppSettings, ActivityLogItem, TradeDocument } from '../types';
import { storage } from '../services/storage';
import { documentDB } from '../services/db';
import { useAuth } from './AuthContext';
// import { initializeMockData } from '../services/mockData';
import { supabase, supabaseUrl } from '../lib/supabase';

interface DataContextType {
  products: Product[];
  customers: Customer[];
  expenses: Expense[];
  transactions: Transaction[];
  activityLogs: ActivityLogItem[];
  documents: TradeDocument[];
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

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
  const [documents, setDocuments] = useState<TradeDocument[]>([]);
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

  const syncLocalToCloud = async (userId: string) => {
    console.log('Syncing local data to cloud...');
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
          return clean;
        });
        await supabase.from('tf_products').upsert(cleanLocalProducts);
      }
      if (localCustomers.length) await supabase.from('tf_customers').upsert(localCustomers);
      if (localExpenses.length) await supabase.from('tf_expenses').upsert(localExpenses);
      if (localTransactions.length) {
        const cleanLocalTransactions = localTransactions.map((t: any) => {
          const { supplier, payment_method, exchange_rate, expiry_date, ...clean } = t;
          return clean;
        });
        await supabase.from('tf_transactions').upsert(cleanLocalTransactions);
      }
      if (localLogs.length) await supabase.from('tf_activity_logs').upsert(localLogs);
      if (localDocs.length) await supabase.from('tf_documents').upsert(localDocs);
      
      await supabase.from('tf_settings').upsert({ user_id: userId, data: localSettings });
      
      console.log('Local data sync complete.');
    } catch (err) {
      console.error('Failed to sync local data to cloud:', err);
    }
  };

  const loadData = async () => {
    if (!user) return;
    setDbStatus('loading');

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
        supabase.from('tf_products').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('tf_customers').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('tf_expenses').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('tf_transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('tf_activity_logs').select('*').eq('user_id', user.id).order('timestamp', { ascending: false }).limit(50),
        supabase.from('tf_settings').select('data').eq('user_id', user.id).maybeSingle(),
        supabase.from('tf_documents').select('*').eq('user_id', user.id).order('date', { ascending: false })
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
                             lowerMsg.includes('cors');

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
        setProducts(storage.getProducts(user.id));
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
        if (resProducts.data) setProducts(resProducts.data);
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
          supabase.from('tf_settings').upsert({ user_id: user.id, data: initialSettings })
            .then(({ error }) => {
              if (error) console.error('Failed to initialize settings in Supabase:', error);
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
      
      if (lowerCaught.includes('fetch') || lowerCaught.includes('network') || lowerCaught.includes('typeerror') || lowerCaught.includes('load failed') || lowerCaught.includes('cors')) {
        setDbStatus('offline');
        setDbError('Connected in Local Mode. Data will be saved to your browser.');
      } else {
        setDbStatus('error');
        setDbError(caughtMsg);
      }
    }
  };

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

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
        await supabase.from('tf_activity_logs').insert([log]);
      } catch (err) {
        console.error('Error adding activity log to Supabase:', err);
      }
    })();
  }, [user]);

  const clearActivityLogs = useCallback(async () => {
    if (!user) return;
    setActivityLogs([]);
    storage.clearActivityLogs(user.id);
    (async () => {
      try {
        await supabase.from('tf_activity_logs').delete().eq('user_id', user.id);
      } catch (err) {
        console.error('Error clearing activity logs in Supabase:', err);
      }
    })();
  }, [user]);

  const addProduct = useCallback(async (p: any) => {
    if (!user) return;
    const newProduct: Product = { 
      ...p, 
      id: p.id || `p_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, 
      user_id: user.id, 
      created_at: new Date().toISOString() 
    };
    
    setProducts(prev => [newProduct, ...prev]);
    storage.saveProduct(newProduct);
    
    // Create a clean version for Supabase that only includes confirmed columns
    // to prevent "Could not find column... in schema cache" errors
    const { sku, image, unit, ...cleanProduct } = newProduct as any;
    
    (async () => {
      try {
        const { error } = await supabase.from('tf_products').insert([cleanProduct]);
        if (error) {
          console.error('Supabase error adding product:', error.message);
        }
        addActivityLog(`Product added: ${p.name}`, '📦', 'var(--purple-light)');
      } catch (err) {
        console.error('Error during background product adding sync:', err);
      }
    })();
  }, [user, addActivityLog]);

  const updateProduct = useCallback(async (p: Product) => {
    setProducts(prev => prev.map(item => item.id === p.id ? p : item));
    storage.saveProduct(p);
    
    // Create a clean version for Supabase
    const { sku, image, unit, ...cleanProduct } = p as any;
    
    (async () => {
      try {
        const { error } = await supabase.from('tf_products').upsert(cleanProduct);
        if (error) console.error('Supabase error updating product:', error.message);
        addActivityLog(`Product updated: ${p.name}`, '📦', 'var(--accent-light)');
      } catch (err) {
        console.error('Error during background product updating sync:', err);
      }
    })();
  }, [addActivityLog]);

  const deleteProduct = useCallback(async (id: string, name: string) => {
    setProducts(prev => prev.filter(item => item.id !== id));
    storage.deleteProduct(id);
    
    (async () => {
      try {
        const { error } = await supabase.from('tf_products').delete().eq('id', id);
        if (error) console.error('Supabase error deleting product:', error.message);
        addActivityLog(`Product deleted: ${name}`, '🗑️', 'var(--danger-light)');
      } catch (err) {
        console.error('Error during background product deletion sync:', err);
      }
    })();
  }, [addActivityLog]);

  const addCustomer = useCallback(async (c: any) => {
    if (!user) return;
    const newCustomer: Customer = { 
      ...c, 
      id: c.id || `c_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, 
      user_id: user.id, 
      loyalty_points: c.loyalty_points || 0,
      membership_tier: c.membership_tier || 'Bronze',
      created_at: new Date().toISOString() 
    };
    
    setCustomers(prev => [newCustomer, ...prev]);
    storage.saveCustomer(newCustomer);
    
    (async () => {
      try {
        const { error } = await supabase.from('tf_customers').insert([newCustomer]);
        if (error) console.error('Supabase error adding customer:', error.message);
        addActivityLog(`Customer added: ${c.name}`, '👤', 'var(--accent-light)');
      } catch (err) {
        console.error('Error during background customer addition sync:', err);
      }
    })();
  }, [user, addActivityLog]);

  const addExpense = useCallback(async (e: any) => {
    if (!user) return;
    const newExpense: Expense = { ...e, id: `e_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, user_id: user.id };
    
    setExpenses(prev => [newExpense, ...prev]);
    storage.saveExpense(newExpense);
    
    (async () => {
      try {
        const { error } = await supabase.from('tf_expenses').insert([newExpense]);
        if (error) console.error('Supabase error adding expense:', error.message);
        addActivityLog(`Expense recorded: ${e.title}`, '💸', 'var(--danger-light)');
      } catch (err) {
        console.error('Error during background expense addition sync:', err);
      }
    })();
  }, [user, addActivityLog]);

  const addTransaction = useCallback(async (t: any) => {
    if (!user) return;
    const newTransaction: Transaction = { 
      ...t, 
      id: t.id || `tr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, 
      user_id: user.id 
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
    storage.saveTransaction(newTransaction);
    
    const productUpdatesToTrigger: Product[] = [];
    const customerUpdatesToTrigger: Customer[] = [];
    
    if (t.items?.length > 0) {
      for (const item of t.items) {
        const p = products.find(prod => prod.id === item.product_id || prod.name === item.product_name);
        if (p) {
          const updated = { ...p };
          if (t.type === 'sale') updated.stock -= item.quantity;
          if (t.type === 'purchase') {
            updated.stock += item.quantity;
            updated.cost_price = item.unit_price;
            if (item.sell_price) updated.sell_price = item.sell_price;
          }
          productUpdatesToTrigger.push(updated);
        } else if (t.type === 'purchase') {
          // Auto-create product if missing during purchase
          const newP: Product = {
            id: `p_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            user_id: user.id,
            created_at: new Date().toISOString(),
            name: item.product_name,
            category: 'Uncategorized',
            stock: item.quantity,
            cost_price: item.unit_price,
            sell_price: item.sell_price || item.unit_price,
            sku: `SKU-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            image: '',
            unit: 'pcs',
            hs_code: '',
            min_stock: 10
          };
          setProducts(prev => [newP, ...prev]);
          storage.saveProduct(newP);
          (async () => {
            try {
              const { sku, image, unit, ...cleanP } = newP as any;
              await supabase.from('tf_products').insert([cleanP]);
            } catch (err) {
              console.error(err);
            }
          })();
        }
      }
    } else {
      const p = products.find(prod => prod.id === t.product_id || prod.name === t.product_name);
      if (p) {
        const updated = { ...p };
        if (t.type === 'sale') updated.stock -= t.quantity;
        if (t.type === 'purchase') {
          updated.stock += t.quantity;
          updated.cost_price = t.unit_price;
          if (t.sell_price) updated.sell_price = t.sell_price;
        }
        productUpdatesToTrigger.push(updated);
      } else if (t.type === 'purchase') {
        // Auto-create product if missing during purchase
        const newP: Product = {
          id: `p_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          user_id: user.id,
          created_at: new Date().toISOString(),
          name: t.product_name,
          category: 'Uncategorized',
          stock: t.quantity,
          cost_price: t.unit_price,
          sell_price: t.sell_price || t.unit_price,
          sku: `SKU-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          image: '',
          unit: 'pcs',
          hs_code: '',
          min_stock: 10
        };
        setProducts(prev => [newP, ...prev]);
        storage.saveProduct(newP);
        (async () => {
          try {
            const { sku, image, unit, ...cleanP } = newP as any;
            await supabase.from('tf_products').insert([cleanP]);
          } catch (err) {
            console.error(err);
          }
        })();
      }
    }

    // Auto-add customer if not exists
    if (t.type === 'sale' && t.customer_name && t.customer_name.trim() !== '' && t.customer_name.toLowerCase() !== 'walk-in') {
      const customerExists = customers.some(c => c.name.toLowerCase() === t.customer_name.toLowerCase());
      if (!customerExists) {
        const newCustomer: Customer = { 
          id: `c_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, 
          user_id: user.id, 
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

    if (productUpdatesToTrigger.length > 0) {
      setProducts(prev => prev.map(item => {
        const matchingUpdate = productUpdatesToTrigger.find(u => u.id === item.id);
        return matchingUpdate ? matchingUpdate : item;
      }));
      productUpdatesToTrigger.forEach(p => storage.saveProduct(p));
    }

    (async () => {
      try {
        for (const p of productUpdatesToTrigger) {
          const { sku, image, unit, ...cleanProduct } = p as any;
          await supabase.from('tf_products').upsert(cleanProduct);
        }

        for (const c of customerUpdatesToTrigger) {
          await supabase.from('tf_customers').insert([c]);
        }

        const { supplier, payment_method, exchange_rate, expiry_date, invoice_file_data, invoice_file_name, invoice_file_type, ...cleanTransaction } = newTransaction as any;
        const { error } = await supabase.from('tf_transactions').insert([cleanTransaction]);
        if (error) console.error('Supabase error adding transaction:', error.message);
        
        const typeLabel = t.type === 'sale' ? 'Sale recorded' : 'Purchase recorded';
        addActivityLog(`${typeLabel}: ${t.product_name || 'Multiple'}`, t.type === 'sale' ? '💰' : '🛒', t.type === 'sale' ? 'var(--success-light)' : 'var(--purple-light)');
      } catch (err) {
        console.error('Error during background transaction addition sync:', err);
      }
    })();
  }, [user, products, customers, addActivityLog]);

  const deleteTransaction = useCallback(async (id: string, name: string) => {
    // Find the transaction to see if we need to adjust stock
    const t = transactions.find(item => item.id === id);
    let productToUpdate: Product | null = null;
    
    if (t) {
      if (t.type === 'purchase') {
        const p = products.find(prod => prod.id === t.product_id || prod.name === t.product_name);
        if (p) {
          productToUpdate = { ...p, stock: Math.max(0, p.stock - (t.quantity || 0)) };
        }
      } else if (t.type === 'sale') {
        const p = products.find(prod => prod.id === t.product_id || prod.name === t.product_name);
        if (p) {
          productToUpdate = { ...p, stock: p.stock + (t.quantity || 0) };
        }
      }
    }

    // 1. Instantly update transactions state for instant UI response
    setTransactions(prev => prev.filter(item => item.id !== id));
    storage.deleteTransaction(id);

    // 2. Instantly update products state if stock changed
    if (productToUpdate) {
      const updatedProduct = productToUpdate;
      setProducts(prev => prev.map(item => item.id === updatedProduct.id ? updatedProduct : item));
      storage.saveProduct(updatedProduct);
    }

    // 3. Perform network calls and activity logs in background asynchronously (non-blocking)
    (async () => {
      try {
        if (productToUpdate) {
          const { sku, image, unit, ...cleanProduct } = productToUpdate as any;
          const { error: pError } = await supabase.from('tf_products').upsert(cleanProduct);
          if (pError) console.error('Supabase error updating product:', pError.message);
        }
        
        const { error: tError } = await supabase.from('tf_transactions').delete().eq('id', id);
        if (tError) console.error('Supabase error deleting transaction:', tError.message);
        
        addActivityLog(`Transaction deleted: ${name}`, '🗑️', 'var(--danger-light)');
      } catch (err) {
        console.error('Error during background transaction deletion sync:', err);
      }
    })();
  }, [transactions, products, addActivityLog]);

  const addDocument = useCallback(async (d: any) => {
    if (!user) return;
    const newDoc: TradeDocument = { 
      ...d, 
      id: `doc_${Date.now()}`, 
      user_id: user.id, 
      date: new Date().toISOString() 
    };
    
    setDocuments(prev => [newDoc, ...prev]);
    await documentDB.save(newDoc);
    
    (async () => {
      try {
        const { error } = await supabase.from('tf_documents').insert([newDoc]);
        if (error) console.error('Supabase error adding document:', error.message);
        addActivityLog(`Document uploaded: ${d.name}`, '📄', 'var(--accent-light)');
      } catch (err) {
        console.error('Error during background document upload sync:', err);
      }
    })();
  }, [user, addActivityLog]);

  const deleteDocument = useCallback(async (id: string, name: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    await documentDB.delete(id);
    
    (async () => {
      try {
        const { error } = await supabase.from('tf_documents').delete().eq('id', id);
        if (error) console.error('Supabase error deleting document:', error.message);
        addActivityLog(`Document deleted: ${name}`, '🗑️', 'var(--danger-light)');
      } catch (err) {
        console.error('Error during background document deletion sync:', err);
      }
    })();
  }, [addActivityLog]);

  const updateSettings = useCallback(async (s: AppSettings) => {
    if (!user) return;
    setSettings(s);
    storage.saveSettings(user.id, s);
    
    (async () => {
      try {
        await supabase.from('tf_settings').upsert({ user_id: user.id, data: s });
      } catch (err) {
        console.error('Supabase error updating settings:', err);
      }
    })();
  }, [user]);

  const contextValue = useMemo(() => ({
    products, customers, expenses, transactions, activityLogs, documents, settings,
    selectedInvoiceId, dbStatus, setSelectedInvoiceId,
    addProduct, updateProduct, deleteProduct,
    addCustomer, addExpense, addTransaction, deleteTransaction, 
    addDocument, deleteDocument,
    addActivityLog, clearActivityLogs, updateSettings,
    refreshData: loadData
  }), [
    products, customers, expenses, transactions, activityLogs, documents, settings,
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
