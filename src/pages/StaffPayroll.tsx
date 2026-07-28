import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { 
  DollarSign, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  Plus, 
  UserPlus, 
  CreditCard, 
  Search, 
  X, 
  ChevronDown, 
  FileText, 
  Trash2, 
  Check, 
  Briefcase,
  Layers,
  ArrowUpRight
} from 'lucide-react';

interface EmployeePayroll {
  id: string;
  name: string;
  role: string;
  baseSalary: number;
  allowanceOvertime: number;
  allowanceBonus: number;
  deductionAdvance: number;
  deductionTax: number;
  paymentMethod: 'Bank Transfer' | 'Cash' | 'Mobile Wallet';
  status: 'Paid' | 'Pending';
  avatarInitials: string;
  avatarBg: string;
  payoutDate?: string;
}

const initialEmployees: EmployeePayroll[] = [
  {
    id: "EMP-102",
    name: "Alex Sterling",
    role: "Customs Agent & Compliance Officer",
    baseSalary: 4500,
    allowanceOvertime: 250,
    allowanceBonus: 500,
    deductionAdvance: 0,
    deductionTax: 675, // 15% estimated
    paymentMethod: "Bank Transfer",
    status: "Paid",
    avatarInitials: "AS",
    avatarBg: "from-cyan-500 to-blue-600",
    payoutDate: "2026-05-15"
  },
  {
    id: "EMP-108",
    name: "Marcus Vance",
    role: "Global Logistics Director",
    baseSalary: 5800,
    allowanceOvertime: 0,
    allowanceBonus: 800,
    deductionAdvance: 300,
    deductionTax: 870,
    paymentMethod: "Bank Transfer",
    status: "Paid",
    avatarInitials: "MV",
    avatarBg: "from-indigo-500 to-purple-600",
    payoutDate: "2026-05-15"
  },
  {
    id: "EMP-115",
    name: "Sarah Rahman",
    role: "Supply Chain Analyst",
    baseSalary: 3800,
    allowanceOvertime: 150,
    allowanceBonus: 200,
    deductionAdvance: 0,
    deductionTax: 570,
    paymentMethod: "Mobile Wallet",
    status: "Pending",
    avatarInitials: "SR",
    avatarBg: "from-emerald-400 to-teal-600",
  },
  {
    id: "EMP-120",
    name: "Tariq Mahmood",
    role: "Warehouse Operations Supervisor",
    baseSalary: 3200,
    allowanceOvertime: 480,
    allowanceBonus: 0,
    deductionAdvance: 150,
    deductionTax: 480,
    paymentMethod: "Mobile Wallet",
    status: "Pending",
    avatarInitials: "TM",
    avatarBg: "from-amber-400 to-orange-600",
  },
  {
    id: "EMP-134",
    name: "Helena Rostova",
    role: "Freight Procurement Specialist",
    baseSalary: 4100,
    allowanceOvertime: 120,
    allowanceBonus: 300,
    deductionAdvance: 0,
    deductionTax: 615,
    paymentMethod: "Bank Transfer",
    status: "Paid",
    avatarInitials: "HR",
    avatarBg: "from-pink-500 to-rose-600",
    payoutDate: "2026-05-15"
  },
  {
    id: "EMP-149",
    name: "Devon Carter",
    role: "Port Operations Coordinator",
    baseSalary: 3000,
    allowanceOvertime: 320,
    allowanceBonus: 100,
    deductionAdvance: 0,
    deductionTax: 450,
    paymentMethod: "Cash",
    status: "Pending",
    avatarInitials: "DC",
    avatarBg: "from-violet-500 to-fuchsia-600",
  }
];

