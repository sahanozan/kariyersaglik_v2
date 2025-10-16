/**
 * Performance optimization utilities for the app
 */
import React from 'react';

// Debounce function for search inputs
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait) as any;
  };
};

// Throttle function for scroll events
export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Memoization for expensive calculations
export const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
  const cache = new Map();
  return ((...args: any[]) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

// Image optimization helper
export const optimizeImageUrl = (url: string, width?: number, height?: number): string => {
  if (!url) return url;
  
  // If it's a Pexels URL, add optimization parameters
  if (url.includes('pexels.com')) {
    const baseUrl = url.split('?')[0];
    const params = new URLSearchParams();
    params.set('auto', 'compress');
    params.set('cs', 'tinysrgb');
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    params.set('fit', 'crop');
    return `${baseUrl}?${params.toString()}`;
  }
  
  return url;
};

// Batch API calls to reduce network requests
export const batchApiCalls = async <T>(
  calls: (() => Promise<T>)[],
  batchSize: number = 5
): Promise<T[]> => {
  const results: T[] = [];
  
  for (let i = 0; i < calls.length; i += batchSize) {
    const batch = calls.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(call => call()));
    results.push(...batchResults);
  }
  
  return results;
};

// Format large numbers for display
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// Check if device has low memory
export const isLowMemoryDevice = (): boolean => {
  // This is a simple heuristic - in a real app you might use
  // react-native-device-info or similar
  return false; // Placeholder
};

// Lazy loading helper for components
export const createLazyComponent = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) => {
  return React.lazy(importFunc);
};

// Performance monitoring
export const performanceMonitor = {
  startTime: (label: string) => {
    console.time(label);
  },
  
  endTime: (label: string) => {
    console.timeEnd(label);
  },
  
  measure: async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
    console.time(label);
    try {
      const result = await fn();
      return result;
    } finally {
      console.timeEnd(label);
    }
  }
};
