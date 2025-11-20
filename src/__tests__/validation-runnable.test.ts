/**
 * Tests for ValidationRunnable
 */

import { ValidationRunnable, CustomValidatorFn } from '../validation-runnable';
import { GuardrailViolationError } from '../validators';
import type { Validator } from '../types';

describe('ValidationRunnable', () => {
  const mockValidators: Validator[] = [
    {
      type: 'banned_words',
      enabled: true,
      fail_on_violation: true,
      params: {
        words: ['bad', 'evil'],
      },
    },
    {
      type: 'max_length',
      enabled: true,
      fail_on_violation: false,
      params: {
        max_characters: 100,
      },
    },
  ];

  const mockCustomValidators: Record<string, CustomValidatorFn> = {
    sentiment: (response) => ({
      passed: response.includes('good'),
      validatorType: 'sentiment',
      message: response.includes('good') ? undefined : 'Sentiment not positive',
    }),
  };

  describe('constructor', () => {
    it('should create a ValidationRunnable', () => {
      const runnable = new ValidationRunnable({
        validators: mockValidators,
      });

      expect(runnable).toBeDefined();
      expect(runnable.invoke).toBeDefined();
    });

    it('should throw if required custom validator is missing', () => {
      const validators: Validator[] = [
        {
          type: 'sentiment',
          enabled: true,
          fail_on_violation: false,
        },
      ];

      expect(() => {
        new ValidationRunnable({
          validators,
          customValidators: {},
        });
      }).toThrow('Missing validator implementations: sentiment');
    });

    it('should not throw if OOTB validator is missing from custom validators', () => {
      const runnable = new ValidationRunnable({
        validators: mockValidators,
        customValidators: {},
      });
      
      expect(runnable).toBeDefined();
    });
  });

  describe('invoke', () => {
    it('should validate string input', async () => {
      const runnable = new ValidationRunnable({
        validators: mockValidators,
      });

      const result = await runnable.invoke('This is a good response');

      expect(result.validation.passed).toBe(true);
      expect(result.validation.results).toHaveLength(2);
    });

    it('should validate object with content property', async () => {
      const runnable = new ValidationRunnable({
        validators: mockValidators,
      });

      const result = await runnable.invoke({
        content: 'This is a good response',
      });

      expect(result.validation.passed).toBe(true);
    });

    it('should fail validation for banned words', async () => {
      // Create validators without fail_on_violation for non-strict mode
      const nonStrictValidators: Validator[] = [
        {
          type: 'banned_words',
          enabled: true,
          fail_on_violation: false, // Don't throw in this test
          params: {
            words: ['bad', 'evil'],
          },
        },
      ];

      const runnable = new ValidationRunnable({
        validators: nonStrictValidators,
      });

      const result = await runnable.invoke('This is a bad response');

      expect(result.validation.passed).toBe(false);
      expect(result.validation.failed).toHaveLength(1);
      expect(result.validation.failed[0].validatorType).toBe('banned_words');
    });

    it('should throw in strict mode when validation fails', async () => {
      const runnable = new ValidationRunnable({
        validators: mockValidators,
        throwOnFailure: true,
      });

      await expect(
        runnable.invoke('This is a bad response')
      ).rejects.toThrow(GuardrailViolationError);
    });

    it('should use custom validators', async () => {
      const validators: Validator[] = [
        {
          type: 'sentiment',
          enabled: true,
          fail_on_violation: false,
        },
      ];

      const runnable = new ValidationRunnable({
        validators,
        customValidators: mockCustomValidators,
      });

      const goodResult = await runnable.invoke('This is good');
      expect(goodResult.validation.passed).toBe(true);

      const badResult = await runnable.invoke('This is bad');
      expect(badResult.validation.passed).toBe(false);
    });

    it('should skip disabled validators', async () => {
      const validators: Validator[] = [
        {
          type: 'banned_words',
          enabled: false,
          fail_on_violation: true,
          params: {
            words: ['bad'],
          },
        },
      ];

      const runnable = new ValidationRunnable({
        validators,
      });

      const result = await runnable.invoke('This is bad');
      expect(result.validation.passed).toBe(true);
      expect(result.validation.results).toHaveLength(0);
    });

    it('should only throw for fail_on_violation validators', async () => {
      const validators: Validator[] = [
        {
          type: 'banned_words',
          enabled: true,
          fail_on_violation: false, // Should not throw
          params: {
            words: ['bad'],
          },
        },
        {
          type: 'max_length',
          enabled: true,
          fail_on_violation: false,
          params: {
            max_characters: 100,
          },
        },
      ];

      const runnable = new ValidationRunnable({
        validators,
        throwOnFailure: true,
      });

      // Should not throw even though validation fails
      const result = await runnable.invoke('This is bad');
      expect(result.validation.passed).toBe(false);
    });
  });
});
