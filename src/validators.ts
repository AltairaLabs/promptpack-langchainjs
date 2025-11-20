/**
 * Validation and guardrails for LLM responses
 */

import { Validator } from './types';

/**
 * Built-in (out-of-the-box) validator types
 */
export const OOTB_VALIDATORS = [
  'banned_words',
  'max_length',
  'min_length',
  'regex_match',
] as const;

export type OOTBValidatorType = typeof OOTB_VALIDATORS[number];

/**
 * Error thrown when validation fails
 */
export class GuardrailViolationError extends Error {
  constructor(
    message: string,
    public validatorType: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'GuardrailViolationError';
  }
}

/**
 * Result of a validation check
 */
export interface ValidationResult {
  passed: boolean;
  validatorType: string;
  message?: string;
  details?: Record<string, unknown>;
}

/**
 * Validate a response against a set of validators (guardrails)
 */
export function validateResponse(
  response: string,
  validators: Validator[]
): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  for (const validator of validators) {
    if (!validator.enabled) {
      continue;
    }
    
    const result = runValidator(response, validator);
    results.push(result);
    
    // Throw if fail_on_violation is true
    if (!result.passed && validator.fail_on_violation) {
      throw new GuardrailViolationError(
        result.message || 'Validation failed',
        validator.type,
        result.details
      );
    }
  }
  
  return results;
}

/**
 * Check if a validator type is a built-in OOTB validator
 */
export function isOOTBValidator(type: string): boolean {
  return OOTB_VALIDATORS.includes(type as OOTBValidatorType);
}

/**
 * Run a single validator
 */
function runValidator(response: string, validator: Validator): ValidationResult {
  switch (validator.type) {
    case 'banned_words':
      return validateBannedWords(response, validator);
    case 'max_length':
      return validateMaxLength(response, validator);
    case 'min_length':
      return validateMinLength(response, validator);
    case 'regex_match':
      return validateRegexMatch(response, validator);
    default:
      // Unknown validator type - should not reach here if properly validated
      return {
        passed: true,
        validatorType: validator.type,
        message: `Unknown validator type: ${validator.type}`,
      };
  }
}

/**
 * Validate for banned words
 */
function validateBannedWords(response: string, validator: Validator): ValidationResult {
  const words = (validator.params?.words as string[]) || [];
  const foundWords: string[] = [];
  
  for (const word of words) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(response)) {
      foundWords.push(word);
    }
  }
  
  if (foundWords.length > 0) {
    return {
      passed: false,
      validatorType: 'banned_words',
      message: `Response contains banned words: ${foundWords.join(', ')}`,
      details: { banned_words: foundWords },
    };
  }
  
  return {
    passed: true,
    validatorType: 'banned_words',
  };
}

/**
 * Validate maximum length
 */
function validateMaxLength(response: string, validator: Validator): ValidationResult {
  const maxChars = validator.params?.max_characters as number | undefined;
  const maxTokens = validator.params?.max_tokens as number | undefined;
  
  if (maxChars !== undefined && response.length > maxChars) {
    return {
      passed: false,
      validatorType: 'max_length',
      message: `Response exceeds maximum length: ${response.length} > ${maxChars} characters`,
      details: { length: response.length, max_characters: maxChars },
    };
  }
  
  // Rough token estimation (4 chars ≈ 1 token)
  if (maxTokens !== undefined) {
    const estimatedTokens = Math.ceil(response.length / 4);
    if (estimatedTokens > maxTokens) {
      return {
        passed: false,
        validatorType: 'max_length',
        message: `Response exceeds maximum tokens: ~${estimatedTokens} > ${maxTokens} tokens`,
        details: { estimated_tokens: estimatedTokens, max_tokens: maxTokens },
      };
    }
  }
  
  return {
    passed: true,
    validatorType: 'max_length',
  };
}

/**
 * Validate minimum length
 */
function validateMinLength(response: string, validator: Validator): ValidationResult {
  const minChars = validator.params?.min_characters as number | undefined;
  const minTokens = validator.params?.min_tokens as number | undefined;
  
  if (minChars !== undefined && response.length < minChars) {
    return {
      passed: false,
      validatorType: 'min_length',
      message: `Response below minimum length: ${response.length} < ${minChars} characters`,
      details: { length: response.length, min_characters: minChars },
    };
  }
  
  // Rough token estimation (4 chars ≈ 1 token)
  if (minTokens !== undefined) {
    const estimatedTokens = Math.ceil(response.length / 4);
    if (estimatedTokens < minTokens) {
      return {
        passed: false,
        validatorType: 'min_length',
        message: `Response below minimum tokens: ~${estimatedTokens} < ${minTokens} tokens`,
        details: { estimated_tokens: estimatedTokens, min_tokens: minTokens },
      };
    }
  }
  
  return {
    passed: true,
    validatorType: 'min_length',
  };
}

/**
 * Validate regex match
 */
function validateRegexMatch(response: string, validator: Validator): ValidationResult {
  const pattern = validator.params?.pattern as string | undefined;
  const mustMatch = validator.params?.must_match !== false; // Default true
  
  if (!pattern) {
    return {
      passed: true,
      validatorType: 'regex_match',
      message: 'No pattern specified',
    };
  }
  
  try {
    const regex = new RegExp(pattern);
    const matches = regex.test(response);
    
    if (mustMatch && !matches) {
      return {
        passed: false,
        validatorType: 'regex_match',
        message: `Response does not match required pattern: ${pattern}`,
        details: { pattern },
      };
    }
    
    if (!mustMatch && matches) {
      return {
        passed: false,
        validatorType: 'regex_match',
        message: `Response matches forbidden pattern: ${pattern}`,
        details: { pattern },
      };
    }
    
    return {
      passed: true,
      validatorType: 'regex_match',
    };
  } catch (error) {
    return {
      passed: false,
      validatorType: 'regex_match',
      message: `Invalid regex pattern: ${pattern}`,
      details: { error: String(error) },
    };
  }
}

/**
 * Check if all validators passed
 */
export function allValidatorsPassed(results: ValidationResult[]): boolean {
  return results.every((r) => r.passed);
}

/**
 * Get failed validators
 */
export function getFailedValidators(results: ValidationResult[]): ValidationResult[] {
  return results.filter((r) => !r.passed);
}
