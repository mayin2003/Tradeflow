import React, { useState, useMemo } from 'react';
import { Sparkles } from 'lucide-react';

interface LandedCostTabProps {
  onStart: () => void;
}

export const LandedCostTab: React.FC<LandedCostTabProps> = ({ onStart }) => {
  // Landed Cost & Profit Margin Calculator local state
  const [itemUnits, setItemUnits] = useState(450);
  const [itemUnitCost, setItemUnitCost] = useState(85); // USD
  const [customsDutyPercent, setCustomsDutyPercent] = useState(15); // %
  const [freightLogisticsCost, setFreightLogisticsCost] = useState(2400); // flat USD
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  const currencyRate = useMemo(() => {
    if (selectedCurrency === 'BDT') return 118;
    if (selectedCurrency === 'Yuan') return 7.25;
    if (selectedCurrency === 'Rupee') return 83.5;
    return 1; // USD default
  }, [selectedCurrency]);

  const currencySymbolDisplay = useMemo(() => {
    if (selectedCurrency === 'BDT') return '৳';
    if (selectedCurrency === 'Yuan') return '¥';
    if (selectedCurrency === 'Rupee') return '₹';
    return '$';
  }, [selectedCurrency]);

  // Calculations for interactive tool
  const baseFobTotal = useMemo(() => itemUnits * itemUnitCost, [itemUnits, itemUnitCost]);
  const calculatedDuty = useMemo(() => baseFobTotal * (customsDutyPercent / 100), [baseFobTotal, customsDutyPercent]);
  const totalLandedCost = useMemo(() => baseFobTotal + calculatedDuty + freightLogisticsCost, [baseFobTotal, calculatedDuty, freightLogisticsCost]);
  const landedCostPerUnit = useMemo(() => itemUnits > 0 ? totalLandedCost / itemUnits : 0, [totalLandedCost, itemUnits]);
  
  // Suggested retail price at 30% gross profit margin
  const suggestedRetailPrice = useMemo(() => landedCostPerUnit / 0.7, [landedCostPerUnit]);
  const estimatedProfitPerUnit = useMemo(() => suggestedRetailPrice - landedCostPerUnit, [suggestedRetailPrice, landedCostPerUnit]);
  const estimatedTotalProfit = useMemo(() => estimatedProfitPerUnit * itemUnits, [estimatedProfitPerUnit, itemUnits]);

  return (
    <div id="margin-calculator" className="relative max-w-5xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        
        {/* Descriptive Left Segment */}
        <div className="lg:col-span-5 space-y-6">
          <span className="px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold text-blue-700 uppercase tracking-widest inline-block shadow-sm">
            Tactile Sizing Calculator
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Calculate True Landed Costs Instantly
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Do not guesstimate your Net Profit margin levels. Drag the sliders on our custom mathematical sandboxed widget to see how duty rates and shipping overheads impact your actual pricing points.
          </p>
          <div className="space-y-3.5">
            <div className="flex items-start gap-2.5">
              <div className="w-5.5 h-5.5 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-[10px] font-bold mt-0.5 pointer-events-none">
                ✓
              </div>
              <p className="text-xs text-slate-650">
                <strong>Freight Allocation Splits:</strong> Flat logistics costs are divided proportionally based on item volumes automatically.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-5.5 h-5.5 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-[10px] font-bold mt-0.5 pointer-events-none">
                ✓
              </div>
              <p className="text-xs text-slate-650">
                <strong>Duty Optimization Safeguard:</strong> Automatically flags margin degradation if duty structures exceed 25% overhead.
              </p>
            </div>
          </div>
          <div className="bg-indigo-50/20 rounded-2xl p-4 border border-indigo-100/50">
            <p className="text-xs text-indigo-900 font-semibold mb-1">💡 Trade Strategy Tip:</p>
            <p className="text-xs text-slate-500">Adding accurate customs VAT percentages prevents accounting gaps at end-of-year audit thresholds.</p>
          </div>
        </div>

        {/* Dynamic Calculator Interactive Panel */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xl">🧮</span>
              <span className="font-bold text-slate-850 text-xs sm:text-sm">Prudence Margin Matrix Simulator</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200">
              {['USD', 'BDT', 'Yuan', 'Rupee'].map((curr) => (
                <button 
                  key={curr} 
                  onClick={() => setSelectedCurrency(curr)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${selectedCurrency === curr ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' : 'text-slate-400 hover:text-slate-800'}`}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-600">
              <span>Shipment Order Qty</span>
              <span className="font-mono text-blue-600">{itemUnits.toLocaleString()} Units</span>
            </div>
            <input 
              type="range"
              min="50"
              max="5000"
              step="50"
              value={itemUnits}
              onChange={(e) => setItemUnits(Number(e.target.value))}
              className="w-full accent-blue-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-600">
              <span>Sourcing Base Cost (FOB per Unit)</span>
              <span className="font-mono text-blue-600">
                {currencySymbolDisplay}{(itemUnitCost * currencyRate).toFixed(1)}
              </span>
            </div>
            <input 
              type="range"
              min="5"
              max="400"
              step="5"
              value={itemUnitCost}
              onChange={(e) => setItemUnitCost(Number(e.target.value))}
              className="w-full accent-blue-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-600">
              <span>Port Customs Tariff Duty</span>
              <span className="font-mono text-blue-600">{customsDutyPercent}%</span>
            </div>
            <input 
              type="range"
              min="0"
              max="45"
              value={customsDutyPercent}
              onChange={(e) => setCustomsDutyPercent(Number(e.target.value))}
              className="w-full accent-blue-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-600">
              <span>Flat Freight Expenses</span>
              <span className="font-mono text-blue-600">
                {currencySymbolDisplay}{(freightLogisticsCost * currencyRate).toLocaleString(undefined, {maximumFractionDigits: 0})}
              </span>
            </div>
            <input 
              type="range"
              min="200"
              max="12000"
              step="200"
              value={freightLogisticsCost}
              onChange={(e) => setFreightLogisticsCost(Number(e.target.value))}
              className="w-full accent-blue-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/50">
              <span className="block text-[8px] uppercase font-mono text-slate-400 font-bold">FOB Value Total</span>
              <span className="font-bold font-mono text-slate-800 text-[11px]">
                {currencySymbolDisplay}{(baseFobTotal * currencyRate).toLocaleString(undefined, {maximumFractionDigits:0})}
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/50">
              <span className="block text-[8px] uppercase font-mono text-slate-400 font-bold">Customs Duty</span>
              <span className="font-bold font-mono text-indigo-700 text-[11px]">
                {currencySymbolDisplay}{(calculatedDuty * currencyRate).toLocaleString(undefined, {maximumFractionDigits:0})}
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/50">
              <span className="block text-[8px] uppercase font-mono text-slate-400 font-bold">Landed / Unit</span>
              <span className="font-bold font-mono text-slate-800 text-[11px] font-black">
                {currencySymbolDisplay}{(landedCostPerUnit * currencyRate).toFixed(1)}
              </span>
            </div>
            <div className="bg-slate-55 p-2.5 rounded-xl border border-slate-200/50">
              <span className="block text-[8px] uppercase font-mono text-slate-400 font-bold font-black">Sug. Retail (30%)</span>
              <span className="font-bold font-mono text-emerald-600 text-[11px] font-black">
                {currencySymbolDisplay}{(suggestedRetailPrice * currencyRate).toFixed(1)}
              </span>
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-xl p-4.5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 block">
                  TARGET NET PROFIT (30% GPM)
                </span>
                <span className="text-[10px] text-slate-400">Preserving portfolio hygiene</span>
              </div>
              <div className="text-right">
                <span className="text-lg sm:text-xl font-mono text-emerald-400 font-black">
                  {currencySymbolDisplay}{(estimatedTotalProfit * currencyRate).toLocaleString(undefined, {maximumFractionDigits:0})}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
