/**
 * Tests for validators
 */

import {
  validateResponse,
  GuardrailViolationError,
  allValidatorsPassed,
  getFailedValidators,
} from '../validators';
import { Validator } from '../types';

describe('validators', () => {
  describe('banned_words validator', () => {
    const validator: Validator = {
      type: 'banned_words',
      enabled: true,
      fail_on_violation: true,
      params: {
        words: ['inappropriate', 'banned', 'offensive'],
      },
    };

    it('should pass when no banned words are present', () => {
      const results = validateResponse('This is a clean response', [validator]);
      expect(results[0].passed).toBe(true);
    });

    it('should fail when banned words are present', () => {
      expect(() => {
        validateResponse('This is inappropriate content', [validator]);
      }).toThrow(GuardrailViolationError);
    });

    it('should be case-insensitive', () => {
      expect(() => {
        validateResponse('This is INAPPROPRIATE content', [validator]);
      }).toThrow(GuardrailViolationError);
    });
  });

  describe('max_length validator', () => {
    const validator: Validator = {
      type: 'max_length',
      enabled: true,
      fail_on_violation: true,
      params: {
        max_characters: 50,
        max_tokens: 15,
      },
    };

    it('should pass when within limits', () => {
      const results = validateResponse('Short response', [validator]);
      expect(results[0].passed).toBe(true);
    });

    it('should fail when exceeding character limit', () => {
      const longText = 'a'.repeat(51);
      expect(() => {
        validateResponse(longText, [validator]);
      }).toThrow(GuardrailViolationError);
    });
  });

  describe('min_length validator', () => {
    const validator: Validator = {
      type: 'min_length',
      enabled: true,
      fail_on_violation: true,
      params: {
        min_characters: 10,
      },
    };

    it('should pass when above minimum', () => {
      const results = validateResponse('This is long enough', [validator]);
      expect(results[0].passed).toBe(true);
    });

    it('should fail when below minimum', () => {
      expect(() => {
        validateResponse('Short', [validator]);
      }).toThrow(GuardrailViolationError);
    });
  });

  describe('regex_match validator', () => {
    const validator: Validator = {
      type: 'regex_match',
      enabled: true,
      fail_on_violation: true,
      params: {
        pattern: String.raw`^[A-Z].*\.$`,
        must_match: true,
      },
    };

    it('should pass when pattern matches', () => {
      const results = validateResponse('This starts with capital and ends with period.', [
        validator,
      ]);
      expect(results[0].passed).toBe(true);
    });

    it('should fail when pattern does not match', () => {
      expect(() => {
        validateResponse('this is lowercase', [validator]);
      }).toThrow(GuardrailViolationError);
    });
  });

  describe('multiple validators', () => {
    const validators: Validator[] = [
      {
        type: 'banned_words',
        enabled: true,
        fail_on_violation: false,
        params: { words: ['bad'] },
      },
      {
        type: 'max_length',
        enabled: true,
        fail_on_violation: false,
        params: { max_characters: 100 },
      },
    ];

    it('should run all validators', () => {
      const results = validateResponse('This is a good response', validators);
      expect(results.length).toBe(2);
    });

    it('should not throw when fail_on_violation is false', () => {
      const results = validateResponse('This has bad words', validators);
      expect(results[0].passed).toBe(false);
      expect(results[1].passed).toBe(true);
    });
  });

  describe('helper functions', () => {
    it('allValidatorsPassed should return true when all pass', () => {
      const results = [
        { passed: true, validatorType: 'test1' },
        { passed: true, validatorType: 'test2' },
      ];
      expect(allValidatorsPassed(results)).toBe(true);
    });

    it('allValidatorsPassed should return false when any fail', () => {
      const results = [
        { passed: true, validatorType: 'test1' },
        { passed: false, validatorType: 'test2' },
      ];
      expect(allValidatorsPassed(results)).toBe(false);
    });

    it('getFailedValidators should return only failed validators', () => {
      const results = [
        { passed: true, validatorType: 'test1' },
        { passed: false, validatorType: 'test2' },
        { passed: false, validatorType: 'test3' },
      ];
      const failed = getFailedValidators(results);
      expect(failed.length).toBe(2);
      expect(failed[0].validatorType).toBe('test2');
      expect(failed[1].validatorType).toBe('test3');
    });
  });

  describe('disabled validators', () => {
    it('should skip disabled validators', () => {
      const validator: Validator = {
        type: 'banned_words',
        enabled: false,
        params: { words: ['bad'] },
      };

      const results = validateResponse('This has bad words', [validator]);
      expect(results.length).toBe(0);
    });
  });
});
