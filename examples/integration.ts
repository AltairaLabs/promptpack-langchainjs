/**
 * Advanced LangChain Integration Example
 * 
 * Shows advanced PromptPack features:
 * - Streaming responses
 * - Batching multiple requests
 * - Chaining runnables
 * 
 * Run with: npx tsx examples/integration.ts
 */

import { PromptPackTemplate, PromptPackRegistry } from '../dist/index.js';
import { ChatOpenAI } from '@langchain/openai';
import { AIMessage } from '@langchain/core/messages';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import chalk from 'chalk';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load pack from JSON file
const supportPack = PromptPackRegistry.loadFromFile(
  join(__dirname, 'packs/customer-support.json')
);

async function streamingExample() {
  console.log(chalk.bold('=== Streaming Response Example ===\n'));
  console.log(chalk.gray('Watch the response arrive token by token...\n'));

  const template = new PromptPackTemplate({
    pack: supportPack,
    promptId: 'support',
  });

  const model = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0.7,
    streaming: true,
  });

  const chain = template.pipe(model);

  // Show system prompt
  const systemPrompt = await template.formatPromptValue({
    role: 'customer support agent',
    company: 'SecureApp',
    user_message: '',
  });
  const systemMsg = systemPrompt.toChatMessages().find(m => m._getType() === 'system');
  if (systemMsg) {
    console.log(chalk.blue.bold('🔧 SYSTEM:'));
    console.log(chalk.blue(systemMsg.content));
  }

  console.log(chalk.green.bold('\n👤 USER:'));
  console.log(chalk.green('How do I reset my password?\n'));
  
  console.log(chalk.magenta.bold('🤖 ASSISTANT (streaming):'));
  console.log(chalk.magenta(''));

  // Stream the response
  const stream = await chain.stream({
    role: 'customer support agent',
    company: 'SecureApp',
    user_message: 'How do I reset my password?',
  });

  for await (const chunk of stream) {
    const content = (chunk as AIMessage).content;
    if (typeof content === 'string') {
      process.stdout.write(chalk.magenta(content));
    }
  }

  console.log('\n');
}

async function batchExample() {
  console.log(chalk.bold('\n=== Batch Processing Example ===\n'));
  console.log(chalk.gray('Process multiple requests in parallel...\n'));

  const template = new PromptPackTemplate({
    pack: supportPack,
    promptId: 'support',
  });

  const model = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0.7,
  });

  const chain = template.pipe(model);

  // Show system prompt
  const systemPrompt = await template.formatPromptValue({
    role: 'support agent',
    user_message: '',
  });
  const systemMsg = systemPrompt.toChatMessages().find(m => m._getType() === 'system');
  if (systemMsg) {
    console.log(chalk.blue.bold('🔧 SYSTEM:'));
    console.log(chalk.blue(systemMsg.content));
  }

  const requests = [
    {
      role: 'support agent',
      user_message: 'How do I change my email?',
    },
    {
      role: 'support agent',
      user_message: 'What are your business hours?',
    },
    {
      role: 'support agent',
      user_message: 'Do you offer refunds?',
    },
  ];

  console.log(chalk.cyan('\nProcessing 3 requests in parallel...\n'));

  const responses = await chain.batch(requests);

  for (let i = 0; i < requests.length; i++) {
    console.log(chalk.green.bold(`👤 USER ${i + 1}:`));
    console.log(chalk.green(requests[i].user_message));
    console.log(chalk.magenta.bold('\n🤖 ASSISTANT:'));
    console.log(chalk.magenta(String((responses[i] as AIMessage).content)));
    if (i < requests.length - 1) {
      console.log(chalk.gray('\n---\n'));
    }
  }
}

async function chainingExample() {
  console.log(chalk.bold('\n\n=== Runnable Chaining Example ===\n'));
  console.log(chalk.gray('Chain template → model → parser for clean output...\n'));

  const template = new PromptPackTemplate({
    pack: supportPack,
    promptId: 'support',
  });

  const model = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0.7,
  });

  // Show system prompt
  const systemPrompt = await template.formatPromptValue({
    role: 'friendly support agent',
    user_message: '',
  });
  const systemMsg = systemPrompt.toChatMessages().find(m => m._getType() === 'system');
  if (systemMsg) {
    console.log(chalk.blue.bold('🔧 SYSTEM:'));
    console.log(chalk.blue(systemMsg.content));
  }

  // Chain: template → model → string parser
  const chain = RunnableSequence.from([
    template,
    model,
    new StringOutputParser(),
  ]);

  console.log(chalk.green.bold('\n👤 USER:'));
  console.log(chalk.green('I need help with my account\n'));

  // Returns a plain string instead of AIMessage
  const response = await chain.invoke({
    role: 'friendly support agent',
    user_message: 'I need help with my account',
  });

  console.log(chalk.magenta.bold('🤖 ASSISTANT (parsed string):'));
  console.log(chalk.magenta(response));
  console.log(chalk.cyan(`\nType: ${typeof response}`));
}

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║   Advanced LangChain Integration Examples            ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

try {
  await streamingExample();
  await batchExample();
  await chainingExample();

  console.log(chalk.green.bold('\n✅ Examples completed successfully!'));
} catch (error) {
  console.error(chalk.red.bold('\n❌ Error:'), error);
  if (error instanceof Error) {
    console.error(chalk.red('Message:'), error.message);
    if (error.message.includes('API key')) {
      console.error(chalk.yellow('\n💡 Make sure to set your OPENAI_API_KEY environment variable:'));
      console.error(chalk.yellow('   export OPENAI_API_KEY=your-api-key-here'));
    }
  }
}
