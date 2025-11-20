/**
 * LangChain-native validation using Runnables
 * 
 * This integrates PromptPack validators with LangChain's Runnable system,
 * allowing validators to be used in .pipe() chains just like other LangChain components.
 */

import { Runnable } from '@langchain/core/runnables';
import { Validator } from './types';
import {
  validateResponse,
  GuardrailViolationError,
  ValidationResult,
  allValidatorsPassed,
  getFailedValidators,
  isOOTBValidator,
} from './validators';

/**
 * Custom validator implementation function
 */
export type CustomValidatorFn = (response: string, validator: Validator) => ValidationResult;

/**
 * Options for validation runnable
 */
export interface ValidationRunnableOptions {
  /**
   * Validators to apply
   */
  validators: Validator[];
  
  /**
   * Custom validator implementations (e.g., sentiment, PII, toxicity)
   */
  customValidators?: Record<string, CustomValidatorFn>;
  
  /**
   * Whether to throw on validation failure
   * If false, returns result with validation metadata
   */
  throwOnFailure?: boolean;
  
  /**
   * Key to store validation results in output
   */
  validationKey?: string;
}

/**
 * Validation result with content
 */
export interface ValidatedOutput<T = unknown> {
  /**
   * Original content from LLM
   */
  content: T;
  
  /**
   * Validation results
   */
  validation: {
    passed: boolean;
    results: ValidationResult[];
    failed: ValidationResult[];
  };
}

/**
 * LangChain Runnable for PromptPack validation
 * 
 * Usage:
 *   const chain = template
 *     .pipe(model)
 *     .pipe(new ValidationRunnable({ validators }));
 * 
 *   // With retry
 *   const chainWithRetry = chain.withRetry({ stopAfterAttempt: 3 });
 */
export class ValidationRunnable<
  InputType = unknown,
  OutputType = ValidatedOutput
> extends Runnable<InputType, OutputType> {
  lc_namespace = ['promptpack', 'runnables'];
  
  private readonly validators: Validator[];
  private readonly customValidators: Record<string, CustomValidatorFn>;
  private readonly throwOnFailure: boolean;
  private readonly validationKey: string;
  
  constructor(options: ValidationRunnableOptions) {
    super();
    this.validators = options.validators;
    this.customValidators = options.customValidators || {};
    this.throwOnFailure = options.throwOnFailure ?? false;
    this.validationKey = options.validationKey ?? '_validation';
    
    // Validate that all non-OOTB validators have implementations
    this.validateValidatorImplementations();
  }
  
  /**
   * Validate that all required validators have implementations
   */
  private validateValidatorImplementations(): void {
    const missingValidators: string[] = [];
    
    for (const validator of this.validators) {
      if (!validator.enabled) continue;
      
      // OOTB validators are always available
      if (isOOTBValidator(validator.type)) continue;
      
      // Custom validators must be provided
      if (!this.customValidators[validator.type]) {
        missingValidators.push(validator.type);
      }
    }
    
    if (missingValidators.length > 0) {
      throw new Error(
        `Missing validator implementations: ${missingValidators.join(', ')}. ` +
        `These validators are required by the PromptPack but no implementation was provided.`
      );
    }
  }
  
  /**
   * Invoke validation on input
   */
  async invoke(
    input: InputType
  ): Promise<OutputType> {
    // Extract string content from input
    const content = this.extractContent(input);
    
    // Run validation
    const results = this.runValidation(content);
    const passed = allValidatorsPassed(results);
    const failed = getFailedValidators(results);
    
    // Throw if configured to do so
    if (!passed && this.throwOnFailure) {
      const criticalFailures = failed.filter(r => 
        this.validators.find(v => v.type === r.validatorType)?.fail_on_violation
      );
      
      if (criticalFailures.length > 0) {
        const first = criticalFailures[0];
        throw new GuardrailViolationError(
          first.message || 'Validation failed',
          first.validatorType,
          first.details
        );
      }
    }
    
    // Return validated output
    return {
      content: input,
      validation: {
        passed,
        results,
        failed,
      },
    } as OutputType;
  }
  
  /**
   * Extract string content from various input types
   */
  private extractContent(input: unknown): string {
    if (typeof input === 'string') {
      return input;
    }
    
    if (input && typeof input === 'object') {
      const obj = input as Record<string, unknown>;
      
      // LangChain message format
      if ('content' in obj) {
        return String(obj.content);
      }
      
      // AIMessage format
      if ('text' in obj) {
        return String(obj.text);
      }
      
      // Try to stringify
      try {
        return JSON.stringify(obj);
      } catch {
        return '[object Object]';
      }
    }
    
    return String(input);
  }
  
  /**
   * Run all validators
   */
  private runValidation(content: string): ValidationResult[] {
    const results: ValidationResult[] = [];
    
    for (const validator of this.validators) {
      if (!validator.enabled) continue;
      
      // Check for custom validator
      const customValidator = this.customValidators[validator.type];
      
      const result = customValidator
        ? customValidator(content, validator)
        : validateResponse(content, [validator])[0];
      
      results.push(result);
    }
    
    return results;
  }
}

/**
 * Create a validation runnable with custom validators registry.
 * 
 * This is typically called from PromptPackTemplate.createValidationRunnable()
 * which automatically gets validators from the pack definition.
 * 
 * @example
 * ```typescript
 * // Preferred: Use template.createValidationRunnable()
 * const chain = template
 *   .pipe(model)
 *   .pipe(template.createValidationRunnable(customValidators));
 * 
 * // Alternative: Create directly with validator array
 * const validators = template.getValidators();
 * const chain = template
 *   .pipe(model)
 *   .pipe(createValidationRunnable(validators, customValidators));
 * ```
 */
export function createValidationRunnable(
  validators: Validator[],
  customValidators?: Record<string, CustomValidatorFn>
): ValidationRunnable {
  return new ValidationRunnable({
    validators,
    customValidators,
    throwOnFailure: false,
  });
}

/**
 * Create a strict validation runnable that throws on failure
 * 
 * Use with .withFallbacks() for graceful degradation:
 * 
 *   const strictChain = template
 *     .pipe(model)
 *     .pipe(createStrictValidationRunnable(validators));
 *   
 *   const withFallback = strictChain.withFallbacks([fallbackChain]);
 */
export function createStrictValidationRunnable(
  validators: Validator[],
  customValidators?: Record<string, CustomValidatorFn>
): ValidationRunnable {
  return new ValidationRunnable({
    validators,
    customValidators,
    throwOnFailure: true,
  });
}
