import { Platform } from 'react-native';

// Date formatting utilities with Istanbul timezone
export const formatDate = (dateString: string, locale: string = 'tr-TR') => {
  return new Date(dateString).toLocaleDateString(locale, {
    timeZone: 'Europe/Istanbul'
  });
};

export const formatTime = (dateString: string, locale: string = 'tr-TR') => {
  return new Date(dateString).toLocaleTimeString(locale, { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'Europe/Istanbul'
  });
};

export const formatDateTime = (dateString: string, locale: string = 'tr-TR') => {
  const date = new Date(dateString);
  return `${date.toLocaleDateString(locale, {
    timeZone: 'Europe/Istanbul'
  })} ${date.toLocaleTimeString(locale, { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'Europe/Istanbul'
  })}`;
};

// Text utilities
export const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const capitalizeFirst = (text: string) => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};

// Validation utilities
export const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string) => {
  const phoneRegex = /^[0-9\s\-\+\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

// Platform utilities
export const isWeb = () => Platform.OS === 'web';
export const isMobile = () => Platform.OS !== 'web';

// Color utilities
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return '#D97706';
    case 'approved': 
    case 'accepted': return '#10B981';
    case 'rejected': return '#DC2626';
    case 'reviewed': return '#3B82F6';
    default: return '#6B7280';
  }
};

export const getUrgencyColor = (urgency: string) => {
  switch (urgency) {
    case 'high': return '#DC2626';
    case 'medium': return '#D97706';
    case 'low': return '#059669';
    default: return '#6B7280';
  }
};

// Array utilities
export const groupBy = <T>(array: T[], key: keyof T) => {
  return array.reduce((groups, item) => {
    const group = (groups[item[key] as string] || []);
    group.push(item);
    groups[item[key] as string] = group;
    return groups;
  }, {} as Record<string, T[]>);
};

// Async utilities
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Error handling utilities
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  
  if (error?.message?.includes('Failed to fetch')) {
    return 'Bağlantı hatası. İnternet bağlantınızı kontrol edin.';
  }
  
  if (error?.message?.includes('JWT')) {
    return 'Oturum süresi doldu. Lütfen tekrar giriş yapın.';
  }
  
  if (error?.message?.includes('duplicate')) {
    return 'Bu kayıt zaten mevcut.';
  }
  
  if (error?.message?.includes('foreign key')) {
    return 'İlişkili veri bulunamadı.';
  }
  
  return error?.message || 'Bilinmeyen bir hata oluştu.';
};

// Date validation utilities
export const isValidDateString = (dateString: string): boolean => {
  if (!dateString) return false;
  
  // Check format YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;
  
  // Check if it's a valid date
  const date = new Date(dateString + 'T00:00:00');
  const [year, month, day] = dateString.split('-').map(Number);
  
  return date.getFullYear() === year &&
         date.getMonth() === month - 1 &&
         date.getDate() === day &&
         year >= 1900 && year <= 2100;
};

export const isValidTimeString = (timeString: string): boolean => {
  if (!timeString) return false;
  
  // Check format HH:MM
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
};

export const isDateInFuture = (dateString: string, timeString?: string): boolean => {
  if (!isValidDateString(dateString)) return false;
  
  const inputDate = new Date(dateString + 'T' + (timeString || '00:00:00'));
  const now = new Date();
  
  return inputDate > now;
};

// DD/MM/YYYY format validation utilities
export const isValidDDMMYYYYDate = (dateString: string): boolean => {
  if (!dateString) return false;
  
  // Check format DD/MM/YYYY
  const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!dateRegex.test(dateString)) return false;
  
  // Check if it's a valid date
  const [day, month, year] = dateString.split('/').map(Number);
  
  // Basic validation
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  
  // Create date and validate
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year &&
         date.getMonth() === month - 1 &&
         date.getDate() === day;
};

export const convertDDMMYYYYToDate = (dateString: string): Date | null => {
  if (!isValidDDMMYYYYDate(dateString)) return null;
  
  const [day, month, year] = dateString.split('/').map(Number);
  return new Date(year, month - 1, day);
};

export const isDateInFutureDDMMYYYY = (dateString: string, timeString?: string): boolean => {
  if (!dateString) return false;
  
  // Check if date string is in DD/MM/YYYY format
  const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!dateRegex.test(dateString)) {
    console.log('❌ Invalid date format:', dateString);
    return false;
  }
  
  const [day, month, year] = dateString.split('/').map(Number);
  
  // Basic validation
  if (year < 2024 || year > 2050) {
    console.log('❌ Year out of range:', year);
    return false;
  }
  if (month < 1 || month > 12) {
    console.log('❌ Month out of range:', month);
    return false;
  }
  if (day < 1 || day > 31) {
    console.log('❌ Day out of range:', day);
    return false;
  }
  
  // Create date object
  const date = new Date(year, month - 1, day);
  
  // Validate the date is valid
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    console.log('❌ Invalid date:', dateString);
    return false;
  }
  
  // If time is provided, add it to the date
  if (timeString && isValidTimeString(timeString)) {
    const [hours, minutes] = timeString.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);
  } else {
    // Set to end of day to allow today's date
    date.setHours(23, 59, 59, 999);
  }
  
  const now = new Date();
  console.log('🔍 Comparing dates:', { dateString, date: date.toISOString(), now: now.toISOString(), isValid: date >= now });
  
  // Allow today's date and future dates
  return date >= now;
};

// Conversation ID generator
export const generateConversationId = (userId1: string, userId2: string) => {
  return [userId1, userId2].sort().join('_');
};

// Better date and time formatting for Turkish locale with Istanbul timezone
export const formatPostDateTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Tarih bilinmiyor';
    }
    
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    // Show relative time for recent posts
    if (diffInMinutes < 1) {
      return 'Az önce';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} dakika önce`;
    } else if (diffInHours < 24) {
      return `${diffInHours} saat önce`;
    } else if (diffInDays === 1) {
      return 'Dün';
    } else if (diffInDays < 7) {
      return `${diffInDays} gün önce`;
    } else {
      // For older posts, show full date and time
      return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Istanbul'
      });
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Tarih bilinmiyor';
  }
};
