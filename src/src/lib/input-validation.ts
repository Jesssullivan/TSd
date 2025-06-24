/**
 * Input validation utilities for translation system
 * Handles edge cases discovered through property-based testing
 */

export interface ValidationResult {
  isValid: boolean;
  sanitizedText: string;
  warnings: string[];
}

/**
 * Validates and sanitizes input text for translation
 * @param text - Input text to validate
 * @param maxLength - Maximum allowed length (default: 5000)
 * @returns Validation result with sanitized text and warnings
 */
export function validateTranslationInput(
  text: string, 
  maxLength: number = 5000
): ValidationResult {
  const warnings: string[] = [];
  let sanitizedText = text;
  
  // Handle null/undefined
  if (text == null) {
    return {
      isValid: false,
      sanitizedText: '',
      warnings: ['Input text is null or undefined']
    };
  }
  
  // Convert to string if not already
  if (typeof text !== 'string') {
    sanitizedText = String(text);
    warnings.push('Input was converted to string');
  }
  
  // Check for whitespace-only input (discovered by fast-check)
  const trimmed = sanitizedText.trim();
  if (trimmed.length === 0 && sanitizedText.length > 0) {
    warnings.push('Input contains only whitespace');
    // For whitespace-only, return as-is but mark as handled
    return {
      isValid: true,
      sanitizedText,
      warnings
    };
  }
  
  // Check for empty string
  if (sanitizedText.length === 0) {
    return {
      isValid: true, // Empty strings are valid but don't need translation
      sanitizedText,
      warnings: ['Input is empty string']
    };
  }
  
  // Basic security sanitization
  if (sanitizedText.includes('<script') || 
      sanitizedText.includes('javascript:') || 
      sanitizedText.includes('data:') ||
      sanitizedText.includes('vbscript:')) {
    warnings.push('Potentially unsafe content detected and removed');
    sanitizedText = sanitizedText
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/data:/gi, '');
  }
  
  // Length validation
  if (sanitizedText.length > maxLength) {
    warnings.push(`Text truncated from ${sanitizedText.length} to ${maxLength} characters`);
    sanitizedText = sanitizedText.substring(0, maxLength) + '...';
  }
  
  // Check for excessive newlines or special characters
  const newlineCount = (sanitizedText.match(/\n/g) || []).length;
  if (newlineCount > 100) {
    warnings.push('Excessive newlines detected');
    sanitizedText = sanitizedText.replace(/\n{3,}/g, '\n\n'); // Collapse multiple newlines
  }
  
  return {
    isValid: true,
    sanitizedText,
    warnings
  };
}

/**
 * Quick check if text needs translation (not empty/whitespace-only)
 */
export function needsTranslation(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  return text.trim().length > 0;
}

/**
 * Normalize text for consistent key generation
 */
export function normalizeForKey(text: string): string {
  if (!text) return text;
  
  // Preserve original for empty/whitespace strings for key uniqueness
  if (!needsTranslation(text)) return text;
  
  // For translatable text, use trimmed version
  return text.trim();
}