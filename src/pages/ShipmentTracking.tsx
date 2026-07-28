import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';

interface Shipment {
  id: string;
  carrier: string;
  vessel: string;
  origin: string;
  destination: string;
  goods: string;
  estArrival: string;
  activeStep: number; // 0 to 4
  value: number;
  hs_code: string;
  lastUpdate: string;
  routeCode: string;
}

interface HSCodeItem {
  code: string;
  name: string;
  origin: string;
  basicDuty: number; // decimal percent
  regulatoryDuty: number; // decimal percent
  vat: number; // decimal percent
}

const mockHSCodeDirectory: HSCodeItem[] = [
  { code: '8471.30.10', name: 'Automatic Data Processing Machines (Laptops, Tablets, PCs)', origin: 'Shenzhen (SZX)', basicDuty: 0.15, regulatoryDuty: 0.03, vat: 0.15 },
  { code: '6109.10.00', name: 'Knitted Cotton T-Shirts, Apparel & Apparel Accessories', origin: 'Dhaka (DAC)', basicDuty: 0.25, regulatoryDuty: 0.05, vat: 0.15 },
  { code: '8541.43.00', name: 'Photovoltaic Solar Cells & Energy Conversion Panels', origin: 'Munich (MUC)', basicDuty: 0.05, regulatoryDuty: 0.00, vat: 0.05 },
  { code: '3004.90.99', name: 'Therapeutic Pharmaceutical Medicaments & Vaccines', origin: 'Basel (BSL)', basicDuty: 0.10, regulatoryDuty: 0.02, vat: 0.15 },
  { code: '8703.23.19', name: 'Passenger Motor Cars (Reciprocating Piston, 1500cc-3000cc)', origin: 'Nagoya (NGO)', basicDuty: 0.30, regulatoryDuty: 0.10, vat: 0.15 },
  { code: '8517.13.00', name: 'Smartphones and Wireless Network Handsets', origin: 'Seoul (ICN)', basicDuty: 0.12, regulatoryDuty: 0.02, vat: 0.15 },
  { code: '6907.21.00', name: 'Glazed Ceramic Flags & Paving Tiles', origin: 'Foshan (CAN)', basicDuty: 0.20, regulatoryDuty: 0.04, vat: 0.15 },
  { code: '2101.11.00', name: 'Extracts, Essences & Concentrates of Roasted Coffee Beans', origin: 'Santos (SSZ)', basicDuty: 0.10, regulatoryDuty: 0.03, vat: 0.15 },
];

const mockShipments: Shipment[] = [
  {
    id: 'TF-88209',
    carrier: 'Maersk Line CO.',
    vessel: 'Maersk Mc-Kinney Moller',
    origin: 'Port of Guangzhou (CNCAN)',
    destination: 'Port of Chittagong (BDCGP)',
    goods: '750x Organic Solar Panel Inverters',
    estArrival: 'May 30, 2026',
    activeStep: 2, // In Transit (Ocean Freight)
    value: 42500,
    hs_code: '8541.43.00',
    lastUpdate: 'Vessel departure logged at East China Sea. Moving at 18.4 knots.',
    routeCode: 'GZ-CGP-M4',
  },
  {
    id: 'TF-91047',
    carrier: 'Mediterranean Shipping Co.',
    vessel: 'MSC Amelia',
    origin: 'Port of Shenzhen (CNSZX)',
    destination: 'Port of Los Angeles (USLAX)',
    goods: '1,200x Premium Metal Chassis Towers',
    estArrival: 'Jun 12, 2026',
    activeStep: 1, // Port of Origin
    value: 124000,
    hs_code: '8471.30.10',
    lastUpdate: 'Container loading completed at Terminal 3. Customs cleared for exit.',
    routeCode: 'SZ-LAX-S8',
  },
  {
    id: 'TF-10350',
    carrier: 'CMA CGM Group',
    vessel: 'CMA CGM Antoine de Saint Exupery',
    origin: 'Port of Yokohama (JPYOK)',
    destination: 'Port of Rotterdam (NLRTM)',
    goods: '450x Optical Lenses & Imaging Scopes',
    estArrival: 'May 24, 2026',
    activeStep: 3, // Customs Clearance
    value: 68000,
    hs_code: '3004.90.99',
    lastUpdate: 'Port health and security documentation reviewed. Awaiting duty payment verification.',
    routeCode: 'YK-RTM-C2',
  },
  {
    id: 'TF-11029',
    carrier: 'Hapag-Lloyd AG',
    vessel: 'HK Bremen Express',
    origin: 'Port of Hamburg (DEHAM)',
    destination: 'Port of Chittagong (BDCGP)',
    goods: '2,500x Precision Metal Valves',
    estArrival: 'May 18, 2026',
    activeStep: 4, // Delivered to Warehouse
    value: 31000,
    hs_code: '8703.23.19',
    lastUpdate: 'Delivered at Central Logistics Warehouse Bay 4. Receipt acknowledged.',
    routeCode: 'HB-CGP-H1',
  }
];

