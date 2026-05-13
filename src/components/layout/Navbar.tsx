import React from 'react';
import { Icon } from '../icons';
import { Button, Input } from '../ui/Base';

export const Navbar = ({ title, toggleMobileSidebar }: any) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleMobileSidebar}
          className="lg:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-500"
        >
          <Icon.Menu size={20} />
        </button>
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-600/10 focus-within:border-blue-600 transition-all">
          <Icon.Search size={18} className="text-slate-400" />
          <input 
            placeholder="Search anything..." 
            className="bg-transparent border-none focus:outline-none text-sm px-2 w-64"
          />
        </div>

        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <Icon.Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>

        <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block" />

        <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors hidden sm:flex">
          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
            <Icon.User size={18} className="text-slate-600" />
          </div>
        </div>
      </div>
    </header>
  );
};
