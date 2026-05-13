import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Icon } from '../icons';
import { Button } from './Base';
import { cn } from '../../lib/utils';

export const Modal = ({ isOpen, onClose, title, children, footer, className }: any) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="fixed inset-0 z-[51] flex items-center justify-center pointer-events-none p-4"
          >
            <div className={cn("bg-white w-full max-w-lg rounded-2xl shadow-2xl pointer-events-auto overflow-hidden flex flex-col", className)}>
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                <h3 className="font-bold text-lg text-slate-800">{title}</h3>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                  <Icon.Close size={20} />
                </button>
              </div>
              <div className="px-6 py-6 overflow-y-auto max-h-[85vh]">
                {children}
              </div>
              {footer && (
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                  {footer}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
