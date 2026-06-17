import React from 'react';
import { Check } from 'lucide-react';

export const ComparisonMatrixTab: React.FC = () => {
  return (
    <div id="plans-comparison" className="max-w-4xl mx-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 font-bold text-slate-400">
                <th className="pb-4">OPERATIONAL CRITERIA</th>
                <th className="pb-4 text-blue-600 font-black text-center">TRADEFLOW</th>
                <th className="pb-4 text-slate-500 text-center">TRADITIONAL EXCEL</th>
                <th className="pb-4 text-slate-500 text-center">LEGACY SYSTEM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {[
                { detail: 'Proportional Landed Cost Formula Splits', ours: true, excel: 'Manual entry', legacy: 'Sluggish batch run' },
                { detail: 'True Client-Side A4 Print PDF Generation', ours: true, excel: 'No layout support', legacy: 'External expensive module' },
                { detail: 'Multi-Currency (BDT, USD, YU, IN) Loggers', ours: true, excel: 'Fragile values link', legacy: 'Hardcoded exchange values' },
                { detail: 'Secure Sandboxed Cache Hygiene Protection', ours: true, excel: 'Easily lost file', legacy: 'High monthly fee hosting' },
                { detail: 'Continuous Active Ledger Auditing', ours: true, excel: 'No security logs', legacy: 'Clunky Terminal interface' },
              ].map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 text-slate-800 font-bold">{row.detail}</td>
                  <td className="py-4 text-center">
                    <Check className="w-5 h-5 text-emerald-600 mx-auto bg-emerald-100/40 rounded-full p-0.5 pointer-events-none" />
                  </td>
                  <td className="py-4 text-center text-slate-400 font-mono text-xs">{row.excel}</td>
                  <td className="py-4 text-center text-slate-400 font-mono text-xs">{row.legacy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
