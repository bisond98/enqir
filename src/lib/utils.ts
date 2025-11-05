import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format number with Indian comma notation (e.g., 1,00,000)
export function formatIndianCurrency(amount: string | number): string {
  if (!amount) return '0';
  
  // Convert to string and remove any existing commas
  const numStr = amount.toString().replace(/,/g, '');
  
  // Check if it's a valid number
  if (isNaN(Number(numStr))) return amount.toString();
  
  // Split into integer and decimal parts
  const parts = numStr.split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1] ? '.' + parts[1] : '';
  
  // Indian numbering system: last 3 digits, then groups of 2
  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  
  const result = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree + decimalPart;
  return result;
}
