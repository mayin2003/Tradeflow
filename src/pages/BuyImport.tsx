import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useData, deduplicateProducts } from '../context/DataContext';
import { QrCode, Camera, Calendar, X, Sparkles, Watch, Truck, CreditCard, DollarSign, Percent, AlertCircle, Upload, FileText, Image as ImageIcon, Trash2, ShoppingBag, Package, LayoutGrid, User, UserPlus, ChevronDown, Landmark, Calculator, Save, MoreVertical, ShoppingCart, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BarcodeScanner } from '../components/BarcodeScanner';

const RECORD_CATEGORIES = [
  'Fashion', 'Electronics', 'Home', 'Beauty', 'Health', 'Sports', 'Toys', 'Automotive', 
  'Books', 'Groceries', 'Kitchen', 'Tools', 'Office', 'Pets', 'Travel', 'Baby', 
  'Jewelry', 'Fitness', 'Music', 'Garden', 'Others'
];

const CATEGORY_MAPPING: Record<string, string[]> = {
  Fashion: ['T-shirt', 'Jeans', 'Sneakers', 'Socks', 'Jacket', 'Sunglass', 'Wallet', 'Watch Strap', 'Backpack', 'Raincoat'],
  Electronics: ['Smartphone', 'Power Bank', 'Earbuds', 'Smart Plug', 'Cable', 'Adapter', 'Multiplug', 'Speaker', 'Ring Light', 'Router'],
  Home: ['Bedsheet', 'Pillow', 'Curtain', 'Doormat', 'LED Bulb', 'Hanger', 'Wall Clock', 'Storage Box', 'Basket', 'Freshener'],
  Beauty: ['Facewash', 'Moisturizer', 'Sunscreen', 'Lip Balm', 'Perfume', 'Shampoo', 'Hair Oil', 'Body Wash', 'Hand Cream', 'Comb'],
  Health: ['Mask', 'Sanitizer', 'Bandage', 'Ointment', 'Vitamins', 'Thermometer', 'BP Monitor', 'Mosquito Cream', 'Pain Spray', 'Scale'],
  Sports: ['Football', 'Cricket Bat', 'Racket', 'Shuttlecock', 'Jersey', 'Wristband', 'Jump Rope', 'Water Bottle', 'Running Shoes', 'Knee Cap'],
  Toys: ['Rubik\'s Cube', 'RC Car', 'Teddy Bear', 'Blocks', 'Chess', 'Ludo', 'Spinner', 'Doll', 'Puzzle', 'Slime'],
  Automotive: ['Phone Mount', 'Car Charger', 'Helmet', 'Bike Cover', 'Air Purifier', 'Cloth', 'Cushion', 'Key Ring', 'Car Perfume', 'Tyre Pump'],
  Books: ['Novel', 'Story Book', 'Diary', 'Notebook', 'Drawing Book', 'Self-Help Book', 'Comic', 'Calendar', 'Dictionary', 'Coloring Book'],
  Groceries: ['Rice', 'Oil', 'Salt', 'Sugar', 'Onion', 'Lentils', 'Milk', 'Tea', 'Spices', 'Eggs'],
  Kitchen: ['Knife', 'Bottle', 'Lunch Box', 'Pan', 'Spice Jar', 'Board', 'Dish Soap', 'Towel', 'Kettle', 'Blender'],
  Tools: ['Screwdriver', 'Hammer', 'Tape Measure', 'Pliers', 'Glue', 'Scissors', 'Flashlight', 'Tape', 'Padlock', 'Pocket Knife'],
  Office: ['Pen', 'A4 Paper', 'Stapler', 'Sticky Notes', 'Organizer', 'Mouse Pad', 'Scissors', 'Highlighter', 'Clips', 'Folder'],
  Pets: ['Cat Food', 'Dog Food', 'Shampoo', 'Litter', 'Collar', 'Bowl', 'Toy Ball', 'Brush', 'Pet Bed', 'Bird Seed'],
  Travel: ['Suitcase', 'Neck Pillow', 'Passport Case', 'Pouch', 'Eye Mask', 'Adapter', 'Tag', 'Umbrella', 'Lock', 'Towel'],
  Baby: ['Diapers', 'Wipes', 'Lotion', 'Feeder', 'Romper', 'Pacifier', 'Bib', 'Rattle', 'Shampoo', 'Stroller'],
  Jewelry: ['Ring', 'Necklace', 'Earrings', 'Bracelet', 'Nose Pin', 'Anklet', 'Hair Clip', 'Jewelry Box', 'Brooch', 'Bangles'],
  Fitness: ['Yoga Mat', 'Dumbbell', 'Band', 'Shaker', 'Waist Belt', 'Push Up Bar', 'Gloves', 'Sweatband', 'Scale', 'Roller'],
  Music: ['Guitar', 'Ukulele', 'Harmonica', 'Picks', 'Tuner', 'Mic', 'Pop Filter', 'Stand', 'Audio Cable', 'Drumsticks'],
  Garden: ['Spray Bottle', 'Pot', 'Seeds', 'Fertilizer', 'Gloves', 'Trowel', 'Shears', 'Watering Can', 'Plant Stick', 'Grass Mat']
};

