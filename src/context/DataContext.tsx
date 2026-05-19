import React, { createContext, useContext, useState, useEffect } from 'react';
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
      defaultClientPhone: ''
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

      if (localProducts.length) await supabase.from('tf_products').upsert(localProducts);
      if (localCustomers.length) await supabase.from('tf_customers').upsert(localCustomers);
      if (localExpenses.length) await supabase.from('tf_expenses').upsert(localExpenses);
      if (localTransactions.length) await supabase.from('tf_transactions').upsert(localTransactions);
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
        const msg = anyError.error.message;
        const isDefaultUrl = supabaseUrl === 'https://qerbogtxvdqsihhuadzl.supabase.co';
        
        let errorMsg = msg;
        if (msg.includes('Failed to fetch')) {
          setDbStatus('offline'); // Use a specific status for offline fallback
          errorMsg = 'Network Error: Could not connect to Supabase. Proceeding in Offline/Fallback mode.';
          console.warn(errorMsg);
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
        if (resTransactions.data) setTransactions(resTransactions.data);
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
    } catch (error) {
      console.warn('Supabase fetch critical failure, using local storage fallback', error);
      setProducts(storage.getProducts(user.id));
      setCustomers(storage.getCustomers(user.id));
      setExpenses(storage.getExpenses(user.id));
      setTransactions(storage.getTransactions(user.id));
      setActivityLogs(storage.getActivityLogs(user.id));
      setSettings(storage.getSettings(user.id));
      
      const docs = await documentDB.getAll(user.id);
      setDocuments(docs);
      setDbStatus('error');
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

  const addActivityLog = async (action: string, icon: string, color: string) => {
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
    await supabase.from('tf_activity_logs').insert([log]);
  };

  const clearActivityLogs = async () => {
    if (!user) return;
    setActivityLogs([]);
    storage.clearActivityLogs(user.id);
    await supabase.from('tf_activity_logs').delete().eq('user_id', user.id);
  };

  const addProduct = async (p: any) => {
    if (!user) return;
    const newProduct: Product = { ...p, id: `p_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, user_id: user.id, created_at: new Date().toISOString() };
    
    setProducts(prev => [newProduct, ...prev]);
    storage.saveProduct(newProduct);
    
    const { error } = await supabase.from('tf_products').insert([newProduct]);
    if (error) {
      console.error('Supabase error adding product:', error.message);
      // We could optionally revert local state or show a warning
    }
    
    await addActivityLog(`Product added: ${p.name}`, '📦', 'var(--purple-light)');
  };

  const updateProduct = async (p: Product) => {
    setProducts(prev => prev.map(item => item.id === p.id ? p : item));
    storage.saveProduct(p);
    
    const { error } = await supabase.from('tf_products').upsert(p);
    if (error) console.error('Supabase error updating product:', error.message);
    
    await addActivityLog(`Product updated: ${p.name}`, '📦', 'var(--accent-light)');
  };

  const deleteProduct = async (id: string, name: string) => {
    setProducts(prev => prev.filter(item => item.id !== id));
    storage.deleteProduct(id);
    
    const { error } = await supabase.from('tf_products').delete().eq('id', id);
    if (error) console.error('Supabase error deleting product:', error.message);
    
    await addActivityLog(`Product deleted: ${name}`, '🗑️', 'var(--danger-light)');
  };

  const addCustomer = async (c: any) => {
    if (!user) return;
    const newCustomer: Customer = { 
      ...c, 
      id: `c_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, 
      user_id: user.id, 
      loyalty_points: 0,
      membership_tier: 'Bronze',
      created_at: new Date().toISOString() 
    };
    
    setCustomers(prev => [newCustomer, ...prev]);
    storage.saveCustomer(newCustomer);
    
    const { error } = await supabase.from('tf_customers').insert([newCustomer]);
    if (error) console.error('Supabase error adding customer:', error.message);
    
    await addActivityLog(`Customer added: ${c.name}`, '👤', 'var(--accent-light)');
  };

  const addExpense = async (e: any) => {
    if (!user) return;
    const newExpense: Expense = { ...e, id: `e_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, user_id: user.id };
    
    setExpenses(prev => [newExpense, ...prev]);
    storage.saveExpense(newExpense);
    
    const { error } = await supabase.from('tf_expenses').insert([newExpense]);
    if (error) console.error('Supabase error adding expense:', error.message);
    
    await addActivityLog(`Expense recorded: ${e.title}`, '💸', 'var(--danger-light)');
  };

  const addTransaction = async (t: any) => {
    if (!user) return;
    const newTransaction: Transaction = { ...t, id: `tr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, user_id: user.id };
    
    setTransactions(prev => [newTransaction, ...prev]);
    storage.saveTransaction(newTransaction);
    
    const { error } = await supabase.from('tf_transactions').insert([newTransaction]);
    if (error) console.error('Supabase error adding transaction:', error.message);
    
    // Auto-update inventory
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
          await updateProduct(updated);
        } else if (t.type === 'purchase') {
          // Auto-create product if missing during purchase
          await addProduct({
            name: item.product_name,
            category: 'Uncategorized',
            stock: item.quantity,
            cost_price: item.unit_price,
            sell_price: item.sell_price || item.unit_price,
            sku: `SKU-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            image: '',
            unit: 'pcs'
          });
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
        await updateProduct(updated);
      } else if (t.type === 'purchase') {
        // Auto-create product if missing during purchase
        await addProduct({
          name: t.product_name,
          category: 'Uncategorized',
          stock: t.quantity,
          cost_price: t.unit_price,
          sell_price: t.sell_price || t.unit_price,
          sku: `SKU-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          image: '',
          unit: 'pcs'
        });
      }
    }

    // Auto-add customer if not exists
    if (t.type === 'sale' && t.customer_name && t.customer_name.trim() !== '' && t.customer_name.toLowerCase() !== 'walk-in') {
      const customerExists = customers.some(c => c.name.toLowerCase() === t.customer_name.toLowerCase());
      if (!customerExists) {
        await addCustomer({
          name: t.customer_name,
          email: '',
          phone: '',
          address: ''
        });
      }
    }

    const typeLabel = t.type === 'sale' ? 'Sale recorded' : 'Purchase recorded';
    await addActivityLog(`${typeLabel}: ${t.product_name || 'Multiple'}`, t.type === 'sale' ? '💰' : '🛒', t.type === 'sale' ? 'var(--success-light)' : 'var(--purple-light)');
  };

  const addDocument = async (d: any) => {
    if (!user) return;
    const newDoc: TradeDocument = { 
      ...d, 
      id: `doc_${Date.now()}`, 
      user_id: user.id, 
      date: new Date().toISOString() 
    };
    
    setDocuments(prev => [newDoc, ...prev]);
    await documentDB.save(newDoc);
    
    const { error } = await supabase.from('tf_documents').insert([newDoc]);
    if (error) console.error('Supabase error adding document:', error.message);
    
    await addActivityLog(`Document uploaded: ${d.name}`, '📄', 'var(--accent-light)');
  };

  const deleteDocument = async (id: string, name: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    await documentDB.delete(id);
    
    const { error } = await supabase.from('tf_documents').delete().eq('id', id);
    if (error) console.error('Supabase error deleting document:', error.message);
    
    await addActivityLog(`Document deleted: ${name}`, '🗑️', 'var(--danger-light)');
  };

  const updateSettings = async (s: AppSettings) => {
    if (!user) return;
    setSettings(s);
    storage.saveSettings(user.id, s);
    
    const { error } = await supabase.from('tf_settings').upsert({ user_id: user.id, data: s });
    if (error) console.error('Supabase error updating settings:', error.message);
  };

  return (
    <DataContext.Provider value={{
      products, customers, expenses, transactions, activityLogs, documents, settings,
      selectedInvoiceId, setSelectedInvoiceId,
      addProduct, updateProduct, deleteProduct,
      addCustomer, addExpense, addTransaction, 
      addDocument, deleteDocument,
      addActivityLog, clearActivityLogs, updateSettings,
      refreshData: loadData
    }}>
      {children}
      {(dbStatus === 'error' || dbStatus === 'offline') && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: dbStatus === 'offline' ? '#f0f9ff' : '#fee2e2',
          border: `1px solid ${dbStatus === 'offline' ? '#bae6fd' : '#fecaca'}`,
          color: dbStatus === 'offline' ? '#0369a1' : '#991b1b',
          padding: '12px 20px',
          borderRadius: '12px',
          fontSize: '13px',
          fontWeight: 600,
          zIndex: 9999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>{dbStatus === 'offline' ? '🌐' : '⚠️'}</span>
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '300px' }}>
            <span>{dbStatus === 'offline' ? 'Offline Mode' : 'Database Status'}</span>
            <span style={{ fontSize: '11px', opacity: 0.9, fontWeight: 400, lineHeight: 1.3 }}>
              {dbError || 'Connection issue. Using local storage.'}
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
