import { validateTranslationInput, needsTranslation, normalizeForKey } from '../../src/lib/input-validation';

describe('Input Validation', () => {
  describe('validateTranslationInput', () => {
    test('handles whitespace-only input (fast-check edge case)', () => {
      const result = validateTranslationInput('   ');
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedText).toBe('   ');
      expect(result.warnings).toContain('Input contains only whitespace');
    });

    test('handles empty string', () => {
      const result = validateTranslationInput('');
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedText).toBe('');
      expect(result.warnings).toContain('Input is empty string');
    });

    test('handles null/undefined input', () => {
      const result = validateTranslationInput(null as any);
      
      expect(result.isValid).toBe(false);
      expect(result.sanitizedText).toBe('');
      expect(result.warnings).toContain('Input text is null or undefined');
    });

    test('sanitizes potentially harmful content', () => {
      const result = validateTranslationInput('Hello <script>alert("xss")</script> world');
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedText).toBe('Hello  world');
      expect(result.warnings).toContain('Potentially unsafe content detected and removed');
    });

    test('handles excessively long text', () => {
      const longText = 'a'.repeat(6000);
      const result = validateTranslationInput(longText);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedText.length).toBe(5003); // 5000 + '...'
      expect(result.warnings).toContain('Text truncated from 6000 to 5000 characters');
    });

    test('handles normal text without issues', () => {
      const result = validateTranslationInput('Hello world!');
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedText).toBe('Hello world!');
      expect(result.warnings).toHaveLength(0);
    });

    test('collapses excessive newlines', () => {
      const textWithManyNewlines = 'Line 1' + '\n'.repeat(200) + 'Line 2';
      const result = validateTranslationInput(textWithManyNewlines);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedText).toBe('Line 1\n\nLine 2');
      expect(result.warnings).toContain('Excessive newlines detected');
    });

    test('converts non-string input to string', () => {
      const result = validateTranslationInput(123 as any);
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedText).toBe('123');
      expect(result.warnings).toContain('Input was converted to string');
    });
  });

  describe('needsTranslation', () => {
    test('returns false for empty string', () => {
      expect(needsTranslation('')).toBe(false);
    });

    test('returns false for whitespace-only string', () => {
      expect(needsTranslation('   ')).toBe(false);
    });

    test('returns false for null/undefined', () => {
      expect(needsTranslation(null as any)).toBe(false);
      expect(needsTranslation(undefined as any)).toBe(false);
    });

    test('returns true for normal text', () => {
      expect(needsTranslation('Hello world')).toBe(true);
    });

    test('returns true for text with leading/trailing whitespace', () => {
      expect(needsTranslation('  Hello world  ')).toBe(true);
    });
  });

  describe('normalizeForKey', () => {
    test('preserves empty string for key generation', () => {
      expect(normalizeForKey('')).toBe('');
    });

    test('preserves whitespace-only string for key generation', () => {
      expect(normalizeForKey('   ')).toBe('   ');
    });

    test('trims normal text for key generation', () => {
      expect(normalizeForKey('  Hello world  ')).toBe('Hello world');
    });

    test('handles null/undefined gracefully', () => {
      expect(normalizeForKey(null as any)).toBe(null);
      expect(normalizeForKey(undefined as any)).toBe(undefined);
    });
  });

  describe('Edge cases discovered by fast-check', () => {
    test('handles various problematic inputs', () => {
      const problematicInputs = [
        ' ',           // Single space (discovered by fast-check)
        '\\t\\n\\r',      // Various whitespace
        '🚀'.repeat(100), // Unicode emojis
        'javascript:alert(1)', // Potential XSS
        'data:text/html,<script>alert(1)</script>', // Data URL XSS
        'a'.repeat(10000), // Extremely long text
        '',            // Empty string
        '\n'.repeat(200), // Excessive newlines
      ];

      for (const input of problematicInputs) {
        const result = validateTranslationInput(input);
        
        // Should always return a valid result, never crash
        expect(result.isValid).toBeDefined();
        expect(result.sanitizedText).toBeDefined();
        expect(result.warnings).toBeDefined();
        expect(Array.isArray(result.warnings)).toBe(true);
        
        // Sanitized text should be safe
        expect(result.sanitizedText).not.toContain('<script');
        expect(result.sanitizedText).not.toContain('javascript:');
        expect(result.sanitizedText).not.toContain('data:');
        expect(result.sanitizedText.length).toBeLessThanOrEqual(5003); // Max length + ellipsis
      }
    });

    test('edge case regression: whitespace-only strings maintain identity', () => {
      // This was the specific edge case found by fast-check
      const whitespaceInputs = [' ', '  ', '\t', '\r\n', ' \t '];
      
      for (const input of whitespaceInputs) {
        const result = validateTranslationInput(input);
        
        // Should return original input for whitespace-only strings
        expect(result.sanitizedText).toBe(input);
        expect(result.isValid).toBe(true);
        
        // Should be flagged as not needing translation
        expect(needsTranslation(result.sanitizedText)).toBe(false);
        
        // Should preserve original for key generation (uniqueness)
        expect(normalizeForKey(input)).toBe(input);
      }
      
      // Special case: single newline should also not need translation
      const newlineResult = validateTranslationInput('\n');
      expect(needsTranslation(newlineResult.sanitizedText)).toBe(false);
    });
  });
});