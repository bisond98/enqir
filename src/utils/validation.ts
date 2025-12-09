/**
 * Input validation and sanitization utilities
 * Prevents XSS, SQL injection, and validates user inputs
 */

/**
 * Sanitize string input to prevent XSS attacks
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .slice(0, 10000); // Limit length
};

/**
 * Validate and sanitize text input
 */
export const validateText = (text: string, minLength: number = 1, maxLength: number = 10000): {
  isValid: boolean;
  sanitized: string;
  error?: string;
} => {
  const sanitized = sanitizeInput(text);
  
  if (sanitized.length < minLength) {
    return {
      isValid: false,
      sanitized,
      error: `Text must be at least ${minLength} characters long`
    };
  }
  
  if (sanitized.length > maxLength) {
    return {
      isValid: false,
      sanitized,
      error: `Text must be no more than ${maxLength} characters long`
    };
  }
  
  return {
    isValid: true,
    sanitized
  };
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validate budget/price input
 */
export const validateBudget = (budget: string): {
  isValid: boolean;
  sanitized: string;
  error?: string;
} => {
  const sanitized = budget.trim();
  
  // Allow numbers, commas, and currency symbols
  const budgetRegex = /^[\d,\s₹$€£¥]+$/;
  
  if (!budgetRegex.test(sanitized)) {
    return {
      isValid: false,
      sanitized,
      error: 'Budget contains invalid characters'
    };
  }
  
  return {
    isValid: true,
    sanitized
  };
};

/**
 * Validate location input
 */
export const validateLocation = (location: string): {
  isValid: boolean;
  sanitized: string;
  error?: string;
} => {
  const sanitized = sanitizeInput(location);
  
  if (sanitized.length < 2) {
    return {
      isValid: false,
      sanitized,
      error: 'Location must be at least 2 characters long'
    };
  }
  
  if (sanitized.length > 200) {
    return {
      isValid: false,
      sanitized,
      error: 'Location must be no more than 200 characters long'
    };
  }
  
  return {
    isValid: true,
    sanitized
  };
};

/**
 * Validate ID number based on type
 */
export const validateIdNumber = (idNumber: string, idType: string): {
  isValid: boolean;
  sanitized: string;
  error?: string;
} => {
  const sanitized = idNumber.trim().toUpperCase();
  
  switch (idType.toLowerCase()) {
    case 'aadhaar':
      if (!/^\d{12}$/.test(sanitized)) {
        return {
          isValid: false,
          sanitized,
          error: 'Aadhaar number must be exactly 12 digits'
        };
      }
      break;
    case 'pan':
      if (!/^[A-Z]{5}\d{4}[A-Z]{1}$/.test(sanitized)) {
        return {
          isValid: false,
          sanitized,
          error: 'PAN must be in format: ABCDE1234F'
        };
      }
      break;
    case 'passport':
      if (sanitized.length < 6 || sanitized.length > 20) {
        return {
          isValid: false,
          sanitized,
          error: 'Passport number must be between 6 and 20 characters'
        };
      }
      break;
    default:
      if (sanitized.length < 4 || sanitized.length > 50) {
        return {
          isValid: false,
          sanitized,
          error: 'ID number must be between 4 and 50 characters'
        };
      }
  }
  
  return {
    isValid: true,
    sanitized
  };
};

/**
 * Validate URL to prevent malicious links
 */
export const validateUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Sanitize object recursively
 */
export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  const sanitized = { ...obj };
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeInput(sanitized[key]);
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key]);
    }
  }
  
  return sanitized;
};

