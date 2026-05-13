import { storage } from './storage';
import { Product, Transaction, Customer } from '../types';

export const initializeMockData = (userId: string) => {
  const CLEAN_FLAG = `tradeflow_cleaned_${userId}`;
  const isCleaned = localStorage.getItem(CLEAN_FLAG);

  if (!isCleaned) {
    storage.clearAllData(userId);
    localStorage.setItem(CLEAN_FLAG, 'true');
    console.log('Demo data cleaned for user:', userId);
  }
};
