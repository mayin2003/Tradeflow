import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowRight, Package, DollarSign, TrendingUp, FileText, Globe, Layers 
} from 'lucide-react';

interface EngineModulesTabProps {
  onStart: () => void;
}

export const EngineModulesTab: React.FC<EngineModulesTabProps> = ({ onStart }) => {
  const features = [
    { 
      icon: <Package className="w-6 h-6" />, 
      title: 'High-Fidelity HS Directory', 
      desc: 'Safeguard inventory rows using compliant HS tariff codes. Keep tab of low port values with custom color warning bars.',
      accent: 'amber',
      badge: 'Live Stock Tracking'
    },
    { 
      icon: <DollarSign className="w-6 h-6" />, 
      title: 'Duty & Landed Cost splitter', 
      desc: 'Calculate precise itemized duty fractions directly inside your log ledger. Tracks Freight, Insurance, Customs, and VAT.',
      accent: 'blue',
      badge: 'Cost Accuracy'
    },
    { 
      icon: <TrendingUp className="w-6 h-6" />, 
      title: 'Profit & Margins Ledger', 
      desc: 'A robust daily balance tracking Gross Revenue against documented Logistics Expenses instantly.',
      accent: 'emerald',
      badge: 'Net Profit Tracking'
    },
    { 
      icon: <FileText className="w-6 h-6" />, 
      title: 'Sleek A4 PDF Exporter', 
      desc: 'Generate gorgeous export-compliant invoice receipts from internal databases in seconds to send to global customers.',
      accent: 'purple',
      badge: 'Client Print Engine'
    },
    { 
      icon: <Globe className="w-6 h-6" />, 
      title: 'Multi-Currency Core', 
      desc: 'Supports historical conversion lock-ins for USD, BDT, Euro, Yuan, and Indian Rupee under active portfolios.',
      accent: 'indigo',
      badge: 'Global Exchange'
    },
    { 
      icon: <Layers className="w-6 h-6" />, 
      title: 'Audit-ready Activity Sheets', 
      desc: 'Continuous tracking monitors every addition, transaction revision, or invoice deletion to secure enterprise compliance.',
      accent: 'rose',
      badge: 'Security Logging'
    }
  ];

  return (
    <div id="core-features" className="max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group p-8 rounded-3xl bg-white border border-slate-200/75 shadow-[0_4px_16px_rgba(0,0,0,0.01)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.03)] hover:border-slate-300 transition-all duration-300 relative flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center transition-transform group-hover:scale-105 duration-300 pointer-events-none">
                  {feature.icon}
                </div>
                <span className="text-[10px] font-mono bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-md uppercase">
                  {feature.badge}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-200 mb-2">
                {feature.title}
              </h3>
              
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-6">
                {feature.desc}
              </p>
            </div>

            <button 
              type="button"
              onClick={onStart}
              className="text-xs font-bold text-slate-650 group-hover:text-blue-600 inline-flex items-center gap-1 hover:underline transition-all mt-auto self-start"
            >
              <span>Interact with module</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
