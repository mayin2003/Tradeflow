import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useData, deduplicateProducts } from '../context/DataContext';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { motion, AnimatePresence } from 'motion/react';
import { X, QrCode, Camera, Watch, MoreVertical, Package, AlertTriangle, Layers } from 'lucide-react';

const MASTER_CATEGORIES = [
  'Fashion',
  'Electronics',
  'Home',
  'Beauty',
  'Health',
  'Sports',
  'Toys',
  'Automotive',
  'Books',
  'Groceries',
  'Kitchen',
  'Tools',
  'Office',
  'Pets',
  'Travel',
  'Baby',
  'Jewelry',
  'Fitness',
  'Music',
  'Garden'
];

const normalizeCategoryName = (cat: string): string => {
  const norm = (cat || '').trim().toLowerCase();
  
  const matched = MASTER_CATEGORIES.find(c => c.toLowerCase() === norm);
  if (matched) return matched;
  
  if (norm === 'fashion & apparel' || norm === 'fashion and apparel' || norm === 'garments' || norm === 'clothing') return 'Fashion';
  if (norm === 'electronics & gadgets' || norm === 'electronics and gadgets' || norm === 'gadgets' || norm === 'gadget' || norm === 'phone') return 'Electronics';
  if (norm === 'home & kitchen' || norm === 'home and kitchen' || norm === 'furniture' || norm === 'houseware') return 'Home';
  if (norm === 'beauty & personal care' || norm === 'beauty and personal care' || norm === 'makeup' || norm === 'cosmetics') return 'Beauty';
  if (norm === 'health & wellness' || norm === 'health and wellness' || norm === 'medicine' || norm === 'wellness') return 'Health';
  if (norm === 'sports & outdoors' || norm === 'sports and outdoors') return 'Sports';
  if (norm === 'toys & hobbies' || norm === 'toys and hobbies' || norm === 'hobby') return 'Toys';
  if (norm === 'automotive accessories' || norm === 'automotive & accessories' || norm === 'car' || norm === 'vehicle') return 'Automotive';
  if (norm === 'books & stationery' || norm === 'books and stationery' || norm === 'stationery') return 'Books';
  if (norm === 'groceries & gourmet food' || norm === 'groceries and gourmet food' || norm === 'food' || norm === 'beverage' || norm === 'food & beverage') return 'Groceries';
  if (norm === 'cooking' || norm === 'cookware') return 'Kitchen';
  if (norm === 'hardware' || norm === 'tool') return 'Tools';
  if (norm === 'office supplies') return 'Office';
  if (norm === 'pet' || norm === 'pet supplies') return 'Pets';
  if (norm === 'luggage' || norm === 'tour') return 'Travel';
  if (norm === 'infant' || norm === 'toddler') return 'Baby';
  if (norm === 'jewellery' || norm === 'gold' || norm === 'silver') return 'Jewelry';
  if (norm === 'gym' || norm === 'workout' || norm === 'exercise') return 'Fitness';
  if (norm === 'instrument' || norm === 'song') return 'Music';
  if (norm === 'backyard' || norm === 'plants' || norm === 'yard') return 'Garden';
  if (norm === 'others' || norm === 'other') return 'Others';

  return 'Others';
};

const getCategoryIcon = (category: string): string => {
  const norm = category.toLowerCase();
  if (norm.includes('fashion')) return '👔';
  if (norm.includes('electronics')) return '🖥️';
  if (norm.includes('home')) return '🏠';
  if (norm.includes('beauty')) return '💄';
  if (norm.includes('health')) return '🌿';
  if (norm.includes('sports')) return '⚽';
  if (norm.includes('toys')) return '🧸';
  if (norm.includes('automotive')) return '🚗';
  if (norm.includes('books')) return '📚';
  if (norm.includes('groceries')) return '🍉';
  if (norm.includes('kitchen')) return '🍳';
  if (norm.includes('tools')) return '🛠️';
  if (norm.includes('office')) return '🏢';
  if (norm.includes('pets')) return '🐱';
  if (norm.includes('travel')) return '✈️';
  if (norm.includes('baby')) return '👶';
  if (norm.includes('jewelry')) return '💎';
  if (norm.includes('fitness')) return '🏋️';
  if (norm.includes('music')) return '🎵';
  if (norm.includes('garden')) return '🌻';
  return '📦';
};

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
      
      // Handle hyphenation (e.g. t-shirt matching t shirt or tshirt)
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

      // Check singular root forms if plural (e.g. "diapers" matches "diaper")
      if (itemLower.endsWith('s') && itemLower.length > 3) {
        const singular = itemLower.slice(0, -1);
        if (name.includes(singular)) {
          return category;
        }
      }
    }
  }

  // 2. Word-boundary token checking (similar naming patterns)
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

  // 3. Fallback extra generic mapping
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

interface InventoryProps {
  initialTab?: 'products' | 'categories';
}

