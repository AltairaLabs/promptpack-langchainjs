/**
 * Multi-turn Conversation Example
 * 
 * Shows how to manage conversation state with PromptPack templates
 * Run with: npx tsx examples/conversation.ts
 */

import { PromptPackTemplate, PromptPackRegistry } from '../dist/index.js';
import { ChatOpenAI } from '@langchain/openai';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { RunnableWithMessageHistory } from '@langchain/core/runnables';
import { ChatMessageHistory } from '@langchain/community/stores/message/in_memory';
import chalk from 'chalk';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load pack from JSON file
const conversationPack = PromptPackRegistry.loadFromFile(
  join(__dirname, 'packs/customer-support.json')
);

async function conversationExample() {
  console.log('=== Multi-turn Conversation Example ===\n');

  // 1. Create template
  const template = new PromptPackTemplate({
    pack: conversationPack,
    promptId: 'support',
  });

  // 2. Create model
  const model = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0.7,
  });

  // 3. Create chain
  const chain = template.pipe(model);

  // 4. Keep conversation history
  const conversationHistory: BaseMessage[] = [];

  // Show system prompt
  const systemPrompt = await template.formatPromptValue({
    role: 'friendly support agent named Jarvis',
    company: 'Acme Corp',
    user_message: '',
    messages: [],
  });
  const systemMsg = systemPrompt.toChatMessages().find(m => m._getType() === 'system');
  if (systemMsg) {
    console.log(chalk.blue.bold('🔧 SYSTEM:'));
    console.log(chalk.blue(systemMsg.content));
  }

  // Turn 1
  console.log(chalk.green.bold('\n👤 USER:'));
  console.log(chalk.green("Hi, what's your name?"));
  
  const response1 = await chain.invoke({
    role: 'friendly support agent named Jarvis',
    company: 'Acme Corp',
    user_message: "Hi, what's your name?",
    messages: conversationHistory,
  });
  
  console.log(chalk.magenta.bold('\n🤖 ASSISTANT:'));
  console.log(chalk.magenta(String((response1 as AIMessage).content)));

  // Add to history
  conversationHistory.push(
    new HumanMessage("Hi, what's your name?"),
    new AIMessage(String((response1 as AIMessage).content))
  );

  // Turn 2 - Tests memory
  console.log(chalk.green.bold('\n👤 USER:'));
  console.log(chalk.green('What did I just ask you?'));
  
  const response2 = await chain.invoke({
    role: 'friendly support agent named Jarvis',
    company: 'Acme Corp',
    user_message: 'What did I just ask you?',
    messages: conversationHistory,
  });
  
  console.log(chalk.magenta.bold('\n🤖 ASSISTANT:'));
  console.log(chalk.magenta(String((response2 as AIMessage).content)));

  // Add to history
  conversationHistory.push(
    new HumanMessage('What did I just ask you?'),
    new AIMessage(String((response2 as AIMessage).content))
  );

  // Turn 3 - More context
  console.log(chalk.green.bold('\n👤 USER:'));
  console.log(chalk.green('Can you help me with TypeScript?'));
  
  const response3 = await chain.invoke({
    role: 'friendly support agent named Jarvis',
    company: 'Acme Corp',
    user_message: 'Can you help me with TypeScript?',
    messages: conversationHistory,
  });
  
  console.log(chalk.magenta.bold('\n🤖 ASSISTANT:'));
  console.log(chalk.magenta(String((response3 as AIMessage).content)));

  console.log(chalk.cyan.bold(`\n📝 Conversation has ${conversationHistory.length + 2} messages in history`));
}

