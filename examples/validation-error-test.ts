/**
 * Test Missing Validator Error
 * 
 * This demonstrates that the system properly throws an error when a
 * PromptPack requires a validator that isn't provided.
 */

import {
  PromptPackTemplate,
  PromptPackRegistry,
  CustomValidatorFn,
  OOTB_VALIDATORS,
} from '../dist/index.js';
import { ChatOpenAI } from '@langchain/openai';
import chalk from 'chalk';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Only provide one of the required custom validators
const incompleteValidators: Record<string, CustomValidatorFn> = {
  sentiment: () => ({
    passed: true,
    validatorType: 'sentiment',
    details: { detected: 'neutral' },
  }),
  // Missing pii_detection!
};

async function main() {
  console.log(chalk.bold('=== Missing Validator Error Test ===\n'));
  
  // Load pack that requires: banned_words, pii_detection, sentiment
  const pack = PromptPackRegistry.loadFromFile(
    join(__dirname, 'packs/validation-demo.json')
  );
  
  const template = new PromptPackTemplate({ pack, promptId: 'responder' });
  const model = new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0.7 });
  
  // Show what's available vs what's required
  const allAvailableValidators = [...OOTB_VALIDATORS, ...Object.keys(incompleteValidators)];
  const packValidators = template.getValidators().map(v => v.type);
  
  console.log(chalk.cyan('Available validators:'), allAvailableValidators.join(', '));
  console.log(chalk.cyan('Pack requires:'), packValidators.join(', '));
  console.log(chalk.yellow('\nMissing: pii_detection'));
  
  console.log(chalk.gray('\nAttempting to create validation runnable...'));
  
  try {
    // This should throw an error because pii_detection is missing
    template
      .pipe(model)
      .pipe(template.createValidationRunnable(incompleteValidators));
    
    console.log(chalk.red('\n❌ FAILED: Should have thrown an error!'));
    process.exit(1);
  } catch (error) {
    if (error instanceof Error) {
      console.log(chalk.green.bold('\n✅ SUCCESS: Error caught as expected'));
      console.log(chalk.red('\nError message:'));
      console.log(chalk.red(error.message));
      
      console.log(chalk.gray('\n💡 Key points:'));
      console.log(chalk.gray('   - OOTB validators (banned_words, max_length, min_length, regex_match)'));
      console.log(chalk.gray('     are always available and don\'t need implementations'));
      console.log(chalk.gray('   - Custom validators (sentiment, pii_detection, toxicity, etc.)'));
      console.log(chalk.gray('     must be provided by your code'));
      console.log(chalk.gray('   - If a PromptPack requires a validator, you MUST provide it'));
      console.log(chalk.gray('   - This ensures governance: the pack controls what gets validated'));
    } else {
      console.log(chalk.red('\n❌ FAILED: Unexpected error type'));
      console.error(error);
      process.exit(1);
    }
  }
}

await main();
