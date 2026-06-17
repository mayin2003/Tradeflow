import React, { useState, useMemo } from 'react';
import { Check } from 'lucide-react';

interface FlexibleRatesTabProps {
  onStart: () => void;
}

export const FlexibleRatesTab: React.FC<FlexibleRatesTabProps> = ({ onStart }) => {
  const [isAnnualBilling, setIsAnnualBilling] = useState(true);
  const [shipmentVolume, setShipmentVolume] = useState(350); // 50 to 1000 slider

  // Pricing plans based on sliders and billing
  const pricingPlan = useMemo(() => {
    let basePrice = 49;
    let rank = 'Starter Enterprise';
    let maxUsers: number | string = 3;

    if (shipmentVolume <= 150) {
      basePrice = 49;
      rank = 'Starter Growth';
      maxUsers = 3;
    } else if (shipmentVolume <= 600) {
      basePrice = 99;
      rank = 'Business Authority';
      maxUsers = 10;
    } else {
      basePrice = 249;
      rank = 'Global Trade Apex';
      maxUsers = 'Unlimited';
    }

    const price = isAnnualBilling ? Math.round(basePrice * 0.8) : basePrice;
    return { price, rank, maxUsers };
  }, [shipmentVolume, isAnnualBilling]);

  return (
    <div id="pricing-tier" className="max-w-5xl mx-auto space-y-12">
      
      {/* Billing toggle layout */}
      <div className="flex items-center justify-center gap-4">
        <span className={`text-sm font-semibold transition-colors duration-200 ${!isAnnualBilling ? 'text-slate-900' : 'text-slate-400'}`}>
          Monthly Billing
        </span>
        
        <button 
          type="button"
          onClick={() => setIsAnnualBilling(!isAnnualBilling)}
          className="w-14 h-8 bg-slate-200 hover:bg-slate-300 rounded-full relative p-1 transition-all duration-200 cursor-pointer"
        >
          <div className={`w-6 h-6 rounded-full bg-blue-600 shadow-md transition-transform duration-200 ${isAnnualBilling ? 'translate-x-6' : 'translate-x-0'}`}>
          </div>
        </button>

        <span className={`text-sm font-semibold flex items-center gap-1 transition-colors duration-200 ${isAnnualBilling ? 'text-slate-900' : 'text-slate-400'}`}>
          Annually
          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded uppercase">
            Save 20%
          </span>
        </span>
      </div>

      {/* Main double column widget */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 bg-white rounded-3xl border border-slate-200 shadow-lg p-6 sm:p-10">
        
        {/* Continuous slider control channel */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-8">
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Adjust Sizing Threshold</h3>
            <p className="text-slate-500 text-xs sm:text-sm">
              How many shipping logs, custom duties formulas, and trade invoices does your business operation team write every month? Drag to calibrate your rate.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <span className="text-[9px] font-mono tracking-wider font-extrabold text-slate-400">ACTIVE MONTHLY BILLS LEDGER</span>
              <span className="text-xl font-black text-blue-600 font-mono">{shipmentVolume.toLocaleString()} Logistics Rows</span>
            </div>

            <input 
              type="range"
              min="50"
              max="1000"
              step="25"
              value={shipmentVolume}
              onChange={(e) => setShipmentVolume(Number(e.target.value))}
              className="w-full accent-blue-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
            />

            <div className="flex justify-between text-[9px] text-slate-400 font-mono font-bold uppercase">
              <span>50 rows</span>
              <span>500 Mid-Tier Enterprise</span>
              <span>1,000+ Corporate Apex</span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/60 font-sans">
            <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-3">
              INCLUDED BENEFITS ON ALL TIERS:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
              <p className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-600" /> Multi-Currency lockin</p>
              <p className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-600" /> Compliant A4 PDF print</p>
              <p className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-600" /> Sandboxed Safe DB Cache</p>
              <p className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-600" /> Dynamic landing margin metrics</p>
            </div>
          </div>
        </div>

        {/* Dynamic total checkout price card */}
        <div className="lg:col-span-5 bg-gradient-to-b from-slate-50 to-slate-100/50 rounded-2xl border border-slate-200 p-6 sm:p-8 text-center flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none"></div>

          <div>
            <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 font-extrabold uppercase px-3 py-1 rounded-full">
              {pricingPlan.rank}
            </span>
            
            <div className="my-8">
              <span className="text-4xl sm:text-5xl font-black text-slate-900 font-mono">${pricingPlan.price}</span>
              <span className="text-slate-400 text-xs font-mono font-bold"> /month</span>
            </div>

            <div className="space-y-3.5 mb-8 text-xs text-slate-650">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span>Maximum Auth Seats</span>
                <strong className="text-slate-900">{pricingPlan.maxUsers} Users Authorized</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span>Port Compliance</span>
                <strong className="text-slate-900">Custom HS Tariffs Support</strong>
              </div>
              <div className="flex justify-between">
                <span>System Support</span>
                <strong className="text-slate-900">24/7 Priority Trade Desk</strong>
              </div>
            </div>
          </div>

          <button 
            type="button"
            onClick={onStart}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:shadow-blue-600/10 active:scale-98 text-xs sm:text-sm cursor-pointer"
          >
            Start Safe 14-days Free Trial
          </button>
        </div>

      </div>

    </div>
  );
};
