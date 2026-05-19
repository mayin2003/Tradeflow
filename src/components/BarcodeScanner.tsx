import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export const BarcodeScanner = ({ onScan, onClose }: BarcodeScannerProps) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render((decodedText) => {
      onScan(decodedText);
      scanner.clear();
      onClose();
    }, (error) => {
      // "No Multi-format found" is a common error while looking for barcode, we ignore it.
    });

    // Handle initialization errors (like permission denied)
    const originalClear = scanner.clear.bind(scanner);
    // Note: Html5QrcodeScanner doesn't expose a clean way to catch render initialization errors 
    // unless we use Html5Qrcode directly, but adding the metadata permission is the key part.

    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error("Failed to clear scanner", e));
      }
    };
  }, [onScan, onClose]);

  return (
    <div className="modal-overlay custom-modal-overlay" style={{ zIndex: 2000 }}>
      <div className="retro-modal" style={{ height: 'auto' }}>
        <div className="retro-modal-header">
          <h3>Scan QR / Barcode</h3>
          <button className="retro-close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="retro-modal-body">
          <p style={{ marginBottom: '16px', fontSize: '14px', opacity: 0.8 }}>
            Position the code within the frame to scan automatically.
          </p>
          <div id="reader" style={{ width: '100%', overflow: 'hidden', borderRadius: '12px' }}></div>
        </div>
        <div className="retro-modal-footer">
          <button className="retro-btn-metallic-silver lg" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};