export const InventoryComponent = ({ initialTab = 'products' }: InventoryProps) => {
  const { products, transactions, addProduct, updateProduct, deleteProduct, settings } = useData();
  const isDarkMode = settings?.theme === 'dark';
  const [showModal, setShowModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    hs_code: '',
    cost_price: 0,
    stock: 0,
    min_stock: 10,
    barcode: '',
    sku: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const dateInputRef = useRef<HTMLInputElement>(null);
  const categoryDetailsRef = useRef<HTMLDivElement>(null);
  const productsTableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedCategory && categoryDetailsRef.current) {
      setTimeout(() => {
        categoryDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [selectedCategory]);

  const formattedDate = useMemo(() => {
    if (!newProduct.date) return 'Select Date';
    return new Date(newProduct.date).toLocaleDateString('en-GB');
  }, [newProduct.date]);

  // Automatically update and classify any Uncategorized products that come from Buy section inputs
  useEffect(() => {
    const uncategorized = products.filter(
      p => !p.category || p.category.trim() === '' || p.category.toLowerCase() === 'uncategorized'
    );
    if (uncategorized.length === 0) return;

    const syncCategories = async () => {
      for (const p of uncategorized) {
        const autoCat = inferCategory(p.name);
        await updateProduct({
          ...p,
          category: autoCat
        });
      }
    };
    syncCategories();
  }, [products, updateProduct]);

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.category) {
      alert("Please provide at least a Product Name and Category");
      return;
    }
    
    const normalizedCategory = normalizeCategoryName(newProduct.category);
    const productPayload = {
      ...newProduct,
      category: normalizedCategory
    };

    if (editingId) {
      const existing = products.find(p => p.id === editingId);
      if (existing) {
        updateProduct({
          ...existing,
          ...productPayload,
          sell_price: productPayload.cost_price * 1.2
        });
      }
    } else {
      addProduct({
        ...productPayload,
        sell_price: productPayload.cost_price * 1.2 // Default markup
      } as any);
    }

    setEditingId(null);
    setShowModal(false);
    setNewProduct({
      name: '',
      category: '',
      hs_code: '',
      cost_price: 0,
      stock: 0,
      min_stock: 10,
      barcode: '',
      sku: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleEdit = (p: any) => {
    setEditingId(p.id);
    
    // Safely extract YYYY-MM-DD for standard <input type="date">
    const getSafeDateStr = (val: any) => {
      if (!val) return new Date().toISOString().split('T')[0];
      try {
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
          return d.toISOString().split('T')[0];
        }
      } catch (_) {}
      return new Date().toISOString().split('T')[0];
    };

    setNewProduct({
      name: p.name,
      category: p.category,
      hs_code: p.hs_code,
      cost_price: p.cost_price,
      stock: p.stock,
      min_stock: p.min_stock,
      barcode: p.barcode || '',
      sku: p.sku || '',
      description: p.description || '',
      date: getSafeDateStr(p.date || p.created_at)
    });
    setShowModal(true);
  };

  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);

  const deduplicatedProducts = useMemo(() => {
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

    return deduplicateProducts(list);
  }, [products, transactions]);

  const activeProducts = useMemo(() => {
    return deduplicatedProducts.filter(p => !(p as any).is_inactive && (p as any).status !== 'inactive');
  }, [deduplicatedProducts]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let base = activeProducts;
    if (selectedCategory) {
      base = base.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase());
    }
    if (!query) return base;
    return base.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      (p.hs_code && p.hs_code.toLowerCase().includes(query)) ||
      (p.barcode && p.barcode.toLowerCase().includes(query)) ||
      (p.sku && p.sku.toLowerCase().includes(query))
    );
  }, [activeProducts, searchQuery, selectedCategory]);

  // Dynamically extract and list low-stock items (Current Stock < 5)
  const lowStockProducts = useMemo(() => {
    return activeProducts.filter(p => Number(p.stock) < 5);
  }, [activeProducts]);

  const lowStockCount = useMemo(() => {
    return lowStockProducts.length;
  }, [lowStockProducts]);

  // Real-time synchronization of Total Products across both products list and active Buy section transactions
  const totalProductsCount = useMemo(() => {
    const uniqueKeys = new Set<string>();
    activeProducts.forEach(p => {
      if (p.name && p.name.trim()) {
        uniqueKeys.add(p.name.trim().toLowerCase());
      }
    });
    transactions.forEach(t => {
      if (t.type === 'purchase') {
        if (t.items && t.items.length > 0) {
          t.items.forEach(item => {
            if (item.product_name && item.product_name.trim()) {
              uniqueKeys.add(item.product_name.trim().toLowerCase());
            }
          });
        } else if (t.product_name && t.product_name.trim()) {
          uniqueKeys.add(t.product_name.trim().toLowerCase());
        }
      }
    });
    return Math.max(activeProducts.length, uniqueKeys.size);
  }, [activeProducts, transactions]);

  // Count active categories (categories containing at least 1 active product)
  const categoryMasterList = useMemo(() => {
    const activeCatsMap = new Map<string, number>();
    activeProducts.forEach(p => {
      const cat = normalizeCategoryName(p.category);
      if (cat && cat.trim().length > 0) {
        activeCatsMap.set(cat, (activeCatsMap.get(cat) || 0) + 1);
      }
    });

    const defaultList = [
      'Fashion',
      'Electronics',
      'Home',
      'Beauty',
      'Health',
      'Sports',
      'Toys',
      'Automotive',
      'Books',
      'Groceries',
      'Kitchen',
      'Tools',
      'Office',
      'Pets',
      'Travel',
      'Baby',
      'Jewelry',
      'Fitness',
      'Music',
      'Garden',
      'Others'
    ];
    
    // Categories with active products only
    const activeList = defaultList.filter(cat => (activeCatsMap.get(cat) || 0) > 0);

    // Fallback for any other custom category found in products
    const customList: string[] = [];
    activeCatsMap.forEach((count, cat) => {
      if (count > 0 && !defaultList.includes(cat)) {
        customList.push(cat);
      }
    });

    return [...activeList, ...customList];
  }, [activeProducts]);

  const activeCategoriesCount = useMemo(() => {
    return categoryMasterList.length;
  }, [categoryMasterList]);

  const categoriesStats = useMemo(() => {
    return {
      totalCategories: activeCategoriesCount,
      totalProducts: totalProductsCount,
      lowStockCount: lowStockCount,
      outOfStockCount: activeProducts.filter(p => Number(p.stock) <= 0).length
    };
  }, [activeCategoriesCount, totalProductsCount, lowStockCount, activeProducts]);

  const stats = useMemo(() => ({
    lowStockCount: lowStockCount,
    productNames: Array.from(new Set(activeProducts.map(p => p.name))),
    categories: Array.from(new Set(activeProducts.map(p => normalizeCategoryName(p.category))))
  }), [activeProducts, lowStockCount]);

  return (
    <div id="page-inventory" className={`page active ${isDarkMode ? 'bg-slate-950 p-6 rounded-[24px] border border-white/5 shadow-2xl' : ''}`}>
      <div className="page-header">
        <div>
          <h2 className={isDarkMode ? 'text-white' : ''}>Product & Inventory</h2>
          <p className={isDarkMode ? 'text-slate-400' : ''}>Manage your product catalog and stock levels</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Product</button>
      </div>

      {/* Sub-navigation Option Bar */}
      <div className={`inventory-tabs-bar ${isDarkMode ? '!bg-slate-900 !border-white/10 !p-1.5' : ''}`}>
        <button
          className={`inventory-tab-btn ${activeTab === 'products' ? 'active' : ''} ${
            isDarkMode 
              ? activeTab === 'products' 
                ? '!bg-slate-800 !text-white !border-white/10 shadow-md' 
                : '!text-slate-400 hover:!text-slate-200 hover:!bg-slate-800/40' 
              : ''
          }`}
          onClick={() => {
            setActiveTab('products');
            setSelectedCategory(null);
          }}
        >
          📦 All Products
        </button>
        <button
          className={`inventory-tab-btn ${activeTab === 'categories' ? 'active' : ''} ${
            isDarkMode 
              ? activeTab === 'categories' 
                ? '!bg-slate-800 !text-white !border-white/10 shadow-md' 
                : '!text-slate-400 hover:!text-slate-200 hover:!bg-slate-800/40' 
              : ''
          }`}
          onClick={() => {
            setActiveTab('categories');
            setSelectedCategory(null);
          }}
        >
          🗂️ Categories
        </button>
      </div>

      {activeTab === 'products' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-6 mb-6">
            {/* KPI 2: LOW STOCK ALERTS */}
            <div 
              className={isDarkMode 
                ? "bg-gradient-to-b from-[#0d163d] via-[#09102f] to-[#060a21] border border-[#1b2756] text-white rounded-[20px] p-5 shadow-lg flex flex-col justify-between h-[162px] hover:border-[#2b3c7d] transition-all group" 
                : "border border-white/10 text-white rounded-[20px] p-5 shadow-[0_10px_20px_rgba(15,23,42,0.08),0_20px_40px_rgba(37,99,235,0.12),0_30px_60px_rgba(37,99,235,0.08)] hover:shadow-[0_16px_32px_rgba(15,23,42,0.12),0_28px_56px_rgba(37,99,235,0.18),0_40px_70px_rgba(37,99,235,0.12)] hover:-translate-y-1 transition-all duration-250 ease-out flex flex-col justify-between h-[162px] group relative overflow-hidden"}
              style={isDarkMode ? undefined : { background: 'radial-gradient(circle at top left, rgba(255, 255, 255, 0.16), transparent 45%), linear-gradient(135deg, #315E9F 0%, #2B5598 45%, #244A8F 100%)' }}
            >
              <div className="flex justify-between items-start w-full relative z-10">
                <div className="flex items-center gap-3">
                  <div className={isDarkMode ? "w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/20" : "w-10 h-10 rounded-xl bg-white/12 border border-white/10 backdrop-blur-md text-white flex items-center justify-center shrink-0 shadow-xs"}>
                    <AlertTriangle size={18} />
                  </div>
                  <span className={isDarkMode ? "text-[11px] font-extrabold uppercase tracking-wider text-slate-200" : "text-[11px] font-bold uppercase tracking-wider text-white/90"}>LOW STOCK ALERTS</span>
                </div>
                <MoreVertical size={16} className={isDarkMode ? "text-slate-400 hover:text-white cursor-pointer transition-colors" : "text-white/60 hover:text-white cursor-pointer transition-colors"} />
              </div>
              <div className="text-[28px] font-bold tracking-tight text-white font-sans leading-none my-1 relative z-10">
                {stats.lowStockCount}
              </div>
              <div className="flex items-center justify-between pt-2.5 border-t border-white/10 text-[11px] relative z-10">
                <span className={isDarkMode ? "text-slate-300 font-medium" : "text-white/75 font-medium"}>Critical items threshold</span>
                <span className={isDarkMode ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-bold px-3 py-0.5 rounded-md" : "bg-[#B91C1C]/40 text-rose-100 border border-[#B91C1C]/60 text-[11px] font-bold px-3 py-0.5 rounded-md shadow-xs"}>
                  {stats.lowStockCount} Items
                </span>
              </div>
            </div>

            {/* KPI 3: CATEGORIES */}
            <div 
              onClick={() => setActiveTab('categories')}
              className={isDarkMode 
                ? "bg-gradient-to-b from-[#0d163d] via-[#09102f] to-[#060a21] border border-[#1b2756] text-white rounded-[20px] p-5 shadow-lg flex flex-col justify-between h-[162px] hover:border-[#2b3c7d] transition-all group cursor-pointer" 
                : "border border-white/10 text-white rounded-[20px] p-5 shadow-[0_10px_20px_rgba(15,23,42,0.08),0_20px_40px_rgba(37,99,235,0.12),0_30px_60px_rgba(37,99,235,0.08)] hover:shadow-[0_16px_32px_rgba(15,23,42,0.12),0_28px_56px_rgba(37,99,235,0.18),0_40px_70px_rgba(37,99,235,0.12)] hover:-translate-y-1 transition-all duration-250 ease-out flex flex-col justify-between h-[162px] group relative overflow-hidden cursor-pointer"}
              style={isDarkMode ? undefined : { background: 'radial-gradient(circle at top left, rgba(255, 255, 255, 0.16), transparent 45%), linear-gradient(135deg, #315E9F 0%, #2B5598 45%, #244A8F 100%)' }}
              title="Click to view categories"
            >
              <div className="flex justify-between items-start w-full relative z-10">
                <div className="flex items-center gap-3">
                  <div className={isDarkMode ? "w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 border border-purple-400/20" : "w-10 h-10 rounded-xl bg-white/12 border border-white/10 backdrop-blur-md text-white flex items-center justify-center shrink-0 shadow-xs"}>
                    <Layers size={18} />
                  </div>
                  <span className={isDarkMode ? "text-[11px] font-extrabold uppercase tracking-wider text-slate-200" : "text-[11px] font-bold uppercase tracking-wider text-white/90"}>CATEGORIES</span>
                </div>
                <MoreVertical size={16} className={isDarkMode ? "text-slate-400 hover:text-white cursor-pointer transition-colors" : "text-white/60 hover:text-white cursor-pointer transition-colors"} />
              </div>
              <div className="text-[28px] font-bold tracking-tight text-white font-sans leading-none my-1 relative z-10">
                {activeCategoriesCount}
              </div>
              <div className="flex items-center justify-between pt-2.5 border-t border-white/10 text-[11px] relative z-10">
                <span className={isDarkMode ? "text-slate-300 font-medium" : "text-white/75 font-medium"}>Product categories</span>
                <span className={isDarkMode ? "bg-[#1c2e63] text-blue-200 border border-blue-500/30 text-[11px] font-bold px-3 py-0.5 rounded-md" : "bg-[#1D4ED8]/40 text-blue-100 border border-[#1D4ED8]/60 text-[11px] font-bold px-3 py-0.5 rounded-md shadow-xs"}>
                  Active
                </span>
              </div>
            </div>
          </div>

          {lowStockProducts.length > 0 && (
            <div className="low-stock-alert-container mb-6">
              <div className="low-stock-header-bar">
                <div className="low-stock-indicator">
                  <div className="low-stock-pulse-ring"></div>
                  <span className="low-stock-icon">⚠️</span>
                </div>
                <div>
                  <h3 className="low-stock-title">Low Stock Alerts</h3>
                  <p className="low-stock-subtitle">
                    The following products have a critical stock level of <strong className="font-semibold text-rose-600 dark:text-rose-400">less than 5 units</strong>.
                  </p>
                </div>
              </div>
              <div className="low-stock-grid-wrapper">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {lowStockProducts.map(p => (
                    <div key={p.id} className="low-stock-product-card">
                      <div className="flex flex-col gap-1">
                        <span className="low-stock-product-name">{p.name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="low-stock-product-category-icon">{getCategoryIcon(p.category)}</span>
                          <span className="low-stock-product-category">{p.category}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className={`low-stock-badge ${p.stock === 0 ? 'out-of-stock' : 'very-low'}`}>
                          {p.stock === 0 ? '0 units' : `${p.stock} units`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="table-card" ref={productsTableRef}>
            <div className="table-toolbar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, flexWrap: 'wrap' }}>
                <div style={{ background: 'var(--accent)', width: '4px', height: '16px', borderRadius: '2px' }}></div>
                <h3 style={{ margin: 0 }}>
                  {selectedCategory ? `Products in "${selectedCategory}"` : 'All Products'}
                </h3>
                {selectedCategory && (
                  <button 
                    onClick={() => setSelectedCategory(null)}
                    className="text-xs bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 px-2.5 py-1 rounded-lg border border-blue-400/30 transition-all cursor-pointer font-medium"
                    title="Show all products"
                  >
                    Show All Products ✕
                  </button>
                )}
              </div>
              <div className="search-input">
                <span style={{ opacity: 0.5 }}>🔍</span>
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="table-wrapper">
              <table style={{ background: 'transparent' }}>
                <thead>
                  <tr>
                    <th style={{ paddingLeft: '24px' }}>Product Details</th>
                    <th>Category</th>
                    <th>HS Code / Barcode</th>
                    <th>Current Stock</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right', paddingRight: '24px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length > 0 ? filteredProducts.map(p => (
                    <tr key={p.id}>
                      <td style={{ paddingLeft: '24px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '15px' }}>{p.name}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ID: {p.id.slice(0, 8)}</span>
                        </div>
                      </td>
                      <td>
                        <span className="inventory-table-category">
                          {p.category}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 500 }}>HS: {p.hs_code || 'N/A'}</span>
                          <code className="inventory-table-barcode">
                            {p.barcode || 'Empty'}
                          </code>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'monospace' }}>
                          {p.stock.toLocaleString()}
                        </span>
                      </td>
                      <td>
                        {p.stock <= p.min_stock ? (
                          <span className="badge badge-danger" style={{ fontWeight: 700 }}>⚠ Low</span>
                        ) : (
                          <span className="badge badge-success" style={{ fontWeight: 700 }}>✓ OK</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button className="btn btn-sm btn-outline" onClick={() => handleEdit(p)}>Edit</button>
                          <button className="btn btn-sm btn-danger" onClick={() => deleteProduct(p.id, p.name)}>Del</button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        <div className="flex flex-col items-center justify-center gap-2">
                          <p>
                            {searchQuery 
                              ? `No products matching "${searchQuery}"${selectedCategory ? ` in category "${selectedCategory}"` : ''}` 
                              : selectedCategory 
                                ? `No products found in category "${selectedCategory}"`
                                : 'No products available'
                            }
                          </p>
                          {(searchQuery || selectedCategory) && (
                            <button
                              onClick={() => {
                                setSearchQuery('');
                                setSelectedCategory(null);
                              }}
                              className="text-xs text-blue-500 hover:underline font-semibold cursor-pointer"
                            >
                              Clear filters to view all products
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Configuration toolbar for Low Stock Threshold */}
          <div className={`flex flex-wrap items-center justify-between gap-4 p-5 mb-6 rounded-2xl border transition-all duration-200 select-none ${
            isDarkMode 
              ? 'bg-slate-800 border-white/10 shadow-xl text-white' 
              : 'border-slate-200/60 bg-gradient-to-r from-white to-slate-50/50 shadow-[0_4px_20px_rgba(0,0,0,0.01)]'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                isDarkMode ? 'bg-slate-700 text-white' : 'bg-blue-50 text-slate-600'
              }`}>
                ⚙️
              </div>
              <div>
                <span className={`font-extrabold text-sm ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Category Calculation Settings</span>
                <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Configure thresholds for real-time inventory diagnostics</p>
              </div>
            </div>
            <div className={`flex items-center gap-3 p-2 rounded-xl border ${
              isDarkMode ? 'bg-slate-900/50 border-white/5' : 'bg-slate-50/60 border-slate-100'
            }`}>
              <label htmlFor="low-stock-threshold-input-tab" className={`text-xs font-bold px-1 ${
                isDarkMode ? 'text-slate-300' : 'text-slate-600'
              }`}>
                Low Stock Warning:
              </label>
              <div className="relative rounded-lg w-20">
                <input
                  id="low-stock-threshold-input-tab"
                  type="number"
                  min="1"
                  max="100"
                  value={lowStockThreshold}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val >= 1) {
                      setLowStockThreshold(val);
                    }
                  }}
                  className={`w-full text-center py-1 rounded-lg text-sm font-black focus:outline-none focus:ring-1 transition-all duration-150 ${
                    isDarkMode 
                      ? 'border border-white/10 bg-slate-700 text-white focus:ring-blue-500' 
                      : 'border border-slate-200 bg-white text-slate-800 focus:ring-blue-500'
                  }`}
                />
              </div>
            </div>
          </div>



          {/* Clean Category Cards */}
          {categoryMasterList.length === 0 ? (
            <div className={`p-8 text-center rounded-[20px] border mb-6 ${isDarkMode ? 'bg-[#1E293B] border-white/10 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>
              No active categories found. Add products to populate categories.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
              {categoryMasterList.map((cat, index) => {
              const catProducts = deduplicatedProducts.filter(p => normalizeCategoryName(p.category) === cat);
              const totalInventoryQuantity = catProducts.reduce((sum, p) => sum + Math.max(0, p.stock), 0);
              
              const isSelected = selectedCategory === cat;
              
              const cardClassName = isDarkMode
                ? (isSelected
                    ? "group relative overflow-hidden p-6 rounded-[22px] transition-all duration-300 ease-out cursor-pointer border bg-[#1E293B] border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.25)] ring-1 ring-blue-500/30 scale-[1.02]"
                    : "group relative overflow-hidden p-6 rounded-[22px] transition-all duration-300 ease-out cursor-pointer border border-white/10 bg-[#1E293B] shadow-[0_10px_35px_rgba(0,0,0,0.3)] hover:-translate-y-1.5 hover:border-blue-500/40 hover:shadow-[0_15px_35px_rgba(0,0,0,0.45),_0_0_20px_rgba(59,130,246,0.15)] hover:bg-[#233147]")
                : (isSelected
                    ? "group relative overflow-hidden p-6 rounded-[20px] transition-all duration-200 ease-out cursor-pointer border bg-blue-50/60 border-blue-500 shadow-lg shadow-blue-500/20 scale-[1.01]"
                    : "group relative overflow-hidden p-6 rounded-[20px] transition-all duration-200 ease-out cursor-pointer border border-slate-200/50 bg-white shadow-lg hover:shadow-lg hover:-translate-y-1 hover:border-blue-400 hover:brightness-110");

              const iconContainerClass = isDarkMode
                ? (isSelected
                    ? 'bg-blue-600/30 text-blue-400 ring-2 ring-blue-400/30 scale-110 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                    : 'bg-[#0f172a] text-slate-300 border border-white/5 shadow-inner group-hover:text-blue-400 group-hover:border-blue-500/30 group-hover:bg-[#1e293b] group-hover:scale-110 group-hover:shadow-[0_0_12px_rgba(59,130,246,0.2)]')
                : (isSelected
                    ? 'bg-blue-100 text-blue-600 scale-105'
                    : 'bg-slate-50 text-slate-500 group-hover:scale-105 group-hover:brightness-110');

              const badgeClass = isDarkMode
                ? (isSelected
                    ? 'bg-blue-600 text-white font-bold border border-blue-400/30 shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                    : 'bg-[#0f172a] text-slate-400 border border-white/10 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-400/20 group-hover:shadow-[0_0_10px_rgba(59,130,246,0.3)]')
                : (isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                    : 'bg-slate-50 text-slate-500 group-hover:bg-blue-50/50');

              const titleClass = isDarkMode
                ? 'text-lg font-bold text-white !text-white tracking-tight select-none m-0 group-hover:text-blue-200 transition-colors'
                : 'text-lg font-semibold text-slate-800 select-none m-0';

              const quantityClass = isDarkMode
                ? `text-2xl font-black select-none m-0 text-blue-400 !text-blue-400 transition-all ${isSelected ? 'drop-shadow-[0_0_10px_rgba(96,165,250,0.6)] scale-105 origin-left' : ''}`
                : 'text-2xl font-black select-none m-0 text-blue-600 transition-colors';

              return (
                <motion.div
                  key={cat}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.015, ease: "easeOut" }}
                  onClick={() => setSelectedCategory(isSelected ? null : cat)}
                  className={cardClassName}
                >
                  {isDarkMode && (
                    <>
                      <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all duration-500 pointer-events-none" />
                      <div className="absolute -left-8 -top-8 w-20 h-20 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-[#3b82f6]/10 transition-all duration-500 pointer-events-none" />
                    </>
                  )}
                  <div className="w-full flex flex-col justify-between h-full relative z-10">
                    <div className="flex justify-between items-center mb-4 w-full">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl transition-all duration-200 select-none ${iconContainerClass}`}>
                        {getCategoryIcon(cat)}
                      </div>
                      <span 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCategory(cat);
                        }}
                        className={`text-[10px] font-extrabold tracking-wider px-2.5 py-1.5 rounded-xl uppercase transition-all duration-200 cursor-pointer ${badgeClass}`}
                      >
                        {isSelected ? 'Selected' : 'View Products'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className={titleClass}>
                        {cat}
                      </h4>
                      <p 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCategory(cat);
                        }}
                        className={`${quantityClass} cursor-pointer hover:opacity-90 flex items-center gap-1.5`}
                        title={`Click to view ${cat} product details`}
                      >
                        <span>{catProducts.length} {catProducts.length === 1 ? 'Product' : 'Products'}</span>
                        <span className="text-xs font-normal opacity-75">({totalInventoryQuantity} units)</span>
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          )}

          {/* Category Details View */}
          <AnimatePresence mode="wait">
            {selectedCategory && (
              <motion.div 
                ref={categoryDetailsRef}
                key={selectedCategory}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={`table-card mt-6 overflow-hidden rounded-[20px] border shadow-2xl transition-all duration-200 ${
                  isDarkMode 
                    ? 'border-white/15 bg-slate-800 text-white shadow-black/40' 
                    : 'border-slate-200/80 bg-white shadow-slate-100/30'
                }`}
              >
                <div className={`table-toolbar inventory-table-toolbar flex justify-between items-center p-5 border-b ${
                  isDarkMode ? 'border-white/10 bg-slate-900/40' : 'border-slate-100 bg-slate-50/50'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-2xl select-none ${
                      isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/5 text-blue-600'
                    }`}>
                      {getCategoryIcon(selectedCategory)}
                    </div>
                    <div>
                      <h3 className={`text-sm font-black flex items-center gap-2 m-0 leading-none ${
                        isDarkMode ? 'text-white' : 'text-slate-800'
                      }`}>
                        <span>{selectedCategory} Products</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          isDarkMode 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-blue-500/10 text-blue-600 border-blue-500/10'
                        }`}>
                          {deduplicatedProducts.filter(p => normalizeCategoryName(p.category) === selectedCategory).length} items
                        </span>
                      </h3>
                      <p className={`text-[11px] mt-1 mb-0 leading-none ${
                        isDarkMode ? 'text-slate-300' : 'text-slate-400'
                      }`}>Live stock status and unit pricing for this department</p>
                    </div>
                  </div>
                  <button
                    className={`flex items-center gap-1.5 px-3.5 py-2 border rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 font-bold text-xs cursor-pointer select-none ${
                      isDarkMode 
                        ? 'border-white/10 bg-slate-700 text-white hover:text-rose-400 hover:border-rose-500/30 hover:bg-slate-600 hover:shadow-lg hover:shadow-rose-500/10' 
                        : 'border-slate-200 bg-white text-slate-600 hover:text-rose-500 hover:border-rose-200 hover:shadow-lg hover:shadow-rose-500/5'
                    }`}
                    onClick={() => setSelectedCategory(null)}
                  >
                    <X size={14} className="text-current" />
                    <span>Close Details</span>
                  </button>
                </div>
                <div className="table-wrapper">
                  <table style={{ background: 'transparent' }} className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <th style={{ paddingLeft: '24px' }}>Product Name</th>
                        <th>SKU</th>
                        <th>Current Stock</th>
                        <th>Purchase Price</th>
                        <th>Selling Price</th>
                        <th style={{ textAlign: 'center', paddingRight: '24px' }}>Current Stock Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const categorySpecificProducts = deduplicatedProducts.filter(p => normalizeCategoryName(p.category) === selectedCategory);
                        return categorySpecificProducts.length > 0 ? (
                          categorySpecificProducts.map(p => {
                            const badges: React.ReactNode[] = [];
                            if (p.stock > 1) {
                              badges.push(
                                <span key="instock" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100/10">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                  In Stock
                                </span>
                              );
                            }
                            if (p.stock <= 1) {
                              badges.push(
                                <span key="lowstock" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-100/10">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                  Low Stock (⚠)
                                </span>
                              );
                            }
                            if (p.stock <= 0) {
                              badges.push(
                                <span key="outofstock" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-100/10">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                  Out of Stock
                                </span>
                              );
                            }
                            
                            const statusBadge = (
                              <div className="flex flex-wrap items-center justify-center gap-1.5">
                                {badges}
                              </div>
                            );

                            return (
                              <tr key={p.id}>
                                <td style={{ paddingLeft: '24px' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '15px' }}>{p.name}</span>
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ID: {p.id.slice(0, 8)}</span>
                                  </div>
                                </td>
                                <td>
                                  <span className="inventory-table-sku">
                                    {p.sku || 'N/A'}
                                  </span>
                                </td>
                                <td>
                                  <span style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'monospace' }}>
                                    {p.stock.toLocaleString()}
                                  </span>
                                </td>
                                <td>
                                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                    {p.cost_price?.toFixed(2) || '0.00'} BDT
                                  </span>
                                </td>
                                <td>
                                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                    {p.sell_price?.toFixed(2) || '0.00'} BDT
                                  </span>
                                </td>
                                <td style={{ textAlign: 'center', paddingRight: '24px' }}>
                                  {statusBadge}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                              No products found in "{selectedCategory}"
                            </td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay custom-modal-overlay">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="retro-modal"
            >
              <div className="retro-modal-header">
                <h3>{editingId ? 'Edit Product' : 'Add Product'}</h3>
                <button className="retro-close-btn" onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                }}>
                  <X size={20} />
                </button>
              </div>
              
              <div className="retro-modal-body custom-scrollbar">
                {/* Product Name Row */}
                <div className="retro-form-row">
                  <div className="retro-form-group full-width">
                    <label>Product Name / Item *</label>
                    <div className="retro-input-wrapper">
                      <input 
                        type="text" 
                        list="product-names"
                        className="retro-input"
                        value={newProduct.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          const detected = inferCategory(val);
                          setNewProduct({
                            ...newProduct,
                            name: val,
                            category: detected
                          });
                        }}
                        placeholder="e.g. Samsung LED TV 55" 
                      />
                    </div>
                    <datalist id="product-names">
                      {stats.productNames.map(name => <option key={name} value={name} />)}
                      <option value="Others" />
                    </datalist>
                  </div>
                </div>

                {/* Scan Barcode Section Container */}
                <div className="retro-section-container">
                  <div className="retro-form-row">
                    <div className="retro-form-group no-label-margin">
                      <label>Scan Barcode</label>
                      <div className="qr-scan-area">
                        <div className="qr-preview-box">
                          <QrCode size={32} className="qr-icon-dim" />
                          <div className="qr-focus-corners"></div>
                          <div className="qr-scan-line"></div>
                        </div>
                        <button 
                          className="retro-btn-metallic-teal scan-btn"
                          type="button"
                          onClick={() => setShowScanner(true)}
                        >
                          <Camera size={18} />
                          <span>Scan Barcode</span>
                        </button>
                      </div>
                    </div>
                    
                    <div className="retro-form-group">
                      <label>Barcode</label>
                      <div className="retro-input-wrapper">
                        <input 
                          type="text" 
                          className="retro-input"
                          value={newProduct.barcode}
                          onChange={(e) => setNewProduct({...newProduct, barcode: e.target.value})}
                          placeholder="SCAN ME" 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Date Row */}
                <div className="retro-form-row">
                  <div className="retro-form-group">
                    <label>Date *</label>
                    <div className="retro-input-wrapper with-icon cursor-pointer group relative overflow-hidden" 
                         onClick={() => dateInputRef.current?.showPicker?.()}>
                      <input 
                        ref={dateInputRef}
                        type="date" 
                        className="retro-input-hidden"
                        value={newProduct.date}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) setNewProduct({...newProduct, date: val});
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="retro-input-display group-hover:border-blue-400 transition-colors duration-100 relative z-0 pointer-events-none">
                        {formattedDate}
                      </div>
                      <div className="retro-input-icon group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors duration-100 z-0 pointer-events-none">
                        <Watch size={18} className="text-slate-700 dark:text-slate-300 group-hover:text-blue-500 transition-colors duration-100" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category & SKU Row */}
                <div className="retro-form-row">
                  <div className="retro-form-group">
                    <label>Category (Item Type) *</label>
                    <div className="retro-input-wrapper">
                      <input 
                        type="text"
                        list="category-list"
                        className="retro-input"
                        value={newProduct.category}
                        onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                        placeholder="Select or type category"
                      />
                    </div>
                    <datalist id="category-list">
                      <option value="Fashion" />
                      <option value="Electronics" />
                      <option value="Home" />
                      <option value="Beauty" />
                      <option value="Health" />
                      <option value="Sports" />
                      <option value="Toys" />
                      <option value="Automotive" />
                      <option value="Books" />
                      <option value="Groceries" />
                      <option value="Kitchen" />
                      <option value="Tools" />
                      <option value="Office" />
                      <option value="Pets" />
                      <option value="Travel" />
                      <option value="Baby" />
                      <option value="Jewelry" />
                      <option value="Fitness" />
                      <option value="Music" />
                      <option value="Garden" />
                      <option value="Others" />
                      {stats.categories.map(cat => <option key={cat} value={cat} />)}
                    </datalist>
                  </div>
                  <div className="retro-form-group">
                    <label>SKU Code</label>
                    <div className="retro-input-wrapper">
                      <input 
                        type="text" 
                        className="retro-input"
                        value={newProduct.sku}
                        onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                        placeholder="e.g. ELEC-SAMP-12" 
                      />
                    </div>
                  </div>
                </div>

                {/* HS Code & Cost Price Row */}
                <div className="retro-form-row">
                  <div className="retro-form-group">
                    <label>HS Code</label>
                    <div className="retro-input-wrapper">
                      <input 
                        type="text" 
                        className="retro-input"
                        value={newProduct.hs_code}
                        onChange={(e) => setNewProduct({...newProduct, hs_code: e.target.value})}
                        placeholder="8528.72" 
                      />
                    </div>
                  </div>
                  <div className="retro-form-group">
                    <label>Cost Price (BDT)</label>
                    <div className="retro-input-wrapper">
                      <input 
                        type="number" 
                        className="retro-input"
                        value={newProduct.cost_price}
                        onChange={(e) => setNewProduct({...newProduct, cost_price: +e.target.value})}
                        placeholder="0.00" 
                      />
                    </div>
                  </div>
                </div>

                {/* Quantity & Min Stock Alert Row */}
                <div className="retro-form-row">
                  <div className="retro-form-group">
                    <label>Quantity</label>
                    <div className="retro-input-wrapper">
                      <input 
                        type="number" 
                        className="retro-input"
                        value={newProduct.stock}
                        onChange={(e) => setNewProduct({...newProduct, stock: +e.target.value})}
                        placeholder="0" 
                      />
                    </div>
                  </div>
                  <div className="retro-form-group">
                    <label>Min Stock Alert</label>
                    <div className="retro-input-wrapper">
                      <input 
                        type="number" 
                        className="retro-input"
                        value={newProduct.min_stock}
                        onChange={(e) => setNewProduct({...newProduct, min_stock: +e.target.value})}
                        placeholder="10" 
                      />
                    </div>
                  </div>
                </div>

                {/* Description Row */}
                <div className="retro-form-row">
                  <div className="retro-form-group full-width">
                    <label>Description</label>
                    <div className="retro-input-wrapper">
                      <textarea 
                        className="retro-input min-h-[80px] py-2"
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                        rows={2} 
                        placeholder="Brief product description..."
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>

              <div className="retro-modal-footer">
                <button className="retro-btn-metallic-silver lg" onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                }}>Cancel</button>
                <button className="retro-btn-metallic-teal lg flex-1" onClick={handleAddProduct}>
                  <span>{editingId ? 'Save Changes' : 'Add Product'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {showScanner && (
        <BarcodeScanner onScan={(text) => setNewProduct({...newProduct, barcode: text})} onClose={() => setShowScanner(false)} />
      )}
    </div>
  );
};

export const Inventory = React.memo(InventoryComponent);
