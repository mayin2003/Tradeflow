import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, Package, Truck, FileText, AlertTriangle 
} from 'lucide-react';

interface WorkspacePreviewTabProps {
  onStart: () => void;
}

export const WorkspacePreviewTab: React.FC<WorkspacePreviewTabProps> = ({ onStart }) => {
  const [activePreviewTab, setActivePreviewTab] = useState('dashboard');

  const simulatedInvoicesLog = [
    { id: 'INV-2026-001', client: 'Dhaka Logistics Hub', date: 'June 02, 2026', value: 8900 },
    { id: 'INV-2026-002', client: 'Rotterdam Port Dist.', date: 'June 05, 2026', value: 14500 },
    { id: 'INV-2026-003', client: 'Bengal Retail Consort.', date: 'June 08, 2026', value: 31200 },
  ];

  return (
    <div id="workspace-preview" className="relative">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.06)] overflow-hidden max-w-5xl mx-auto">
        
        {/* Browser Bar */}
        <div className="bg-[#fcfdfe] border-b border-slate-200/60 py-4.5 px-6 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-400 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block"></span>
          </div>
          <div className="bg-slate-100/70 border border-slate-200/40 text-[11px] font-mono text-slate-500 py-1.5 px-8 rounded-xl w-full max-w-md text-center shadow-inner">
            https://tradeflow.net/corp/workspace/root_ledger
          </div>
          <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100/90 px-2 py-0.5 rounded-md hidden sm:inline-block">
            SECURE SSL
          </span>
        </div>

        {/* Split Menu / Canvas */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
          <div className="md:col-span-3 bg-slate-50/70 border-r border-slate-200/50 p-5 flex flex-col gap-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-3 mb-2 block animate-pulse">
              OPERATIONS DESK
            </span>

            <button 
              onClick={() => setActivePreviewTab('dashboard')}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all duration-200 text-left ${activePreviewTab === 'dashboard' ? 'bg-white text-blue-600 shadow-sm border border-slate-200/70' : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-900'}`}
            >
              <BarChart3 className="w-4 h-4 text-blue-500" />
              <span>Business Dashboard</span>
            </button>

            <button 
              onClick={() => setActivePreviewTab('inventory')}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all duration-200 text-left ${activePreviewTab === 'inventory' ? 'bg-white text-blue-600 shadow-sm border border-slate-200/70' : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-900'}`}
            >
              <Package className="w-4 h-4 text-yellow-500" />
              <span>HS Port Catalogue</span>
            </button>

            <button 
              onClick={() => setActivePreviewTab('shipments')}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all duration-200 text-left ${activePreviewTab === 'shipments' ? 'bg-white text-blue-600 shadow-sm border border-slate-200/70' : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-900'}`}
            >
              <Truck className="w-4 h-4 text-indigo-500" />
              <span>Vessel Logistics</span>
            </button>

            <button 
              onClick={() => setActivePreviewTab('invoice')}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all duration-200 text-left ${activePreviewTab === 'invoice' ? 'bg-white text-blue-600 shadow-sm border border-slate-200/70' : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-900'}`}
            >
              <FileText className="w-4 h-4 text-emerald-500" />
              <span>A4 Invoices Engine</span>
            </button>

            <div className="mt-8 border-t border-slate-200/50 pt-4 px-3">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-2">
                QUICK MULTI-CURRENCY
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold text-slate-600 font-mono">
                <span className="bg-slate-100/60 p-1.5 rounded text-center border border-slate-200/30">USD: 1.0</span>
                <span className="bg-slate-100/60 p-1.5 rounded text-center border border-slate-200/30">BDT: 118.0</span>
                <span className="bg-slate-100/60 p-1.5 rounded text-center border border-slate-200/30">YUA: 7.25</span>
                <span className="bg-slate-100/60 p-1.5 rounded text-center border border-slate-200/30">RUP: 83.5</span>
              </div>
            </div>

            <div className="mt-auto pt-8">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-3 text-center">
                <p className="text-[10px] font-bold text-blue-900 mb-1">Local Sandboxed Mode</p>
                <button 
                  onClick={onStart}
                  className="text-[9px] font-extrabold text-blue-600 hover:underline hover:text-blue-800 uppercase tracking-widest block mx-auto"
                >
                  Launch Suite →
                </button>
              </div>
            </div>
          </div>

          <div className="md:col-span-9 p-7 sm:p-9 bg-white flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {activePreviewTab === 'dashboard' && (
                <motion.div 
                  key="v-dashboard"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 flex flex-col gap-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Enterprise Ledger & Revenue Monitor</h4>
                      <p className="text-[11px] text-slate-500">Prudence algorithms calculating live inventory totals.</p>
                    </div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold uppercase border border-emerald-100 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                      Live Ledger
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 hover:shadow-sm transition-all animate-fade-in">
                      <span className="text-[9px] font-mono font-bold tracking-widest text-slate-400 block mb-1">CUMULATIVE REVENUE</span>
                      <div className="text-2xl font-black font-mono text-slate-900">$189,450.00</div>
                      <span className="text-[9px] text-emerald-600 font-bold inline-flex items-center gap-0.5 mt-1">
                        +14.2% this quarter
                      </span>
                    </div>
                    
                    <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 hover:shadow-sm transition-all">
                      <span className="text-[9px] font-mono font-bold tracking-widest text-slate-400 block mb-1">LOGISTICS COSTS</span>
                      <div className="text-2xl font-black font-mono text-slate-900">$42,390.00</div>
                      <span className="text-[9px] text-slate-400 font-medium block mt-1">
                        Duties & Freight included
                      </span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 hover:shadow-sm transition-all">
                      <span className="text-[9px] font-mono font-bold tracking-widest text-slate-400 block mb-1">CALCULATED NET PROFIT</span>
                      <div className="text-2xl font-black font-mono text-blue-600">$147,060.00</div>
                      <span className="text-[9px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded-md mt-1 inline-block">
                        77.6% Margin Rate
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Monthly Profit Velocity (2026)</span>
                      <span className="text-[10px] font-mono text-slate-500 font-bold">100% SECURE ROOM DATABASE</span>
                    </div>

                    <div className="h-28 flex items-end justify-between gap-3 pt-2">
                      {[25, 45, 35, 65, 55, 80, 95, 110, 130, 147].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center">
                          <div className="w-full bg-slate-200 rounded-t-md h-24 flex items-end">
                            <motion.div 
                              initial={{ height: 0 }}
                              animate={{ height: `${h}%` }}
                              className="w-full bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-md cursor-pointer hover:from-blue-500 hover:to-indigo-400 transition-colors"
                            />
                          </div>
                          <span className="text-[8px] font-semibold text-slate-400 mt-1.5 font-mono">{['J','F','M','A','M','J','J','A','S','O'][i]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activePreviewTab === 'inventory' && (
                <motion.div 
                  key="v-inventory"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 flex flex-col gap-5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Customs HS Database Catalogue</h4>
                      <p className="text-[11px] text-slate-500">Auto tags duty percentage thresholds to individual inventory slots.</p>
                    </div>
                    <button 
                      onClick={onStart}
                      className="text-[10px] bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      + Create New Product
                    </button>
                  </div>

                  <div className="border border-slate-200/60 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                          <th className="p-3">PRODUCT DETAIL</th>
                          <th className="p-3 font-mono">HS TARIFF</th>
                          <th className="p-3 font-mono">DUTY RATING</th>
                          <th className="p-3">CURRENT STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {[
                          { name: 'Heavy Industrial Crane Hydraulic Kit 77B', hs: '8412.21.00', duty: '6.5%', stock: '25 Units', level: 'Healthy' },
                          { name: 'Copper Core Thermal Insulation Shielding', hs: '7419.80.00', duty: '12.0%', stock: '4 Units', level: 'Near Low Alert' },
                          { name: 'Recycled Aluminum Casting Alloy Ingot', hs: '7601.20.00', duty: '2.5%', stock: '0 Tons', level: 'Stock Out' },
                        ].map((item, id) => (
                          <tr key={id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-semibold text-slate-800">{item.name}</td>
                            <td className="p-3 font-mono text-slate-500 text-[11px]">{item.hs}</td>
                            <td className="p-3 font-mono font-bold text-slate-700">{item.duty}</td>
                            <td className="p-3 font-mono">
                              <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full inline-block ${
                                  item.level === 'Healthy' ? 'bg-emerald-500' : item.level === 'Stock Out' ? 'bg-rose-500' : 'bg-amber-500'
                                }`}></span>
                                <span className="text-[11px] text-slate-600">{item.stock}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {activePreviewTab === 'shipments' && (
                <motion.div 
                   key="v-shipments"
                   initial={{ opacity: 0, scale: 0.98 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.98 }}
                   transition={{ duration: 0.3 }}
                   className="flex-1 flex flex-col gap-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Global Vessel Transit Stepper</h4>
                      <p className="text-[11px] text-slate-500">Live Port milestone tracker mapping B/L custom codes.</p>
                    </div>
                    <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 uppercase font-black px-2.5 py-1 rounded">
                      VOYAGE #TF-7709
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-250/30 rounded-2xl p-5 flex flex-col gap-4">
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[9px] uppercase font-mono block text-slate-400">CARGO VESSEL</span>
                        <span className="font-bold text-slate-800">Maersk Atlantic Star v44</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] uppercase font-mono block text-slate-400">CURRENT PORT SEGMENT</span>
                        <span className="font-bold text-blue-600">Atlantic Crossing 5</span>
                      </div>
                    </div>

                    <div className="relative py-4">
                      <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-200 z-0 rounded-full"></div>
                      <div className="relative z-10 flex justify-between">
                        {[
                          { title: 'Rotterdam Port', sub: 'Completed', status: 'done' },
                          { title: 'Suez Customs', sub: 'In Transit', status: 'active' },
                          { title: 'USA Harbor Inward', sub: 'Pending', status: 'pending' },
                        ].map((step, sIdx) => (
                          <div key={sIdx} className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              step.status === 'done' ? 'bg-blue-600 text-white shadow-md' :
                              step.status === 'active' ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-md animate-pulse' :
                              'bg-white border-2 border-slate-200 text-slate-400'
                            }`}>
                              {step.status === 'done' ? '✓' : sIdx + 1}
                            </div>
                            <span className="text-[10px] font-bold text-slate-900 mt-2">{step.title}</span>
                            <span className="text-[8px] font-mono text-slate-400">{step.sub}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200/50 text-[11px] text-slate-600 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <span>Vessel delay of 4 hours reported near Rotterdam harbor due to custom log revisions. Cargo remains pristine.</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {activePreviewTab === 'invoice' && (
                <motion.div 
                  key="v-invoice"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Compliant A4 Invoicing Sandbox</h4>
                      <p className="text-[11px] text-slate-500">Offline document vector drawing rendering system.</p>
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-1 rounded font-bold uppercase">
                      Local PDF Engine
                    </span>
                  </div>

                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {simulatedInvoicesLog.map((invoice) => (
                      <div key={invoice.id} className="bg-slate-50 hover:bg-slate-100/70 p-3.5 rounded-xl border border-slate-200/40 flex items-center justify-between text-xs transition-colors">
                        <div>
                          <span className="font-mono text-blue-600 font-bold block">{invoice.id}</span>
                          <span className="font-semibold text-slate-700">{invoice.client}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400">{invoice.date}</span>
                          <span className="font-mono font-bold text-slate-800">${invoice.value.toLocaleString()}</span>
                          <button 
                            type="button"
                            onClick={() => {
                              alert(`Client-side A4 Invoice vector print initialized for ${invoice.id}. Document generated successfully!`);
                            }}
                            className="px-2.5 py-1 text-[10px] font-bold bg-white border border-slate-300 rounded hover:bg-slate-50 active:scale-95 transition-all text-slate-700"
                          >
                            Print A4 PDF
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="border-t border-slate-200 pt-4 mt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 font-mono gap-2">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-ping"></span>
                Secure Port Gateway (Rotterdam API)
              </span>
              <button 
                type="button"
                onClick={onStart}
                className="text-indigo-600 hover:text-indigo-800 font-bold uppercase tracking-widest text-[9px] hover:underline"
              >
                Enter Fully-functional Sandbox Environment →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
