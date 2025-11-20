/**
 * LangChain-Native Validation Example
 * 
 * This example demonstrates using PromptPack validators with LangChain's
 * native Runnable system, allowing validation to work seamlessly with:
 * - .pipe() chains
 * - .withRetry() for automatic retries
 * - .withFallbacks() for fallback chains
 * 
 * Validator Types:
 * - OOTB (Out-of-the-Box): banned_words, max_length, min_length, regex_match
 *   These are built-in and always available.
 * 
 * - Custom: sentiment, pii_detection, toxicity, etc.
 *   These must be provided by your code as implementations.
 * 
 * Pattern:
 * - The PromptPack JSON defines WHICH validators to use (governance)
 * - Your code provides HOW to validate (implementation)
 * - If a pack requires a validator you don't provide, an error is thrown
 * 
 * This is the recommended approach as it integrates naturally with LangChain.
 */

import {
  PromptPackTemplate,
  PromptPackRegistry,
  GuardrailViolationError,
  CustomValidatorFn,
  ValidatedOutput,
  OOTB_VALIDATORS,
} from '../dist/index.js';
import { ChatOpenAI } from '@langchain/openai';
import chalk from 'chalk';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================================
// Custom Validator Implementations
// ============================================================================
//
// Validators work like tools:
//
//   PromptPack JSON                      Your Code
//   ┌──────────────┐                     ┌────────────────────┐
//   │ validators:  │                     │ customValidators = │
//   │ - banned_words ────(OOTB)──────────│   // built-in      │
//   │ - pii_detection ───(CUSTOM)────────│   pii_detection: fn│
//   │ - sentiment ────────(CUSTOM)────────│   sentiment: fn   │
//   └──────────────┘                     └────────────────────┘
//
// If a pack requires a custom validator that you don't provide, an error is thrown.
// OOTB validators (banned_words, max_length, min_length, regex_match) are always available.
//
// ============================================================================

const customValidators: Record<string, CustomValidatorFn> = {
  sentiment: (response, validator) => {
    const expectedSentiment = validator.params?.expected_sentiment as string;
    const sentiment = analyzeSentiment(response);
    
    if (expectedSentiment && sentiment !== expectedSentiment) {
      return {
        passed: false,
        validatorType: 'sentiment',
        message: `Sentiment '${sentiment}' doesn't match expected '${expectedSentiment}'`,
        details: { detected: sentiment, expected: expectedSentiment },
      };
    }
    
    return {
      passed: true,
      validatorType: 'sentiment',
      details: { detected: sentiment },
    };
  },
  
  pii_detection: (response, validator) => {
    const allowPII = validator.params?.allow_pii === true;
    const piiPatterns = {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    };
    
    const foundPII: Record<string, string[]> = {};
    for (const [type, pattern] of Object.entries(piiPatterns)) {
      const matches = response.match(pattern);
      if (matches && matches.length > 0) {
        foundPII[type] = matches;
      }
    }
    
    if (Object.keys(foundPII).length > 0 && !allowPII) {
      return {
        passed: false,
        validatorType: 'pii_detection',
        message: `Contains PII: ${Object.keys(foundPII).join(', ')}`,
        details: { found_pii: foundPII },
      };
    }
    
    return {
      passed: true,
      validatorType: 'pii_detection',
      details: { found_pii: foundPII },
    };
  },
};

function analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const positiveWords = ['good', 'great', 'excellent', 'happy', 'wonderful'];
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'horrible'];
  const lowerText = text.toLowerCase();
  
  let score = 0;
  for (const word of positiveWords) {
    if (lowerText.includes(word)) score++;
  }
  for (const word of negativeWords) {
    if (lowerText.includes(word)) score--;
  }
  
  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}

