import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isUuid(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export function ensureUuid(id: string): string {
  if (!id) return '00000000-0000-4000-8000-000000000000';
  if (isUuid(id)) return id;
  
  // Deterministically convert any non-UUID string into a valid UUID v4 format
  let hash1 = 0;
  let hash2 = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash1 = (hash1 << 5) - hash1 + char;
    hash1 |= 0;
    hash2 = (hash2 << 7) - hash2 + char;
    hash2 |= 0;
  }
  
  const h1 = Math.abs(hash1).toString(16).padStart(8, '0');
  const h2 = Math.abs(hash2).toString(16).padStart(8, '0');
  const combined = (h1 + h2 + '0000000000000000').slice(0, 32);
  
  return `${combined.slice(0, 8)}-${combined.slice(8, 12)}-4${combined.slice(13, 16)}-8${combined.slice(17, 20)}-${combined.slice(20, 32)}`;
}

export function formatCurrency(amount: number, currency: string = '৳') {
  return `${currency}${amount.toLocaleString('en-BD')}`;
}

export function formatDate(date: string | Date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
