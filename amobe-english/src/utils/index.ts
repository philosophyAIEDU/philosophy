// Utility Functions

/**
 * Generates a unique ID
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Formats a date to locale string
 */
export const formatDate = (date: Date | string, locale = 'en-US'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Formats time in minutes to readable format
 */
export const formatMinutes = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function
 */
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

/**
 * Clamps a number between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Normalizes a string for comparison
 */
export const normalizeString = (str: string): string => {
  return str.toLowerCase().replace(/[^\w\s]/g, '').trim();
};

/**
 * Calculates word count
 */
export const getWordCount = (text: string): number => {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
};

/**
 * Calculates character count
 */
export const getCharCount = (text: string): number => {
  return text.length;
};

/**
 * Calculates reading time in minutes
 */
export const getReadingTime = (text: string, wordsPerMinute = 200): number => {
  const wordCount = getWordCount(text);
  return Math.ceil(wordCount / wordsPerMinute);
};

/**
 * Truncates text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};

/**
 * Capitalizes first letter
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Converts camelCase to Title Case
 */
export const camelToTitle = (str: string): string => {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
};

/**
 * Calculates percentage
 */
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

/**
 * Calculates accuracy between two strings
 */
export const calculateAccuracy = (userText: string, correctText: string): number => {
  const userWords = normalizeString(userText).split(/\s+/).filter(Boolean);
  const correctWords = normalizeString(correctText).split(/\s+/).filter(Boolean);

  if (correctWords.length === 0) return 0;

  let correctCount = 0;
  const maxLength = Math.max(userWords.length, correctWords.length);

  for (let i = 0; i < maxLength; i++) {
    if (userWords[i] === correctWords[i]) {
      correctCount++;
    }
  }

  return (correctCount / correctWords.length) * 100;
};

/**
 * Generates a color based on score
 */
export const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  return 'text-red-400';
};

/**
 * Generates a background color based on score
 */
export const getScoreBgColor = (score: number): string => {
  if (score >= 80) return 'bg-green-900/20';
  if (score >= 60) return 'bg-yellow-900/20';
  return 'bg-red-900/20';
};

/**
 * Validates email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Checks if localStorage is available
 */
export const isLocalStorageAvailable = (): boolean => {
  try {
    const testKey = '__test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

/**
 * Safely parses JSON
 */
export const safeJsonParse = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
};

/**
 * Creates a delay promise
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Retries a function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries - 1) {
        await delay(baseDelay * Math.pow(2, attempt));
      }
    }
  }

  throw lastError;
};

/**
 * Checks if the browser supports Web Speech API
 */
export const isSpeechSynthesisSupported = (): boolean => {
  return 'speechSynthesis' in window;
};

/**
 * Checks if the browser supports MediaRecorder API
 */
export const isMediaRecorderSupported = (): boolean => {
  return 'MediaRecorder' in window;
};

/**
 * Gets the current date in ISO format (date only)
 */
export const getTodayISO = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Checks if two dates are the same day
 */
export const isSameDay = (date1: Date | string, date2: Date | string): boolean => {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  return d1.toDateString() === d2.toDateString();
};

/**
 * Gets days between two dates
 */
export const getDaysBetween = (date1: Date | string, date2: Date | string): number => {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Classnames utility (simple version of clsx/classnames)
 */
export const cn = (...classes: (string | boolean | undefined | null)[]): string => {
  return classes.filter(Boolean).join(' ');
};
