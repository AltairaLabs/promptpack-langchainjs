/**
 * Basic usage example for @promptpack/langchain
 * 
 * This example shows the core PromptPack workflow:
 * 1. Load a pack from JSON
 * 2. Get a template
 * 3. Use it in a LangChain chain
 */

import { PromptPackRegistry } from '../dist/index.js';
import { ChatOpenAI } from '@langchain/openai';
import { AIMessage, type BaseMessage } from '@langchain/core/messages';
import chalk from 'chalk';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Helper to display conversation in a readable format
function logConversation(messages: BaseMessage[], response?: AIMessage) {
  for (const msg of messages) {
    const type = msg._getType().toUpperCase();
    if (type === 'SYSTEM') {
      console.log(chalk.blue.bold(`\n🔧 SYSTEM:`));
      console.log(chalk.blue(msg.content));
    } else if (type === 'HUMAN') {
      console.log(chalk.green.bold(`\n👤 USER:`));
      console.log(chalk.green(msg.content));
    } else if (type === 'AI') {
      console.log(chalk.magenta.bold(`\n🤖 ASSISTANT:`));
      console.log(chalk.magenta(msg.content));
    }
  }
  
  if (response) {
    console.log(chalk.magenta.bold(`\n🤖 ASSISTANT:`));
    console.log(chalk.magenta(String(response.content)));
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('=== Basic PromptPack Usage ===\n');

// 1. Load PromptPack from JSON file
const registry = new PromptPackRegistry();
registry.loadAndRegister(join(__dirname, 'packs/customer-support.json'));

console.log('Registered packs:', registry.listPacks());
console.log('Prompts in pack:', registry.listPrompts('customer-support'));

// 2. Get a template from the registry
const template = await registry.getTemplate('customer-support', 'support');

console.log('\n--- Template Metadata ---');
console.log('Input variables:', template.inputVariables);
console.log('Parameters:', template.getParameters());

// 3. Use with LangChain - create a chain
const model = new ChatOpenAI({ 
  modelName: 'gpt-4o-mini',
  temperature: template.getParameters()?.temperature || 0.7
});

const chain = template.pipe(model);

// 4. Invoke the chain
console.log(chalk.bold('\n--- Billing Support Request ---'));

const vars1 = {
  role: 'customer support',
  issue_type: 'billing',
  user_message: 'I was charged twice for my subscription'
};

// Format to see what will be sent
const promptValue1 = await template.formatPromptValue(vars1);
const messages1 = promptValue1.toChatMessages();

// Invoke and display the full conversation
const response1 = await chain.invoke(vars1);
logConversation(messages1, response1 as AIMessage);

// 5. Use with default values
console.log(chalk.bold('\n\n--- General Support Request ---'));

const vars2 = {
  role: 'senior support specialist',
  user_message: 'How do I reset my password?'
};

const promptValue2 = await template.formatPromptValue(vars2);
const messages2 = promptValue2.toChatMessages();

const response2 = await chain.invoke(vars2);
logConversation(messages2, response2 as AIMessage);

// 6. Different template from same pack
const escalationTemplate = await registry.getTemplate('customer-support', 'escalation');
const escalationChain = escalationTemplate.pipe(model);

console.log(chalk.bold('\n\n--- Escalated Issue ---'));

const vars3 = {
  issue_type: 'billing',
  customer_tier: 'enterprise',
  user_message: 'This is the third time I\'ve been incorrectly charged!'
};

const promptValue3 = await escalationTemplate.formatPromptValue(vars3);
const messages3 = promptValue3.toChatMessages();

const response3 = await escalationChain.invoke(vars3);
logConversation(messages3, response3 as AIMessage);