function ShipmentTrackingComponent() {
  const { settings, addExpense, addActivityLog } = useData();

  // Active shipment selection states
  const [shipments, setShipments] = useState<Shipment[]>(mockShipments);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>(mockShipments[0].id);

  const activeShipment = useMemo(() => {
    return shipments.find(s => s.id === selectedShipmentId) || shipments[0];
  }, [shipments, selectedShipmentId]);

  // Duty Calculator Search & Calculation states
  const [searchText, setSearchText] = useState<string>('');
  const [selectedHSItem, setSelectedHSItem] = useState<HSCodeItem>(mockHSCodeDirectory[2]); // Photovoltaic code
  const [shipmentValueInput, setShipmentValueInput] = useState<number>(activeShipment.value);

  // Success flash messages for actions
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Active steps info
  const milestones = [
    { title: 'Order Placed', desc: 'SaaS Invoice Raised' },
    { title: 'Port of Origin', desc: 'Secure Port Checking' },
    { title: 'In Transit', desc: 'Ocean Freight Shipping' },
    { title: 'Customs Clearance', desc: 'Tax & Policy Review' },
    { title: 'Delivered', desc: 'Warehouse Bay 4' }
  ];

  // Map active shipment value when active shipment changes
  const handleSelectShipment = (id: string) => {
    setSelectedShipmentId(id);
    const ship = shipments.find(s => s.id === id);
    if (ship) {
      setShipmentValueInput(ship.value);
      // Auto-match corresponding hs-code in calculator directory
      const hsMatch = mockHSCodeDirectory.find(h => h.code === ship.hs_code);
      if (hsMatch) {
         setSelectedHSItem(hsMatch);
      }
    }
  };

  // Step advancement simulator
  const handleStepChange = (toStep: number) => {
    setShipments(prev => prev.map(s => {
      if (s.id === selectedShipmentId) {
        return {
          ...s,
          activeStep: toStep,
          lastUpdate: `Manual state update. Shipment stepped to status: "${milestones[toStep].title}".`
        };
      }
      return s;
    }));
    
    addActivityLog(
      `Shipment ${selectedShipmentId} updated to: ${milestones[toStep].title}`,
      '🌐',
      '#10b981'
    );
  };

  // Search results filtration
  const filteredHSCodes = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return mockHSCodeDirectory.slice(0, 4);
    return mockHSCodeDirectory.filter(item => 
      item.code.includes(query) || item.name.toLowerCase().includes(query)
    );
  }, [searchText]);

  // Custom Duty Calculations
  const calculations = useMemo(() => {
    const value = shipmentValueInput || 0;
    const cdRate = selectedHSItem.basicDuty;
    const rdRate = selectedHSItem.regulatoryDuty;
    const vatRate = selectedHSItem.vat;

    const cdAmount = value * cdRate;
    const rdAmount = value * rdRate;
    const vatBase = value + cdAmount;
    const vatAmount = vatBase * vatRate;
    const totalDuty = cdAmount + rdAmount + vatAmount;
    const landedCost = value + totalDuty;

    return {
      cdAmount,
      rdAmount,
      vatAmount,
      totalDuty,
      landedCost,
    };
  }, [shipmentValueInput, selectedHSItem]);

  // Integration handler to send duty to local expenses ledger
  const handlePostToExpenses = async () => {
    try {
      const expenseTitle = `Customs Duty Payment: Shipment ${activeShipment.id}`;
      await addExpense({
        title: expenseTitle,
        category: 'Customs',
        amount: calculations.totalDuty,
        date: new Date().toISOString().split('T')[0],
        note: `Posted automatically from Shipment Tracking center. HS Code: ${selectedHSItem.code}. Calculated Duty Breakdown -- Basic Duty: ${settings.currency}${calculations.cdAmount.toLocaleString()}, RD: ${settings.currency}${calculations.rdAmount.toLocaleString()}, VAT: ${settings.currency}${calculations.vatAmount.toLocaleString()}.`
      });

      triggerFlash(`Successfully posted duty of ${settings.currency}${Math.round(calculations.totalDuty).toLocaleString()} to system expenses!`);
    } catch (err) {
      console.error(err);
    }
  };

  const triggerFlash = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => {
      setActionSuccess(null);
    }, 4000);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-[#090d16] text-[#e0e7f6] selection:bg-teal-500/20 selection:text-white">
      {/* Decorative background grid and neon mesh elements */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-25">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-cyan-500/10 to-indigo-500/5 blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-emerald-500/10 to-teal-500/5 blur-[90px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        
        {/* Upper Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-[0.25em] mb-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              Global Freight Hub
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white font-sans bg-clip-text bg-gradient-to-r from-white via-white/95 to-slate-400">
              Shipments & Customs Center
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Verify global cargo transit progress, lookup harmonized system codes, and compute duty valuations dynamically.
            </p>
          </div>

          {/* Active Shipment Selector Chips */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-950/40 p-1.5 rounded-2xl border border-white/5">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider px-2.5">
              Shipments:
            </span>
            {shipments.map(s => {
              const active = s.id === selectedShipmentId;
              return (
                <button
                  key={s.id}
                  onClick={() => handleSelectShipment(s.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                    active 
                      ? 'bg-gradient-to-r from-teal-500/20 to-cyan-500/15 border border-teal-500/40 text-teal-300 shadow-[0_0_12px_rgba(20,184,166,0.2)]'
                      : 'border border-transparent text-slate-400 hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  {s.id}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Flash Notice Banner */}
        {actionSuccess && (
          <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 flex items-center justify-between text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-all duration-300 animate-fade-in relative z-50">
            <div className="flex items-center gap-2">
              <span className="text-sm">⚡</span>
              <span>{actionSuccess}</span>
            </div>
            <button className="text-emerald-400 hover:text-white ml-4 text-[10px] uppercase font-black tracking-widest cursor-pointer" onClick={() => setActionSuccess(null)}>
              Dismiss
            </button>
          </div>
        )}

        {/* Custom Screen Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT WIDGET: SHIPMENT MILESTONE TIMELINE (7 COLS) */}
          <div className="lg:col-span-7 flex flex-col space-y-6">
            
            {/* Main Milestone Container */}
            <div className="relative p-6 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
              
              {/* Top premium ambient line light */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-teal-400/30 to-transparent pointer-events-none" />

              {/* Title Header */}
              <div className="flex items-center justify-between pb-5 border-b border-white/5 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border border-teal-500/20 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(20,184,166,0.15)] text-teal-400">
                    🛳️
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                      Active Shipment Tracking
                      <span className="text-[10px] font-mono font-bold bg-[#14b8a6]/10 text-teal-300 px-2 py-0.5 rounded border border-teal-500/20 uppercase tracking-widest">
                        {activeShipment.carrier}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Vessel Route ID: <span className="font-mono text-teal-400">{activeShipment.routeCode}</span></p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400 uppercase font-black tracking-wider">Est. Arrival</div>
                  <div className="text-sm font-bold text-white mt-0.5">{activeShipment.estArrival}</div>
                </div>
              </div>

              {/* ACTIVE SHIPMENT MANIFEST DETAILS SUMMARY */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-white/[0.01] border border-white/5 mb-8 text-xs relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-500/[0.01] to-cyan-500/[0.02] pointer-events-none" />
                <div>
                  <div className="text-slate-400 uppercase font-black tracking-widest text-[9px] mb-1">Carrier Carrier</div>
                  <div className="font-bold text-slate-200 truncate">{activeShipment.carrier}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-medium">{activeShipment.vessel}</div>
                </div>
                <div>
                  <div className="text-slate-400 uppercase font-black tracking-widest text-[9px] mb-1">Route Passage</div>
                  <div className="font-bold text-slate-200 truncate">{activeShipment.origin}</div>
                  <div className="text-[10px] text-teal-400 mt-0.5 font-medium">➔ {activeShipment.destination}</div>
                </div>
                <div>
                  <div className="text-slate-400 uppercase font-black tracking-widest text-[9px] mb-1">Invoiced Goods</div>
                  <div className="font-bold text-slate-200 truncate">{activeShipment.goods}</div>
                  <div className="text-[10px] text-emerald-400 mt-0.5 font-bold">Valued at {settings.currency}{activeShipment.value.toLocaleString()}</div>
                </div>
              </div>

              {/* TIMELINE PROGRESS GRAPHICAL MODEL (Responsive horizontal) */}
              <div className="relative py-14 overflow-x-auto select-none custom-scrollbar pb-10">
                <div className="min-w-[620px] relative px-4">
                  
                  {/* Base neutral connection line */}
                  <div className="absolute top-1/2 left-0 right-0 h-[3px] bg-slate-800 -translate-y-1/2 rounded" />

                  {/* Active connection glow line */}
                  <div 
                    className="absolute top-1/2 left-0 h-[3px] bg-gradient-to-r from-teal-400 to-cyan-400 -translate-y-1/2 rounded shadow-[0_0_12px_#2dd4bf]"
                    style={{
                      width: `${(activeShipment.activeStep / 4) * 100}%`,
                      transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  />

                  {/* Nodes Grid */}
                  <div className="relative flex justify-between">
                    {milestones.map((step, idx) => {
                      const completed = idx < activeShipment.activeStep;
                      const active = idx === activeShipment.activeStep;
                      const future = idx > activeShipment.activeStep;

                      return (
                        <div key={idx} className="flex flex-col items-center text-center w-28 group relative">
                          
                          {/* Node Icon Circle */}
                          <div 
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shadow-lg border relative z-10 transition-all duration-300 hover:scale-110 ${
                              completed 
                                ? 'bg-[#0f172a] border-teal-500/80 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.4)]'
                                : active 
                                ? 'bg-gradient-to-br from-teal-400 to-cyan-500 border-white text-[#090d16] scale-110 shadow-[0_0_20px_rgba(45,212,191,0.6)] animate-pulse'
                                : 'bg-[#0f172a] border-slate-700 text-slate-400'
                            }`}
                          >
                            {completed ? '✓' : idx + 1}

                            {/* Accent node breathing particle */}
                            {active && (
                              <span className="absolute -inset-1.5 rounded-full border border-teal-400/50 animate-ping opacity-60 pointer-events-none" />
                            )}
                          </div>

                          {/* Typography labels & hover detail effects */}
                          <div className="mt-3.5 space-y-0.5">
                            <div className={`text-xs font-bold leading-tight transition-all duration-200 ${
                              active ? 'text-white scale-102 filter drop-shadow-[0_0_6px_rgba(255,255,255,0.3)]' : completed ? 'text-slate-200' : 'text-slate-500'
                            }`}>
                              {step.title}
                            </div>
                            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                              {step.desc}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>

              {/* SHIPMENT UPDATE LOG */}
              <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 space-y-2 mt-4">
                <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <span>🛰️ Active Signal Ledger</span>
                  <span className="text-teal-400 font-mono">Synchronized</span>
                </div>
                <div className="text-xs text-slate-200 leading-relaxed font-mono italic">
                  "{activeShipment.lastUpdate}"
                </div>
              </div>

            </div>

            {/* SIMULATOR TOOLBAR: STEP MILESTONE */}
            <div className="p-5 rounded-3xl border border-white/5 bg-slate-950/40 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  🕹️ Shipment Simulator Console
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Change global milestone steps manually to simulate compliance checks.</p>
              </div>
              
              <div className="flex items-center gap-1 bg-[#090d16] p-1 rounded-xl border border-white/5 shrink-0 select-none">
                {milestones.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handleStepChange(i)}
                    className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all duration-150 cursor-pointer ${
                      activeShipment.activeStep === i 
                        ? 'bg-gradient-to-tr from-teal-500 to-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(20,184,166,0.3)]' 
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT WIDGET: HS CODE DIRECTORY & DUTY CALCULATOR (5 COLS) */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
            
            <div className="relative p-6 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
              
              {/* Top premium ambient line light */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent pointer-events-none" />

              {/* Header Title */}
              <div className="flex items-center gap-3 pb-5 border-b border-white/5 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 border border-cyan-500/20 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(6,182,212,0.15)] text-cyan-400">
                  📁
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">HS Directory & Duty Calculator Header</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Lookup tariff classifications and model net duties.</p>
                </div>
              </div>

              {/* SEARCH INPUT */}
              <div className="space-y-2 mb-4 relative z-20">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Product / HS Code Finder Search
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold select-none pointer-events-none">
                    🔍
                  </span>
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search product or HS code..."
                    className="w-full bg-[#05070c]/90 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-500/30 transition-all duration-200"
                  />
                  {searchText && (
                    <button 
                      onClick={() => setSearchText('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* SUGGESTION LIST DROPDOWN (Real-time Filtering) */}
                <div className="absolute left-0 right-0 mt-1 bg-[#090d16]/95 border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-30 transition-all duration-200">
                  {searchText.trim().length > 0 && (
                    <div className="divide-y divide-white/5 max-h-[180px] overflow-y-auto custom-scrollbar">
                      {filteredHSCodes.length > 0 ? (
                        filteredHSCodes.map(item => (
                          <div
                            key={item.code}
                            onClick={() => {
                              setSelectedHSItem(item);
                              setSearchText('');
                            }}
                            className="p-3 hover:bg-cyan-500/5 text-xs text-slate-300 hover:text-white cursor-pointer transition-colors flex items-center justify-between"
                          >
                            <div className="pr-4 truncate flex-1">
                              <span className="font-bold text-slate-100">{item.name}</span>
                            </div>
                            <span className="font-mono text-[10px] font-bold bg-[#06b6d4]/10 text-cyan-300 border border-cyan-500/20 px-1.5 py-0.5 rounded shrink-0">
                              {item.code}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-xs text-slate-500 italic text-center">No HS code codes found inside directory</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* CURRENT SELECTED HS CODE PROFILE */}
              <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 text-xs space-y-3 mb-6 relative overflow-hidden">
                <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none" />
                
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Classification Product</div>
                    <div className="font-bold text-slate-100 mt-0.5 text-sm">{selectedHSItem.name}</div>
                  </div>
                  <span className="font-mono text-xs font-black bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded-xl shadow-[0_0_12px_rgba(6,182,212,0.15)] shrink-0 select-all">
                    {selectedHSItem.code}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-3">
                  <div>
                    <div className="text-slate-400 uppercase font-black tracking-widest text-[8px]">Basic CD</div>
                    <div className="font-black text-slate-200 mt-0.5 font-mono">{(selectedHSItem.basicDuty * 100).toFixed(0)}%</div>
                  </div>
                  <div>
                    <div className="text-slate-400 uppercase font-black tracking-widest text-[8px]">Regulatory RD</div>
                    <div className="font-black text-slate-200 mt-0.5 font-mono">{(selectedHSItem.regulatoryDuty * 100).toFixed(0)}%</div>
                  </div>
                  <div>
                    <div className="text-slate-400 uppercase font-black tracking-widest text-[8px]">VAT Percent</div>
                    <div className="font-black text-slate-200 mt-0.5 font-mono">{(selectedHSItem.vat * 100).toFixed(0)}%</div>
                  </div>
                </div>
              </div>

              {/* VALUATION CALCULATOR MODEL BASE VALUE */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Shipment Value (FOB)
                  </label>
                  <span className="text-[10px] font-black text-teal-400 font-mono uppercase">
                    Currency: {settings.currency || 'USD'}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold select-none text-xs pointer-events-none">
                    {settings.currency || '$'}
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={shipmentValueInput || ''}
                    onChange={(e) => setShipmentValueInput(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#05070c]/90 border border-white/10 rounded-2xl py-3 pl-8 pr-4 text-xs font-mono font-bold text-white focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-500/30 transition-all duration-200"
                  />
                </div>
              </div>

              {/* GLASSMORPHIC DUTY BREAKDOWN TABLE */}
              <div className="rounded-2xl border border-white/5 bg-white/[0.01] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02] text-slate-400 text-[10px] uppercase font-black tracking-wider">
                      <th className="p-3">Type</th>
                      <th className="p-3 text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    
                    {/* CD */}
                    <tr className="hover:bg-white/[0.01] transition-colors group">
                      <td className="p-3 text-slate-300 font-medium">
                        Basic Duty (CD) <span className="font-mono text-slate-500 text-[10px]">({(selectedHSItem.basicDuty * 100).toFixed(0)}%)</span>
                      </td>
                      <td className="p-3 text-right font-mono text-slate-200 font-semibold transition-colors group-hover:text-white">
                        {settings.currency}{Math.round(calculations.cdAmount).toLocaleString()}
                      </td>
                    </tr>

                    {/* RD */}
                    <tr className="hover:bg-white/[0.01] transition-colors group">
                      <td className="p-3 text-slate-300 font-medium">
                        Regulatory Duty (RD) <span className="font-mono text-slate-500 text-[10px]">({(selectedHSItem.regulatoryDuty * 100).toFixed(0)}%)</span>
                      </td>
                      <td className="p-3 text-right font-mono text-slate-200 font-semibold transition-colors group-hover:text-white">
                        {settings.currency}{Math.round(calculations.rdAmount).toLocaleString()}
                      </td>
                    </tr>

                    {/* VAT */}
                    <tr className="hover:bg-white/[0.01] transition-colors group">
                      <td className="p-3 text-slate-300 font-medium">
                        Customs VAT <span className="font-mono text-slate-500 text-[10px]">({(selectedHSItem.vat * 100).toFixed(0)}%)</span>
                      </td>
                      <td className="p-3 text-right font-mono text-slate-200 font-semibold transition-colors group-hover:text-white">
                        {settings.currency}{Math.round(calculations.vatAmount).toLocaleString()}
                      </td>
                    </tr>

                    {/* TOTAL */}
                    <tr className="bg-cyan-500/5 text-cyan-300 font-bold border-t border-cyan-500/20">
                      <td className="p-3.5">
                        Total Estimated Tax/Duty Total
                      </td>
                      <td className="p-3.5 text-right font-mono text-[13px]">
                        {settings.currency}{Math.round(calculations.totalDuty).toLocaleString()}
                      </td>
                    </tr>

                  </tbody>
                </table>
              </div>

              {/* POST DUTY TO BUSINESS EXPENSES INTEGRATION BUTTON */}
              <button 
                onClick={handlePostToExpenses}
                className="w-full mt-6 py-3.5 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-[#090d16] font-bold text-xs border border-white/10 shadow-[0_0_20px_rgba(20,184,166,0.3)] transition-all duration-300 flex items-center justify-center gap-2 group active:scale-[0.98] select-none cursor-pointer"
              >
                <span>🏛️</span>
                Post Duty to Business Ledger Expense
                <span className="opacity-70 transition-transform duration-200 group-hover:translate-x-0.5">➔</span>
              </button>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

const ShipmentTracking = React.memo(ShipmentTrackingComponent);
export default ShipmentTracking;
