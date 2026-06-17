import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, Check, Ship, DollarSign, TrendingUp, AlertTriangle, 
  Package, Truck, FileText, Globe, Layers, Users, Shield, Zap, 
  Mail, BarChart3, LineChart, Play, Sparkles, Award, Star, Settings, 
  Calendar, Percent, ArrowUpRight, Menu, X, Plus, Clock, Search, 
  ArrowDownCircle, CheckCircle2, ShieldCheck, Database, FileCheck
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';

export const LandingPage = ({ onStart }: { onStart: () => void }) => {
  // Theme state: defaults to premium dark mode (Mercury / Linear style)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // States for live metric counters
  const [volume, setVolume] = useState(0);
  const [items, setItems] = useState(0);
  const [shipments, setShipments] = useState(0);
  const [savedMargin, setSavedMargin] = useState(0);

  // Active Shipment progress item select
  const [activeStageIdx, setActiveStageIdx] = useState<number>(2); // Default is "In Transit"

  // Live Operations Ledger Feeds
  const [logFeed, setLogFeed] = useState([
    { id: 'TF-8942', type: 'IMPORT', cargo: 'Synthetic Resins', port: 'Chittagong Port', val: '৳1,750,000', status: 'Passed Custom' },
    { id: 'TF-3891', type: 'EXPORT', cargo: 'Organic Jute Yarn', port: 'Port of Rotterdam', val: '৳3,450,000', status: 'Arrived Port' },
    { id: 'TF-4910', type: 'STATUS', cargo: 'Precision Electronics', port: 'Singapore Terminal', val: '৳5,800,000', status: 'In Ocean Transit' }
  ]);

  // Simulate count-up metrics & live ops stream updates
  useEffect(() => {
    let isMounted = true;
    const duration = 1500; // 1.5s
    const steps = 30;
    const stepTime = duration / steps;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      if (isMounted) {
        // Targets: volume 15M+, items 50K+, shipments 5K+, savedMargin 18.4%
        setVolume(Math.min(Math.round((15 * step) / steps), 15));
        setItems(Math.min(Math.round((50 * step) / steps), 50));
        setShipments(Math.min(Math.round((5000 * step) / steps), 5000));
        setSavedMargin(parseFloat(Math.min((18.4 * step) / steps, 18.4).toFixed(1)));
      }
      if (step >= steps) {
        clearInterval(interval);
      }
    }, stepTime);

    // Periodically append live logistical streams
    const streamInterval = setInterval(() => {
      if (isMounted) {
        setLogFeed(prev => {
          const next = [...prev];
          next.pop();
          const listItems = [
            { id: `TF-${Math.floor(1000 + Math.random() * 9000)}`, type: 'IMPORT', cargo: 'Petrochemical Polymers', port: 'Chittagong Gate', val: '৳2,180,000', status: 'Duty Paid' },
            { id: `TF-${Math.floor(1000 + Math.random() * 9000)}`, type: 'EXPORT', cargo: 'Woven Cotton Fabrics', port: 'Hamburg Terminal', val: '৳4,250,500', status: 'On Carrier' },
            { id: `TF-${Math.floor(1000 + Math.random() * 9000)}`, type: 'STATUS', cargo: 'Automotive Subassemblies', port: 'Yokohama Port', val: '৳9,820,000', status: 'Cleared Exit' }
          ];
          next.unshift(listItems[Math.floor(Math.random() * listItems.length)]);
          return next;
        });
      }
    }, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      clearInterval(streamInterval);
    };
  }, []);

  // Standard AreaChart pricing index trend representing real margin outcomes
  const chartData = [
    { name: 'Jan', Profit: 380000, Revenue: 1800000 },
    { name: 'Feb', Profit: 620000, Revenue: 2400000 },
    { name: 'Mar', Profit: 840000, Revenue: 3100000 },
    { name: 'Apr', Profit: 1100000, Revenue: 4200000 },
    { name: 'May', Profit: 1450000, Revenue: 5100000 },
    { name: 'Jun', Profit: 1980000, Revenue: 6800000 },
  ];

  const trackingStages = [
    { name: 'Order Placed', date: 'Jun 10, 2026', loc: 'Vendor Hub (Duisburg)', status: 'Verified', desc: 'Commercial invoice parsed. Freight forwarder booked.' },
    { name: 'Port of Origin', date: 'Jun 11, 2026', loc: 'Hamburg Terminal 4', status: 'Completed', desc: 'Container sealed & declared under HS Code 3907.' },
    { name: 'In Transit', date: 'Jun 13, 2026', loc: 'Atlantic Route Corridor', status: 'In Progress', desc: 'Carrier moving at 22 knots. Temperature/humidity stabilized.' },
    { name: 'Customs Clearance', date: 'Est: Jun 17, 2026', loc: 'Chittagong Port', status: 'Scheduled', desc: 'AI Optimal Tariff Assessment staged automatically.' },
    { name: 'Delivered', date: 'Est: Jun 19, 2026', loc: 'Capital Warehouse', status: 'Pending', desc: 'Auto-updated stock ledger entries ready for intake.' }
  ];

  // Helper smooth scroll
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen relative overflow-x-hidden font-sans transition-colors duration-500 selection:bg-blue-500/20 selection:text-blue-300 ${isDark ? 'bg-[#0B1220] text-slate-100' : 'bg-[#FAFCFF] text-slate-900'}`}>
      
      {/* Premium Spotlight Background blobs for Elite presentation */}
      {isDark ? (
        <>
          <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-blue-500/10 to-emerald-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
          <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none z-0" />
          <div className="absolute bottom-[20%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[150px] pointer-events-none z-0" />
        </>
      ) : (
        <>
          <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-blue-500/5 to-emerald-500/5 rounded-full blur-[100px] pointer-events-none z-0" />
          <div className="absolute top-[50%] right-[-10%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none z-0" />
        </>
      )}

      {/* STYLISH NAV-BAR (HEADER) */}
      <header className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 border-b backdrop-blur-md shadow-sm ${isDark ? 'bg-[#0B1220]/80 border-white/10' : 'bg-white/80 border-slate-200/80'}`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo Brand pairing */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => scrollTo('hero')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center shadow-md shadow-blue-500/10 text-white font-extrabold text-lg">
              🚢
            </div>
            <div className="flex flex-col">
              <span className={`text-xl font-extrabold tracking-tight leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
                TradeFlow
              </span>
              <span className="text-[9px] font-bold tracking-widest text-[#059669] uppercase font-mono mt-1">
                ENTERPRISE SaaS
              </span>
            </div>
          </div>

          {/* Clean minimal navigation links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold tracking-wider font-mono">
            {[
              { label: 'Overview', id: 'hero' },
              { label: 'SaaS Volume', id: 'metrics' },
              { label: 'Core Capabilities', id: 'features' },
              { label: 'Visual Cockpit', id: 'dashboard-preview' },
              { label: 'Tracking', id: 'tracker' },
              { label: 'Import & Export', id: 'showcase' },
              { label: 'Endorsements', id: 'testimonials' }
            ].map((link) => (
              <button 
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className={`transition-colors cursor-pointer uppercase ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-700 hover:text-blue-600'}`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right Side: Theme toggles and Launch CTA */}
          <div className="flex items-center gap-4">
            
            {/* SaaS Design System Swapper */}
            <div className={`p-1 rounded-full flex items-center border ${isDark ? 'bg-[#0F172A] border-white/10' : 'bg-slate-100 border-slate-200'}`}>
              <button
                onClick={() => setTheme('light')}
                className={`p-1.5 rounded-full transition-all flex items-center gap-1 ${!isDark ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-white'}`}
                title="Stripe Light System"
              >
                <span className="text-xs">☀️</span>
                {!isDark && <span className="text-[9px] font-mono font-bold uppercase tracking-wider pr-1">Light</span>}
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`p-1.5 rounded-full transition-all flex items-center gap-1 ${isDark ? 'bg-blue-600 shadow text-white' : 'text-slate-500 hover:text-slate-800'}`}
                title="Linear Dark System"
              >
                <span className="text-xs">🌙</span>
                {isDark && <span className="text-[9px] font-mono font-bold uppercase tracking-wider pr-1 text-white text-opacity-90">Dark</span>}
              </button>
            </div>

            <button
              onClick={onStart}
              className="hidden sm:inline-flex px-5 py-2.5 rounded-xl text-xs font-bold font-mono tracking-wider bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-[0_4px_14px_rgba(37,99,235,0.25)] items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <span>Launch App</span>
              <ArrowRight size={14} />
            </button>

            {/* Mobile hamburger open */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`md:hidden p-2 rounded-xl border ${isDark ? 'border-white/10 text-white' : 'border-slate-200 text-slate-800'}`}
            >
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile menu panel */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`md:hidden border-t overflow-hidden shadow-xl ${isDark ? 'bg-[#0B1220] border-white/10' : 'bg-white border-slate-200'}`}
            >
              <div className="p-6 flex flex-col gap-4 text-xs font-bold font-mono">
                {[
                  { label: 'Overview', id: 'hero' },
                  { label: 'SaaS Volume', id: 'metrics' },
                  { label: 'Core Capabilities', id: 'features' },
                  { label: 'Visual Cockpit', id: 'dashboard-preview' },
                  { label: 'Tracking', id: 'tracker' },
                  { label: 'Import & Export', id: 'showcase' },
                  { label: 'Endorsements', id: 'testimonials' }
                ].map((link) => (
                  <button
                    key={link.id}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      scrollTo(link.id);
                    }}
                    className={`text-left py-2 border-b uppercase pb-2 ${isDark ? 'border-white/5 text-slate-300 hover:text-white' : 'border-slate-200 text-slate-700 hover:text-blue-600'}`}
                  >
                    {link.label}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onStart();
                  }}
                  className="w-full mt-2 py-3 rounded-xl bg-blue-600 text-white font-bold text-center flex items-center justify-center gap-1.5"
                >
                  <span>Launch Live Platform</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Spacer to prevent layout shift of fixed top header */}
      <div className="h-20 w-full" />


      {/* THE HERO SECTION (REORGANIZED FOR MAX BREATHING ROOM) */}
      <section id="hero" className="scroll-mt-20 max-w-7xl mx-auto px-6 pt-16 pb-20 lg:pt-24 lg:pb-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left Column: Focused Copy & Elite Spacing */}
          <div className="lg:col-span-6 space-y-8 pr-4">
            {/* Small Trust Capsule */}
            <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase font-mono border ${isDark ? 'bg-blue-500/5 text-blue-400 border-blue-500/20' : 'bg-blue-50/80 text-blue-700 border-blue-200'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
              <span>Fintech-grade Security • ISO 27001 Stamped</span>
            </div>

            {/* Powerful Display Heading */}
            <div className="space-y-4">
              <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Manage global trade <br />
                from one <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">powerful platform</span>
              </h1>
              
              <p className={`text-base sm:text-lg lg:text-xl leading-relaxed max-w-lg ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Track physical inventory, coordinate imports and exports, analyze custom duty parameters, and run your entire workflow with zero infrastructure friction.
              </p>
            </div>

            {/* Clear Action buttons with breathing room */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button
                onClick={onStart}
                className="px-8 py-4 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-500 hover:shadow-xl hover:shadow-blue-500/25 transition-all text-center inline-flex items-center justify-center gap-2 cursor-pointer text-sm font-mono tracking-wider hover:-translate-y-0.5"
              >
                <span>Launch Console</span>
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => scrollTo('tracker')}
                className={`px-8 py-4 rounded-xl font-bold border transition-all text-center inline-flex items-center justify-center gap-2 cursor-pointer text-sm font-mono tracking-wider hover:-translate-y-0.5 ${isDark ? 'bg-slate-900/60 border-white/10 text-slate-100 hover:bg-slate-800/80' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}
              >
                <Play size={14} className="fill-current text-[#2563EB]" />
                <span>Watch Lifecycle</span>
              </button>
            </div>

            {/* Sleek inline credibility row */}
            <div className={`pt-10 border-t grid grid-cols-3 gap-6 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
              <div>
                <div className="text-2xl font-extrabold text-[#2563EB] tracking-tight">10k+</div>
                <div className={`text-[10px] font-bold uppercase tracking-wider font-mono mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Transactions</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-[#10B981] tracking-tight">99.9%</div>
                <div className={`text-[10px] font-bold uppercase tracking-wider font-mono mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>System SLA</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-[#F59E0B] tracking-tight">CIF/FOB</div>
                <div className={`text-[10px] font-bold uppercase tracking-wider font-mono mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Standards Spec</div>
              </div>
            </div>
          </div>

          {/* Right Column: Premium High-contrast Interactive Mini telemetry */}
          <div className="lg:col-span-6 relative">
            <div className="relative p-1 rounded-3xl overflow-hidden bg-gradient-to-tr from-blue-600/20 via-slate-800/20 to-emerald-500/20">
              
              {/* Premium Telemetry Box */}
              <div className={`p-6 sm:p-7 rounded-[22px] border ${isDark ? 'bg-[#0F172A] border-white/10' : 'bg-white border-slate-205 shadow-xl'} shadow-2xl`}>
                
                <div className="flex items-center justify-between pb-4 border-b border-slate-850/50 mb-5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-[#EF4444] rounded-full" />
                    <div className="w-2.5 h-2.5 bg-[#F59E0B] rounded-full" />
                    <div className="w-2.5 h-2.5 bg-[#10B981] rounded-full" />
                  </div>
                  <div className={`text-[9px] font-mono tracking-widest font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>LIVE_LOGISTICS_DESK_CONNECTED</div>
                </div>

                <div className="space-y-4">
                  
                  {/* Ledger Widget 1 */}
                  <div className={`flex items-center justify-between p-4 rounded-xl border ${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-600/10 text-blue-500 flex items-center justify-center">
                        <Ship size={16} />
                      </div>
                      <div>
                        <div className={`text-[10px] font-mono font-bold uppercase ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Incoming Freight Route</div>
                        <div className={`text-xs font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>Customs Assessment Terminal 3</div>
                      </div>
                    </div>
                    <span className={`text-xs font-bold font-mono ${isDark ? 'text-[#10B981]' : 'text-emerald-600'}`}>+18% Profit</span>
                  </div>

                  {/* Weight Graph Progress Index */}
                  <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#152033]/50 border-white/5' : 'bg-slate-50 border-slate-202'}`}>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>Chittagong Maritime Intake Index</span>
                      <span className={`font-bold font-mono text-[11px] ${isDark ? 'text-[#10B981]' : 'text-emerald-600'}`}>8.4 Giga-tons</span>
                    </div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                      <div className="w-[78%] h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full" />
                    </div>
                  </div>

                  {/* Sandbox Shell Terminal */}
                  <div className={`p-4 rounded-xl border font-mono text-xs ${isDark ? 'bg-slate-950/80 border-white/5' : 'bg-slate-900 text-white'}`}>
                    <div className="flex items-center justify-between mb-2 text-[10px] text-slate-400 border-b border-slate-800 pb-1">
                      <span>CONSOLE PIPE STATUS</span>
                      <span className="text-emerald-500">SYSTEM_OK</span>
                    </div>
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between text-slate-300">
                        <span className="text-[#2563EB]">TF-8942</span>
                        <span>Synthesis Plastics</span>
                        <span className="font-bold text-emerald-400">৳1.7M</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span className="text-[#2563EB]">TF-3891</span>
                        <span>Organic Yarn</span>
                        <span className="font-bold text-emerald-400">৳3.4M</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>

            {/* Floating indicator widget */}
            <div className={`absolute -right-3 bottom-12 p-4 rounded-2xl border hidden xl:block w-44 shadow-2xl ${isDark ? 'bg-[#0F172A]/90 border-white/10' : 'bg-white border-slate-200'}`}>
              <span className={`block text-[9px] font-bold font-mono uppercase mb-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>DUTY AUTO CALCULATE</span>
              <span className={`text-lg font-extrabold block ${isDark ? 'text-white' : 'text-slate-900'}`}>12.5% Optimal</span>
              <span className={`text-[10px] font-mono font-semibold block mt-1 ${isDark ? 'text-[#10B981]' : 'text-emerald-600'}`}>✓ Saved ৳245,000</span>
            </div>

          </div>

        </div>
      </section>

      {/* REFINED BUSINESS METRICS HIGHLIGHTS (FINTECH STYLE) */}
      <section id="metrics" className={`scroll-mt-20 py-16 border-t border-b transition-colors duration-550 ${isDark ? 'bg-[#0E1524]/60 border-white/10' : 'bg-slate-100/60 border-slate-205'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
            
            <div className="space-y-2">
              <span className="block text-4xl sm:text-5xl font-extrabold text-[#2563EB] font-mono tracking-tight">
                ৳{volume}M+
              </span>
              <span className={`text-[10px] uppercase font-mono tracking-wider font-bold block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Trade Volume Managed
              </span>
            </div>

            <div className="space-y-2">
              <span className={`block text-4xl sm:text-5xl font-extrabold font-mono tracking-tight ${isDark ? 'text-[#10B981]' : 'text-emerald-600'}`}>
                {items}K+
              </span>
              <span className={`text-[10px] uppercase font-mono tracking-wider font-bold block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Inventory Items
              </span>
            </div>

            <div className="space-y-2">
              <span className={`block text-4xl sm:text-5xl font-extrabold font-mono tracking-tight ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                {(shipments / 1000).toFixed(1)}K+
              </span>
              <span className={`text-[10px] uppercase font-mono tracking-wider font-bold block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Shipments Tracked
              </span>
            </div>

            <div className="space-y-2">
              <span className="block text-4xl sm:text-5xl font-extrabold text-[#2563EB] font-mono tracking-tight">
                {savedMargin}%
              </span>
              <span className={`text-[10px] uppercase font-mono tracking-wider font-bold block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Average Margin Saved
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* CORE FEATURES GRID SECTION (UNIFORM DESIGNED CARDS) */}
      <section id="features" className={`scroll-mt-20 py-24 border-b ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase font-mono bg-blue-500/10 text-blue-500 border border-blue-500/10">
              OPERATIONAL BENCHMARK
            </span>
            <h2 className={`text-3xl sm:text-5xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
              Engineered for Enterprise SaaS
            </h2>
            <p className={`text-base sm:text-lg leading-relaxed ${isDark ? 'text-slate-350' : 'text-[#475569]'}`}>
              TradeFlow streamlines core global logistics modules, automatic landed cost divisions, custom declaration, and beautiful client-side PDF documents.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              {
                id: 'feat-1',
                icon: <BarChart3 className="w-5 h-5 text-blue-500" />,
                title: 'Cockpit Analytics',
                desc: 'Observe cashflow metrics, investments, total purchases, and net profit margins instantly.'
              },
              {
                id: 'feat-2',
                icon: <Package className="w-5 h-5 text-emerald-500" />,
                title: 'Smart Inventory',
                desc: 'Group items and warehouse stock by HS Code automatically with real-time intake.'
              },
              {
                id: 'feat-3',
                icon: <ArrowDownCircle className="w-5 h-5 text-blue-500" />,
                title: 'Import Control',
                desc: 'Audit container purchase sheets, supplier invoices, and ocean transit parameters.'
              },
              {
                id: 'feat-4',
                icon: <TrendingUp className="w-5 h-5 text-emerald-500" />,
                title: 'Export Control',
                desc: 'Track export invoice completions, port credits, custom registers, and currency metrics.'
              },
              {
                id: 'feat-5',
                icon: <Truck className="w-5 h-5 text-amber-500" />,
                title: 'Shipment Tracking',
                desc: 'Verify container positions from origins to ports of destinations with modern steppers.'
              },
              {
                id: 'feat-6',
                icon: <FileText className="w-5 h-5 text-blue-500" />,
                title: 'A4 Voucher Engine',
                desc: 'Compile, style, and generate standard A4 vector-quality PDFs client-side with one click.'
              },
              {
                id: 'feat-7',
                icon: <Users className="w-5 h-5 text-blue-500" />,
                title: 'SaaS Directory',
                desc: 'Maintain directories of suppliers, customers, and customs clearing agents securely.'
              },
              {
                id: 'feat-8',
                icon: <Layers className="w-5 h-5 text-emerald-500" />,
                title: 'Financial Ledger',
                desc: 'Instantly construct quarterly registers, gross margins, and export logs.'
              },
              {
                id: 'feat-9',
                icon: <Percent className="w-5 h-5 text-amber-500" />,
                title: 'Landed Margin Split',
                desc: 'Automate landed cost division formulas, VAT calculations, and suggest retail prices.'
              },
              {
                id: 'feat-10',
                icon: <Zap className="w-5 h-5 text-blue-500" />,
                title: 'Optimal Duty Logic',
                desc: 'Identify correct HS codes automatically to reduce tariff margins up to 12.5%.'
              }
            ].map((feat) => (
              <div
                key={feat.id}
                className={`p-6 rounded-2xl border flex flex-col justify-between transition-all duration-300 hover:border-blue-500/20 hover:shadow-lg min-h-[220px] ${isDark ? 'bg-[#0E1524]/50 border-white/10 hover:bg-[#11192C]' : 'bg-white border-slate-200/85 hover:shadow-slate-200/40 hover:bg-slate-50/50'}`}
              >
                <div className="space-y-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-slate-800/60' : 'bg-slate-100'}`}>
                    {feat.icon}
                  </div>
                  <h3 className={`font-extrabold text-sm tracking-tight leading-snug ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
                    {feat.title}
                  </h3>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-[#475569]'}`}>
                    {feat.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* INTERACTIVE VISUAL COCKPIT (THE DASHBOARD WORKSPACE CENTERPIECE) */}
      <section id="dashboard-preview" className={`scroll-mt-20 py-24 border-b ${isDark ? 'border-white/10' : 'border-slate-200'} bg-gradient-to-b ${isDark ? 'from-[#0B1220] to-[#0D1525]' : 'from-[#FAFCFF] to-[#F1F5F9]'}`}>
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase font-mono bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/10">
              INTELLIGENT INSIGHTS COCKPIT
            </span>
            <h2 className={`text-3xl sm:text-5xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
              The Operations Command Center
            </h2>
            <p className={`text-base sm:text-lg leading-relaxed ${isDark ? 'text-slate-330' : 'text-[#475569]'}`}>
              Simulate actual system metrics below. Real equal-height layouts, pristine grid alignment, and accurate telemetry updates.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            
            {/* Main Mockup Screen Chassis */}
            <div className={`rounded-3xl border p-5 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md ${isDark ? 'bg-[#0E1524]/90 border-white/10 shadow-black/80' : 'bg-white border-slate-200 shadow-xl shadow-slate-100'}`}>
              
              {/* Cockpit Title Line */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-6 border-b border-dashed border-slate-200/80 dark:border-slate-800/10 mb-8 font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-50 animate-pulse" />
                  <span className={`text-[11px] font-bold tracking-wider uppercase ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>COCKPIT_LEDGER_A7_LIVE</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'} hidden lg:inline`}>BBDT/USD Multi-currency enabled</span>
                  <button onClick={onStart} className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] uppercase tracking-wider font-mono">Launch Workspace</button>
                </div>
              </div>

              {/* PERFECT 5-COLUMN EQUAL CARD GRID (Investment, Total Buy, Total Sell, Profit, Stock) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
                
                {/* 1. INVESTMENT CARD */}
                <div className={`p-5 rounded-2xl border flex flex-col justify-between min-h-[140px] transition-all ${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-slate-400">
                      <span className={`text-[10px] font-bold font-mono uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Investment</span>
                      <DollarSign size={14} className="text-[#2563EB]" />
                    </div>
                    <div className={`text-lg font-extrabold tracking-tight mt-1 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>৳12,500,000</div>
                  </div>
                  <span className={`text-[9px] font-mono font-bold flex items-center gap-1 ${isDark ? 'text-emerald-500' : 'text-emerald-600'}`}>
                    <TrendingUp size={10} /> +14.2% Base
                  </span>
                </div>

                {/* 2. TOTAL BUY (IMPORT) */}
                <div className={`p-5 rounded-2xl border flex flex-col justify-between min-h-[140px] transition-all ${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-slate-400">
                      <span className={`text-[10px] font-bold font-mono uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Buy</span>
                      <ArrowDownCircle size={14} className="text-[#2563EB]" />
                    </div>
                    <div className={`text-lg font-extrabold tracking-tight mt-1 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>৳8,450,200</div>
                  </div>
                  <span className={`text-[9px] font-mono font-bold ${isDark ? 'text-[#2563EB]' : 'text-blue-600'}`}>45 standard cargo</span>
                </div>

                {/* 3. TOTAL SELL (EXPORT) */}
                <div className={`p-5 rounded-2xl border flex flex-col justify-between min-h-[140px] transition-all ${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-slate-400">
                      <span className={`text-[10px] font-bold font-mono uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Sell</span>
                      <ArrowUpRight size={14} className="text-[#10B981]" />
                    </div>
                    <div className={`text-lg font-extrabold tracking-tight mt-1 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>৳18,920,000</div>
                  </div>
                  <span className={`text-[9px] font-mono font-bold ${isDark ? 'text-[#10B981]' : 'text-emerald-600'}`}>৳1.2M pending collect</span>
                </div>

                {/* 4. NET PROFIT */}
                <div className={`p-5 rounded-2xl border-2 flex flex-col justify-between min-h-[140px] transition-all ${isDark ? 'border-emerald-500/20 bg-[#10B981]/5' : 'border-emerald-250 bg-emerald-50/40'}`}>
                  <div className="space-y-1.5">
                    <div className={`flex justify-between items-center ${isDark ? 'text-[#10B981]' : 'text-emerald-700'}`}>
                      <span className="text-[10px] font-bold font-mono uppercase tracking-wider">Net Profit</span>
                      <CheckCircle2 size={14} className={isDark ? 'text-[#10B981]' : 'text-emerald-700'} />
                    </div>
                    <div className={`text-lg font-black tracking-tight mt-1 ${isDark ? 'text-[#10B981]' : 'text-emerald-700'}`}>৳10,469,800</div>
                  </div>
                  <span className={`text-[9px] font-mono font-bold ${isDark ? 'text-[#10B981]' : 'text-emerald-700'}`}>55.3% Gross Margin</span>
                </div>

                {/* 5. STOCK ASSETS */}
                <div className={`p-5 rounded-2xl border flex flex-col justify-between min-h-[140px] transition-all ${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-slate-400">
                      <span className={`text-[10px] font-bold font-mono uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Stock Assets</span>
                      <Package size={14} className="text-[#F59E0B]" />
                    </div>
                    <div className={`text-lg font-extrabold tracking-tight mt-1 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>৳4,049,800</div>
                  </div>
                  <span className={`text-[9px] font-mono font-bold ${isDark ? 'text-[#F59E0B]' : 'text-amber-600'}`}>9,200 metric volume</span>
                </div>

              </div>

              {/* Professional Chart Container */}
              <div className={`p-6 rounded-2xl border mb-6 ${isDark ? 'bg-slate-900/40 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h4 className={`text-xs font-mono font-bold uppercase tracking-wider ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>Sourcing Margin Performance Indicators</h4>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Estimated revenue margin vs verified net profit indices</p>
                  </div>
                  <span className="px-2.5 py-1 text-[9px] font-mono font-bold bg-blue-600/10 text-blue-600 rounded">YTD ACTUAL ACTIVE</span>
                </div>

                <div className="h-48 font-mono text-[10px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} />
                      <XAxis dataKey="name" stroke="#64748b" opacity={0.5} strokeWidth={1} />
                      <YAxis stroke="#64748b" opacity={0.5} strokeWidth={1} />
                      <Tooltip contentStyle={{ background: isDark ? '#0F172A' : '#FFFFFF', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #CBD5E1', borderRadius: '8px', color: isDark ? '#FFF' : '#0F172A' }} />
                      <Area type="monotone" dataKey="Profit" stroke="#2563EB" fill="url(#colorProfit2)" strokeWidth={2} />
                      <Area type="monotone" dataKey="Revenue" stroke="#10B981" fill="url(#colorRevenue2)" strokeWidth={1.5} strokeDasharray="3 3" />
                      <defs>
                        <linearGradient id="colorProfit2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorRevenue2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.05}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                 </div>
              </div>

              {/* Sub-widget: Active Port Transit Details */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${isDark ? 'bg-slate-900/40 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-3">
                  <div className="text-xl">🚢</div>
                  <div>
                    <span className={`font-bold text-xs block ${isDark ? 'text-slate-300' : 'text-slate-900'}`}>MSC GERALDINE (Oceans Lane Container)</span>
                    <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>Hamburg Port Terminal D ➔ Chittagong Port Gateway</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded font-bold font-mono text-[9px] ${isDark ? 'bg-[#F59E0B]/10 text-amber-450' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>IN OCEAN TRANSIT CORRIDOR</span>
                  <span className={`text-xs font-mono font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>ETA: 3 Days</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* SHIPMENT LIFECYCLE PROGRESS TRACKER */}
      <section id="tracker" className={`scroll-mt-20 py-24 border-b ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase font-mono ${isDark ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
              STAGED CLEARANCE PIPELINE
            </span>
            <h2 className={`text-3xl sm:text-5xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Interactive Tracking Steps
            </h2>
            <p className={`text-base sm:text-lg leading-relaxed ${isDark ? 'text-slate-350' : 'text-slate-600'}`}>
              Observe each port clearance phase live. Click on stages to audit custom stamps, HS declarations, and automated inland cost allocations.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            
            {/* Horizontal timeline connector */}
            <div className="relative flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
              <div className={`absolute top-1/2 left-[10%] right-[10%] h-[2px] -translate-y-1/2 hidden md:block ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
              
              {/* Active progress color */}
              <div 
                className="absolute top-1/2 left-[10%] h-[2px] bg-blue-600 -translate-y-1/2 transition-all duration-500 hidden md:block"
                style={{ width: `${activeStageIdx * 20}%` }}
              />

              {trackingStages.map((stage, i) => {
                const isActive = activeStageIdx === i;
                const isPassed = i < activeStageIdx;

                let stateClasses = isDark ? 'bg-slate-900 border-white/10 text-slate-500' : 'bg-white border-slate-300 text-slate-500';
                if (isActive) {
                  stateClasses = 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-500/20 ring-4 ring-blue-500/10 scale-105';
                } else if (isPassed) {
                  stateClasses = 'bg-emerald-600 border-emerald-500 text-white';
                }

                return (
                  <button
                    key={stage.name}
                    onClick={() => setActiveStageIdx(i)}
                    className="relative z-10 flex flex-row md:flex-col items-center gap-4 cursor-pointer outline-none md:w-1/5 text-left md:text-center group"
                  >
                    
                    <div className={`w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all duration-350 font-mono text-xs font-bold ${stateClasses}`}>
                      {isPassed && !isActive ? <Check size={14} /> : <span>0{i + 1}</span>}
                    </div>

                    <div className="flex flex-col">
                      <span className={`text-[11px] font-bold leading-normal transition-colors ${isActive ? 'text-blue-600' : (isDark ? 'text-slate-400' : 'text-slate-700')} group-hover:text-blue-650`}>
                        {stage.name}
                      </span>
                      <span className={`text-[9px] font-mono font-semibold uppercase ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>{stage.status}</span>
                    </div>

                  </button>
                );
              })}
            </div>

            {/* Stage Detailed Info Box */}
            <div className={`p-6 sm:p-8 rounded-2xl border ${isDark ? 'bg-slate-900/40 border-white/10' : 'bg-white border-slate-205 shadow-sm'}`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-slate-200/80 dark:border-slate-800/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-500 flex items-center justify-center">
                    <Truck size={18} />
                  </div>
                  <div>
                    <h3 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{trackingStages[activeStageIdx].name}</h3>
                    <p className={`text-[10px] font-mono uppercase ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>Verified Custom Customs & Transit Stamp</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full font-bold font-mono text-[10px] uppercase ${isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
                  {trackingStages[activeStageIdx].status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm mb-6 font-mono">
                <div>
                  <span className={`block text-[9px] uppercase tracking-wider mb-1 font-bold ${isDark ? 'text-slate-500' : 'text-slate-605'}`}>Reporting Port Location</span>
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{trackingStages[activeStageIdx].loc}</span>
                </div>
                <div>
                  <span className={`block text-[9px] uppercase tracking-wider mb-1 font-bold ${isDark ? 'text-slate-500' : 'text-slate-605'}`}>Date Stamped</span>
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{trackingStages[activeStageIdx].date}</span>
                </div>
                <div>
                  <span className={`block text-[9px] uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-605'}`}>Clearance Phase Key</span>
                  <span className={`font-bold flex items-center gap-1 text-[11px] ${isDark ? 'text-[#10B981]' : 'text-emerald-700'}`}>
                    <ShieldCheck size={14} />
                    <span>DIGITALLY_APPROVED</span>
                  </span>
                </div>
              </div>

              <p className={`pt-6 border-t border-slate-200/85 dark:border-slate-800/10 text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-650'}`}>
                <strong>Status Update Log:</strong> {trackingStages[activeStageIdx].desc}
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* SEAMLESS INBOUND & OUTBOUND CASE DUELISM */}
      <section id="showcase" className={`scroll-mt-20 py-24 border-b ${isDark ? 'border-white/10' : 'border-slate-200'} bg-gradient-to-b ${isDark ? 'from-[#0B1220] to-[#0A0F1B]' : 'from-[#FAFCFF] to-[#FFFFFF]'}`}>
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase font-mono ${isDark ? 'bg-blue-500/10 text-blue-400 border border-blue-500/10' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
              DUAL LOGISTICAL SPEC
            </span>
            <h2 className={`text-3xl sm:text-5xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Inbound & Outbound Dualism
            </h2>
            <p className={`text-base sm:text-lg leading-relaxed ${isDark ? 'text-slate-350' : 'text-slate-600'}`}>
              Verify both importing and exporting workflows through identical, elegant data-tables, automatic tariff margins, and verified custom records.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            
            {/* Import Showcase */}
            <div className={`p-6 sm:p-8 rounded-3xl border flex flex-col justify-between ${isDark ? 'bg-slate-900/40 border-white/10' : 'bg-white border-slate-205 shadow-sm shadow-slate-100/50'}`}>
              <div className="space-y-6">
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-500 flex items-center justify-center">
                      <ArrowDownCircle size={20} />
                    </div>
                    <div>
                      <h3 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Import Management</h3>
                      <p className={`text-[10px] uppercase font-mono tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>Suppliers, POs & Landed Costs</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-[9px] font-mono font-bold rounded ${isDark ? 'bg-blue-600/10 text-blue-450' : 'bg-blue-50 text-blue-700 border border-blue-150'}`}>CIF INVOICES</span>
                </div>

                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Trace supplier commercial invoices, total landed cost divisions, customs values, and target port requirements with zero compliance friction.
                </p>

                {/* Import Grid widget */}
                <div className={`rounded-xl border font-mono text-xs overflow-hidden ${isDark ? 'border-white/5 bg-[#0A0F1B]/90' : 'border-slate-200 bg-slate-50'}`}>
                  <div className={`grid grid-cols-3 p-3 font-bold border-b ${isDark ? 'border-white/5 bg-slate-900/60' : 'border-slate-300 bg-slate-100 text-slate-900'}`}>
                    <span>Supplier PO</span>
                    <span>Cargo Specs</span>
                    <span className="text-right">CIF Stamp</span>
                  </div>
                  <div className={`p-3 space-y-2 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-705'}`}>
                    <div className="grid grid-cols-3">
                      <span className="text-blue-600 font-bold">#PO-HA-748</span>
                      <span>Synthetic Resins</span>
                      <span className={`text-right font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>৳1,420,000</span>
                    </div>
                    <div className={`grid grid-cols-3 pt-2 border-t ${isDark ? 'border-slate-800/10' : 'border-slate-200'}`}>
                      <span className="text-blue-600 font-bold">#PO-SI-930</span>
                      <span>Textile Fabrics</span>
                      <span className={`text-right font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>৳3,800,000</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <Check className="text-emerald-500 w-4 h-4 shrink-0" />
                    <span className={isDark ? 'text-slate-305' : 'text-slate-700'}>Splits base cost, import tax and logistics assets</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="text-emerald-500 w-4 h-4 shrink-0" />
                    <span className={isDark ? 'text-slate-305' : 'text-slate-700'}>Real-time HS optimum margin allocation</span>
                  </div>
                </div>

              </div>

              <button onClick={onStart} className="w-full mt-8 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs font-mono uppercase tracking-wider shadow-md shadow-blue-500/15">
                <span>Configure Import Suite</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Export Showcase */}
            <div className={`p-6 sm:p-8 rounded-3xl border flex flex-col justify-between ${isDark ? 'bg-slate-900/40 border-white/10' : 'bg-white border-slate-205 shadow-sm shadow-slate-100/50'}`}>
              <div className="space-y-6">
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-500 flex items-center justify-center">
                      <TrendingUp size={20} />
                    </div>
                    <div>
                      <h3 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Export Management</h3>
                      <p className={`text-[10px] uppercase font-mono tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>Buyers, Challans & Port Bill credits</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-[9px] font-mono font-bold rounded ${isDark ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-emerald-55 text-emerald-800 border border-emerald-150'}`}>PORT TAX CREDITS</span>
                </div>

                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-330' : 'text-slate-600'}`}>
                  Record outgoing containers to international partners, compile commercial export bills, register cargo challans, and track global currency trades.
                </p>

                {/* Export Grid widget */}
                <div className={`rounded-xl border font-mono text-xs overflow-hidden ${isDark ? 'border-white/5 bg-[#0A0F1B]/90' : 'border-slate-200 bg-slate-50'}`}>
                  <div className={`grid grid-cols-3 p-3 font-bold border-b ${isDark ? 'border-white/5 bg-slate-900/60' : 'border-slate-300 bg-slate-100 text-slate-900'}`}>
                    <span>Buyer Client</span>
                    <span>Ocean Vessel</span>
                    <span className="text-right">Bill Value</span>
                  </div>
                  <div className={`p-3 space-y-2 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-705'}`}>
                    <div className="grid grid-cols-3">
                      <span className="text-emerald-600 font-bold">EuroLink Cargo</span>
                      <span>Hamburg Line</span>
                      <span className={`text-right font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>৳4,500,000</span>
                    </div>
                    <div className={`grid grid-cols-3 pt-2 border-t ${isDark ? 'border-slate-800/10' : 'border-slate-200'}`}>
                      <span className="text-emerald-600 font-bold">US Sourcing SA</span>
                      <span>New York Marine</span>
                      <span className={`text-right font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>৳8,920,000</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <Check className="text-[#10B981] w-4 h-4 shrink-0" />
                    <span className={isDark ? 'text-slate-305' : 'text-slate-700'}>Direct client database tracking integrated</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="text-[#10B981] w-4 h-4 shrink-0" />
                    <span className={isDark ? 'text-slate-305' : 'text-slate-700'}>Generates printable A4 challans & custom export logs</span>
                  </div>
                </div>

              </div>

              <button onClick={onStart} className="w-full mt-8 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs font-mono uppercase tracking-wider shadow-md shadow-emerald-500/15">
                <span>Configure Export Suite</span>
                <ArrowRight size={14} />
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* REFINED ENDORSEMENTS & TESTIMONIALS SECTION */}
      <section id="testimonials" className={`scroll-mt-20 py-24 border-b ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase font-mono bg-blue-500/10 text-[#2563EB] border border-blue-500/10">
              LOGISTICAL ENDORSEMENT
            </span>
            <h2 className={`text-3xl sm:text-5xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
              Trusted by Leading Logistic Directors
            </h2>
            <p className={`text-base sm:text-lg leading-relaxed ${isDark ? 'text-slate-350' : 'text-[#475569]'}`}>
              Global sourcing officers audit their daily container allocations and import-export sheets strictly with TradeFlow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "Before discovering TradeFlow, computing our monthly import landed cost was a massive multiday Excel headache. Today we do it on a single, clean workspace in minutes. Pure elegance.",
                name: "Martin Van Der Berg",
                role: "Operations Chief",
                company: "Rotterdam Shipping Group",
                alias: "M"
              },
              {
                quote: "Our port logistics staff appreciates the absolute lack of clutter. Finding any active container ID, checking HS declarations, and exporting A4 PDF invoices is perfectly intuitive.",
                name: "Rahat Rahman",
                role: "Managing Director",
                company: "Bengal Maritime Ltd",
                alias: "R"
              },
              {
                quote: "The interactive staged timeline trackers and custom calculations are incredibly accurate. This application has restored complete operational trust inside our regional warehouse hubs.",
                name: "Helena Rostova",
                role: "Director of Sourcing",
                company: "EuroLink Freight GmbH",
                alias: "H"
              }
            ].map((test, i) => (
              <div
                key={i}
                className={`p-8 rounded-2xl border flex flex-col justify-between transition-all duration-300 hover:border-blue-500/10 ${isDark ? 'bg-[#0E1524]/70 border-white/10 hover:bg-[#121B2D]' : 'bg-white border-slate-200/80 shadow-sm'}`}
              >
                <div className="space-y-6">
                  <div className="flex items-center gap-1 text-[#F59E0B]">
                    {[...Array(5)].map((_, starIdx) => (
                      <Star key={starIdx} size={13} className="fill-current" />
                    ))}
                  </div>
                  <p className={`text-xs sm:text-sm leading-relaxed italic ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    “{test.quote}”
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-6 border-t border-slate-800/10 mt-8">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-md">
                    {test.alias}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs sm:text-sm">{test.name}</h4>
                    <p className="text-[10px] text-slate-500 font-mono">{test.role} • <strong>{test.company}</strong></p>
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ENTERPRISE CALL TO ACTION WITH PREMIUM DESIGN */}
      <section id="cta" className="scroll-mt-20 py-24 max-w-7xl mx-auto px-6 text-center relative z-10">
        <div className={`p-8 sm:p-16 rounded-[32px] border relative overflow-hidden flex flex-col items-center justify-center ${isDark ? 'bg-gradient-to-br from-[#0F172A] via-[#0C1220] to-[#0F172A] border-blue-500/15 shadow-2xl' : 'bg-white border-slate-205 shadow-2xl shadow-slate-200/40'}`}>
          
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

          <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold font-mono uppercase tracking-widest mb-6 ${isDark ? 'bg-blue-600/10 text-blue-400 border border-blue-600/10' : 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'}`}>
            COMPLIANCE GUARANTEED
          </span>

          <h2 className={`text-3xl sm:text-5xl font-extrabold tracking-tight max-w-2xl mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Ready to scale your business?
          </h2>

          <p className={`text-sm sm:text-base max-w-xl leading-relaxed mb-8 ${isDark ? 'text-slate-300' : 'text-slate-650'}`}>
            Configure your local TradeFlow container, import PO spreadsheets, and analyze customs taxes in under 2 minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md font-mono">
            <button 
              onClick={onStart}
              className="w-full sm:flex-1 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-blue-500/15 hover:-translate-y-0.5"
            >
              <span>Initialize Workspace</span>
              <ArrowRight size={14} />
            </button>
            <button 
              onClick={onStart}
              className={`w-full sm:flex-1 py-3.5 rounded-xl border font-bold transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer hover:-translate-y-0.5 ${isDark ? 'bg-slate-900 border-white/10 hover:bg-slate-800 text-white' : 'bg-white border-slate-300 text-slate-705 hover:bg-slate-50'}`}
            >
              <span>Request Sandbox</span>
            </button>
          </div>

        </div>
      </section>

      {/* FOOTER SECTION */}
      <footer className={`pt-20 pb-12 border-t transition-colors duration-500 ${isDark ? 'bg-[#060A14] border-white/10 text-slate-300' : 'bg-slate-50 border-slate-205 text-slate-700'}`}>
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
            
            <div className="md:col-span-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center text-white text-base font-bold shadow">
                  🚢
                </div>
                <span className={`text-lg font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  TradeFlow
                </span>
              </div>

              <p className={`text-xs sm:text-sm leading-relaxed max-w-md ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                A highly secure, high-end ledger and ERP specialized for global sourcing suppliers, import distributors, and ocean cargo agents. Optimize HS Customs duty allocations, generate compliant invoices, and audit transit lines.
              </p>

              <div className={`flex items-center gap-2 text-xs font-mono font-semibold ${isDark ? 'text-[#10B981]' : 'text-emerald-700'}`}>
                <Award size={15} />
                <span>Verified Compliant with International Port Surcharges</span>
              </div>
            </div>

            {[
              {
                title: 'Product Suite',
                links: ['Dashboard Analytics', 'Inventory Matrix', 'Landed Cost Splits', 'Shipping Steppers', 'A4 PDF Engine']
              },
              {
                title: 'Compliance & SLA',
                links: ['Terms of Carriage', 'SLA Policy Protection', 'Port System Status', 'Contact Sourcing', 'Enterprise Security']
              }
            ].map((col) => (
              <div key={col.title} className="col-span-1 md:col-span-3 space-y-4">
                <h4 className={`text-xs font-bold font-mono uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {col.title}
                </h4>
                <ul className="space-y-2.5 text-xs font-mono">
                  {col.links.map((link) => (
                    <li key={link}>
                      <button 
                        onClick={onStart}
                        className={`text-left transition-colors cursor-pointer ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-blue-600'}`}
                      >
                        {link}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

          </div>

          <div className={`pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-mono uppercase tracking-wider ${isDark ? 'border-white/5 text-slate-500' : 'border-slate-200 text-slate-600'}`}>
            <p>© 2026 TradeFlow Systems Inc. All rights reserved globally. Built for compliance.</p>
            <div className="flex gap-4">
              <span className={isDark ? 'text-emerald-500' : 'text-emerald-700'}>● Local Encrypted Storage Sandbox Active</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
};