export const StaffPayrollComponent = () => {
  const { settings, addExpense, addActivityLog } = useData();
  const [employees, setEmployees] = useState<EmployeePayroll[]>(initialEmployees);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Paid" | "Pending">("All");

  // State handles for modals & detailed flows
  const [isNewEmpModalOpen, setIsNewEmpModalOpen] = useState(false);
  const [selectedSlipEmp, setSelectedSlipEmp] = useState<EmployeePayroll | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form input states for adding a new employee
  const [newEmpName, setNewEmpName] = useState("");
  const [newEmpRole, setNewEmpRole] = useState("");
  const [newEmpSalary, setNewEmpSalary] = useState(3000);
  const [newEmpOvertime, setNewEmpOvertime] = useState(0);
  const [newEmpBonus, setNewEmpBonus] = useState(0);
  const [newEmpAdvance, setNewEmpAdvance] = useState(0);
  const [newEmpTaxRatio, setNewEmpTaxRatio] = useState(15); // percent
  const [newEmpMethod, setNewEmpMethod] = useState<'Bank Transfer' | 'Cash' | 'Mobile Wallet'>("Bank Transfer");

  const currencySymbol = settings?.currency || '৳';

  // Helper trigger
  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // 1. Calculations logic (Total, Disbursed, Pending)
  const stats = useMemo(() => {
    let totalPayroll = 0;
    let disbursedPayroll = 0;
    let pendingPayroll = 0;

    employees.forEach(emp => {
      const netPayable = emp.baseSalary + emp.allowanceOvertime + emp.allowanceBonus - emp.deductionAdvance - emp.deductionTax;
      totalPayroll += netPayable;
      if (emp.status === 'Paid') {
        disbursedPayroll += netPayable;
      } else {
        pendingPayroll += netPayable;
      }
    });

    return { totalPayroll, disbursedPayroll, pendingPayroll };
  }, [employees]);

  // 2. Filter states
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          emp.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "All" || emp.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [employees, searchTerm, statusFilter]);

  // Actions: Handle paying single employee
  const handlePayNow = async (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;

    const netPayable = emp.baseSalary + emp.allowanceOvertime + emp.allowanceBonus - emp.deductionAdvance - emp.deductionTax;

    // Toggle local state to Paid
    setEmployees(prev => prev.map(e => {
      if (e.id === empId) {
        return { ...e, status: 'Paid', payoutDate: new Date().toISOString().split('T')[0] };
      }
      return e;
    }));

    // Post to Expenses Context
    try {
      await addExpense({
        title: `Staff Salary: ${emp.name} (${emp.id})`,
        category: "Salaries",
        amount: netPayable,
        date: new Date().toISOString().split('T')[0],
        note: `Salary disbursed via ${emp.paymentMethod}. Details - Base: ${currencySymbol}${emp.baseSalary.toLocaleString()}, Overtime: ${currencySymbol}${emp.allowanceOvertime.toLocaleString()}, Overtime: ${currencySymbol}${emp.allowanceBonus.toLocaleString()}, Taxes Deducted: ${currencySymbol}${emp.deductionTax.toLocaleString()}.`
      });

      await addActivityLog(`Disbursed salary of ${currencySymbol}${Math.round(netPayable).toLocaleString()} to ${emp.name}`, '💰', '#10b981');
      showToast(`Successfully disbursed ${currencySymbol}${Math.round(netPayable).toLocaleString()} to ${emp.name}. Logged as operating expense.`);
    } catch (err) {
      console.error(err);
    }
  };

  // Actions: Bulk payout approvals
  const handleBulkPayrollApproval = async () => {
    const pendings = employees.filter(e => e.status === 'Pending');
    if (pendings.length === 0) {
      showToast("All employees currently have 'Paid' status. No pending payrolls to disburse.");
      return;
    }

    // Pay all
    setEmployees(prev => prev.map(e => ({
      ...e,
      status: 'Paid',
      payoutDate: new Date().toISOString().split('T')[0]
    })));

    // Send expenses and logs
    let totalDisbursedSum = 0;
    for (const emp of pendings) {
      const netPayable = emp.baseSalary + emp.allowanceOvertime + emp.allowanceBonus - emp.deductionAdvance - emp.deductionTax;
      totalDisbursedSum += netPayable;
      await addExpense({
        title: `Staff Salary (Bulk): ${emp.name}`,
        category: "Salaries",
        amount: netPayable,
        date: new Date().toISOString().split('T')[0],
        note: `Bulk salary release context. Disbursed via ${emp.paymentMethod}.`
      });
    }

    await addActivityLog(`Approved bulk payroll disbursement of ${currencySymbol}${Math.round(totalDisbursedSum).toLocaleString()} for ${pendings.length} employees`, '💰', '#10b981');
    showToast(`Bulk payroll approved! Released ${currencySymbol}${Math.round(totalDisbursedSum).toLocaleString()} across ${pendings.length} remaining members.`);
  };

  // Actions: Add new staff member
  const handleAddNewEmployee = () => {
    if (!newEmpName.trim() || !newEmpRole.trim()) {
      alert("Please provide name and designation details.");
      return;
    }

    const calculatedTax = Math.round(newEmpSalary * (newEmpTaxRatio / 100));
    const randomGradients = [
      "from-teal-500 to-cyan-600",
      "from-pink-500 to-rose-600",
      "from-purple-500 to-indigo-600",
      "from-amber-400 to-orange-500",
      "from-blue-500 to-violet-600"
    ];
    const borderBg = randomGradients[Math.floor(Math.random() * randomGradients.length)];
    const initials = newEmpName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

    const newEmp: EmployeePayroll = {
      id: `EMP-${Math.floor(100 + Math.random() * 900)}`,
      name: newEmpName,
      role: newEmpRole,
      baseSalary: newEmpSalary,
      allowanceOvertime: newEmpOvertime,
      allowanceBonus: newEmpBonus,
      deductionAdvance: newEmpAdvance,
      deductionTax: calculatedTax,
      paymentMethod: newEmpMethod,
      status: "Pending",
      avatarInitials: initials || "EE",
      avatarBg: borderBg
    };

    setEmployees(prev => [...prev, newEmp]);
    setIsNewEmpModalOpen(false);
    
    // reset form fields
    setNewEmpName("");
    setNewEmpRole("");
    setNewEmpSalary(3000);
    setNewEmpOvertime(0);
    setNewEmpBonus(0);
    setNewEmpAdvance(0);
    setNewEmpTaxRatio(15);
    
    addActivityLog(`Added brand new employee payroll record for ${newEmpName}`, '👥', '#3b82f6');
    showToast(`${newEmpName} listed on staff register. Initial payroll status is set to Pending.`);
  };

  const handleDeleteEmployee = (id: string, name: string) => {
    if (confirm(`Remove ${name} from payroll system registry?`)) {
      setEmployees(prev => prev.filter(e => e.id !== id));
      addActivityLog(`Deleted employee payroll record: ${name}`, '🗑️', '#ef4444');
      showToast(`Removed employee ${name} from payroll directory.`);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-[#0d111a] text-[#e0e7f6] selection:bg-teal-500/20 selection:text-white">
      
      {/* Dynamic light glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 z-0">
        <div className="absolute top-[10%] left-[20%] w-[450px] h-[450px] rounded-full bg-indigo-500/10 blur-[130px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[380px] h-[380px] rounded-full bg-teal-400/5 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        
        {/* Banner/Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-[0.2em] mb-1.5">
              <span>💼</span> Human Resources Desk
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">
              Staff Salary & Payroll Management
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              Track contract values, manage deductions, generate premium payslips, and disburse balances direct to operating expense ledgers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsNewEmpModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-xs font-semibold text-white flex items-center gap-2 transition-all duration-200 cursor-pointer hover:scale-[1.02]"
            >
              <UserPlus className="w-4 h-4 text-teal-400" />
              Add New Staff
            </button>
            <button
              onClick={handleBulkPayrollApproval}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-[#0d111a] text-xs font-bold shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_25px_rgba(20,184,166,0.5)] transition-all duration-200 flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <Check className="w-4 h-4" />
              Approve Bulk Payroll
            </button>
          </div>
        </div>

        {/* Global Toast Success Pop */}
        {successToast && (
          <div className="p-4 rounded-2xl border border-teal-500/30 bg-teal-500/10 text-teal-200 text-xs font-bold shadow-[0_0_15px_rgba(20,184,166,0.15)] flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
              <span>{successToast}</span>
            </div>
            <button className="text-teal-400 hover:text-white font-extrabold cursor-pointer" onClick={() => setSuccessToast(null)}>
              ✕
            </button>
          </div>
        )}

        {/* SECTION 1: Top Analytics Cards (3 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.3)] transition-all duration-200 hover:border-white/20 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Monthly Payroll</span>
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform duration-200">
                <DollarSign className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="text-3xl font-black text-white font-mono">
              {currencySymbol}{Math.round(stats.totalPayroll).toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1 font-bold uppercase tracking-widest">
              <span>●</span> Active ledger commitments
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.3)] transition-all duration-200 hover:border-white/20 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Disbursed (Paid)</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform duration-200">
                <CheckCircle className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="text-3xl font-black text-emerald-400 font-mono">
              {currencySymbol}{Math.round(stats.disbursedPayroll).toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-400/80 mt-2 flex items-center gap-1 font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Released successfully
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.3)] transition-all duration-200 hover:border-white/20 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Remaining Pending</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform duration-200">
                <AlertCircle className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="text-3xl font-black text-amber-400 font-mono">
              {currencySymbol}{Math.round(stats.pendingPayroll).toLocaleString()}
            </div>
            <div className="text-[10px] text-amber-400/80 mt-2 flex items-center gap-1 font-bold uppercase tracking-widest">
              <span>⚠</span> Awaiting authorization
            </div>
          </div>

        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="relative w-full md:w-96 select-none">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search staff, designation or EmpID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#05070c]/80 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50 transition-all duration-200"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors cursor-pointer">
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 select-none shrink-0 w-full md:w-auto">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Filter Status:</span>
            <div className="flex bg-[#05070c]/90 border border-white/5 p-1 rounded-xl">
              {(["All", "Paid", "Pending"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                    statusFilter === f 
                      ? "bg-white/[0.08] text-white border border-white/10"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* SECTION 2: Payroll Management Table */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.04] text-slate-400 text-[10px] uppercase font-black tracking-wider">
                  <th className="p-4">Employee</th>
                  <th className="p-4">Base Salary</th>
                  <th className="p-4">Allowances</th>
                  <th className="p-4">Deductions</th>
                  <th className="p-4 font-bold text-white">Net Payable</th>
                  <th className="p-4">Payment Method</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map(emp => {
                    const totalAllowances = emp.allowanceOvertime + emp.allowanceBonus;
                    const totalDeductions = emp.deductionAdvance + emp.deductionTax;
                    const netPayable = emp.baseSalary + totalAllowances - totalDeductions;

                    return (
                      <tr key={emp.id} className="hover:bg-white/[0.02] transition-all duration-200 group">
                        
                        {/* Employee Avatar details */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${emp.avatarBg} text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(255,255,255,0.05)]`}>
                              {emp.avatarInitials}
                            </div>
                            <div className="overflow-hidden">
                              <div className="font-bold text-white group-hover:text-teal-300 transition-colors truncate">
                                {emp.name}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5 font-medium truncate">
                                <span className="font-mono text-xs text-slate-500 font-bold">{emp.id}</span>
                                <span>•</span>
                                <span className="truncate">{emp.role}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Base Salary */}
                        <td className="p-4 font-mono font-bold text-slate-300">
                          {currencySymbol}{emp.baseSalary.toLocaleString()}
                        </td>

                        {/* Allowances */}
                        <td className="p-4">
                          <div className="font-mono space-y-0.5 text-slate-300">
                            {totalAllowances > 0 ? (
                              <>
                                <div className="text-emerald-400 font-bold">{currencySymbol}{totalAllowances.toLocaleString()}</div>
                                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                                  {emp.allowanceOvertime > 0 && `OT: ${currencySymbol}${emp.allowanceOvertime} `} 
                                  {emp.allowanceBonus > 0 && `BNS: ${currencySymbol}${emp.allowanceBonus}`}
                                </div>
                              </>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </div>
                        </td>

                        {/* Deductions */}
                        <td className="p-4">
                          <div className="font-mono space-y-0.5 text-slate-300">
                            {totalDeductions > 0 ? (
                              <>
                                <div className="text-amber-500 font-bold">-{currencySymbol}{totalDeductions.toLocaleString()}</div>
                                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                                  {emp.deductionAdvance > 0 && `ADV: ${currencySymbol}${emp.deductionAdvance} `} 
                                  {emp.deductionTax > 0 && `TAX: ${currencySymbol}${emp.deductionTax}`}
                                </div>
                              </>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </div>
                        </td>

                        {/* Net Payable */}
                        <td className="p-4 font-mono font-black text-white text-sm">
                          {currencySymbol}{Math.round(netPayable).toLocaleString()}
                        </td>

                        {/* Payment Method */}
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                            <span>{emp.paymentMethod}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm ${
                            emp.status === "Paid"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'Paid' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                            {emp.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            {emp.status === "Pending" ? (
                              <button
                                onClick={() => handlePayNow(emp.id)}
                                className="px-3 py-1.5 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-300 text-[10px] font-bold tracking-wider uppercase transition-all duration-150 hover:scale-[1.03] cursor-pointer"
                              >
                                Pay Now
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-semibold font-mono">Paid {emp.payoutDate}</span>
                            )}
                            
                            <button
                              onClick={() => setSelectedSlipEmp(emp)}
                              className="p-1.5 rounded-lg hover:bg-white/[0.04] text-slate-400 hover:text-white transition-colors cursor-pointer"
                              title="Download/Preview Pay-slip"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                              className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Remove Employee"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500 font-medium">
                      ⚠️ No employee or salary records match current parameters.
                    </td>
                  </tr>
                )}
              </tbody>

            </table>
          </div>
        </div>

        {/* SECTION 3: Detailed Ledger Audit Log Trail */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/40 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                📜 Active Payroll Operating Log
              </h3>
              <p className="text-[11px] text-slate-400">All payouts automatically register with your local core operating budgets.</p>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/[0.03] text-slate-400 border border-white/5 uppercase">Audited</span>
          </div>
          
          <div className="border border-white/5 bg-[#05070c]/50 p-4 rounded-xl divide-y divide-white/5 max-h-[140px] overflow-y-auto custom-scrollbar">
            {employees.filter(e => e.status === 'Paid').map(e => (
              <div key={e.id} className="py-2 flex items-center justify-between text-[11px] font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400">●</span>
                  <span className="text-slate-400">Salary Release:</span>
                  <span className="font-bold text-white">{e.name}</span>
                </div>
                <div className="text-right flex items-center gap-4 text-slate-400">
                  <span>Method: {e.paymentMethod}</span>
                  <span className="font-bold text-emerald-400">+{currencySymbol}{Math.round(e.baseSalary + e.allowanceOvertime + e.allowanceBonus - e.deductionAdvance - e.deductionTax).toLocaleString()}</span>
                </div>
              </div>
            ))}
            {employees.filter(e => e.status === 'Paid').length === 0 && (
              <div className="text-center py-4 text-slate-600 font-medium italic">No ledger payout operations recorded on this device session.</div>
            )}
          </div>
        </div>

      </div>

      {/* MODAL WINDOWS: 1) ADD NEW STAFF */}
      {isNewEmpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsNewEmpModalOpen(false)} />
          
          <div className="relative w-full max-w-xl p-6 rounded-3xl border border-white/10 bg-[#0d111a] shadow-[0_25px_50px_rgba(0,0,0,0.8)] space-y-6">
            
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-teal-400" />
                Register New Employee Contract
              </h3>
              <button 
                onClick={() => setIsNewEmpModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white/[0.04] text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Liam Sterling"
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  className="w-full bg-[#05070c] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-teal-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Designation / Role</label>
                <input
                  type="text"
                  placeholder="e.g. Export Coordinator"
                  value={newEmpRole}
                  onChange={(e) => setNewEmpRole(e.target.value)}
                  className="w-full bg-[#05070c] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-teal-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Base Contract ({currencySymbol})</label>
                <input
                  type="number"
                  min="0"
                  value={newEmpSalary}
                  onChange={(e) => setNewEmpSalary(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#05070c] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white font-mono focus:outline-none focus:border-teal-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Est. Overtime Allowances ({currencySymbol})</label>
                <input
                  type="number"
                  min="0"
                  value={newEmpOvertime}
                  onChange={(e) => setNewEmpOvertime(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#05070c] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white font-mono focus:outline-none focus:border-teal-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bonus Allowances ({currencySymbol})</label>
                <input
                  type="number"
                  min="0"
                  value={newEmpBonus}
                  onChange={(e) => setNewEmpBonus(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#05070c] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white font-mono focus:outline-none focus:border-teal-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Advance Salary Deduction ({currencySymbol})</label>
                <input
                  type="number"
                  min="0"
                  value={newEmpAdvance}
                  onChange={(e) => setNewEmpAdvance(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#05070c] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white font-mono focus:outline-none focus:border-teal-500/50"
                />
              </div>

              <div className="space-y-1 col-span-1 sm:col-span-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  <span>Withholding Income Tax Percent</span>
                  <span className="font-mono text-teal-400 font-bold">{newEmpTaxRatio}% (Est. {currencySymbol}{Math.round(newEmpSalary * (newEmpTaxRatio / 100))})</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="35"
                  step="5"
                  value={newEmpTaxRatio}
                  onChange={(e) => setNewEmpTaxRatio(parseInt(e.target.value))}
                  className="w-full accent-teal-500"
                />
              </div>

              <div className="space-y-1 col-span-1 sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Disbursement Gateway</label>
                <select
                  value={newEmpMethod}
                  onChange={(e) => setNewEmpMethod(e.target.value as any)}
                  className="w-full bg-[#05070c] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-teal-500/50"
                >
                  <option value="Bank Transfer">🏢 Bank wire Transfer (SWIFT / Local RTGS)</option>
                  <option value="Mobile Wallet">📱 Mobile Payment Ecosystem (bKash / Wallet)</option>
                  <option value="Cash">💵 Operating Currency Cash Counter</option>
                </select>
              </div>

            </div>

            {/* Form submission controls */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
              <button
                onClick={() => setIsNewEmpModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNewEmployee}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-[#0d111a] text-xs font-bold transition-all duration-200 cursor-pointer"
              >
                Confirm Contract
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL WINDOWS: 2) PREVIEW PAY-SLIP DOC */}
      {selectedSlipEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setSelectedSlipEmp(null)} />
          
          <div className="relative w-full max-w-xl p-6 rounded-3xl border border-white/10 bg-[#0d111a] shadow-[0_25px_50px_rgba(0,0,0,0.8)] space-y-6">
            
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-md font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-400" />
                Employee Pay-slip Ledger Receipt
              </h3>
              <button 
                onClick={() => setSelectedSlipEmp(null)}
                className="w-8 h-8 rounded-full hover:bg-white/[0.04] text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Payslip Design */}
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-white/5 space-y-6 text-slate-300 relative print:bg-white print:text-black">
              
              <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-teal-400 to-cyan-500" />

              {/* Branding header inside slip */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-black text-white text-base tracking-tight">{settings?.shopProfile?.name || 'TradeFlow Ltd.'}</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">Corporate Headquarters Register</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold uppercase tracking-widest text-teal-400">Salary Slip</div>
                  <div className="text-[10px] font-mono text-zinc-500 mt-0.5">ID: {selectedSlipEmp.id}</div>
                </div>
              </div>

              {/* Employee Detail segment */}
              <div className="grid grid-cols-2 gap-4 border-y border-white/5 py-4 text-xs">
                <div>
                  <div className="text-zinc-500 font-bold uppercase text-[9px] tracking-wider">Employee Name</div>
                  <div className="font-bold text-white mt-0.5">{selectedSlipEmp.name}</div>
                  <div className="text-[10px] text-zinc-400 mt-1">{selectedSlipEmp.role}</div>
                </div>
                <div className="text-right">
                  <div className="text-zinc-500 font-bold uppercase text-[9px] tracking-wider">Disbursement Date</div>
                  <div className="font-bold text-white mt-0.5">{selectedSlipEmp.payoutDate || 'Pending Status'}</div>
                  <div className="text-[10px] text-zinc-400 mt-1">Via {selectedSlipEmp.paymentMethod}</div>
                </div>
              </div>

              {/* Ledger breakdown list */}
              <div className="space-y-3">
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Balance Accounting Details</div>
                
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-zinc-400">Base Contract Salary</span>
                    <span className="font-mono text-white font-medium">{currencySymbol}{selectedSlipEmp.baseSalary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5 text-emerald-400">
                    <span>Overtime Allowance</span>
                    <span className="font-mono font-medium">+{currencySymbol}{selectedSlipEmp.allowanceOvertime.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5 text-emerald-400">
                    <span>Bonus Allowance</span>
                    <span className="font-mono font-medium">+{currencySymbol}{selectedSlipEmp.allowanceBonus.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5 text-amber-500">
                    <span>Salary Advance Deduction</span>
                    <span className="font-mono font-medium">-{currencySymbol}{selectedSlipEmp.deductionAdvance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5 text-amber-500">
                    <span>Withholding Income Taxes</span>
                    <span className="font-mono font-medium">-{currencySymbol}{selectedSlipEmp.deductionTax.toLocaleString()}</span>
                  </div>
                </div>

                {/* Final calculated total sum */}
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 mt-4 flex justify-between items-center">
                  <span className="font-bold text-white">Net Disbursed Payable</span>
                  <span className="font-mono font-black text-teal-400 text-base">
                    {currencySymbol}{Math.round(
                      selectedSlipEmp.baseSalary + 
                      selectedSlipEmp.allowanceOvertime + 
                      selectedSlipEmp.allowanceBonus - 
                      selectedSlipEmp.deductionAdvance - 
                      selectedSlipEmp.deductionTax
                    ).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Status declaration stamp */}
              <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-2 border-t border-white/5">
                <span>Computerized Audit Certified</span>
                <span className={`inline-flex items-center gap-1.5 font-black uppercase tracking-widest ${selectedSlipEmp.status === 'Paid' ? 'text-emerald-400' : 'text-amber-500'}`}>
                  STATUS: {selectedSlipEmp.status}
                </span>
              </div>

            </div>

            {/* Preview controls */}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
              <button
                onClick={() => setSelectedSlipEmp(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                Close Preview
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-[#0d111a] text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Print Payslip
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export const StaffPayroll = React.memo(StaffPayrollComponent);