const inferCategory = (productName: string): string => {
  const name = productName.trim().toLowerCase();
  if (!name) return 'Others';

  // 1. Direct item substring matching from database (case insensitive)
  for (const [category, items] of Object.entries(CATEGORY_MAPPING)) {
    for (const item of items) {
      const itemLower = item.toLowerCase();
      if (name.includes(itemLower)) {
        return category;
      }
      
      // Handle hyphenation
      if (itemLower.includes('-')) {
        const itemNoHyphen = itemLower.replace('-', '');
        const itemSpace = itemLower.replace('-', ' ');
        if (name.includes(itemNoHyphen) || name.includes(itemSpace)) {
          return category;
        }
      }
      if (itemLower.includes(' ')) {
        const itemNoSpace = itemLower.replace(/\s+/g, '');
        if (name.includes(itemNoSpace)) {
          return category;
        }
      }

      // Plural check
      if (itemLower.endsWith('s') && itemLower.length > 3) {
        const singular = itemLower.slice(0, -1);
        if (name.includes(singular)) {
          return category;
        }
      }
    }
  }

  // 2. Word token matches
  const nameWords = name.split(/[^a-zA-Z0-9_\-+']+/).filter(w => w.length > 2);
  for (const word of nameWords) {
    for (const [category, items] of Object.entries(CATEGORY_MAPPING)) {
      for (const item of items) {
        const itemLower = item.toLowerCase();
        const itemWords = itemLower.split(/[^a-zA-Z0-9_\-+']+/);
        const isMatch = itemWords.some(itemWord => {
          if (itemWord === word) return true;
          if (itemWord.endsWith('s') && itemWord.slice(0, -1) === word) return true;
          if (word.endsWith('s') && word.slice(0, -1) === itemWord) return true;
          return false;
        });
        if (isMatch) {
          return category;
        }
      }
    }
  }

  // 3. Substring matching of generic helpers
  const extraKeywords: Record<string, string[]> = {
    Fashion: ['shirt', 'pant', 'garments', 'cloth', 'apparel', 'fashion', 'clothing', 'jeans', 'saree', 'dress', 'cotton'],
    Electronics: ['tv', 'led', 'samsung', 'phone', 'camera', 'laptop', 'display', 'screen', 'charger', 'cable', 'adapter', 'electronics', 'device', 'computer', 'monitor', 'headphone', 'gadget', 'smartphone', 'earbud'],
    Home: ['bed', 'chair', 'table', 'furniture', 'curtain', 'pillow', 'sofa', 'home', 'houseware'],
    Beauty: ['cosmetics', 'makeup', 'soap', 'shampoo', 'perfume', 'fragrance', 'lotion', 'skincare', 'beauty', 'facewash', 'personal care'],
    Health: ['medicine', 'pill', 'supplement', 'clinical', 'health', 'wellness', 'mask', 'sanitizer'],
    Sports: ['sports', 'outdoor', 'football', 'cricket', 'bat', 'ball', 'jersey'],
    Toys: ['toy', 'game', 'puzzle', 'hobby', 'doll', 'play'],
    Automotive: ['car', 'bike', 'motor', 'automotive', 'vehicle', 'accessory', 'tire', 'helmet'],
    Books: ['book', 'pen', 'notebook', 'paper', 'pencil', 'diary', 'stationery', 'novel'],
    Groceries: ['food', 'beverage', 'drink', 'coke', 'juice', 'water', 'snack', 'biscuit', 'chips', 'tea', 'coffee', 'sugar', 'oil', 'onion', 'garlic', 'milk', 'egg', 'groceries', 'gourmet'],
    Kitchen: ['kitchen', 'cooking', 'pan', 'pot', 'knife', 'cookware', 'stove', 'bottle'],
    Tools: ['drill', 'pump', 'gear', 'tool', 'engine', 'generator', 'compressor', 'hammer', 'screwdriver', 'wrench'],
    Office: ['office', 'desk', 'stapler', 'calculator', 'pen'],
    Pets: ['pet', 'dog', 'cat', 'bird', 'animal'],
    Travel: ['travel', 'baggage', 'suitcase', 'backpack', 'luggage', 'passport'],
    Baby: ['baby', 'diaper', 'infant', 'toddler', 'stroller', 'cradle'],
    Jewelry: ['jewelry', 'jewellery', 'gold', 'silver', 'ring', 'necklace', 'earring', 'bracelet', 'diamond'],
    Fitness: ['fitness', 'gym', 'workout', 'treadmill', 'dumbbell', 'yoga'],
    Music: ['music', 'song', 'guitar', 'piano', 'instrument', 'microphone', 'drum'],
    Garden: ['garden', 'plants', 'seeds', 'flower', 'lawn', 'potting', 'fertilizer', 'soil']
  };

  for (const [category, keywords] of Object.entries(extraKeywords)) {
    for (const kw of keywords) {
      if (name.includes(kw)) {
        return category;
      }
    }
  }

  return 'Others';
};

interface BuyImportProps {
  onNavigate?: (page: string) => void;
}

export const BuyImportComponent = ({ onNavigate }: BuyImportProps) => {
  const { products, transactions, addTransaction, deleteTransaction, settings, addProduct, updateProduct } = useData();
  const isDarkMode = settings.theme === 'dark' || (typeof document !== 'undefined' && (document.body.classList.contains('dark-mode') || document.documentElement.classList.contains('dark')));
  const [showModal, setShowModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewInvoice, setPreviewInvoice] = useState<any>(null);
  const [previewInvoiceUrl, setPreviewInvoiceUrl] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleClosePreviewInvoice = () => {
    if (previewInvoiceUrl) {
      URL.revokeObjectURL(previewInvoiceUrl);
      setPreviewInvoiceUrl(null);
    }
    setPreviewInvoice(null);
  };

  const openPreviewInvoice = (t: any) => {
    // Make sure we have the correct file type
    let fileType = t.invoice_file_type || '';
    const fileData = t.invoice_file_data;
    
    if (fileData && !fileType && fileData.startsWith('data:')) {
      const match = fileData.match(/^data:([^;]+);/);
      if (match) fileType = match[1];
    }
    
    const updatedT = {
      ...t,
      invoice_file_type: fileType || t.invoice_file_type
    };
    
    setPreviewInvoice(updatedT);
    
    if (fileData) {
      if (fileType && (fileType.includes('pdf') || fileType.includes('image'))) {
        try {
          const base64 = fileData.includes(',') ? fileData.split(',')[1] : fileData;
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: fileType });
          const url = URL.createObjectURL(blob);
          setPreviewInvoiceUrl(url);
        } catch (err) {
          console.error("Error creating preview URL:", err);
          setPreviewInvoiceUrl(fileData); // Fallback to base64
        }
      } else {
        // Direct dataURL fallback if not a strict PDF/Image blob parseable string
        setPreviewInvoiceUrl(fileData);
      }
    }
  };

  const handleDownloadInvoice = (t: any) => {
    const link = document.createElement('a');
    link.href = t.invoice_file_data;
    link.download = t.invoice_file_name || `${t.product_name || 'invoice'}_invoice`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteTransaction = (t: any) => {
    if (deletingId === t.id) {
      deleteTransaction(t.id, t.product_name);
      setDeletingId(null);
    } else {
      setDeletingId(t.id);
      // Auto revert after 4 seconds to prevent accidental double clicks or stale states
      setTimeout(() => {
        setDeletingId(prev => prev === t.id ? null : prev);
      }, 4000);
    }
  };
  const dateInputRef = useRef<HTMLInputElement>(null);
  const expiryInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    product_id: '',
    product_name: '',
    category: 'Others',
    qty: 0,
    price: 0,
    sell_price: 0,
    ship: 0,
    duty: 0,
    vat: 0,
    other: 0,
    currency: 'BDT',
    date: new Date().toISOString().split('T')[0],
    supplier: '',
    payment_method: 'Cash',
    exchange_rate: 1,
    expiry_date: '',
    invoice_image: null as File | null
  });

  const [categorySearch, setCategorySearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCategories = useMemo(() => {
    return RECORD_CATEGORIES.filter(cat => 
      cat.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categorySearch]);

  const calculations = useMemo(() => {
    const prodVal = formData.price * formData.qty * formData.exchange_rate;
    const addVal = (formData.ship + formData.duty + formData.vat + formData.other) * formData.exchange_rate;
    const totalVal = prodVal + addVal;
    const landVal = formData.qty ? totalVal / formData.qty : 0;
    
    // Margin calculation
    const margin = formData.sell_price > 0 
      ? ((formData.sell_price - landVal) / formData.sell_price) * 100 
      : 0;

    return { prod: prodVal, add: addVal, total: totalVal, land: landVal, margin };
  }, [formData]);

  const { prod, add, total, land, margin } = calculations;

  const handleAdd = () => {
    if (!formData.product_name || !formData.qty) {
      alert('Please fill in all required fields (Product, Quantity).');
      return;
    }
    
    // Default sell_price to purchase price if not set
    const finalSellPrice = formData.sell_price || formData.price;
    const selectedCategory = formData.category || 'Others';

    const submitData = async (invoiceData?: { data: string; name: string; type: string }) => {
      const existingProduct = products.find(p => p.name.trim().toLowerCase() === formData.product_name.trim().toLowerCase());
      const finalProductId = existingProduct ? existingProduct.id : (formData.product_id || `p_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`);

      await addTransaction({
        type: 'purchase',
        product_id: finalProductId,
        product_name: formData.product_name,
        category: selectedCategory,
        quantity: formData.qty,
        unit_price: formData.price,
        sell_price: finalSellPrice,
        total_price: total,
        date: formData.date,
        status: 'completed',
        shipping_cost: formData.ship,
        customs_duty: formData.duty,
        vat: formData.vat,
        other_cost: formData.other,
        supplier: formData.supplier,
        payment_method: formData.payment_method,
        exchange_rate: formData.exchange_rate,
        expiry_date: formData.expiry_date,
        invoice_file_data: invoiceData?.data || null,
        invoice_file_name: invoiceData?.name || null,
        invoice_file_type: invoiceData?.type || null,
      } as any);

      setShowModal(false);
      setFormData({
        product_id: '',
        product_name: '',
        category: 'Others',
        qty: 0,
        price: 0,
        sell_price: 0,
        ship: 0,
        duty: 0,
        vat: 0,
        other: 0,
        currency: 'BDT',
        date: new Date().toISOString().split('T')[0],
        supplier: '',
        payment_method: 'Cash',
        exchange_rate: 1,
        expiry_date: '',
        invoice_image: null
      });
    };

    if (formData.invoice_image) {
      const reader = new FileReader();
      reader.onloadend = () => {
        submitData({
          data: reader.result as string,
          name: formData.invoice_image!.name,
          type: formData.invoice_image!.type
        });
      };
      reader.readAsDataURL(formData.invoice_image);
    } else {
      submitData();
    }
  };

  const formattedDate = useMemo(() => {
    if (!formData.date) return 'Select Date';
    return new Date(formData.date).toLocaleDateString('en-GB');
  }, [formData.date]);

  const formattedExpiryDate = useMemo(() => {
    if (!formData.expiry_date) return 'Not Set';
    return new Date(formData.expiry_date).toLocaleDateString('en-GB');
  }, [formData.expiry_date]);

  const suppliers = useMemo(() => {
    const list = transactions
      .filter(t => (t as any).supplier)
      .map(t => (t as any).supplier);
    return Array.from(new Set(list));
  }, [transactions]);

  const handleScan = (decodedText: string) => {
    console.log('Scanned QR:', decodedText);
    // Logic to find product by barcode or just set name
    const existing = products.find(p => p.id === decodedText || p.name === decodedText);
    if (existing) {
      setFormData({
        ...formData,
        product_name: existing.name,
        product_id: existing.id,
        price: existing.cost_price,
        sell_price: existing.sell_price
      });
    } else {
      setFormData({
        ...formData,
        product_name: decodedText
      });
    }
    setShowScanner(false);
  };

  const fmt = (n: number) => settings.currency + Math.round(n).toLocaleString();

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => t.type === 'purchase')
      .filter(t => t.product_name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [transactions, searchQuery]);

  const allProducts = useMemo(() => {
    const list = [...products];
    const existingNames = new Set(list.map(p => p.name.trim().toLowerCase()));

    transactions.forEach(t => {
      if (t.type === 'purchase') {
        const processItem = (pName?: string, catName?: string, cost?: number, qty?: number) => {
          if (!pName || !pName.trim()) return;
          const norm = pName.trim().toLowerCase();
          if (!existingNames.has(norm)) {
            existingNames.add(norm);
            list.push({
              id: `trans-prod-${norm.replace(/[^a-z0-9]/g, '-')}`,
              name: pName.trim(),
              category: catName || inferCategory(pName.trim()),
              cost_price: cost || 0,
              sell_price: (cost || 0) * 1.2,
              stock: qty || 0,
              min_stock: 5,
              hs_code: '',
              barcode: '',
              sku: '',
              unit: 'pcs',
              date: t.date || new Date().toISOString().split('T')[0]
            } as any);
          }
        };

        if (t.items && t.items.length > 0) {
          t.items.forEach(item => {
            processItem(item.product_name, item.category, item.unit_price, item.quantity);
          });
        } else if (t.product_name) {
          processItem(t.product_name, t.category, t.unit_price, t.quantity);
        }
      }
    });

    return deduplicateProducts(list).filter(p => !(p as any).is_inactive && (p as any).status !== 'inactive');
  }, [products, transactions]);

  const stats = useMemo(() => {
    const purchaseTransactions = transactions.filter(t => t.type === 'purchase');
    const totalPurchaseCost = purchaseTransactions.reduce((a, b) => a + b.total_price, 0);
    const totalStockUnits = allProducts.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);
    const avgLandingCost = purchaseTransactions.length > 0 
      ? totalPurchaseCost / purchaseTransactions.reduce((a, b) => a + (b.quantity || 1), 0)
      : 0;

    return { 
      count: purchaseTransactions.length, 
      totalPurchaseCost, 
      totalStockUnits,
      totalSkus: allProducts.length,
      avgLandingCost
    };
  }, [transactions, allProducts]);

  if (showModal) {
    return (
      <div id="page-buy" className="page active space-y-6 w-full pb-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Buy Workspace</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Record new purchase transaction and manage import details</p>
          </div>
          <button 
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            onClick={() => setShowModal(false)}
          >
            <span>← Back to Purchase History</span>
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl p-6 sm:p-8 space-y-6 w-full">
          {/* Card Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center shrink-0 shadow-xs">
                <ShoppingBag size={22} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Record Purchase</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Enter purchase details to calculate landed costs and update inventory.</p>
              </div>
            </div>
            <button 
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer" 
              onClick={() => setShowModal(false)} 
              title="Close Workspace"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            {/* Product * */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wide">Product *</label>
              <div className="relative flex items-center rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
                <Package size={18} className="absolute left-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input 
                  type="text" 
                  list="products-list"
                  className="w-full pl-10 pr-4 py-2.5 bg-transparent text-sm font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none"
                  value={formData.product_name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const existing = products.find(p => p.name === name);
                    const detectedCategory = inferCategory(name);
                    setFormData({
                      ...formData, 
                      product_name: name,
                      product_id: existing ? existing.id : '',
                      price: existing ? existing.cost_price : formData.price,
                      sell_price: existing ? existing.sell_price : formData.sell_price,
                      category: existing ? (existing.category || detectedCategory) : detectedCategory
                    });
                  }}
                  placeholder="Search or enter product name" 
                />
              </div>
              <datalist id="products-list">
                {products.map(p => <option key={p.id} value={p.name} />)}
              </datalist>
            </div>

            {/* Category * */}
            <div className="space-y-1.5 relative" ref={dropdownRef}>
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wide">Category *</label>
              <div 
                className="relative flex items-center rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100/70 dark:hover:bg-slate-800 cursor-pointer px-3.5 py-2.5 transition-all select-none"
                onClick={() => {
                  setDropdownOpen(!dropdownOpen);
                  setCategorySearch('');
                  setFocusedIndex(-1);
                }}
              >
                <LayoutGrid size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0 mr-2.5" />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex-1 truncate">
                  {formData.category || 'Others'}
                </span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {dropdownOpen && (
                <div className="absolute left-0 right-0 top-[100%] mt-1 z-[999] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-2 flex flex-col gap-1">
                  <div className="p-1">
                    <input
                      type="text"
                      className="w-full text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-medium text-slate-800 dark:text-slate-200"
                      placeholder="Type to search category..."
                      value={categorySearch}
                      onChange={(e) => {
                        setCategorySearch(e.target.value);
                        setFocusedIndex(0);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setFocusedIndex(prev => Math.min(filteredCategories.length - 1, prev + 1));
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setFocusedIndex(prev => Math.max(0, prev - 1));
                        } else if (e.key === 'Enter') {
                          e.preventDefault();
                          if (focusedIndex >= 0 && focusedIndex < filteredCategories.length) {
                            const selected = filteredCategories[focusedIndex];
                            setFormData({ ...formData, category: selected });
                            setDropdownOpen(false);
                          }
                        } else if (e.key === 'Escape') {
                          setDropdownOpen(false);
                        }
                      }}
                      autoFocus
                    />
                  </div>
                  <div className="max-h-[160px] overflow-y-auto custom-scrollbar flex flex-col pt-1">
                    {filteredCategories.length > 0 ? (
                      filteredCategories.map((cat, idx) => {
                        const isFocused = idx === focusedIndex;
                        const isSelected = formData.category === cat;
                        return (
                          <button
                            key={cat}
                            type="button"
                            className={`w-full text-left rounded-lg text-xs font-semibold px-3 py-2 transition-all flex items-center justify-between
                              ${isSelected 
                                ? 'bg-indigo-600 text-white' 
                                : isFocused 
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100' 
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                              }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData({ ...formData, category: cat });
                              setDropdownOpen(false);
                            }}
                            onMouseEnter={() => setFocusedIndex(idx)}
                          >
                            <span>{cat}</span>
                            {isSelected && <span className="text-[10px]">✓</span>}
                          </button>
                        );
                      })
                    ) : (
                      <div className="text-center text-[11px] text-slate-400 py-3 italic">
                        No categories match
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Supplier */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wide">Supplier</label>
              <div className="relative flex items-center rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
                <User size={18} className="absolute left-3.5 text-indigo-500 dark:text-indigo-400 pointer-events-none" />
                <input 
                  type="text" 
                  list="suppliers-list"
                  className="w-full pl-10 pr-10 py-2.5 bg-transparent text-sm font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none"
                  value={formData.supplier}
                  onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                  placeholder="Search supplier" 
                />
                <UserPlus size={16} className="absolute right-3.5 text-slate-400 pointer-events-none" />
              </div>
              <datalist id="suppliers-list">
                {suppliers.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>

            {/* Purchase Date * */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wide">Purchase Date *</label>
              <div 
                className="relative flex items-center justify-between rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100/70 dark:hover:bg-slate-800 cursor-pointer px-3.5 py-2.5 transition-all select-none"
                onClick={() => dateInputRef.current?.showPicker?.()}
              >
                <div className="flex items-center gap-2.5">
                  <Calendar size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {formattedDate}
                  </span>
                </div>
                <Calendar size={16} className="text-slate-400 shrink-0" />
                <input 
                  ref={dateInputRef}
                  type="date" 
                  className="sr-only"
                  value={formData.date}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) setFormData({...formData, date: val});
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* Payment Method (Full width) */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wide">Payment Method</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'Cash', label: 'Cash', icon: CreditCard },
                  { id: 'Bank', label: 'Bank Transfer', icon: Landmark },
                  { id: 'LC', label: 'Letter of Credit', icon: FileText },
                ].map(item => {
                  const IconComp = item.icon;
                  const isSelected = formData.payment_method === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-2xs' 
                          : 'bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 font-semibold'
                      }`}
                      onClick={() => setFormData({...formData, payment_method: item.id})}
                    >
                      <IconComp size={16} className={isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Purchase Price (Unit) * */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wide">Purchase Price (Unit) *</label>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                  <span>Exchange Rate • {formData.exchange_rate.toFixed(2)}</span>
                  <input 
                    type="number"
                    step="0.01"
                    className="w-10 bg-transparent border-none p-0 text-[11px] font-bold text-blue-700 dark:text-blue-300 focus:outline-none text-right hidden group-hover:inline-block"
                    value={formData.exchange_rate}
                    onChange={(e) => setFormData({...formData, exchange_rate: +e.target.value || 1})}
                  />
                </div>
              </div>
              <div className="relative flex items-center rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
                <span className="absolute left-3.5 text-sm font-bold text-slate-600 dark:text-slate-300">৳</span>
                <input 
                  type="number" 
                  className="w-full pl-8 pr-4 py-2.5 bg-transparent text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none"
                  value={formData.price || ''}
                  onChange={(e) => {
                    const val = +e.target.value;
                    setFormData({
                      ...formData, 
                      price: val,
                      sell_price: formData.sell_price === formData.price || !formData.sell_price ? val : formData.sell_price
                    });
                  }}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Sell Price (Unit) * */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wide">Sell Price (Unit) *</label>
                <div className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${
                  margin > 20 ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-900/40' : 
                  margin > 5 ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/40 dark:border-amber-900/40' : 
                  'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/40 dark:border-rose-900/40'
                }`}>
                  Profit Margin • {margin.toFixed(0)}%
                </div>
              </div>
              <div className="relative flex items-center rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
                <span className="absolute left-3.5 text-sm font-bold text-slate-600 dark:text-slate-300">৳</span>
                <input 
                  type="number" 
                  className="w-full pl-8 pr-4 py-2.5 bg-transparent text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none"
                  value={formData.sell_price || ''}
                  onChange={(e) => setFormData({...formData, sell_price: +e.target.value})}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Quantity * */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wide">Quantity *</label>
              <div className="relative flex items-center rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
                <Package size={18} className="absolute left-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input 
                  type="number" 
                  className="w-full pl-10 pr-4 py-2.5 bg-transparent text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none"
                  value={formData.qty || ''}
                  onChange={(e) => setFormData({...formData, qty: +e.target.value})}
                  placeholder="0"
                />
              </div>
            </div>

            {/* QR Code Scan */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wide">QR Code Scan</label>
              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="w-11 h-11 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 hover:bg-indigo-100 transition-colors cursor-pointer"
                  title="Open Camera Scanner"
                >
                  <QrCode size={20} />
                </button>
                <button 
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white font-bold rounded-xl py-2.5 px-4 flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 text-sm transition-all cursor-pointer"
                >
                  <Camera size={16} />
                  <span>Scan Product QR</span>
                </button>
              </div>
            </div>

            {/* Expiry Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wide">Expiry Date</label>
              <div 
                className="relative flex items-center justify-between rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100/70 dark:hover:bg-slate-800 cursor-pointer px-3.5 py-2.5 transition-all select-none"
                onClick={() => expiryInputRef.current?.showPicker?.()}
              >
                <div className="flex items-center gap-2.5">
                  <Calendar size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {formattedExpiryDate}
                  </span>
                </div>
                <Calendar size={16} className="text-slate-400 shrink-0" />
                <input 
                  ref={expiryInputRef}
                  type="date" 
                  className="sr-only"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* Invoice File */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wide">Invoice File</label>
              <div 
                className="relative flex items-center justify-between rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100/70 dark:hover:bg-slate-800 cursor-pointer px-3.5 py-2.5 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  ref={fileInputRef}
                  type="file" 
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={(e) => setFormData({...formData, invoice_image: e.target.files?.[0] || null})}
                />
                <div className="flex items-center gap-2.5 truncate flex-1 pr-2">
                  <Upload size={18} className="text-slate-400 shrink-0" />
                  {formData.invoice_image ? (
                    <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 truncate">
                      {formData.invoice_image.name}
                    </span>
                  ) : (
                    <span className="text-sm text-slate-400">
                      Upload invoice (PDF or Image)
                    </span>
                  )}
                </div>
                {formData.invoice_image && (
                  <button 
                    type="button"
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormData({...formData, invoice_image: null});
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Additional Costs Section Header Pill */}
            <div className="md:col-span-2 relative my-1 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200/80 dark:border-slate-800" />
              </div>
              <div className="relative bg-indigo-50/90 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold px-4 py-1 rounded-full shadow-2xs">
                Additional Costs
              </div>
            </div>

            {/* Shipping Cost */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wide">Shipping Cost</label>
              <div className="relative flex items-center rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
                <span className="absolute left-3.5 text-sm font-bold text-slate-600 dark:text-slate-300">৳</span>
                <input 
                  type="number" 
                  className="w-full pl-8 pr-4 py-2.5 bg-transparent text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none"
                  value={formData.ship || ''}
                  onChange={(e) => setFormData({...formData, ship: +e.target.value})} 
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Customs Duty */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wide">Customs Duty</label>
              <div className="relative flex items-center rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
                <span className="absolute left-3.5 text-sm font-bold text-slate-600 dark:text-slate-300">৳</span>
                <input 
                  type="number" 
                  className="w-full pl-8 pr-4 py-2.5 bg-transparent text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none"
                  value={formData.duty || ''}
                  onChange={(e) => setFormData({...formData, duty: +e.target.value})} 
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Other Costs */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wide">Other Costs</label>
              <div className="relative flex items-center rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
                <span className="absolute left-3.5 text-sm font-bold text-slate-600 dark:text-slate-300">৳</span>
                <input 
                  type="number" 
                  className="w-full pl-8 pr-4 py-2.5 bg-transparent text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none"
                  value={formData.other || ''}
                  onChange={(e) => setFormData({...formData, other: +e.target.value})} 
                  placeholder="Enter additional expenses"
                />
              </div>
            </div>

            {/* Auto Calculation Card */}
            <div className="md:col-span-2 bg-indigo-50/40 dark:bg-slate-800/40 border border-indigo-100/80 dark:border-slate-700/60 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Calculator size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    Auto Calculation <Sparkles size={14} className="text-indigo-500" />
                  </h4>
                </div>
              </div>

              <div className="w-full sm:w-auto space-y-1 text-right text-xs">
                <div className="flex items-center justify-between sm:justify-end gap-6 text-slate-600 dark:text-slate-300">
                  <span className="font-medium text-slate-500">Product Cost</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">৳{prod.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-6">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">Total Landed Cost</span>
                  <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm">৳{total.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-6 text-slate-600 dark:text-slate-300">
                  <span className="font-medium text-slate-500">Landing Cost per Unit</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">৳{land.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button 
              type="button"
              className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm shadow-2xs transition-colors cursor-pointer" 
              onClick={() => setShowModal(false)}
            >
              Discard
            </button>
            <button 
              type="button"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all cursor-pointer" 
              onClick={handleAdd}
            >
              <Save size={16} />
              <span>Save Purchase</span>
            </button>
          </div>
        </div>

        {showScanner && (
          <BarcodeScanner 
            onScan={handleScan} 
            onClose={() => setShowScanner(false)} 
          />
        )}
      </div>
    );
  }

  return (
    <div id="page-buy" className="page active">
      <div className="page-header">
        <div><h2>Buy / Import Management</h2><p>Record purchases with full cost breakdown</p></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>Buy Product</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 mb-6">
        {/* KPI 1: TOTAL PURCHASE COST */}
        <div 
          className={isDarkMode 
            ? "bg-gradient-to-b from-[#0d163d] via-[#09102f] to-[#060a21] border border-[#1b2756] text-white rounded-[20px] p-5 shadow-lg flex flex-col justify-between h-[162px] hover:border-[#2b3c7d] transition-all group" 
            : "border border-white/10 text-white rounded-[20px] p-5 shadow-[0_10px_20px_rgba(15,23,42,0.08),0_20px_40px_rgba(37,99,235,0.12),0_30px_60px_rgba(37,99,235,0.08)] hover:shadow-[0_16px_32px_rgba(15,23,42,0.12),0_28px_56px_rgba(37,99,235,0.18),0_40px_70px_rgba(37,99,235,0.12)] hover:-translate-y-1 transition-all duration-250 ease-out flex flex-col justify-between h-[162px] group relative overflow-hidden"}
          style={isDarkMode ? undefined : { background: 'radial-gradient(circle at top left, rgba(255, 255, 255, 0.16), transparent 45%), linear-gradient(135deg, #315E9F 0%, #2B5598 45%, #244A8F 100%)' }}
        >
          <div className="flex justify-between items-start w-full relative z-10">
            <div className="flex items-center gap-3">
              <div className={isDarkMode ? "w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 border border-purple-400/20" : "w-10 h-10 rounded-xl bg-white/12 border border-white/10 backdrop-blur-md text-white flex items-center justify-center shrink-0 shadow-xs"}>
                <ShoppingCart size={18} />
              </div>
              <span className={isDarkMode ? "text-[11px] font-extrabold uppercase tracking-wider text-slate-200" : "text-[11px] font-bold uppercase tracking-wider text-white/90"}>TOTAL PURCHASE COST</span>
            </div>
            <MoreVertical size={16} className={isDarkMode ? "text-slate-400 hover:text-white cursor-pointer transition-colors" : "text-white/60 hover:text-white cursor-pointer transition-colors"} />
          </div>
          <div className="text-[28px] font-bold tracking-tight text-white font-sans leading-none my-1 relative z-10">
            {fmt(stats.totalPurchaseCost)}
          </div>
          <div className="flex items-center justify-between pt-2.5 border-t border-white/10 text-[11px] relative z-10">
            <span className={isDarkMode ? "text-slate-300 font-medium" : "text-white/75 font-medium"}>Total purchase cost</span>
            <span className={isDarkMode ? "bg-[#1c2e63] text-blue-200 border border-blue-500/30 text-[11px] font-bold px-3 py-0.5 rounded-md" : "bg-[#1D4ED8]/40 text-blue-100 border border-[#1D4ED8]/60 text-[11px] font-bold px-3 py-0.5 rounded-md shadow-xs"}>
              {stats.count} Records
            </span>
          </div>
        </div>

        {/* KPI 2: TOTAL STOCK UNITS */}
        <div 
          onClick={() => {
            if (onNavigate) {
              onNavigate('inventory');
            } else {
              const invNavBtn = document.querySelector('[data-page="inventory"]') as HTMLElement;
              invNavBtn?.click();
            }
          }}
          className={isDarkMode 
            ? "bg-gradient-to-b from-[#0d163d] via-[#09102f] to-[#060a21] border border-[#1b2756] text-white rounded-[20px] p-5 shadow-lg flex flex-col justify-between h-[162px] hover:border-[#2b3c7d] transition-all group cursor-pointer" 
            : "border border-white/10 text-white rounded-[20px] p-5 shadow-[0_10px_20px_rgba(15,23,42,0.08),0_20px_40px_rgba(37,99,235,0.12),0_30px_60px_rgba(37,99,235,0.08)] hover:shadow-[0_16px_32px_rgba(15,23,42,0.12),0_28px_56px_rgba(37,99,235,0.18),0_40px_70px_rgba(37,99,235,0.12)] hover:-translate-y-1 transition-all duration-250 ease-out flex flex-col justify-between h-[162px] group relative overflow-hidden cursor-pointer"}
          style={isDarkMode ? undefined : { background: 'radial-gradient(circle at top left, rgba(255, 255, 255, 0.16), transparent 45%), linear-gradient(135deg, #315E9F 0%, #2B5598 45%, #244A8F 100%)' }}
        >
          <div className="flex justify-between items-start w-full relative z-10">
            <div className="flex items-center gap-3">
              <div className={isDarkMode ? "w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0 border border-blue-400/20" : "w-10 h-10 rounded-xl bg-white/12 border border-white/10 backdrop-blur-md text-white flex items-center justify-center shrink-0 shadow-xs"}>
                <Package size={18} />
              </div>
              <span className={isDarkMode ? "text-[11px] font-extrabold uppercase tracking-wider text-slate-200" : "text-[11px] font-bold uppercase tracking-wider text-white/90"}>TOTAL STOCK UNITS</span>
            </div>
            <MoreVertical size={16} className={isDarkMode ? "text-slate-400 hover:text-white cursor-pointer transition-colors" : "text-white/60 hover:text-white cursor-pointer transition-colors"} />
          </div>
          <div className="text-[28px] font-bold tracking-tight text-white font-sans leading-none my-1 relative z-10">
            {stats.totalStockUnits.toLocaleString()}
          </div>
          <div className="flex items-center justify-between pt-2.5 border-t border-white/10 text-[11px] relative z-10">
            <span className={isDarkMode ? "text-slate-300 font-medium" : "text-white/75 font-medium"}>Total stock units</span>
            <span className={isDarkMode ? "bg-[#1c2e63] text-blue-200 border border-blue-500/30 text-[11px] font-bold px-3 py-0.5 rounded-md" : "bg-[#1D4ED8]/40 text-blue-100 border border-[#1D4ED8]/60 text-[11px] font-bold px-3 py-0.5 rounded-md shadow-xs"}>
              {stats.totalSkus} SKUs
            </span>
          </div>
        </div>

        {/* KPI 3: AVG LANDING COST */}
        <div 
          className={isDarkMode 
            ? "bg-gradient-to-b from-[#0d163d] via-[#09102f] to-[#060a21] border border-[#1b2756] text-white rounded-[20px] p-5 shadow-lg flex flex-col justify-between h-[162px] hover:border-[#2b3c7d] transition-all group" 
            : "border border-white/10 text-white rounded-[20px] p-5 shadow-[0_10px_20px_rgba(15,23,42,0.08),0_20px_40px_rgba(37,99,235,0.12),0_30px_60px_rgba(37,99,235,0.08)] hover:shadow-[0_16px_32px_rgba(15,23,42,0.12),0_28px_56px_rgba(37,99,235,0.18),0_40px_70px_rgba(37,99,235,0.12)] hover:-translate-y-1 transition-all duration-250 ease-out flex flex-col justify-between h-[162px] group relative overflow-hidden"}
          style={isDarkMode ? undefined : { background: 'radial-gradient(circle at top left, rgba(255, 255, 255, 0.16), transparent 45%), linear-gradient(135deg, #315E9F 0%, #2B5598 45%, #244A8F 100%)' }}
        >
          <div className="flex justify-between items-start w-full relative z-10">
            <div className="flex items-center gap-3">
              <div className={isDarkMode ? "w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/20" : "w-10 h-10 rounded-xl bg-white/12 border border-white/10 backdrop-blur-md text-white flex items-center justify-center shrink-0 shadow-xs"}>
                <Tag size={18} />
              </div>
              <span className={isDarkMode ? "text-[11px] font-extrabold uppercase tracking-wider text-slate-200" : "text-[11px] font-bold uppercase tracking-wider text-white/90"}>AVG LANDING COST</span>
            </div>
            <MoreVertical size={16} className={isDarkMode ? "text-slate-400 hover:text-white cursor-pointer transition-colors" : "text-white/60 hover:text-white cursor-pointer transition-colors"} />
          </div>
          <div className="text-[28px] font-bold tracking-tight text-white font-sans leading-none my-1 relative z-10">
            {fmt(stats.avgLandingCost)}
          </div>
          <div className="flex items-center justify-between pt-2.5 border-t border-white/10 text-[11px] relative z-10">
            <span className={isDarkMode ? "text-slate-300 font-medium" : "text-white/75 font-medium"}>Avg landing cost</span>
            <span className={isDarkMode ? "bg-[#1c2e63] text-blue-200 border border-blue-500/30 text-[11px] font-bold px-3 py-0.5 rounded-md" : "bg-[#1D4ED8]/40 text-blue-100 border border-[#1D4ED8]/60 text-[11px] font-bold px-3 py-0.5 rounded-md shadow-xs"}>
              Standard
            </span>
          </div>
        </div>
      </div>

      <div className="mt-12 mb-20 px-1">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-3">
              <Watch className="text-teal-500" size={28} />
              Purchase History
            </h3>
            <p className="text-sm text-slate-500 mt-1 font-medium italic opacity-70">Review and audit all past import transactions</p>
          </div>
          <div className="retro-input-wrapper !w-full md:!w-80 !p-1 group">
            <input 
              type="text" 
              placeholder="Search by product name..." 
              className="retro-input !pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-teal-500 transition-colors">
              🔍
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map(t => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                key={t.id} 
                className="retro-modal !w-full !max-w-none !m-0 !relative overflow-hidden shadow-2xl border-2 border-slate-200/50 dark:border-slate-800/50"
              >
                <div className="retro-modal-header !py-3 !px-6 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-teal-500/10 dark:bg-teal-500/20 rounded-xl flex items-center justify-center border border-teal-500/20">
                      <Sparkles size={20} className="text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-800 dark:text-slate-100 leading-tight">
                        {t.product_name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Calendar size={12} className="text-slate-400" />
                        <span className="text-[11px] font-mono font-bold text-slate-500 tracking-tighter">
                          {new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                        <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{t.id.slice(0, 8)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {(t as any).invoice_file_data && (
                      <button 
                        className="py-1 px-3 bg-teal-500/10 dark:bg-teal-500/20 hover:bg-teal-500/20 dark:hover:bg-teal-500/35 border border-teal-500/30 text-teal-600 dark:text-teal-400 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 focus:outline-none cursor-pointer"
                        onClick={() => openPreviewInvoice(t)}
                        title="View Uploaded Invoice"
                      >
                        <FileText size={14} />
                        <span>Invoice File View</span>
                      </button>
                    )}
                    <button 
                      className={`py-1 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 focus:outline-none cursor-pointer duration-200 border ${
                        deletingId === t.id 
                          ? 'bg-red-600 border-red-600 text-white dark:bg-red-700 dark:border-red-700 hover:bg-red-700 dark:hover:bg-red-800 shadow-md animate-pulse scale-105'
                          : 'bg-rose-500/10 hover:bg-rose-500/20 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 border border-rose-500/35 dark:border-rose-950/50 text-rose-600 dark:text-rose-400'
                      }`}
                      onClick={() => handleDeleteTransaction(t)}
                      title={deletingId === t.id ? "Click again to confirm immediate deletion" : "Delete Entry"}
                    >
                      <Trash2 size={14} className={deletingId === t.id ? 'animate-bounce' : ''} />
                      <span>{deletingId === t.id ? "Confirm Delete?" : "Delete"}</span>
                    </button>
                    <span className="badge badge-info !py-1 !px-4 !text-[10px] !font-black uppercase tracking-widest shadow-sm">Completed</span>
                  </div>
                </div>
                
                <div className="retro-modal-body !p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6">
                    <div className="retro-form-group mb-0">
                      <label className="text-[11px] uppercase tracking-widest font-black opacity-50 flex items-center gap-1.5">
                        <Truck size={12} /> Supplier
                      </label>
                      <div className="retro-input-display !py-2.5 !px-4 text-sm !min-h-0 bg-opacity-40 border-dashed font-semibold">
                        {t.supplier || 'Direct Import'}
                      </div>
                    </div>
                    <div className="retro-form-group mb-0">
                      <label className="text-[11px] uppercase tracking-widest font-black opacity-50 flex items-center gap-1.5">
                         <Sparkles size={12} /> Quantity
                      </label>
                      <div className="retro-input-display !py-2.5 !px-4 text-sm !min-h-0 bg-opacity-40 border-dashed font-mono font-bold">
                        {t.quantity.toLocaleString()} UNITS
                      </div>
                    </div>
                    <div className="retro-form-group mb-0">
                      <label className="text-[11px] uppercase tracking-widest font-black opacity-50 flex items-center gap-1.5">
                        <CreditCard size={12} /> Payment
                      </label>
                      <div className="retro-input-display !py-2.5 !px-4 text-sm !min-h-0 bg-opacity-40 border-dashed flex items-center gap-2 font-semibold">
                        {t.payment_method === 'Cash' && <DollarSign size={14} className="text-emerald-500" />}
                        {t.payment_method === 'Bank' && <CreditCard size={14} className="text-blue-500" />}
                        {t.payment_method === 'LC' && <FileText size={14} className="text-amber-500" />}
                        {t.payment_method || 'Cash'}
                      </div>
                    </div>
                    <div className="retro-form-group mb-0">
                      <label className="text-[11px] uppercase tracking-widest font-black opacity-50 flex items-center gap-1.5">
                        <AlertCircle size={12} /> Expiry Status
                      </label>
                      <div className={`retro-input-display !py-2.5 !px-4 text-sm !min-h-0 bg-opacity-40 border-dashed font-semibold ${t.expiry_date ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
                        {t.expiry_date ? new Date(t.expiry_date).toLocaleDateString('en-GB') : 'NOT APPLICABLE'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 retro-calc-box !p-5 shadow-inner border-2">
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center">
                        <div className="space-y-1">
                          <div className="text-[10px] font-black opacity-40 uppercase tracking-tighter">Purchase Price</div>
                          <div className="text-base font-mono font-bold text-slate-700 dark:text-slate-300">
                             {settings.currency}{t.unit_price.toLocaleString()}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[10px] font-black opacity-40 uppercase tracking-tighter">Landing Cost/Unit</div>
                          <div className="text-base font-mono text-emerald-600 dark:text-emerald-400 font-black">
                             {settings.currency}{Math.round(t.total_price / (t.quantity || 1)).toLocaleString()}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[10px] font-black opacity-40 uppercase tracking-tighter">Target Sell Price</div>
                          <div className="text-base font-mono text-blue-600 dark:text-blue-400 font-bold">
                             {settings.currency}{t.sell_price?.toLocaleString() || '0'}
                          </div>
                        </div>
                        <div className="text-right border-l border-slate-200 dark:border-slate-800 pl-6 h-full flex flex-col justify-center">
                          <div className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-1">Total Investment</div>
                          <div className="text-2xl font-mono font-black text-slate-900 dark:text-white leading-none">
                             {settings.currency}{t.total_price.toLocaleString()}
                          </div>
                        </div>
                     </div>
                  </div>
                </div>
                <div className="absolute top-0 right-0 p-1">
                   <div className="w-16 h-16 border-t-2 border-r-2 border-slate-500/10 rounded-tr-3xl absolute -top-1 -right-1 pointer-events-none"></div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="retro-modal !w-full !max-w-none !p-20 text-center opacity-40 flex flex-col items-center gap-4">
               <Watch size={64} className="animate-pulse text-slate-500" />
               <p className="text-xl font-bold italic">No records found matching your search...</p>
            </div>
          )}
        </div>
      </div>

      {showScanner && (
        <BarcodeScanner 
          onScan={handleScan} 
          onClose={() => setShowScanner(false)} 
        />
      )}

      {/* Invoice Preview Modal */}
      <AnimatePresence>
        {previewInvoice && (
          <div className="modal-overlay custom-modal-overlay">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="retro-modal !max-w-4xl !w-[90vw]"
            >
              <div className="retro-modal-header">
                <div className="flex items-center gap-2">
                  <FileText className="text-teal-500" size={20} />
                  <h3 className="text-lg font-bold">Invoice Preview: {previewInvoice.invoice_file_name || previewInvoice.product_name}</h3>
                </div>
                <button className="retro-close-btn" onClick={handleClosePreviewInvoice}><X size={20} /></button>
              </div>
              
              <div className="retro-modal-body custom-scrollbar flex flex-col gap-4" style={{ maxHeight: '70vh' }}>
                <div className="flex flex-wrap items-center gap-2 justify-between bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                  <div className="text-xs text-slate-500 font-medium">
                    File: <span className="font-bold text-slate-700 dark:text-slate-300">{previewInvoice.invoice_file_name || 'invoice.pdf'}</span>
                    {previewInvoice.invoice_file_type && (
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-slate-200/50 dark:bg-slate-800 font-mono text-[10px]">
                        {previewInvoice.invoice_file_type}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {previewInvoiceUrl && (
                      <button 
                        className="py-1.5 px-3 bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold transition-colors" 
                        onClick={() => window.open(previewInvoiceUrl, '_blank')}
                      >
                        Open in New Tab
                      </button>
                    )}
                    <button 
                      className="py-1.5 px-3 bg-teal-500 text-white hover:bg-teal-600 rounded-lg text-xs font-bold transition-colors" 
                      onClick={() => handleDownloadInvoice(previewInvoice)}
                    >
                      Download File
                    </button>
                  </div>
                </div>

                <div 
                  className="flex-1 min-h-[400px] max-h-[550px] bg-slate-50 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center relative p-2"
                >
                  {previewInvoice.invoice_file_type?.includes('image') ? (
                    <img 
                      src={previewInvoiceUrl || previewInvoice.invoice_file_data} 
                      alt={previewInvoice.invoice_file_name} 
                      className="max-w-full max-h-[500px] object-contain rounded-lg shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                  ) : previewInvoice.invoice_file_type?.includes('pdf') ? (
                    <embed 
                      src={`${previewInvoiceUrl}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`} 
                      type="application/pdf"
                      style={{ width: '100%', height: '500px', border: 'none', borderRadius: '8px' }} 
                    />
                  ) : (
                    <div className="text-center p-8">
                      <div className="text-5xl mb-4">📄</div>
                      <p className="text-base font-bold text-slate-700 dark:text-slate-300">Preview not supported</p>
                      <p className="text-xs text-slate-400 mt-1 mb-4">This file type is not supported for direct preview.</p>
                      <button 
                        className="py-2 px-4 bg-teal-500 text-white rounded-lg text-xs font-bold hover:bg-teal-600 transition-colors" 
                        onClick={() => handleDownloadInvoice(previewInvoice)}
                      >
                        Download file to view
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="retro-modal-footer">
                <button className="retro-btn-metallic-silver lg flex-1" onClick={handleClosePreviewInvoice}>Close</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const BuyImport = React.memo(BuyImportComponent);
