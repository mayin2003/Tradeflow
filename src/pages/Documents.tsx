import React, { useState, useRef } from 'react';
import { useData } from '../context/DataContext';

export const DocumentsComponent = () => {
  const { documents, addDocument, deleteDocument } = useData();
  const [dragActive, setDragActive] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('All');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClosePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setPreviewDoc(null);
  };

  const openPreview = (doc: any) => {
    setPreviewDoc(doc);
    if (doc.file_type.includes('pdf') || doc.file_type.includes('image')) {
      try {
        // More efficient base64 to blob conversion
        const base64 = doc.file_data.split(',')[1];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: doc.file_type });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      } catch (err) {
        console.error("Error creating preview URL:", err);
        setPreviewUrl(doc.file_data); // Fallback to base64
      }
    }
  };

  const handleFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      addDocument({
        name: file.name,
        type: dTypeFromExt(file.name),
        size: formatBytes(file.size),
        file_data: base64Data,
        file_type: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  const dTypeFromExt = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'PDF Document';
    if (['jpg', 'jpeg', 'png', 'svg'].includes(ext || '')) return 'Image';
    if (['doc', 'docx'].includes(ext || '')) return 'Word Document';
    return 'Trade Document';
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDownload = (doc: any) => {
    const link = document.createElement('a');
    link.href = doc.file_data;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getDocIcon = (type: string) => {
    if (type.includes('PDF')) return '📕';
    if (type.includes('Image')) return '🖼️';
    if (type.includes('Word')) return '📘';
    return '📄';
  };

  const filteredDocs = filterType === 'All' 
    ? documents 
    : documents.filter(d => d.type.includes(filterType));

  return (
    <div id="page-documents" className="page active">
      <div className="page-header">
        <div>
          <h2>Document Management</h2>
          <p>Store and manage trade documents securely</p>
        </div>
        <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
          + Upload Document
        </button>
      </div>

      <div 
        className={`upload-zone ${dragActive ? 'active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: dragActive ? '2px solid var(--accent)' : '2px dashed #e2e8f0',
          background: dragActive ? 'rgba(14, 165, 233, 0.05)' : '#f8fafc',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          style={{ display: 'none' }}
        />
        <div className="icon" style={{ fontSize: '40px', marginBottom: '12px' }}>📤</div>
        <p style={{ margin: '0', fontSize: '16px' }}><strong>Click to upload</strong> or drag and drop documents here</p>
        <p style={{ fontSize: '12px', marginTop: '6px', color: 'var(--text-muted)' }}>Supports PDF, JPG, PNG, DOCX up to 10MB</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
        {['All', 'PDF', 'Image', 'Word'].map(type => (
          <button 
            key={type}
            className={`btn btn-sm ${filterType === type ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilterType(type)}
          >
            {type}
          </button>
        ))}
      </div>

      {filteredDocs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '12px', color: '#64748b' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📂</div>
          <p>No documents found. Start by uploading one!</p>
        </div>
      ) : (
        <div className="doc-grid">
          {filteredDocs.map(d => (
            <div key={d.id} className="doc-card" style={{ position: 'relative' }}>
              <button 
                onClick={(e) => { e.stopPropagation(); if(confirm('Delete this document?')) deleteDocument(d.id, d.name); }}
                style={{ 
                  position: 'absolute', 
                  top: '8px', 
                  right: '8px', 
                  background: 'none', 
                  border: 'none', 
                  fontSize: '14px', 
                  cursor: 'pointer',
                  opacity: 0.5
                }}
              >🗑️</button>
              <div className="doc-icon" style={{ fontSize: '32px', marginBottom: '12px' }}>{getDocIcon(d.type)}</div>
              <div className="doc-name" style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '4px' }}>{d.name}</div>
              <div className="doc-meta" style={{ fontSize: '12px', color: '#64748b' }}>{d.type}</div>
              <div className="doc-meta" style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{d.size} · {new Date(d.date).toLocaleDateString()}</div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '16px', justifyContent: 'center' }}>
                <button className="btn btn-sm btn-outline" onClick={() => openPreview(d)}>👁 Preview</button>
                <button className="btn btn-sm btn-outline" onClick={() => handleDownload(d)}>⬇ Download</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div style={{ 
          position: 'fixed', 
          top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.8)', 
          zIndex: 1000, 
          display: 'flex', 
          flexDirection: 'column',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', color: '#fff' }}>
            <h3 style={{ margin: 0 }}>{previewDoc.name}</h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              {previewUrl && (
                <button 
                  className="btn" 
                  style={{ background: '#0ea5e9', color: '#fff' }} 
                  onClick={() => window.open(previewUrl, '_blank')}
                >Open in New Tab</button>
              )}
              <button className="btn btn-primary" onClick={() => handleDownload(previewDoc)}>Download</button>
              <button className="btn" style={{ background: '#334155', color: '#fff' }} onClick={handleClosePreview}>Close</button>
            </div>
          </div>
          <div style={{ 
            flex: 1, 
            background: '#fff', 
            borderRadius: '12px', 
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            {previewDoc.file_type.includes('image') ? (
              <img src={previewUrl || previewDoc.file_data} alt={previewDoc.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            ) : previewDoc.file_type.includes('pdf') ? (
              <embed 
                src={`${previewUrl}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`} 
                type="application/pdf"
                style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px' }} 
              />
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>📄</div>
                <p style={{ fontSize: '18px', fontWeight: 600 }}>No Visual Preview Available</p>
                <p style={{ color: '#64748b' }}>This file type ({previewDoc.type}) cannot be previewed directly.</p>
                <button className="btn btn-primary" onClick={() => handleDownload(previewDoc)}>Download to View</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const Documents = React.memo(DocumentsComponent);
