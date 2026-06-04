import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { motion, AnimatePresence } from 'motion/react';
import { Settings as SettingsIcon, Printer, Plus, Trash2, X, Check, Save, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';

interface InvoiceItem {
  id: string;
  description: string;
  qty: number;
  price: number;
}

export const InvoicePage = () => {
  const { settings, updateSettings, transactions, customers, selectedInvoiceId, setSelectedInvoiceId } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  
  // Local state for the editable invoice data
  const [invoiceData, setInvoiceData] = useState({
    invoiceNo: '#INV-1001',
    date: new Date().toLocaleDateString('en-GB'),
    customer: {
      name: 'Customer Name',
      address: 'Customer Address Details',
      phone: '01XXXXXXXXX'
    },
    items: [] as InvoiceItem[],
    notes: '1. Goods once sold are not returnable.\n2. Please pay within 7 days.\n3. Thank you for your business!',
    currency: '৳',
    terms: 'Invoice was created on a computer and is valid without signature.'
  });

  // Sync with global settings and selected transaction
  useEffect(() => {
    let transaction: any = null;
    if (selectedInvoiceId) {
      transaction = transactions.find(t => t.id === selectedInvoiceId);
    }

    if (transaction) {
      const customer = customers.find(c => c.name === transaction.customer_name);
      setInvoiceData(prev => ({
        ...prev,
        invoiceNo: transaction.id.replace('tr_', '#INV-'),
        date: new Date(transaction.date).toLocaleDateString('en-GB'),
        customer: {
          name: transaction.customer_name || 'Walk-in Customer',
          address: customer?.address || 'N/A',
          phone: customer?.phone || 'N/A'
        },
        items: transaction.items ? transaction.items.map((item: any, idx: number) => ({
          id: `item_${idx}`,
          description: item.product_name,
          qty: item.quantity,
          price: item.unit_price
        })) : [{
          id: 'item_0',
          description: transaction.product_name || 'Manual Entry',
          qty: transaction.quantity || 1,
          price: transaction.unit_price || 0
        }]
      }));
    } else if (invoiceData.items.length === 0) {
      // Add one empty row if no items
      setInvoiceData(prev => ({
        ...prev,
        items: [{ id: 'item_' + Date.now(), description: '', qty: 1, price: 0 }]
      }));
    }
  }, [selectedInvoiceId, transactions, customers]);

  const subtotal = invoiceData.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const taxAmount = (subtotal * (settings.invoice.taxRate || 0)) / 100;
  const discountAmount = settings.invoice.discount || 0;
  const grandTotal = subtotal + taxAmount - discountAmount;

  const addItem = () => {
    setInvoiceData(prev => ({
      ...prev,
      items: [...prev.items, { id: 'item_' + Date.now(), description: '', qty: 1, price: 0 }]
    }));
  };

  const removeItem = (id: string) => {
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const handlePrint = () => {
    const element = document.getElementById('invoice');
    if (!element) return;

    try {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      // Add printing class to trigger print-specific CSS with setTimeout to let render complete
      element.classList.add('is-printing');

      setTimeout(() => {
        const opt = {
          margin: 0,
          filename: `${invoiceData.invoiceNo || 'Invoice'}.pdf`,
          image: { type: 'jpeg' as const, quality: 1.0 },
          html2canvas: { 
            scale: 3, 
            useCORS: true,
            letterRendering: true,
            scrollX: 0,
            scrollY: 0,
            logging: false,
            ignoreElements: (el: Element) => el.classList.contains('no-print')
          },
          jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
        };

        html2pdf()
          .set(opt)
          .from(element)
          .save()
          .then(() => {
            element.classList.remove('is-printing');
          })
          .catch((err) => {
            console.error("html2pdf generation failed:", err);
            element.classList.remove('is-printing');
          });
      }, 150);
    } catch (e) {
      console.error("Download failed:", e);
      element.classList.remove('is-printing');
      window.print();
    }
  };

  return (
    <div className="invoice-module">
      {/* STICKY NAVIGATION */}
      <div className="nav-bar no-print" style={{ flexWrap: 'wrap', gap: '10px' }}>
        <div className="nav-title" style={{ fontSize: 'clamp(16px, 4vw, 20px)' }}>Smart Invoice 1.0</div>
        <div className="nav-btns" style={{ flexWrap: 'wrap' }}>
            <button className="btn-settings" onClick={() => setIsModalOpen(true)}>⚙️ Settings</button>
            <button className="btn-add" onClick={addItem}>+ Add Item</button>
            <button className="btn-print" onClick={handlePrint}>📥 Download / Print</button>
        </div>
      </div>

      {/* SETTINGS MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="modal" style={{ display: 'flex', zIndex: 3000 }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal-content"
              style={{ width: '100%', maxWidth: '500px', margin: 'auto' }}
            >
              <div className="modal-header">Invoice Configuration</div>
              
              {/* Shop Profile Section */}
              <div className="section-title text-[14px] font-bold text-[#1a2a6c] mb-2 border-b pb-1">Shop Profile</div>
              <div className="form-group">
                <label>Shop Logo URL</label>
                <input 
                  type="text" 
                  id="set-logo" 
                  placeholder="https://image-link.com/logo.png"
                  value={settings.shopProfile.logoUrl}
                  onChange={(e) => updateSettings({ ...settings, shopProfile: { ...settings.shopProfile, logoUrl: e.target.value } })}
                />
              </div>
              <div className="form-group">
                <label>Shop Name</label>
                <input 
                  type="text" 
                  id="set-name"
                  value={settings.shopProfile.name}
                  onChange={(e) => updateSettings({ ...settings, shopProfile: { ...settings.shopProfile, name: e.target.value } })}
                />
              </div>
              <div className="form-group">
                <label>Shop Address & Contact</label>
                <textarea 
                  id="set-address" 
                  rows={2}
                  value={settings.shopProfile.address}
                  onChange={(e) => updateSettings({ ...settings, shopProfile: { ...settings.shopProfile, address: e.target.value } })}
                ></textarea>
              </div>
              <div className="form-group">
                <label>Shop Phone</label>
                <input 
                  type="text" 
                  value={settings.shopProfile.phone}
                  onChange={(e) => updateSettings({ ...settings, shopProfile: { ...settings.shopProfile, phone: e.target.value } })}
                />
              </div>

              {/* Invoice Metadata Section */}
              <div className="section-title text-[14px] font-bold text-[#1a2a6c] mt-4 mb-2 border-b pb-1">Invoice Info</div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: '1 1 180px' }}>
                  <label>Invoice Number</label>
                  <input type="text" value={invoiceData.invoiceNo} onChange={e => setInvoiceData(prev => ({...prev, invoiceNo: e.target.value}))} />
                </div>
                <div className="form-group" style={{ flex: '1 1 180px' }}>
                  <label>Invoice Date</label>
                  <input type="text" value={invoiceData.date} onChange={e => setInvoiceData(prev => ({...prev, date: e.target.value}))} />
                </div>
              </div>

              {/* Customer Details Section */}
              <div className="section-title text-[14px] font-bold text-[#1a2a6c] mt-4 mb-2 border-b pb-1">Customer Details</div>
              <div className="form-group">
                <label>Customer Name</label>
                <input type="text" value={invoiceData.customer.name} onChange={e => setInvoiceData(prev => ({...prev, customer: {...prev.customer, name: e.target.value}}))} />
              </div>
              <div className="form-group">
                <label>Customer Address</label>
                <input type="text" value={invoiceData.customer.address} onChange={e => setInvoiceData(prev => ({...prev, customer: {...prev.customer, address: e.target.value}}))} />
              </div>
              <div className="form-group">
                <label>Customer Phone</label>
                <input type="text" value={invoiceData.customer.phone} onChange={e => setInvoiceData(prev => ({...prev, customer: {...prev.customer, phone: e.target.value}}))} />
              </div>

              {/* Calculations Section */}
              <div className="section-title text-[14px] font-bold text-[#1a2a6c] mt-4 mb-2 border-b pb-1">Calculations & Notes</div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: '1 1 120px' }}>
                  <label>Tax/VAT %</label>
                  <input 
                    type="number" 
                    id="set-tax" 
                    value={settings.invoice.taxRate}
                    onChange={(e) => updateSettings({ ...settings, invoice: { ...settings.invoice, taxRate: Number(e.target.value) } })}
                  />
                </div>
                <div className="form-group" style={{ flex: '1 1 120px' }}>
                  <label>Discount Amount</label>
                  <input 
                    type="number" 
                    id="set-discount" 
                    value={settings.invoice.discount}
                    onChange={(e) => updateSettings({ ...settings, invoice: { ...settings.invoice, discount: Number(e.target.value) } })}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Currency Symbol</label>
                  <input 
                    type="text" 
                    value={invoiceData.currency}
                    onChange={(e) => setInvoiceData(prev => ({...prev, currency: e.target.value}))}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Notes & Terms</label>
                <textarea 
                  rows={3}
                  value={invoiceData.notes}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
                ></textarea>
              </div>

              {/* Visibility & Print Section */}
              <div className="section-title text-[14px] font-bold text-[#1a2a6c] mt-4 mb-2 border-b pb-1">Invoice Template</div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div 
                  className={`cursor-pointer rounded-xl border-2 p-2 transition-all hover:shadow-md ${settings.invoice.templateId === 't1' ? 'border-[#1a2a6c] bg-[#1a2a6c]/5' : 'border-gray-200'}`}
                  onClick={() => updateSettings({ ...settings, invoice: { ...settings.invoice, templateId: 't1' } })}
                >
                  <div className="aspect-[3/4] rounded-lg bg-gray-100 mb-2 flex items-center justify-center overflow-hidden border border-gray-200">
                    <div className="w-full h-full p-1 flex flex-col gap-1">
                      <div className="h-4 bg-gray-300 w-1/2 rounded-sm" />
                      <div className="h-1 bg-gray-200 w-full" />
                      <div className="h-1 bg-gray-200 w-full" />
                      <div className="mt-auto h-3 bg-[#1a2a6c] w-full rounded-sm" />
                    </div>
                  </div>
                  <div className="text-center font-bold text-xs">Modern Elite (T1)</div>
                </div>
                <div 
                  className={`cursor-pointer rounded-xl border-2 p-2 transition-all hover:shadow-md ${settings.invoice.templateId === 't2' ? 'border-[#c19a6b] bg-[#c19a6b]/5' : 'border-gray-200'}`}
                  onClick={() => updateSettings({ ...settings, invoice: { ...settings.invoice, templateId: 't2' } })}
                >
                  <div className="aspect-[3/4] rounded-lg bg-gray-100 mb-2 flex items-center justify-center overflow-hidden border border-gray-200">
                    <div className="w-full h-full p-1 flex flex-col gap-1">
                      <div className="flex justify-between">
                        <div className="w-6 h-6 border-dashed border border-gray-400 rounded-sm" />
                        <div className="w-10 h-3 bg-gray-300 rounded-sm" />
                      </div>
                      <div className="h-3 bg-[#1a2a6c] w-1/3 rounded-sm" />
                      <div className="flex flex-col gap-0.5 mt-2">
                        <div className="h-1 bg-gray-200 w-full" />
                        <div className="h-1 bg-[#1a2a6c] w-full" />
                      </div>
                      <div className="mt-auto h-4 w-1/2 rounded-md border border-[#c19a6b]/30" />
                    </div>
                  </div>
                  <div className="text-center font-bold text-xs">Classic Gold (T2)</div>
                </div>
              </div>

              <div className="section-title text-[14px] font-bold text-[#1a2a6c] mt-4 mb-2 border-b pb-1">Visibility & Print Settings</div>
              <div className="text-[10px] text-gray-400 mb-2 italic">Settings are auto-saved. Printing uses A4 layout.</div>
              <div className="toggle-group">
                <div className="toggle-item"><input type="checkbox" id="chk-logo" checked={settings.invoice.showLogo} onChange={e => updateSettings({ ...settings, invoice: { ...settings.invoice, showLogo: e.target.checked } })} /> Show Logo</div>
                <div className="toggle-item"><input type="checkbox" id="chk-tax" checked={settings.invoice.showTax} onChange={e => updateSettings({ ...settings, invoice: { ...settings.invoice, showTax: e.target.checked } })} /> Show Tax</div>
                <div className="toggle-item"><input type="checkbox" id="chk-discount" checked={settings.invoice.showDiscount} onChange={e => updateSettings({ ...settings, invoice: { ...settings.invoice, showDiscount: e.target.checked } })} /> Show Discount</div>
                <div className="toggle-item"><input type="checkbox" id="chk-sig" checked={settings.invoice.showSignature} onChange={e => updateSettings({ ...settings, invoice: { ...settings.invoice, showSignature: e.target.checked } })} /> Show Signature</div>
                <div className="toggle-item"><input type="checkbox" id="chk-notes" checked={settings.invoice.showNotes} onChange={e => updateSettings({ ...settings, invoice: { ...settings.invoice, showNotes: e.target.checked } })} /> Show Notes</div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button className="btn-print" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setIsModalOpen(false); setShowSavedToast(true); setTimeout(() => setShowSavedToast(false), 3000); }}>Save Settings</button>
                <button className="btn-settings" style={{ flex: 2, border: '1px solid #ccc', justifyContent: 'center' }} onClick={() => setIsModalOpen(false)}>Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSavedToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-24 left-1/2 z-[2000] bg-[#27ae60] text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 font-bold"
          >
            ✨ Settings Saved Successfully
          </motion.div>
        )}
      </AnimatePresence>

      <div className="page-container" style={{ overflowX: 'auto', padding: '16px' }}>
        <div className={`invoice-card template-${settings.invoice.templateId || 't1'}`} id="invoice">
            {settings.invoice.templateId === 't2' ? (
              // TEMPLATE 2: CLASSIC GOLD
              <div className="t2-wrapper flex flex-col h-full">
                <div className="t2-header flex justify-between items-start mb-8">
                  <div className="t2-company-info">
                    <div className="logo-box !w-24 !h-24 !mb-4 !border-dashed !border-slate-300">
                      {settings.shopProfile.logoUrl && settings.invoice.showLogo ? (
                        <img src={settings.shopProfile.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold">LOGO</span>
                      )}
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-1 uppercase tracking-tight">COMPANY: {settings.shopProfile.name || 'TRADEFLOW'}</h2>
                    <p className="text-xs text-slate-600 font-medium">{settings.shopProfile.address || 'Address Line 1, City'}</p>
                    <p className="text-xs text-slate-600 font-medium">Phone: {settings.shopProfile.phone || '+880 1XXX XXXXXX'}</p>
                  </div>
                  <div className="t2-inv-meta text-right">
                    <h1 className="text-5xl font-serif text-[#c19a6b] italic mb-4 opacity-80">INVOICE</h1>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-800">Invoice No: <span className="font-mono text-slate-600">{invoiceData.invoiceNo}</span></p>
                      <p className="text-sm font-bold text-slate-800">Date: <span className="font-mono text-slate-600">{invoiceData.date}</span></p>
                    </div>
                  </div>
                </div>

                <div className="t2-separator h-1.5 w-full flex mb-12">
                   <div className="h-full bg-[#1a2a6c]" style={{ width: '70%' }} />
                   <div className="h-full bg-[#c19a6b]/50" style={{ width: '30%' }} />
                </div>

                <div className="t2-bill-to mb-12">
                  <div className="inline-block bg-[#1a2a6c] text-white px-4 py-1 rounded-sm text-[11px] font-black uppercase tracking-widest mb-3">BILL TO</div>
                  <div className="pl-1 space-y-1">
                    <p className="text-sm font-bold text-slate-800">Customer Name: <span className="font-semibold text-slate-600">{invoiceData.customer.name}</span></p>
                    <p className="text-sm font-bold text-slate-800">Customer Address: <span className="font-semibold text-slate-600">{invoiceData.customer.address}</span></p>
                    <p className="text-sm font-bold text-slate-800">Customer Phone: <span className="font-semibold text-slate-600">{invoiceData.customer.phone}</span></p>
                  </div>
                </div>

                <div className="t2-items-container relative flex-1">
                   {/* Watermark */}
                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] z-0 overflow-hidden">
                      <div className="w-80 h-80 border-8 border-[#1a2a6c] rounded-full flex items-center justify-center p-8">
                         <div className="w-full h-full border-4 border-[#1a2a6c] rounded-full flex items-center justify-center">
                            <span className="text-6xl font-black text-[#1a2a6c]">TF</span>
                         </div>
                      </div>
                   </div>

                   <div className="t2-table-header-bar bg-[#1a2a6c] rounded-md h-12 flex items-center px-4 mb-2">
                       <div className="w-[10%] text-[10px] uppercase font-black tracking-widest text-white">Serial No.</div>
                       <div className="w-[45%] text-[10px] uppercase font-black tracking-widest text-white">Product Name & Description</div>
                       <div className="w-[15%] text-[10px] uppercase font-black tracking-widest text-center text-white">Quantity</div>
                       <div className="w-[15%] text-[10px] uppercase font-black tracking-widest text-center text-white">Price</div>
                       <div className="w-[15%] text-[10px] uppercase font-black tracking-widest text-center text-white">Total</div>
                   </div>
                   <table className="t2-table w-full border-collapse relative z-10 transition-all duration-300">
                      <thead className="hidden">
                        <tr>
                          <th>Serial No.</th>
                          <th>Product Name & Description</th>
                          <th>Quantity</th>
                          <th>Price</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {invoiceData.items.map((item, index) => (
                           <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                              <td className="w-[10%] py-4 px-4 text-sm font-mono text-slate-500 text-center">{index + 1}</td>
                              <td className="w-[45%] py-4 px-4">
                                <div className="print-val font-semibold text-slate-800">{item.description || '-'}</div>
                                <input 
                                  type="text" 
                                  className="input-cell no-print font-semibold text-slate-800 placeholder:italic placeholder:font-normal placeholder:opacity-40" 
                                  placeholder="Product Name and description text..." 
                                  value={item.description}
                                  onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                />
                              </td>
                              <td className="w-[15%] py-4 px-4 text-center">
                                <div className="print-val font-mono text-slate-700">{item.qty}</div>
                                <input 
                                  type="number" 
                                  className="input-cell no-print text-center font-mono text-slate-700" 
                                  value={item.qty} 
                                  onChange={(e) => updateItem(item.id, 'qty', Number(e.target.value))}
                                />
                              </td>
                              <td className="w-[15%] py-4 px-4 text-center">
                                <div className="print-val font-mono text-slate-700">{item.price.toFixed(2)}</div>
                                <input 
                                  type="number" 
                                  className="input-cell no-print text-center font-mono text-slate-700" 
                                  value={item.price} 
                                  onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))}
                                />
                              </td>
                              <td className="w-[15%] py-4 px-4 text-center font-mono font-black text-slate-900">
                                {invoiceData.currency} {(item.qty * item.price).toFixed(2)}
                              </td>
                              <td className="no-print absolute right-0 top-1/2 -translate-y-1/2">
                                 <button 
                                   onClick={() => removeItem(item.id)}
                                   className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 hover:bg-amber-500 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                                 >
                                    <X size={12} />
                                 </button>
                              </td>
                           </tr>
                        ))}
                      </tbody>
                   </table>
                </div>

                <div className="t2-footer mt-auto pt-10 flex justify-between items-end">
                   <div className="t2-totals-box bg-white p-6 rounded-2xl border-2 border-[#c19a6b]/20 shadow-xl shadow-[#c19a6b]/5 min-w-[300px]">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-slate-500 font-bold uppercase tracking-widest text-[11px]">
                          <span>Subtoral:</span>
                          <span className="font-mono text-sm text-slate-800">{invoiceData.currency} {subtotal.toFixed(2)}</span>
                        </div>
                        <div className="h-px bg-slate-200" />
                        <div className="flex justify-between items-end">
                           <div className="flex flex-col">
                              <span className="text-[11px] font-black uppercase text-slate-400 tracking-tighter">Grand</span>
                              <span className="text-2xl font-black text-slate-900 leading-none">Total:</span>
                           </div>
                           <div className="text-4xl font-black text-slate-900 font-mono tracking-tighter">
                              {invoiceData.currency} {grandTotal.toFixed(2)}
                           </div>
                        </div>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em] mb-1">Generated by {settings.shopProfile.name || 'TradeFlow'}</p>
                      <div className="flex justify-end opacity-20">
                         <div className="w-8 h-8 rounded-full border-2 border-slate-400 p-1">
                            <div className="w-full h-full bg-slate-400 rounded-full" />
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            ) : (
              // TEMPLATE 1: MODERN ELITE (Original)
              <>
                <div className="header">
                    <div className="logo-area">
                        <div className="logo-box" id="logo-container">
                            {settings.shopProfile.logoUrl && settings.invoice.showLogo ? (
                              <img id="disp-logo" src={settings.shopProfile.logoUrl} alt="Logo" />
                            ) : (
                              <span id="logo-placeholder">No Logo</span>
                            )}
                        </div>
                        <div className="shop-name" id="disp-name">
                          {settings.shopProfile.name || 'YOUR SHOP NAME'}
                        </div>
                        <div className="shop-info" id="disp-address">
                            {settings.shopProfile.address || 'Address Line 1, City'}<br />
                            Phone: {settings.shopProfile.phone || '+880 1XXX XXXXXX'}
                        </div>
                    </div>
                    <div className="inv-meta">
                        <div className="inv-title">Invoice</div>
                        <div className="meta-data"><b>No:</b> <span>{invoiceData.invoiceNo}</span></div>
                        <div className="meta-data"><b>Date:</b> <span id="current-date">{invoiceData.date}</span></div>
                    </div>
                </div>

                <div className="bill-to">
                    <div className="bill-label">BILL TO</div>
                    <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                        <strong>{invoiceData.customer.name}</strong><br />
                        {invoiceData.customer.address}<br />
                        Phone: {invoiceData.customer.phone}
                    </div>
                </div>

                <table className="items-table">
                    <thead>
                        <tr>
                            <th width="5%">SL</th>
                            <th width="55%">Product Description</th>
                            <th width="10%">Qty</th>
                            <th width="15%">Price</th>
                            <th width="15%">Total</th>
                            <th width="5%" className="btn-row-del no-print"></th>
                        </tr>
                    </thead>
                    <tbody id="item-body">
                        {invoiceData.items.map((item, index) => (
                          <tr key={item.id} className="item-row">
                              <td className="sl-no">{index + 1}</td>
                              <td>
                                <div className="print-val">{item.description || '-'}</div>
                                <input 
                                  type="text" 
                                  className="input-cell no-print" 
                                  placeholder="Product Name..." 
                                  value={item.description}
                                  onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                />
                              </td>
                              <td>
                                <div className="print-val">{item.qty}</div>
                                <input 
                                  type="number" 
                                  className="input-cell qty no-print" 
                                  value={item.qty} 
                                  onChange={(e) => updateItem(item.id, 'qty', Number(e.target.value))}
                                />
                              </td>
                              <td>
                                <div className="print-val">{item.price}</div>
                                <input 
                                  type="number" 
                                  className="input-cell price no-print" 
                                  value={item.price} 
                                  onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))}
                                />
                              </td>
                              <td className="row-total">{invoiceData.currency} {(item.qty * item.price).toFixed(2)}</td>
                              <td className="btn-row-del no-print" onClick={() => removeItem(item.id)}>×</td>
                          </tr>
                        ))}
                    </tbody>
                </table>

                <div className="summary-wrapper">
                    <div className={`notes-box ${!settings.invoice.showNotes ? 'hidden' : ''}`} id="sec-notes">
                        <div className="bill-label">NOTES & TERMS</div>
                        <div style={{ marginTop: '5px', whiteSpace: 'pre-line' }}>
                          {invoiceData.notes}
                        </div>
                    </div>
                    <div className="calc-box">
                        <div className="calc-row">
                            <span>Subtotal:</span>
                            <span id="subtotal">{invoiceData.currency} {subtotal.toFixed(2)}</span>
                        </div>
                        {settings.invoice.showTax && (
                          <div className="calc-row" id="row-tax">
                              <span>VAT (<span id="tax-rate">{settings.invoice.taxRate}</span>%):</span>
                              <span id="tax-amount">{invoiceData.currency} {taxAmount.toFixed(2)}</span>
                          </div>
                        )}
                        {settings.invoice.showDiscount && (
                          <div className="calc-row" id="row-discount">
                              <span>Discount:</span>
                              <span id="discount-amount">{invoiceData.currency} {discountAmount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="calc-row grand-total">
                            <span>
                              <small>Grand</small>
                              Total:
                            </span>
                            <span id="grand-total">{invoiceData.currency} {grandTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {settings.invoice.showSignature && (
                  <div className="sig-section" id="sec-sig">
                      <div className="sig-line">Customer Signature</div>
                      <div className="sig-line">Authorized Signature</div>
                  </div>
                )}

                <div style={{ textAlign: 'center', fontSize: '10px', color: '#ccc', marginTop: 'auto' }}>
                    Generated by Elite Invoice System
                </div>
              </>
            )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&display=swap');

        :root {
            --primary: #1a2a6c;
            --secondary: #5d6d7e;
            --accent: #27ae60;
            --danger: #e74c3c;
            --bg-app: #f4f7f6;
            --white: #ffffff;
            --text: #2c3e50;
            --border: #dcdde1;
        }

        /* --- STICKY NAVIGATION --- */
        .nav-bar {
            background: var(--primary);
            padding: 12px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }
        .nav-title { color: white; font-weight: bold; font-size: 20px; }
        .nav-btns { display: flex; gap: 10px; }

        .invoice-module button {
            padding: 8px 16px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: 600;
            transition: 0.3s;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .btn-settings { background: #fff; color: var(--primary); }
        .btn-print { background: var(--accent); color: white; }
        .btn-add { background: rgba(255,255,255,0.2); color: white; border: 1px solid white; }
        .invoice-module button:hover { opacity: 0.9; transform: translateY(-1px); }

        /* --- SETTINGS MODAL --- */
        .modal {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.6);
            z-index: 3000;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 10px;
        }
        .modal-content {
            background: white;
            padding: 20px;
            border-radius: 12px;
            width: 100%;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        @media (max-width: 600px) {
            .modal-content {
              padding: 15px;
              border-radius: 20px 20px 0 0;
              max-height: 85vh;
              align-self: flex-end;
            }
        }
        .modal-header { border-bottom: 2px solid #eee; margin-bottom: 15px; padding-bottom: 10px; font-size: 18px; font-weight: bold; }
        .form-group { margin-bottom: 12px; }
        .form-group label { display: block; font-size: 13px; font-weight: bold; margin-bottom: 4px; }
        .form-group input, .form-group textarea { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 6px; outline: none; font-size: 16px; }
        .form-group input:focus, .form-group textarea:focus { border-color: var(--primary); }
        .toggle-group { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f9f9f9; padding: 10px; border-radius: 6px; margin-top: 10px; }
        @media (max-width: 480px) {
            .toggle-group { grid-template-columns: 1fr; }
        }
        .toggle-item { display: flex; align-items: center; gap: 8px; font-size: 13px; }

        /* --- INVOICE PAGE (STRICT A4) --- */
        .page-container {
            padding: 20px;
            display: flex;
            justify-content: center;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
        }
        @media (max-width: 768px) {
            .page-container { padding: 10px; }
        }
        .invoice-card {
            width: 210mm;
            min-width: 210mm; /* Force size to preserve layout */
            min-height: 297mm;
            background: white;
            padding: 15mm;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            position: relative;
            display: flex;
            flex-direction: column;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: var(--text);
            line-height: 1.5;
            transform-origin: top center;
        }

        /* --- TEMPLATE 2 (CLASSIC GOLD) SPECIFIC STYLES --- */
        .template-t2 {
           font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
           background: #ffffff !important;
        }
        .template-t2 .font-serif {
           font-family: 'Playfair Display', serif !important;
        }
        .template-t2 .t2-header {
           border-bottom: none !important;
        }
        .template-t2 .t2-table th {
           background: #1a2a6c !important;
           color: white !important;
           text-transform: uppercase;
           font-size: 10px;
           letter-spacing: 0.1em;
        }
        .template-t2 .t2-table td {
           border-bottom: 1px solid #f1f5f9 !important;
           vertical-align: middle;
        }
        .template-t2 .input-cell {
           border: none !important;
           outline: none !important;
           background: transparent !important;
           padding: 0 !important;
           width: 100%;
        }
        .template-t2 .t2-totals-box {
           background: linear-gradient(135deg, #ffffff 0%, #fdfbf7 100%) !important;
        }
        .template-t2 .is-printing .no-print {
           display: none !important;
        }

        @media (max-width: 800px) {
           /* No scaling here as it might break horizontal scroll logic, better to just let it scroll */
        }

        /* --- HEADER --- */
        .header { display: flex; justify-content: space-between; border-bottom: 4px solid var(--primary); padding-bottom: 20px; margin-bottom: 30px; line-height: 1.4; }
        .logo-area { width: 60%; }
        .logo-box { width: 160px; height: 80px; border: 1px dashed #ddd; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
        .logo-box img { max-width: 100%; max-height: 100%; object-fit: contain; }
        .shop-name { font-size: 28px; font-weight: 800; color: var(--primary); line-height: 1.1; margin-bottom: 6px; text-transform: uppercase; }
        .shop-info { font-size: 13px; color: var(--secondary); line-height: 1.6; }

        .inv-meta { text-align: right; }
        .inv-title { font-size: 38px; font-weight: 900; color: #e5e7eb; text-transform: uppercase; margin-bottom: 8px; line-height: 1; letter-spacing: 1px; }
        .meta-data { font-size: 14px; margin-bottom: 4px; line-height: 1.4; color: #4b5563; }

        /* --- TABLES --- */
        .bill-to { margin-bottom: 30px; line-height: 1.6; }
        .bill-label { background: var(--primary); color: white; padding: 5px 14px; font-size: 11px; font-weight: 800; display: inline-block; margin-bottom: 10px; line-height: 1; border-radius: 2px; }
        
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; table-layout: fixed; }
        .items-table th { 
          background: #f9fafb; 
          border-bottom: 2px solid var(--primary); 
          padding: 12px 10px; 
          text-align: left; 
          font-size: 12px; 
          line-height: normal; 
          vertical-align: middle; 
          color: var(--secondary); 
          font-weight: 700; 
          text-transform: uppercase; 
        }
        .items-table td { 
          padding: 12px 10px; 
          border-bottom: 1px solid #f3f4f6; 
          font-size: 14px; 
          line-height: normal; 
          vertical-align: middle; 
          word-break: break-all;
        }
        .sl-no { text-align: center; width: 45px !important; font-weight: 600; }
        
        .input-cell { 
          width: 100%; 
          border: none; 
          outline: none; 
          font-size: 14px; 
          background: transparent; 
          padding: 0;
          margin: 0;
          display: block;
          line-height: inherit;
          font-family: inherit;
          color: inherit;
        }
        .print-val { display: none; }
        .is-printing .input-cell { display: none !important; }
        .is-printing .print-val { display: block !important; }
        @media print {
          .input-cell { display: none !important; }
          .print-val { display: block !important; }
        }
        .html2pdf__page-break { display: none; } /* Prevent accidental page breaks */
        .btn-row-del { color: var(--danger); cursor: pointer; font-weight: bold; border: none; background: none; font-size: 16px; line-height: 1; }

        /* --- SUMMARY --- */
        .summary-wrapper { display: flex; justify-content: space-between; margin-top: auto; padding-top: 30px; min-height: 150px; align-items: flex-start; }
        .notes-box { width: 50%; font-size: 12px; color: #666; line-height: 1.6; }
        .calc-box { width: 40%; background: #f4f7f9; padding: 25px; border-radius: 15px; box-shadow: inset 0 0 0 1px rgba(0,0,0,0.03); }
        .calc-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; line-height: 1.6; color: #555; }
        .grand-total { border-top: 2px solid var(--primary); margin-top: 15px; padding-top: 15px; font-size: 20px; font-weight: 800; color: var(--primary); display: flex; flex-direction: row; justify-content: space-between; align-items: center; border-bottom: none; }
        .grand-total span:first-child { display: flex; flex-direction: column; line-height: 1.1; color: var(--primary); }
        .grand-total span:first-child small { font-size: 13px; color: var(--secondary); font-weight: 700; margin-bottom: 2px; }
        .grand-total span:last-child { font-size: 26px; }

        /* --- SIGNATURE --- */
        .sig-section { display: flex; justify-content: space-between; margin-top: 50px; padding-bottom: 20px; }
        .sig-line { width: 180px; border-top: 1px solid #999; text-align: center; font-size: 12px; padding-top: 5px; color: #777; }

        .hidden { display: none !important; }

        @media print {
            body { background: white !important; }
            .no-print { display: none !important; }
            .page-container { padding: 0 !important; }
            .invoice-card { 
              box-shadow: none !important; 
              width: 210mm !important; 
              height: 297mm !important; 
              padding: 15mm !important; 
              margin: 0 !important; 
              border: none !important; 
            }
            @page { size: A4; margin: 0; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }

        /* --- PERFECT ON-SCREEN DARK MODE COMPATIBILITY --- */
        [data-theme='dark'] .invoice-card:not(.is-printing) {
            background-color: #0b1220 !important;
            color: #f1f5f9 !important;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6) !important;
            border: 1px solid rgba(255, 255, 255, 0.08) !important;
        }

        /* Template 1 Dark Mode */
        [data-theme='dark'] .invoice-card:not(.is-printing) .shop-name {
            color: #60a5fa !important;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .shop-info {
            color: #94a3b8 !important;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .inv-title {
            color: #ffffff !important;
            opacity: 1 !important;
            text-shadow: 0 0 5px rgba(255,255,255,0.1);
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .meta-data {
            color: #cbd5e1 !important;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .meta-data b {
            color: #60a5fa !important;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .bill-label {
            background: #2563eb !important;
            color: #ffffff !important;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .bill-to {
            color: #cbd5e1 !important;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .bill-to strong {
            color: #ffffff !important;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .items-table th {
            background: #111827 !important;
            color: #cbd5e1 !important;
            border-bottom: 2px solid #2563eb !important;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .items-table td {
            border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
            color: #cbd5e1 !important;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .sl-no {
            color: #60a5fa !important;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .row-total {
            color: #60a5fa !important;
            font-weight: 800;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .calc-box {
            background: #111827 !important;
            border: 1px solid rgba(255, 255, 255, 0.08) !important;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .calc-row {
            color: #cbd5e1 !important;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .calc-row span:last-child {
            color: #ffffff !important;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .grand-total {
            border-top: 2px solid #2563eb !important;
            color: #60a5fa !important;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .grand-total span:first-child {
            color: #60a5fa !important;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .grand-total span:first-child small {
            color: #94a3b8 !important;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .grand-total span:last-child {
            color: #60a5fa !important;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .notes-box {
            color: #94a3b8 !important;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .sig-line {
            border-top: 1px solid rgba(255, 255, 255, 0.15) !important;
            color: #cbd5e1 !important;
        }

        /* Template 2 Dark Mode Overlay */
        [data-theme='dark'] .invoice-card:not(.is-printing) .t2-company-info h2 {
            color: #ffffff !important;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .t2-company-info p {
            color: #cbd5e1 !important;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .t2-inv-meta h1 {
            color: #c19a6b !important;
            opacity: 1 !important;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .t2-inv-meta p {
            color: #cbd5e1 !important;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .t2-inv-meta span {
            color: #ffffff !important;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .t2-bill-to p {
            color: #cbd5e1 !important;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .t2-bill-to span {
            color: #ffffff !important;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .t2-table td {
            color: #cbd5e1 !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .t2-table .print-val {
            color: #ffffff !important;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .t2-table td:last-child {
            color: #c19a6b !important;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .t2-totals-box {
            background: #111827 !important;
            border-color: rgba(255, 255, 255, 0.08) !important;
            color: #cbd5e1 !important;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .t2-totals-box span {
            color: #ffffff !important;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .t2-totals-box .text-4xl {
            color: #c19a6b !important;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .logo-box {
            border-color: rgba(255, 255, 255, 0.15) !important;
        }

        /* Raw Text Elements Override inside Dark Card */
        [data-theme='dark'] .invoice-card:not(.is-printing) .text-slate-900,
        [data-theme='dark'] .invoice-card:not(.is-printing) .text-slate-800,
        [data-theme='dark'] .invoice-card:not(.is-printing) .text-slate-700 {
            color: #ffffff !important;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .text-slate-600,
        [data-theme='dark'] .invoice-card:not(.is-printing) .text-slate-500 {
            color: #cbd5e1 !important;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .input-cell {
            color: #ffffff !important;
            background: transparent !important;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .input-cell::placeholder {
            color: rgba(255, 255, 255, 0.35) !important;
        }

        /* --- STRICT SINGLE PAGE AND EXPORT LAYOUT COMPACTNESS --- */
        /* Forces clean, light-themed, single page layouts during pdf download */
        .is-printing.invoice-card {
            background-color: #ffffff !important;
            background: #ffffff !important;
            color: #1e293b !important;
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            padding: 10mm 12mm 10mm 12mm !important; 
            box-shadow: none !important;
            margin: 0 !important;
            border: none !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            box-sizing: border-box !important;
        }

        /* Enforce absolute white-theme components when printing to save ink and remain premium catalog style */
        .is-printing .text-slate-900,
        .is-printing .text-slate-800,
        .is-printing .text-slate-755,
        .is-printing .text-slate-700,
        .is-printing .text-slate-600 {
            color: #1e293b !important;
        }
        .is-printing .text-slate-500,
        .is-printing .text-slate-400 {
            color: #475569 !important;
        }

        /* Hide edit helper elements in PDF */
        .is-printing .no-print,
        .is-printing .btn-row-del {
            display: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
        }

        /* --- Template 1 Print Compactness --- */
        .is-printing .header {
            padding-bottom: 8px !important;
            margin-bottom: 12px !important;
            border-bottom: 3px solid #1a2a6c !important;
        }
        .is-printing .logo-box {
            width: 110px !important;
            height: 55px !important;
            margin-bottom: 5px !important;
        }
        .is-printing .shop-name {
            font-size: 20px !important;
            margin-bottom: 2px !important;
            color: #1a2a6c !important;
        }
        .is-printing .shop-info {
            font-size: 11px !important;
            line-height: 1.3 !important;
            color: #475569 !important;
        }
        .is-printing .inv-title {
            font-size: 28px !important;
            margin-bottom: 4px !important;
            color: #1a2a6c !important;
            opacity: 1 !important;
        }
        .is-printing .meta-data {
            font-size: 11px !important;
            margin-bottom: 2px !important;
            color: #334155 !important;
        }
        .is-printing .bill-to {
            margin-bottom: 12px !important;
        }
        .is-printing .bill-label {
            padding: 3px 8px !important;
            font-size: 10px !important;
            margin-bottom: 5px !important;
            background: #1a2a6c !important;
            color: #ffffff !important;
            border-radius: 2px !important;
        }
        .is-printing .items-table {
            margin-bottom: 12px !important;
        }
        .is-printing .items-table th {
            padding: 6px 8px !important;
            font-size: 11px !important;
            background: #f1f5f9 !important;
            color: #1e293b !important;
            border-bottom: 2px solid #1a2a6c !important;
        }
        .is-printing .items-table td {
            padding: 5px 8px !important;
            font-size: 11px !important;
            color: #1e293b !important;
            border-bottom: 1px solid #e2e8f0 !important;
        }
        .is-printing .summary-wrapper {
            padding-top: 10px !important;
            min-height: 90px !important;
            margin-top: auto !important;
            align-items: flex-start !important;
        }
        .is-printing .calc-box {
            padding: 10px 14px !important;
            border-radius: 8px !important;
            background: #f8fafc !important;
            border: 1px solid #e2e8f0 !important;
            width: 42% !important;
        }
        .is-printing .calc-row {
            padding: 3px 0 !important;
            font-size: 11px !important;
            color: #475569 !important;
        }
        .is-printing .calc-row.grand-total {
            border-top: 1.5px solid #1a2a6c !important;
            margin-top: 6px !important;
            padding-top: 6px !important;
            font-size: 15px !important;
            color: #1a2a6c !important;
        }
        .is-printing .grand-total span:first-child small {
            font-size: 9px !important;
            margin-bottom: 1px !important;
        }
        .is-printing .grand-total span:last-child {
            font-size: 18px !important;
        }
        .is-printing .notes-box {
            width: 52% !important;
            font-size: 10px !important;
            color: #475569 !important;
            line-height: 1.4 !important;
        }
        .is-printing .sig-section {
            margin-top: 25px !important;
        }
        .is-printing .sig-line {
            width: 140px !important;
            font-size: 10px !important;
            color: #475569 !important;
            border-top: 1px solid #94a3b8 !important;
        }

        /* --- Template 2 Print Compactness --- */
        .is-printing .t2-header {
            margin-bottom: 8px !important;
        }
        .is-printing .t2-company-info h2 {
            font-size: 16px !important;
            color: #1e293b !important;
        }
        .is-printing .t2-company-info p {
            font-size: 10px !important;
            color: #475569 !important;
        }
        .is-printing .t2-inv-meta h1 {
            font-size: 28px !important;
            margin-bottom: 4px !important;
            color: #c19a6b !important;
            opacity: 1 !important;
        }
        .is-printing .t2-inv-meta p {
            font-size: 11px !important;
            color: #334155 !important;
        }
        .is-printing .t2-separator {
            margin-bottom: 12px !important;
        }
        .is-printing .t2-bill-to {
            margin-bottom: 12px !important;
        }
        .is-printing .t2-bill-to p {
            font-size: 11px !important;
            color: #334155 !important;
        }
        .is-printing .t2-bill-to span {
            color: #1e293b !important;
        }
        .is-printing .t2-table-header-bar {
            height: 32px !important;
            margin-bottom: 1px !important;
            background: #1a2a6c !important;
        }
        .is-printing .t2-table-header-bar div {
            font-size: 9px !important;
            color: #ffffff !important;
        }
        .is-printing .t2-table td {
            padding: 5px 6px !important;
            font-size: 11px !important;
            color: #1e293b !important;
            border-bottom: 1px solid #e2e8f0 !important;
        }
        .is-printing .t2-table .print-val {
            color: #1e293b !important;
            font-size: 11px !important;
        }
        .is-printing .t2-table td:last-child {
            color: #1e293b !important;
            font-weight: 700 !important;
        }
        .is-printing .t2-totals-box {
            padding: 10px 14px !important;
            border-radius: 10px !important;
            border: 1px solid #e2e8f0 !important;
            min-w-[240px] !important;
            background: #fdfbf7 !important;
        }
        .is-printing .t2-totals-box .flex {
            margin-bottom: 0 !important;
        }
        .is-printing .t2-totals-box span {
            font-size: 10px !important;
            color: #475569 !important;
        }
        .is-printing .t2-totals-box .font-mono {
            color: #1e293b !important;
            font-size: 11px !important;
        }
        .is-printing .t2-totals-box .text-4xl {
            font-size: 18px !important;
            color: #1e293b !important;
        }
        .is-printing .t2-footer {
            padding-top: 10px !important;
            margin-top: auto !important;
        }
        .is-printing .t2-items-container {
            flex: 1 !important;
        }
        .is-printing .logo-box {
            width: 60px !important;
            height: 45px !important;
            margin-bottom: 3px !important;
        }
      ` }} />
    </div>
  );
};