async function langchainMemoryExample() {
  console.log(chalk.bold('\n=== LangChain Memory Integration ===\n'));
  console.log(chalk.gray('Using RunnableWithMessageHistory for automatic memory management...\n'));

  const template = new PromptPackTemplate({
    pack: conversationPack,
    promptId: 'support',
  });

  const model = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0.7,
  });

  const chain = template.pipe(model);

  // Create message history storage
  const messageHistories = new Map<string, ChatMessageHistory>();
  
  const getMessageHistory = async (sessionId: string) => {
    if (!messageHistories.has(sessionId)) {
      messageHistories.set(sessionId, new ChatMessageHistory());
    }
    return messageHistories.get(sessionId)!;
  };

  // Wrap chain with automatic message history management
  const chainWithHistory = new RunnableWithMessageHistory({
    runnable: chain,
    getMessageHistory,
    inputMessagesKey: 'user_message',
    historyMessagesKey: 'messages',
  });

  const sessionId = 'user-123';
  const config = { configurable: { sessionId } };

  // Show system prompt
  const systemPrompt = await template.formatPromptValue({
    role: 'customer support specialist',
    user_message: '',
  });
  const systemMsg = systemPrompt.toChatMessages().find(m => m._getType() === 'system');
  if (systemMsg) {
    console.log(chalk.blue.bold('🔧 SYSTEM:'));
    console.log(chalk.blue(systemMsg.content));
  }

  // Turn 1
  console.log(chalk.green.bold('\n👤 USER:'));
  console.log(chalk.green('Hi, I need help with my account.'));
  
  const response1 = await chainWithHistory.invoke(
    {
      role: 'customer support specialist',
      user_message: 'Hi, I need help with my account.',
    },
    config
  );
  
  console.log(chalk.magenta.bold('\n🤖 ASSISTANT:'));
  console.log(chalk.magenta(String((response1 as AIMessage).content)));
  
  const history1 = await getMessageHistory(sessionId);
  const messages1 = await history1.getMessages();
  console.log(chalk.cyan(`\n[History: ${messages1.length} messages stored]`));

  // Turn 2 - References previous context
  console.log(chalk.green.bold('\n👤 USER:'));
  console.log(chalk.green('I was charged twice for the same subscription.'));
  
  const response2 = await chainWithHistory.invoke(
    {
      role: 'customer support specialist',
      user_message: 'I was charged twice for the same subscription.',
    },
    config
  );
  
  console.log(chalk.magenta.bold('\n🤖 ASSISTANT:'));
  console.log(chalk.magenta(String((response2 as AIMessage).content)));
  
  const history2 = await getMessageHistory(sessionId);
  const messages2 = await history2.getMessages();
  console.log(chalk.cyan(`\n[History: ${messages2.length} messages stored]`));

  // Turn 3 - Tests memory
  console.log(chalk.green.bold('\n👤 USER:'));
  console.log(chalk.green('What was the issue I just mentioned?'));
  
  const response3 = await chainWithHistory.invoke(
    {
      role: 'customer support specialist',
      user_message: 'What was the issue I just mentioned?',
    },
    config
  );
  
  console.log(chalk.magenta.bold('\n🤖 ASSISTANT:'));
  console.log(chalk.magenta(String((response3 as AIMessage).content)));
  
  const history3 = await getMessageHistory(sessionId);
  const messages3 = await history3.getMessages();
  console.log(chalk.cyan(`\n[History: ${messages3.length} messages stored]`));

  console.log(chalk.yellow.bold('\n💡 Benefits:'));
  console.log(chalk.yellow('• Automatic message history management'));
  console.log(chalk.yellow('• Session-based conversations (multi-user support)'));
  console.log(chalk.yellow('• No manual history tracking needed'));
  console.log(chalk.yellow('• Compatible with any LangChain memory backend'));
}

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║   PromptPack Multi-turn Conversations                 ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

try {
  await conversationExample();
  await langchainMemoryExample();
  console.log('\n✅ Examples completed successfully!');
} catch (error) {
  console.error('\n❌ Error:', error);
  if (error instanceof Error) {
    console.error('Message:', error.message);
    if (error.message.includes('API key')) {
      console.error('\n💡 Make sure to set your OPENAI_API_KEY environment variable:');
      console.error('   export OPENAI_API_KEY=your-api-key-here');
    }
  }
}