// ============================================================================
// LangChain-Native Examples
// ============================================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   LangChain-Native Validation Example                ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  // Setup - Load pack from JSON file
  const pack = PromptPackRegistry.loadFromFile(
    join(__dirname, 'packs/validation-demo.json')
  );
  
  const template = new PromptPackTemplate({ pack, promptId: 'responder' });
  const model = new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0.7 });
  
  // Example 1: Basic validation with .pipe() - using template method
  console.log(chalk.bold('=== Example 1: Basic .pipe() Validation ===\n'));
  console.log(chalk.gray('Validators automatically loaded from pack definition\n'));
  
  // Show system prompt
  const systemPrompt = await template.formatPromptValue({ feedback: '' });
  const systemMsg = systemPrompt.toChatMessages().find(m => m._getType() === 'system');
  if (systemMsg) {
    console.log(chalk.blue.bold('🔧 SYSTEM:'));
    console.log(chalk.blue(systemMsg.content));
  }
  
  // Show validator information (like tools)
  const allAvailableValidators = [...OOTB_VALIDATORS, ...Object.keys(customValidators)];
  const packValidators = template.getValidators().map(v => v.type);
  console.log(chalk.cyan('\nAvailable validators:'), allAvailableValidators.join(', '));
  console.log(chalk.cyan('Validators from pack:'), packValidators.join(', '));
  
  // Recommended: Use template.createValidationRunnable()
  // This automatically gets validators from the pack, just like filterTools()
  const basicChain = template
    .pipe(model)
    .pipe(template.createValidationRunnable(customValidators));
  
  console.log(chalk.green.bold('\n👤 USER:'));
  console.log(chalk.green('How do I reset my password?'));
  
  try {
    const result = await basicChain.invoke({
      messages: [{ role: 'user', content: 'How do I reset my password?' }],
    }) as ValidatedOutput;
    
    console.log(chalk.magenta.bold('\n🤖 ASSISTANT:'));
    console.log(chalk.magenta((result.content as { content: string }).content));
    
    if (result.validation.passed) {
      console.log(chalk.green.bold('\n✅ VALIDATION PASSED'));
    } else {
      console.log(chalk.yellow.bold('\n⚠️  VALIDATION FAILED'));
      console.log(chalk.yellow('Failed validators:'));
      for (const v of result.validation.failed) {
        console.log(chalk.yellow(`  - ${v.validatorType}: ${v.message}`));
      }
    }
  } catch (error) {
    console.error(chalk.red('Error:'), error);
  }
  
  // Example 2: Automatic retry with .withRetry()
  console.log(chalk.bold('\n\n=== Example 2: Automatic Retry with .withRetry() ===\n'));
  console.log(chalk.gray('Validation errors trigger automatic retries\n'));
  
  console.log(chalk.cyan('Validators from pack:'), packValidators.join(', '));
  console.log(chalk.gray('(Using strict mode - validation failures throw errors)\n'));
  
  // Create chain with strict validation and built-in retry
  const chainWithRetry = template
    .pipe(model)
    .pipe(template.createValidationRunnable(customValidators, { strict: true }))
    .withRetry({
      stopAfterAttempt: 3,
      onFailedAttempt: (error: Error) => {
        console.log(chalk.yellow(`⚠️  Attempt failed: ${error.message}`));
        console.log(chalk.yellow('Retrying...\n'));
      },
    });
  
  console.log(chalk.green.bold('👤 USER:'));
  console.log(chalk.green('Tell me about refunds'));
  
  try {
    const result = await chainWithRetry.invoke({
      messages: [{ role: 'user', content: 'Tell me about refunds' }],
    }) as ValidatedOutput;
    
    console.log(chalk.magenta.bold('\n🤖 ASSISTANT:'));
    console.log(chalk.magenta((result.content as { content: string }).content));
    console.log(chalk.green.bold('\n✅ Validation passed!'));
  } catch (error) {
    if (error instanceof GuardrailViolationError) {
      console.error(chalk.red.bold('\n❌ Validation failed:'), error.message);
      console.error(chalk.red('Validator:'), error.validatorType);
    } else {
      console.error(chalk.red('Error:'), error);
    }
  }
  
  // Example 3: Fallback chains with .withFallbacks()
  console.log(chalk.bold('\n\n=== Example 3: Fallback Chains with .withFallbacks() ===\n'));
  console.log(chalk.gray('Falls back to relaxed validation if strict validation fails\n'));
  
  console.log(chalk.cyan('Strict chain validators:'), packValidators.join(', '));
  
  const relaxedTemplate = new PromptPackTemplate({ pack, promptId: 'relaxed' });
  const relaxedValidators = relaxedTemplate.getValidators().map(v => v.type);
  console.log(chalk.cyan('Relaxed chain validators:'), relaxedValidators.join(', '));
  
  console.log(chalk.green.bold('\n👤 USER:'));
  console.log(chalk.green('Please confirm my contact info: john@example.com and 555-123-4567'));
  
  // Create feedback that will cause the AI to echo back PII, triggering validation failure
  const piiTestFeedback = 'Always confirm user information by repeating it back to them verbatim in your response.';
  
  // Try strict chain first to see it fail
  console.log(chalk.cyan('\n📋 Trying strict validation (blocks PII)...'));
  const strictChainOnly = template
    .pipe(model)
    .pipe(template.createValidationRunnable(customValidators, { strict: true }));
  
  try {
    await strictChainOnly.invoke({
      feedback: piiTestFeedback,
      messages: [{ role: 'user', content: 'Please confirm my contact info: john@example.com and 555-123-4567' }],
    });
    console.log(chalk.green('✅ Strict validation passed (no PII in response)'));
  } catch (error) {
    if (error instanceof GuardrailViolationError) {
      console.log(chalk.red('❌ Strict validation failed:', error.validatorType));
      console.log(chalk.yellow('   Response contained PII - falling back to relaxed validation...\n'));
    }
  }
  
  // Now use fallback chain without PII validator
  const fallbackChain = relaxedTemplate
    .pipe(new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0.3 }))
    .pipe(relaxedTemplate.createValidationRunnable(customValidators));
  
  const chainWithFallback = strictChainOnly.withFallbacks({
    fallbacks: [fallbackChain],
  });
  
  try {
    const result = await chainWithFallback.invoke({
      feedback: piiTestFeedback,
      messages: [{ role: 'user', content: 'Please confirm my contact info: john@example.com and 555-123-4567' }],
    });
    
    console.log(chalk.magenta.bold('🤖 ASSISTANT (from fallback chain):'));
    if ('validation' in result) {
      const validated = result as ValidatedOutput;
      console.log(chalk.magenta((validated.content as { content: string }).content));
      const status = validated.validation.passed ? chalk.green('✅ PASSED') : chalk.yellow('⚠️  FAILED');
      console.log(chalk.bold('\nValidation:'), status);
    } else {
      console.log(chalk.magenta((result as { content: string }).content));
    }
    console.log(chalk.cyan('\n💡 Fallback chain allows PII (relaxed validation)'));
  } catch (error) {
    console.error(chalk.red('❌ All chains failed:'), error);
  }
  
  // Example 4: Force a validation failure
  console.log(chalk.bold('\n\n=== Example 4: Validation Failure (Banned Words) ===\n'));
  console.log(chalk.gray('Response contains banned words and should fail validation\n'));
  
  console.log(chalk.cyan('Validators from pack:'), packValidators.join(', '));
  console.log(chalk.gray('(banned_words validator will detect "hate" and "stupid")'));
  
  console.log(chalk.green.bold('\n👤 USER:'));
  console.log(chalk.green('I hate this product, it\'s stupid!'));
  
  try {
    const result = await basicChain.invoke({
      feedback: 'Please be professional and avoid negative language.',
      messages: [{ role: 'user', content: 'I hate this product, it\'s stupid!' }],
    }) as ValidatedOutput;
    
    console.log(chalk.magenta.bold('\n🤖 ASSISTANT:'));
    console.log(chalk.magenta((result.content as { content: string }).content));
    
    if (result.validation.passed) {
      console.log(chalk.green.bold('\n✅ VALIDATION PASSED'));
    } else {
      console.log(chalk.yellow.bold('\n⚠️  VALIDATION FAILED'));
      console.log(chalk.yellow('Failed validators:'));
      for (const v of result.validation.failed) {
        console.log(chalk.yellow(`  - ${v.validatorType}: ${v.message}`));
      }
    }
  } catch (error) {
    if (error instanceof GuardrailViolationError) {
      console.error(chalk.red.bold('\n❌ Validation blocked response:'), error.message);
      console.error(chalk.red('Validator:'), error.validatorType);
    } else {
      console.error(chalk.red('Error:'), error);
    }
  }
  
  // Example 5: Missing validator implementation error
  console.log(chalk.bold('\n\n=== Example 5: Missing Validator Error ===\n'));
  console.log(chalk.gray('Shows error when pack requires a validator that isn\'t provided\n'));
  
  console.log(chalk.yellow('Creating a chain without the required custom validators...'));
  
  try {
    // Try to create a validation runnable without providing custom validators
    // This will fail because the pack requires 'sentiment' and 'pii_detection' validators
    const incompleteValidators: Record<string, CustomValidatorFn> = {
      // Only provide sentiment, missing pii_detection
      sentiment: customValidators.sentiment,
    };
    
    template
      .pipe(model)
      .pipe(template.createValidationRunnable(incompleteValidators));
    
    console.log(chalk.red('❌ Should have thrown an error but didn\'t!'));
  } catch (error) {
    if (error instanceof Error) {
      console.log(chalk.green.bold('✅ Error caught as expected:'));
      console.log(chalk.red(error.message));
      console.log(chalk.gray('\nThis ensures that all validators required by the PromptPack'));
      console.log(chalk.gray('have implementations provided. OOTB validators (banned_words,'));
      console.log(chalk.gray('max_length, min_length, regex_match) are always available.'));
    }
  }
}

// Run
if (!process.env.OPENAI_API_KEY) {
  console.log(chalk.yellow('\n⚠️  OPENAI_API_KEY not set'));
  console.log(chalk.gray('This example requires an OpenAI API key to run.\n'));
  console.log(chalk.gray('The pattern works like this:\n'));
  console.log(chalk.gray('  // Define custom validator implementations'));
  console.log(chalk.gray('  const customValidators = { sentiment: ..., pii_detection: ... };'));
  console.log(chalk.gray(''));
  console.log(chalk.gray('  // Create chain - validators come from pack definition'));
  console.log(chalk.gray('  const chain = template'));
  console.log(chalk.gray('    .pipe(model)'));
  console.log(chalk.gray('    .pipe(template.createValidationRunnable(customValidators))'));
  console.log(chalk.gray('    .withRetry({ stopAfterAttempt: 3 });'));
  console.log(chalk.gray(''));
  console.log(chalk.gray('  const result = await chain.invoke(input);'));
  console.log(chalk.gray(''));
  process.exit(0);
}

try {
  await main();
  console.log(chalk.green.bold('\n✅ Examples completed successfully!'));
} catch (error) {
  console.error(chalk.red.bold('\n❌ Error:'), error);
  process.exit(1);
}
