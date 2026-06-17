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

  const template1Ref = useRef<HTMLDivElement>(null);
  const template2Ref = useRef<HTMLDivElement>(null);
  const template3Ref = useRef<HTMLDivElement>(null);
  const template4Ref = useRef<HTMLDivElement>(null);

  const getCurrentTemplateRef = (): React.RefObject<HTMLDivElement> => {
    switch (settings.invoice.templateId) {
      case 't2':
        return template2Ref;
      case 't3':
        return template3Ref;
      case 't4':
        return template4Ref;
      case 't1':
      default:
        return template1Ref;
    }
  };
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
  const shippingCharge = settings.invoice.shippingCharge || 0;
  const grandTotal = subtotal + taxAmount - discountAmount + shippingCharge;

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

const stripOklchOklab = (cssText: string): string => {
  if (!cssText) return '';
  let result = '';
  let i = 0;
  const len = cssText.length;
  const lowerCss = cssText.toLowerCase();

  while (i < len) {
    const isOklch = lowerCss.substring(i, i + 5) === 'oklch';
    const isOklab = lowerCss.substring(i, i + 5) === 'oklab';

    if (isOklch || isOklab) {
      const matchWordLength = 5;
      let j = i + matchWordLength;
      while (j < len && cssText[j] !== '(' && cssText[j] !== ';' && cssText[j] !== '}' && cssText[j] !== '\n') {
        j++;
      }
      if (j < len && cssText[j] === '(') {
        let depth = 1;
        j++;
        while (j < len && depth > 0) {
          if (cssText[j] === '(') {
            depth++;
          } else if (cssText[j] === ')') {
            depth--;
          }
          j++;
        }
        result += 'rgb(120, 120, 120)';
        i = j;
      } else {
        result += 'rgb(120, 120, 120)';
        i = j;
      }
    } else {
      result += cssText[i];
      i++;
    }
  }
  return result;
};

  const cleanOklchStyles = async () => {
    const styleElementsToRestore: { element: HTMLStyleElement; originalText: string }[] = [];
    const linksToRestore: { element: HTMLLinkElement; disabled: boolean }[] = [];
    const inlineStylesToRestore: { element: HTMLElement; originalStyle: string }[] = [];
    const injectedStyleTags: HTMLStyleElement[] = [];
    const originalGetComputedStyle = window.getComputedStyle;

    try {
      // Intercept window.getComputedStyle to translate oklch / oklab to fallback rgb formats
      window.getComputedStyle = function (elt: Element, pseudoElt?: string | null): CSSStyleDeclaration {
        const style = originalGetComputedStyle(elt, pseudoElt);
        return new Proxy(style, {
          get(target, prop, receiver) {
            if (prop === 'getPropertyValue') {
              return function (propertyName: string) {
                const val = target.getPropertyValue(propertyName);
                if (typeof val === 'string' && (val.toLowerCase().includes('oklch') || val.toLowerCase().includes('oklab'))) {
                  return stripOklchOklab(val);
                }
                return val;
              };
            }
            const value = Reflect.get(target, prop, receiver);
            if (typeof value === 'function') {
              return value.bind(target);
            }
            if (typeof value === 'string' && (value.toLowerCase().includes('oklch') || value.toLowerCase().includes('oklab'))) {
              return stripOklchOklab(value);
            }
            return value;
          }
        });
      };

      // 1. Process all inline style tags is crucial for local styles
      const styleTags = Array.from(document.querySelectorAll('style'));
      for (const style of styleTags) {
        const text = style.textContent || '';
        if (text.toLowerCase().includes('oklch') || text.toLowerCase().includes('oklab')) {
          styleElementsToRestore.push({ element: style, originalText: text });
          const cleanedText = stripOklchOklab(text);
          style.textContent = cleanedText;
        }
      }

      // 2. Clear inline 'style' attributes for any elements inside document
      const elementsWithInlineStyle = Array.from(document.querySelectorAll('[style]'));
      for (const el of elementsWithInlineStyle as HTMLElement[]) {
        const styleAttr = el.getAttribute('style') || '';
        if (styleAttr.toLowerCase().includes('oklch') || styleAttr.toLowerCase().includes('oklab')) {
          inlineStylesToRestore.push({ element: el, originalStyle: styleAttr });
          el.setAttribute('style', stripOklchOklab(styleAttr));
        }
      }

      // 3. Directly iterate document.styleSheets and try to strip oklch/oklab from rules
      for (let i = 0; i < document.styleSheets.length; i++) {
        const sheet = document.styleSheets[i] as CSSStyleSheet;
        try {
          if (sheet && sheet.cssRules) {
            const rules = Array.from(sheet.cssRules);
            for (let j = rules.length - 1; j >= 0; j--) {
              const rule = rules[j];
              if (rule && rule.cssText && (rule.cssText.includes('oklch(') || rule.cssText.includes('oklab('))) {
                try {
                  const cleanedRuleText = stripOklchOklab(rule.cssText);
                  sheet.deleteRule(j);
                  sheet.insertRule(cleanedRuleText, j);
                } catch (ruleErr) {
                  console.warn("Could not rewrite individual css rule:", ruleErr);
                  try {
                    sheet.deleteRule(j); // Delete rules that crash html2canvas
                  } catch (delErr) {
                    console.error("Could not delete rule:", delErr);
                  }
                }
              }
            }
          }
        } catch (e) {
          // If we can't access cssRules (CORS/SecurityError), disable the whole sheet during printing!
          console.warn("Could not read/edit stylesheet rules directly due to CORS or other:", e);
          try {
            const ownerNode = sheet.ownerNode;
            if (ownerNode && (ownerNode instanceof HTMLLinkElement || ownerNode instanceof HTMLStyleElement)) {
              if (ownerNode instanceof HTMLLinkElement) {
                if (!linksToRestore.some(item => item.element === ownerNode)) {
                  linksToRestore.push({ element: ownerNode, disabled: ownerNode.disabled });
                  ownerNode.disabled = true;
                }
              } else if (ownerNode instanceof HTMLStyleElement) {
                styleElementsToRestore.push({ element: ownerNode, originalText: ownerNode.textContent || '' });
                ownerNode.textContent = stripOklchOklab(ownerNode.textContent || '');
              }
            }
          } catch (nodeErr) {
            console.error("Could not disable owner node for sheet:", nodeErr);
          }
        }
      }

      // 4. Process stylesheet links via fetch & clean, disable failing ones to prevent parser errors
      const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
      for (const link of links) {
        try {
          const response = await fetch(link.href);
          if (response.ok) {
            const cssText = await response.text();
            if (cssText.includes('oklch(') || cssText.includes('oklab(')) {
              if (!linksToRestore.some(item => item.element === link)) {
                linksToRestore.push({ element: link, disabled: link.disabled });
                link.disabled = true;
              }

              const cleanedText = stripOklchOklab(cssText);

              const newStyle = document.createElement('style');
              newStyle.setAttribute('data-cleaned-style', 'true');
              newStyle.textContent = cleanedText;
              document.head.appendChild(newStyle);
              injectedStyleTags.push(newStyle);
            }
          }
        } catch (linkErr) {
          console.warn("Failed to parse link for oklch/oklab:", link.href, linkErr);
          // CORS / Network fallback: MUST disable temporarily during render to prevent html2canvas crashing
          if (!linksToRestore.some(item => item.element === link)) {
            linksToRestore.push({ element: link, disabled: link.disabled });
            link.disabled = true;
          }
        }
      }
    } catch (err) {
      console.error("Failed during oklch/oklab CSS cleaning phase:", err);
    }

    return () => {
      // Restore elements
      window.getComputedStyle = originalGetComputedStyle;
      styleElementsToRestore.forEach(({ element, originalText }) => {
        element.textContent = originalText;
      });
      linksToRestore.forEach(({ element, disabled }) => {
        element.disabled = disabled;
      });
      inlineStylesToRestore.forEach(({ element, originalStyle }) => {
        element.setAttribute('style', originalStyle);
      });
      injectedStyleTags.forEach(tag => tag.remove());
    };
  };

  const exportInvoiceToPDF = async () => {
    const templateRef = getCurrentTemplateRef();
    const element = templateRef.current;
    if (!element) {
      console.error("Selected template ref is null");
      return;
    }

    let restoreStyles: (() => void) | null = null;
    try {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      // Add printing class to trigger print-specific CSS with setTimeout to let render complete
      element.classList.add('is-printing');

      // Clean oklch styles which crash html2canvas (e.g. Tailwind v4 styling)
      restoreStyles = await cleanOklchStyles();

      setTimeout(() => {
        const opt = {
          margin: 0,
          filename: `${invoiceData.invoiceNo || 'Invoice'}.pdf`,
          image: { type: 'jpeg' as const, quality: 0.98 },
          pagebreak: { mode: ['avoid-all'] },
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
            if (restoreStyles) restoreStyles();
          })
          .catch((err: any) => {
            console.error("html2pdf generation failed:", err);
            element.classList.remove('is-printing');
            if (restoreStyles) restoreStyles();
          });
      }, 150);
    } catch (e) {
      console.error("Download failed:", e);
      element.classList.remove('is-printing');
      if (restoreStyles) restoreStyles();
      window.print();
    }
  };

  const handlePrint = async () => {
    await exportInvoiceToPDF();
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
                <div className="form-group" style={{ flex: '1 1 100px' }}>
                  <label>Tax/VAT %</label>
                  <input 
                    type="number" 
                    id="set-tax" 
                    value={settings.invoice.taxRate || 0}
                    onChange={(e) => updateSettings({ ...settings, invoice: { ...settings.invoice, taxRate: Number(e.target.value) } })}
                  />
                </div>
                <div className="form-group" style={{ flex: '1 1 100px' }}>
                  <label>Discount</label>
                  <input 
                    type="number" 
                    id="set-discount" 
                    value={settings.invoice.discount || 0}
                    onChange={(e) => updateSettings({ ...settings, invoice: { ...settings.invoice, discount: Number(e.target.value) } })}
                  />
                </div>
                <div className="form-group" style={{ flex: '1 1 100px' }}>
                  <label>Shipping Charge</label>
                  <input 
                    type="number" 
                    id="set-shipping" 
                    value={settings.invoice.shippingCharge || 0}
                    onChange={(e) => updateSettings({ ...settings, invoice: { ...settings.invoice, shippingCharge: Number(e.target.value) } })}
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
              <div className="section-title text-[14px] font-bold text-[#1a2a6c] mt-4 mb-2 border-b pb-1">Template Selection</div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Template 1: Modern Elite */}
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
                  <div className="text-center font-bold text-xs">Template 1: Modern Elite</div>
                </div>

                {/* Template 2: Minimalist Grid */}
                <div 
                  className={`cursor-pointer rounded-xl border-2 p-2 transition-all hover:shadow-md ${settings.invoice.templateId === 't2' ? 'border-neutral-800 bg-neutral-100' : 'border-gray-200'}`}
                  onClick={() => updateSettings({ ...settings, invoice: { ...settings.invoice, templateId: 't2' } })}
                >
                  <div className="aspect-[3/4] rounded-lg bg-gray-100 mb-2 flex items-center justify-center overflow-hidden border border-gray-200">
                    <div className="w-full h-full p-1.5 flex flex-col gap-1">
                      <div className="font-extrabold text-[8px] text-black">INVOICE</div>
                      <div className="h-1 bg-gray-200 w-2/3" />
                      <div className="border border-slate-300 w-full h-8 mt-1 p-0.5 flex flex-col justify-between">
                        <div className="h-1 bg-gray-200 w-full" />
                        <div className="h-1 bg-gray-200 w-full" />
                      </div>
                      <div className="mt-auto h-1 bg-gray-400 w-1/3 self-end" />
                    </div>
                  </div>
                  <div className="text-center font-bold text-xs">Template 2: Minimalist Grid</div>
                </div>

                {/* Template 3: Modern Orange */}
                <div 
                  className={`cursor-pointer rounded-xl border-2 p-2 transition-all hover:shadow-md ${settings.invoice.templateId === 't3' ? 'border-[#f25e22] bg-[#f25e22]/5' : 'border-gray-200'}`}
                  onClick={() => updateSettings({ ...settings, invoice: { ...settings.invoice, templateId: 't3' } })}
                >
                  <div className="aspect-[3/4] rounded-lg bg-gray-100 mb-2 flex items-center justify-center overflow-hidden border border-gray-200">
                    <div className="w-full h-full p-0 flex flex-col gap-1">
                      <div className="bg-[#f25e22] text-[6px] text-white p-1 font-bold text-center">INVOICE</div>
                      <div className="px-1 flex justify-between">
                        <div className="w-2 h-2 bg-gray-300 rounded-sm" />
                        <div className="w-2 h-2 bg-gray-300 rounded-sm" />
                      </div>
                      <div className="px-1 h-3 bg-gray-300 w-full" />
                      <div className="px-1 mt-auto h-2 bg-[#f25e22] w-1/2 self-end" />
                    </div>
                  </div>
                  <div className="text-center font-bold text-xs">Template 3: Modern Orange</div>
                </div>

                {/* Template 4: Classic Gold */}
                <div 
                  className={`cursor-pointer rounded-xl border-2 p-2 transition-all hover:shadow-md ${settings.invoice.templateId === 't4' ? 'border-[#c19a6b] bg-[#c19a6b]/5' : 'border-gray-200'}`}
                  onClick={() => updateSettings({ ...settings, invoice: { ...settings.invoice, templateId: 't4' } })}
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
                  <div className="text-center font-bold text-xs">Template 4: Classic Gold</div>
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
            {settings.invoice.templateId === 't2' ? (
              // TEMPLATE 2: MINIMALIST GRID (REFERENCE IMAGE 1 & 3)
              <div ref={template2Ref} id="invoice" className="invoice-card template-t2">
                <div className="t2-minimalist-wrapper flex flex-col h-full bg-white text-black p-2 font-sans select-none">
                {/* Header Top Section: Title & Date */}
                <div className="flex justify-between items-start border-b border-black pb-4 mb-6">
                  <div>
                    <h1 className="text-5xl font-black tracking-tight text-black uppercase leading-none select-none">INVOICE</h1>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-800">
                      <strong>No:</strong> {invoiceData.invoiceNo}<br />
                      <strong>Date:</strong> {invoiceData.date || new Date().toLocaleDateString('en-GB')}
                    </div>
                  </div>
                </div>

                {/* Info row with Store & Client details */}
                <div className="grid grid-cols-2 gap-8 mb-6">
                  {/* Store Details on the Left */}
                  <div className="text-left">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-1.5 pb-0.5 border-b border-slate-200">Store Information</h3>
                    <div className="space-y-0.5 text-xs">
                      <div className="text-xs font-bold text-black uppercase">{settings.shopProfile.name || 'Sharif Poultry Farm'}</div>
                      <div className="text-slate-650 font-semibold">Phone: {settings.shopProfile.phone || '+880 1XXX XXXXXX'}</div>
                      <div className="text-slate-650 font-semibold">Address: {settings.shopProfile.address || 'Dhaka, Bangladesh'}</div>
                    </div>
                  </div>

                  {/* Client Details on the Right */}
                  <div className="text-right">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-1.5 pb-0.5 border-b border-slate-200 text-right">Client Information</h3>
                    <div className="space-y-0.5 text-xs">
                      <div className="text-xs font-bold text-black uppercase">{invoiceData.customer.name || 'John Wick'}</div>
                      <div className="text-slate-650 font-semibold">Phone: {invoiceData.customer.phone || '+1234567890'}</div>
                      <div className="text-slate-650 font-semibold">Address: {invoiceData.customer.address || 'New York'}</div>
                    </div>
                  </div>
                </div>

                {/* Table Block with full grid borders */}
                <div className="relative flex-1 mb-6">
                  <table className="w-full border-collapse border border-slate-300 text-left text-xs bg-white">
                    <thead>
                      <tr className="bg-slate-100 divide-x divide-slate-350 border-b border-slate-350 font-bold text-black">
                        <th className="py-2 px-3 border-l border-slate-300" style={{ width: '45%' }}>Product Description</th>
                        <th className="py-2 px-3 border-l border-slate-300 text-center" style={{ width: '15%' }}>Qty</th>
                        <th className="py-2 px-3 border-l border-slate-300 text-right" style={{ width: '20%' }}>Price</th>
                        <th className="py-2 px-3 border-l border-slate-300 text-right" style={{ width: '20%' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {invoiceData.items.map((item) => (
                        <tr key={item.id} className="divide-x divide-slate-300 text-slate-800">
                          <td className="py-2 px-3 border-l border-slate-300">
                            <div className="print-val font-semibold">{item.description || '-'}</div>
                            <input 
                              type="text" 
                              className="input-cell no-print text-slate-900 font-semibold focus:bg-slate-50 p-0.5 rounded w-full border border-gray-100" 
                              value={item.description}
                              placeholder="Product Name..."
                              onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            />
                          </td>
                          <td className="py-2 px-3 border-l border-slate-300 text-center">
                            <div className="print-val font-mono">{item.qty}</div>
                            <input 
                              type="number" 
                              className="input-cell no-print text-center focus:bg-slate-50 p-0.5 rounded w-full border border-gray-100" 
                              value={item.qty}
                              onChange={(e) => updateItem(item.id, 'qty', Number(e.target.value))}
                            />
                          </td>
                          <td className="py-2 px-3 border-l border-slate-300 text-right">
                            <div className="print-val font-mono">{item.price} {invoiceData.currency}</div>
                            <input 
                              type="number" 
                              className="input-cell no-print text-right focus:bg-slate-50 p-0.5 rounded w-full border border-gray-100" 
                              value={item.price}
                              onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))}
                            />
                          </td>
                          <td className="py-2 px-3 border-l border-slate-300 text-right font-bold text-black font-mono">
                            {(item.qty * item.price).toFixed(2)} {invoiceData.currency}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals Summary and Signature Row */}
                <div className="flex justify-between items-start mt-auto pt-4 border-t border-slate-100">
                  <div className="w-1/2 text-xs text-slate-600 pr-4">
                    {settings.invoice.showNotes && invoiceData.notes && (
                      <div className="mb-4">
                        <strong className="text-black uppercase block mb-1">Notes & Terms:</strong>
                        <p className="whitespace-pre-line text-[10px] leading-relaxed font-semibold">{invoiceData.notes}</p>
                      </div>
                    )}
                  </div>
                  <div className="w-1/2 max-w-[280px] text-xs">
                    <div className="flex justify-between py-1 font-semibold text-slate-600">
                      <span>Subtotal</span>
                      <span className="font-mono text-slate-800">{subtotal.toFixed(2)} {invoiceData.currency}</span>
                    </div>

                    {settings.invoice.showTax && (
                      <div className="flex justify-between py-1 font-semibold text-slate-600">
                        <span>VAT ({settings.invoice.taxRate}%)</span>
                        <span className="font-mono text-slate-800">{taxAmount.toFixed(2)} {invoiceData.currency}</span>
                      </div>
                    )}

                    <div className="flex justify-between py-1 font-semibold text-slate-600">
                      <span>Shipping Charge</span>
                      <span className="font-mono text-slate-800">{shippingCharge.toFixed(2)} {invoiceData.currency}</span>
                    </div>

                    {settings.invoice.showDiscount && (
                      <div className="flex justify-between py-1 font-semibold text-slate-600">
                        <span>Discount</span>
                        <span className="font-mono text-slate-800">- {discountAmount.toFixed(2)} {invoiceData.currency}</span>
                      </div>
                    )}

                    <div className="border-t-2 border-black mt-2 pt-2 flex justify-between font-bold text-black text-[13px]">
                      <span>Grand Total</span>
                      <span className="font-mono text-sm">{grandTotal.toFixed(2)} {invoiceData.currency}</span>
                    </div>
                  </div>
                </div>

                {/* Footer at bottom center */}
                <div className="text-center font-bold text-slate-500 text-[10px] uppercase tracking-wide mt-8 pt-4 border-t border-slate-200 leading-none">
                  This is a system-generated invoice. No signature required.
                </div>
              </div>
              </div>
            ) : settings.invoice.templateId === 't3' ? (
              // TEMPLATE 3: MODERN ORANGE (REFERENCE IMAGE 2)
              <div ref={template3Ref} id="invoice" className="invoice-card template-t3">
                <div className="t3-orange-wrapper flex flex-col h-full bg-white text-slate-900 font-sans select-none">
                {/* Bright Flat Orange header bar spanned full width */}
                <div className="bg-[#f25e22] text-white p-5 rounded-t-lg flex justify-between items-center mb-6">
                  <div className="text-left">
                    <h2 className="text-2xl font-black tracking-tight uppercase leading-none mb-1 select-none">{settings.shopProfile.name || 'Sharif Poultry Farm'}</h2>
                    <p className="text-[11px] font-bold opacity-90 leading-none">{settings.shopProfile.address || 'Dhaka, Bangladesh'}</p>
                  </div>
                  <div className="text-right">
                    <h1 className="text-3xl font-black uppercase tracking-wider leading-none mb-1 select-none font-sans">INVOICE</h1>
                    <p className="text-[10px] font-bold opacity-90 leading-none">
                      No: {invoiceData.invoiceNo} | Date: {invoiceData.date}
                    </p>
                  </div>
                </div>

                {/* Store and Client Info dual-column separated by a thin accent line */}
                <div className="grid grid-cols-2 gap-8 mb-6 px-2 relative">
                  {/* Left Column: Client info */}
                  <div className="text-left pr-4">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Invoice to:</span>
                    <h3 className="text-sm font-black text-[#f25e22] uppercase mb-1">{invoiceData.customer.name || 'John Wick'}</h3>
                    <div className="space-y-0.5 text-xs text-slate-650 font-bold">
                      <p>Phone: {invoiceData.customer.phone || '+1234567890'}</p>
                      <p>Address: {invoiceData.customer.address || 'New York'}</p>
                    </div>
                  </div>

                  {/* Vertical middle accent line */}
                  <div className="absolute top-0 bottom-0 left-1/2 w-px bg-[#f25e22]/20 no-print" />

                  {/* Right Column: Store info */}
                  <div className="text-left pl-8 border-l border-[#f25e22]/20 printing-border-none">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Invoice from:</span>
                    <h3 className="text-sm font-black text-[#f25e22] uppercase mb-1">{settings.shopProfile.name || 'Sharif Poultry Farm'}</h3>
                    <div className="space-y-0.5 text-xs text-slate-650 font-bold font-sans">
                      <p>Phone: {settings.shopProfile.phone || '+880 1XXX XXXXXX'}</p>
                      <p>Address: {settings.shopProfile.address || 'Dhaka, Bangladesh'}</p>
                    </div>
                  </div>
                </div>

                {/* Table Block with orange table headers and orange tint grid */}
                <div className="relative flex-1 mb-6">
                  <table className="w-full border-collapse border border-[#f25e22]/30 text-xs">
                    <thead>
                      <tr className="bg-[#f25e22] text-white font-bold uppercase text-[10px]">
                        <th className="py-2 px-3 text-left" style={{ width: '45%' }}>Product Description</th>
                        <th className="py-2 px-3 text-center" style={{ width: '15%' }}>Qty</th>
                        <th className="py-2 px-3 text-right" style={{ width: '20%' }}>Price</th>
                        <th className="py-2 px-3 text-right" style={{ width: '20%' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f25e22]/10 font-sans">
                      {invoiceData.items.map((item) => (
                        <tr key={item.id} className="text-slate-800 border-b border-[#f25e22]/10">
                          <td className="py-2 px-3 font-semibold text-slate-900">
                            <div className="print-val font-semibold">{item.description || '-'}</div>
                            <input 
                              type="text" 
                              className="input-cell no-print text-slate-900 font-semibold focus:bg-orange-50/50 p-0.5 rounded w-full border border-orange-50" 
                              value={item.description}
                              placeholder="Product Name..."
                              onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            />
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-slate-700">
                            <div className="print-val font-mono">{item.qty}</div>
                            <input 
                              type="number" 
                              className="input-cell no-print text-center focus:bg-orange-50/50 p-0.5 rounded w-full border border-orange-50" 
                              value={item.qty}
                              onChange={(e) => updateItem(item.id, 'qty', Number(e.target.value))}
                            />
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-700">
                            <div className="print-val font-mono">{item.price} {invoiceData.currency}</div>
                            <input 
                              type="number" 
                              className="input-cell no-print text-right focus:bg-orange-50/50 p-0.5 rounded w-full border border-orange-50" 
                              value={item.price}
                              onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))}
                            />
                          </td>
                          <td className="py-2 px-3 text-right font-extrabold text-slate-900 font-mono">
                            {(item.qty * item.price).toFixed(2)} {invoiceData.currency}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Subtotals & Grand totals with orange color highlights */}
                <div className="flex justify-between items-start mt-auto pt-4 border-t border-slate-100">
                  <div className="w-1/2 text-xs text-slate-600 pr-4 animate-pulse">
                    {settings.invoice.showNotes && invoiceData.notes && (
                      <div className="mb-4">
                        <strong className="text-slate-800 uppercase block mb-1">Notes & Terms:</strong>
                        <p className="whitespace-pre-line text-[10px] leading-relaxed font-bold text-[#f25e22]">{invoiceData.notes}</p>
                      </div>
                    )}
                  </div>
                  <div className="w-1/2 max-w-[280px] text-xs">
                    <div className="flex justify-between py-1 font-semibold text-slate-600 font-sans">
                      <span>Subtotal</span>
                      <span className="font-bold text-slate-900 font-mono">{subtotal.toFixed(2)} {invoiceData.currency}</span>
                    </div>

                    {settings.invoice.showTax && (
                      <div className="flex justify-between py-1 font-semibold text-slate-600 font-sans">
                        <span>VAT ({settings.invoice.taxRate}%)</span>
                        <span className="font-bold text-slate-900 font-mono">{taxAmount.toFixed(2)} {invoiceData.currency}</span>
                      </div>
                    )}

                    <div className="flex justify-between py-1 font-semibold text-slate-600 font-sans">
                      <span>Shipping Charge</span>
                      <span className="font-bold text-slate-900 font-mono">{shippingCharge.toFixed(2)} {invoiceData.currency}</span>
                    </div>

                    {settings.invoice.showDiscount && (
                      <div className="flex justify-between py-1 font-semibold text-slate-600 font-sans">
                        <span>Discount</span>
                        <span className="font-bold text-slate-900 font-mono">- {discountAmount.toFixed(2)} {invoiceData.currency}</span>
                      </div>
                    )}

                    <div className="border-t-2 border-[#f25e22] mt-2 pt-2 flex justify-between font-black text-[#f25e22] text-[13px] uppercase tracking-wider">
                      <span>Grand Total</span>
                      <span className="font-mono text-sm">{grandTotal.toFixed(2)} {invoiceData.currency}</span>
                    </div>
                  </div>
                </div>

                {/* Footer disclaimer centered at deep bottom */}
                <div className="text-center font-black text-[#f25e22]/80 text-[10px] uppercase tracking-wide mt-8 pt-4 border-t border-orange-100 select-none font-sans">
                  This is a system-generated invoice. No signature required.
                </div>
              </div>
              </div>
            ) : settings.invoice.templateId === 't4' ? (
              // TEMPLATE 4: CLASSIC GOLD
              <div ref={template4Ref} id="invoice" className="invoice-card template-t4">
                <div className="t2-wrapper flex flex-col h-full bg-white select-none">
                <div className="t2-header flex justify-between items-start mb-8 select-none">
                  <div className="t2-company-info">
                    <div className="logo-box !w-24 !h-24 !mb-4 !border-dashed !border-slate-300">
                      {settings.shopProfile.logoUrl && settings.invoice.showLogo ? (
                        <img src={settings.shopProfile.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold">LOGO</span>
                      )}
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-1 uppercase tracking-tight font-sans">COMPANY: {settings.shopProfile.name || 'TRADEFLOW'}</h2>
                    <p className="text-xs text-slate-600 font-medium font-sans">{settings.shopProfile.address || 'Address Line 1, City'}</p>
                    <p className="text-xs text-slate-600 font-medium font-sans">Phone: {settings.shopProfile.phone || '+880 1XXX XXXXXX'}</p>
                  </div>
                  <div className="t2-inv-meta text-right">
                    <h1 className="text-5xl font-serif text-[#c19a6b] italic mb-4 opacity-80 select-none">INVOICE</h1>
                    <div className="space-y-1 font-sans">
                      <p className="text-sm font-bold text-slate-800">Invoice No: <span className="font-mono text-slate-600">{invoiceData.invoiceNo}</span></p>
                      <p className="text-sm font-bold text-slate-800">Date: <span className="font-mono text-slate-600">{invoiceData.date}</span></p>
                    </div>
                  </div>
                </div>

                <div className="t2-separator h-1.5 w-full flex mb-12 select-none">
                   <div className="h-full bg-[#1a2a6c]" style={{ width: '70%' }} />
                   <div className="h-full bg-[#c19a6b]/50" style={{ width: '30%' }} />
                </div>

                <div className="t2-bill-to mb-12 select-none">
                  <div className="inline-block bg-[#1a2a6c] text-white px-4 py-1 rounded-sm text-[11px] font-black uppercase tracking-widest mb-3 font-sans">BILL TO</div>
                  <div className="pl-1 space-y-1 font-sans">
                    <p className="text-sm font-bold text-slate-800">Customer Name: <span className="font-semibold text-slate-600">{invoiceData.customer.name}</span></p>
                    <p className="text-sm font-bold text-slate-800">Customer Address: <span className="font-semibold text-slate-600">{invoiceData.customer.address}</span></p>
                    <p className="text-sm font-bold text-slate-800">Customer Phone: <span className="font-semibold text-slate-600">{invoiceData.customer.phone}</span></p>
                  </div>
                </div>

                <div className="t2-items-container relative flex-1">
                   {/* Watermark */}
                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] z-0 overflow-hidden select-none">
                      <div className="w-80 h-80 border-8 border-[#1a2a6c] rounded-full flex items-center justify-center p-8">
                         <div className="w-full h-full border-4 border-[#1a2a6c] rounded-full flex items-center justify-center">
                            <span className="text-6xl font-black text-[#1a2a6c] font-sans">TF</span>
                         </div>
                      </div>
                   </div>

                   <div className="t2-table-header-bar bg-[#1a2a6c] rounded-md h-12 flex items-center px-4 mb-2 select-none">
                       <div className="w-[10%] text-[10px] uppercase font-black tracking-widest text-white font-sans">Serial No.</div>
                       <div className="w-[45%] text-[10px] uppercase font-black tracking-widest text-white font-sans">Product Name & Description</div>
                       <div className="w-[15%] text-[10px] uppercase font-black tracking-widest text-center text-white font-sans">Quantity</div>
                       <div className="w-[15%] text-[10px] uppercase font-black tracking-widest text-center text-white font-sans">Price</div>
                       <div className="w-[15%] text-[10px] uppercase font-black tracking-widest text-center text-white font-sans">Total</div>
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
                      <tbody className="divide-y divide-slate-100 font-sans">
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
                   <div className="t2-totals-box bg-white p-6 rounded-2xl border-2 border-[#c19a6b]/20 shadow-xl shadow-[#c19a6b]/5 min-w-[300px] select-none">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-slate-500 font-bold uppercase tracking-widest text-[11px] font-sans">
                          <span>Subtotal:</span>
                          <span className="font-mono text-sm text-slate-800">{invoiceData.currency} {subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-500 font-bold uppercase tracking-widest text-[11px] font-sans">
                          <span>Shipping:</span>
                          <span className="font-mono text-sm text-slate-800">{invoiceData.currency} {shippingCharge.toFixed(2)}</span>
                        </div>
                        <div className="h-px bg-slate-200" />
                        <div className="flex justify-between items-end font-sans">
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
                   <div className="text-right select-none font-sans">
                      <p className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em] mb-1">Generated by {settings.shopProfile.name || 'TradeFlow'}</p>
                      <div className="flex justify-end opacity-20">
                         <div className="w-8 h-8 rounded-full border-2 border-slate-400 p-1">
                            <div className="w-full h-full bg-slate-400 rounded-full" />
                         </div>
                      </div>
                   </div>
                </div>
              </div>
              </div>
            ) : (
              // TEMPLATE 1: MODERN ELITE (Original)
              <div ref={template1Ref} id="invoice" className="invoice-card template-t1">
                <div className="header">
                    <div className="logo-area">
                        <div className="logo-box" id="logo-container">
                            {settings.shopProfile.logoUrl && settings.invoice.showLogo ? (
                              <img id="disp-logo" src={settings.shopProfile.logoUrl} alt="Logo" referrerPolicy="no-referrer" />
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
                        <div className="inv-title uppercase">Invoice</div>
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

                <div className="summary-wrapper mt-auto">
                    <div className={`notes-box ${!settings.invoice.showNotes ? 'hidden' : ''}`} id="sec-notes" style={{ width: '45%' }}>
                        <div className="bill-label">NOTES & TERMS</div>
                        <div style={{ marginTop: '5px', whiteSpace: 'pre-line', fontSize: '10px', lineHeight: '1.4' }} className="font-semibold text-slate-700">
                          {invoiceData.notes}
                        </div>
                    </div>
                    <div className="calc-box ml-auto" style={{ width: '45%' }}>
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
                        <div className="calc-row">
                            <span>Shipping Charge:</span>
                            <span>{invoiceData.currency} {shippingCharge.toFixed(2)}</span>
                        </div>
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
              </div>
            )}
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

        /* --- TEMPLATE 4 (CLASSIC GOLD) SPECIFIC STYLES --- */
        .template-t4 {
           font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
           background: #ffffff !important;
        }
        .template-t4 .font-serif {
           font-family: 'Playfair Display', serif !important;
        }
        .template-t4 .t2-header {
           border-bottom: none !important;
        }
        .template-t4 .t2-table th {
           background: #1a2a6c !important;
           color: white !important;
           text-transform: uppercase;
           font-size: 10px;
           letter-spacing: 0.1em;
        }
        .template-t4 .t2-table td {
           border-bottom: 1px solid #f1f5f9 !important;
           vertical-align: middle;
        }
        .template-t4 .input-cell {
           border: none !important;
           outline: none !important;
           background: transparent !important;
           padding: 0 !important;
           width: 100%;
        }
        .template-t4 .t2-totals-box {
           background: linear-gradient(135deg, #ffffff 0%, #fdfbf7 100%) !important;
        }
        .template-t4 .is-printing .no-print {
           display: none !important;
        }

        /* --- TEMPLATE 2 (MINIMALIST GRID) & TEMPLATE 3 (MODERN ORANGE) STYLES --- */
        .template-t2, .template-t2 .t2-minimalist-wrapper {
           background: #ffffff !important;
           font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
        }
        .template-t3, .template-t3 .t3-orange-wrapper {
           background: #ffffff !important;
           font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
        }
        .template-t2 .input-cell, .template-t3 .input-cell {
           border: none !important;
           outline: none !important;
           background: transparent !important;
           padding: 0 !important;
           width: 100%;
        }

        /* --- PRINT COMPACTNESS AND ADAPTIVE SCALING FOR EXPORT --- */
        .is-printing .t2-minimalist-wrapper,
        .is-printing .t3-orange-wrapper,
        .is-printing .t2-wrapper {
            background-color: #ffffff !important;
            color: #000000 !important;
            height: 100% !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            padding: 0 !important;
            margin: 0 !important;
        }

        .is-printing .t2-minimalist-wrapper h1,
        .is-printing .t2-minimalist-wrapper h3,
        .is-printing .t2-minimalist-wrapper span,
        .is-printing .t2-minimalist-wrapper table {
            color: #000000 !important;
            border-color: #334155 !important;
        }

        .is-printing .t3-orange-wrapper h2,
        .is-printing .t3-orange-wrapper h3,
        .is-printing .t3-orange-wrapper .bg-\[\#f25e22\] {
            background-color: #f25e22 !important;
            color: #ffffff !important;
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
              height: 295mm !important; 
              min-height: 295mm !important; 
              max-height: 295mm !important; 
              padding: 15mm !important; 
              margin: 0 !important; 
              border: none !important; 
              overflow: hidden !important;
              page-break-inside: avoid !important;
              page-break-before: avoid !important;
              page-break-after: avoid !important;
            }
            .t2-minimalist-wrapper,
            .t3-orange-wrapper,
            .t2-wrapper,
            .items-table,
            .items-table tr,
            .items-table td,
            .summary-wrapper,
            .notes-box,
            .calc-box,
            .sig-section {
                page-break-inside: avoid !important;
                page-break-before: avoid !important;
                page-break-after: avoid !important;
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

        /* Template 2 (Minimalist Grid) Dark Mode Overlay */
        [data-theme='dark'] .invoice-card:not(.is-printing) .t2-minimalist-wrapper {
            background-color: #0b1220 !important;
            color: #ffffff !important;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .t2-minimalist-wrapper h1,
        [data-theme='dark'] .invoice-card:not(.is-printing) .t2-minimalist-wrapper h3,
        [data-theme='dark'] .invoice-card:not(.is-printing) .t2-minimalist-wrapper strong,
        [data-theme='dark'] .invoice-card:not(.is-printing) .t2-minimalist-wrapper .text-black,
        [data-theme='dark'] .invoice-card:not(.is-printing) .t2-minimalist-wrapper .text-slate-900 {
            color: #ffffff !important;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .t2-minimalist-wrapper .text-slate-600,
        [data-theme='dark'] .invoice-card:not(.is-printing) .t2-minimalist-wrapper .text-slate-500 {
            color: #cbd5e1 !important;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .t2-minimalist-wrapper table {
            border-color: rgba(255, 255, 255, 0.15) !important;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .t2-minimalist-wrapper th {
            background-color: #111827 !important;
            color: #ffffff !important;
            border-color: rgba(255, 255, 255, 0.15) !important;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .t2-minimalist-wrapper td {
            color: #cbd5e1 !important;
            border-color: rgba(255, 255, 255, 0.1) !important;
        }

        /* Template 3 (Modern Orange) Dark Mode Overlay */
        [data-theme='dark'] .invoice-card:not(.is-printing) .t3-orange-wrapper {
            background-color: #0b1220 !important;
            color: #ffffff !important;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .t3-orange-wrapper h1,
        [data-theme='dark'] .invoice-card:not(.is-printing) .t3-orange-wrapper h3,
        [data-theme='dark'] .invoice-card:not(.is-printing) .t3-orange-wrapper p,
        [data-theme='dark'] .invoice-card:not(.is-printing) .t3-orange-wrapper strong,
        [data-theme='dark'] .invoice-card:not(.is-printing) .t3-orange-wrapper .text-slate-900 {
            color: #ffffff !important;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .t3-orange-wrapper .text-slate-600,
        [data-theme='dark'] .invoice-card:not(.is-printing) .t3-orange-wrapper .text-slate-500 {
            color: #cbd5e1 !important;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .t3-orange-wrapper table {
            border-color: #f25e22 !important;
        }
        [data-theme='dark'] .invoice-card:not(.is-printing) .t3-orange-wrapper td {
            color: #cbd5e1 !important;
            border-color: rgba(242, 94, 34, 0.15) !important;
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
            height: 295mm !important;
            min-height: 295mm !important;
            max-height: 295mm !important;
            padding: 10mm 12mm 10mm 12mm !important; 
            box-shadow: none !important;
            margin: 0 !important;
            border: none !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
            page-break-before: avoid !important;
            page-break-after: avoid !important;
        }

        .is-printing .t2-minimalist-wrapper,
        .is-printing .t3-orange-wrapper,
        .is-printing .t2-wrapper,
        .is-printing .items-table,
        .is-printing .items-table tr,
        .is-printing .items-table td,
        .is-printing .summary-wrapper,
        .is-printing .notes-box,
        .is-printing .calc-box,
        .is-printing .sig-section {
            page-break-inside: avoid !important;
            page-break-before: avoid !important;
            page-break-after: avoid !important;
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

        /* --- Template 3 Print Compactness --- */
        .is-printing .t3-orange-wrapper {
            background-color: #ffffff !important;
            color: #1e293b !important;
            padding: 0 !important;
            margin: 0 !important;
            height: 100% !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            box-sizing: border-box !important;
        }
        .is-printing .t3-orange-wrapper .bg-\[\#f25e22\] {
            background: #f25e22 !important;
            background-color: #f25e22 !important;
            color: #ffffff !important;
            padding: 10px 14px !important;
            border-radius: 4px !important;
            margin-bottom: 8px !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
        }
        .is-printing .t3-orange-wrapper .bg-\[\#f25e22\] h2 {
            font-size: 16px !important;
            color: #ffffff !important;
            font-weight: 900 !important;
        }
        .is-printing .t3-orange-wrapper .bg-\[\#f25e22\] p {
            font-size: 9px !important;
            color: #ffffff !important;
            font-weight: 700 !important;
        }
        .is-printing .t3-orange-wrapper .bg-\[\#f25e22\] h1 {
            font-size: 20px !important;
            color: #ffffff !important;
            font-weight: 900 !important;
        }
        .is-printing .t3-orange-wrapper .grid {
            gap: 12px !important;
            margin-bottom: 8px !important;
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
        }
        .is-printing .t3-orange-wrapper .grid h3 {
            font-size: 11px !important;
            color: #f25e22 !important;
            margin-bottom: 2px !important;
            font-weight: 900 !important;
        }
        .is-printing .t3-orange-wrapper .grid p {
            font-size: 10px !important;
            color: #475569 !important;
            font-weight: 700 !important;
        }
        .is-printing .t3-orange-wrapper .border-l {
            border-left: 1px solid rgba(242, 94, 34, 0.2) !important;
            padding-left: 16px !important;
        }
        .is-printing .t3-orange-wrapper table {
            border-color: rgba(242, 94, 34, 0.2) !important;
            margin-bottom: 6px !important;
            width: 100% !important;
            border-collapse: collapse !important;
        }
        .is-printing .t3-orange-wrapper th {
            background: #f25e22 !important;
            color: #ffffff !important;
            padding: 5px 8px !important;
            font-size: 10px !important;
            font-weight: 700 !important;
            text-transform: uppercase !important;
        }
        .is-printing .t3-orange-wrapper td {
            padding: 5px 8px !important;
            font-size: 11px !important;
            color: #1e293b !important;
            border-bottom: 1px solid rgba(242, 94, 34, 0.1) !important;
        }
        .is-printing .t3-orange-wrapper td .print-val {
            font-size: 11px !important;
            color: #1e293b !important;
            font-weight: 650 !important;
        }
        .is-printing .t3-orange-wrapper .whitespace-pre-line {
            font-size: 9px !important;
            color: #f25e22 !important;
            line-height: 1.3 !important;
            font-weight: 700 !important;
        }
        .is-printing .t3-orange-wrapper .flex {
            margin-bottom: 0 !important;
        }
        .is-printing .t3-orange-wrapper .w-1\/2 {
            width: 50% !important;
        }
        .is-printing .t3-orange-wrapper .w-1\/2 span {
            font-size: 10px !important;
            color: #475569 !important;
        }
        .is-printing .t3-orange-wrapper .max-w-\[280px\] {
            max-width: 200px !important;
        }
        .is-printing .t3-orange-wrapper .max-w-\[280px\] .flex {
            padding-top: 1px !important;
            padding-bottom: 1px !important;
        }
        .is-printing .t3-orange-wrapper .font-mono {
            color: #1e293b !important;
            font-size: 10px !important;
            font-weight: 700 !important;
        }
        .is-printing .t3-orange-wrapper .border-t-2 {
            border-top: 1.5px solid #f25e22 !important;
            margin-top: 4px !important;
            padding-top: 4px !important;
            font-size: 12px !important;
            color: #f25e22 !important;
            font-weight: 900 !important;
        }
        .is-printing .t3-orange-wrapper .border-t-2 .font-mono {
            font-size: 12px !important;
            color: #f25e22 !important;
        }
        .is-printing .t3-orange-wrapper .text-center {
            font-size: 9px !important;
            color: #f25e22 !important;
            margin-top: auto !important;
            padding-top: 6px !important;
            border-top: 1px solid rgba(242, 94, 34, 0.1) !important;
        }

        /* --- Template 4 Print Compactness --- */
        .is-printing.template-t4 .t2-wrapper {
            background-color: #ffffff !important;
            color: #1e293b !important;
            padding: 0 !important;
            margin: 0 !important;
            height: 100% !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            box-sizing: border-box !important;
        }
        .is-printing.template-t4 .t2-header {
            margin-bottom: 6px !important;
            border-bottom: none !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: flex-start !important;
        }
        .is-printing.template-t4 .t2-company-info h2 {
            font-size: 15px !important;
            color: #1e293b !important;
            margin-bottom: 1px !important;
            font-weight: 900 !important;
        }
        .is-printing.template-t4 .t2-company-info p {
            font-size: 9px !important;
            color: #475569 !important;
            font-weight: 500 !important;
        }
        .is-printing.template-t4 .t2-inv-meta h1 {
            font-size: 26px !important;
            margin-bottom: 2px !important;
            color: #c19a6b !important;
            opacity: 1 !important;
            font-family: 'Playfair Display', serif !important;
            font-style: italic !important;
        }
        .is-printing.template-t4 .t2-inv-meta p {
            font-size: 10px !important;
            color: #334155 !important;
            font-weight: 700 !important;
        }
        .is-printing.template-t4 .t2-separator {
            margin-bottom: 8px !important;
            height: 3px !important;
            display: flex !important;
        }
        .is-printing.template-t4 .t2-bill-to {
            margin-bottom: 8px !important;
            display: block !important;
        }
        .is-printing.template-t4 .t2-bill-to .bill-label {
            font-size: 9px !important;
            padding: 2px 6px !important;
            margin-bottom: 4px !important;
            background: #1a2a6c !important;
            color: #ffffff !important;
            border-radius: 2px !important;
        }
        .is-printing.template-t4 .t2-bill-to p {
            font-size: 10px !important;
            color: #334155 !important;
            font-weight: 700 !important;
        }
        .is-printing.template-t4 .t2-bill-to span {
            color: #475569 !important;
            font-weight: 600 !important;
        }
        .is-printing.template-t4 .t2-table-header-bar {
            height: 28px !important;
            margin-bottom: 2px !important;
            background: #1a2a6c !important;
            padding-left: 8px !important;
            padding-right: 8px !important;
            display: flex !important;
            align-items: center !important;
        }
        .is-printing.template-t4 .t2-table-header-bar div {
            font-size: 9px !important;
            color: #ffffff !important;
            font-weight: 900 !important;
            text-transform: uppercase !important;
        }
        .is-printing.template-t4 .t2-table {
            width: 100% !important;
            border-collapse: collapse !important;
        }
        .is-printing.template-t4 .t2-table td {
            padding: 4px 8px !important;
            font-size: 10px !important;
            color: #1e293b !important;
            border-bottom: 1px solid #f1f5f9 !important;
        }
        .is-printing.template-t4 .t2-table .print-val {
            font-size: 10px !important;
            color: #1e293b !important;
            font-weight: 600 !important;
        }
        .is-printing.template-t4 .t2-totals-box {
            padding: 8px 12px !important;
            border-radius: 6px !important;
            border: 1px solid rgba(193, 154, 107, 0.2) !important;
            min-width: 220px !important;
            background: #fdfbf7 !important;
        }
        .is-printing.template-t4 .t2-totals-box .text-sm {
            font-size: 10px !important;
        }
        .is-printing.template-t4 .t2-totals-box .text-4xl {
            font-size: 18px !important;
        }
        .is-printing.template-t4 .t2-footer {
            padding-top: 6px !important;
            margin-top: auto !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: flex-end !important;
        }
        .is-printing.template-t4 .t2-company-info .logo-box {
            width: 60px !important;
            height: 40px !important;
            margin-bottom: 3px !important;
        }
        .is-printing.template-t4 .t2-totals-box .flex {
            margin-bottom: 0 !important;
        }
        .is-printing.template-t4 .t2-totals-box span {
            font-size: 10px !important;
            color: #475569 !important;
        }
        .is-printing.template-t4 .t2-totals-box .font-mono {
            color: #1e293b !important;
            font-size: 11px !important;
        }
        .is-printing.template-t4 .t2-totals-box .text-2xl {
            font-size: 14px !important;
        }
        .is-printing.template-t4 .t2-totals-box .text-4xl {
            font-size: 18px !important;
            color: #1e293b !important;
        }
        .is-printing.template-t4 .t2-totals-box .h-px {
            margin-top: 3px !important;
            margin-bottom: 3px !important;
        }
        .is-printing.template-t4 .t2-totals-box .space-y-4 {
            --spacing: 3px !important;
        }

      ` }} />
    </div>
  );
};

