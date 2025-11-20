/**
 * Real LangChain Tools Integration Example
 * 
 * This example shows how to use PromptPack tools with actual LangChain tools
 * Run with: npx tsx examples/langchain-tools.ts
 */

import { PromptPackTemplate, PromptPackRegistry } from '../dist/index.js';
import { ChatOpenAI } from '@langchain/openai';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import chalk from 'chalk';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load pack from JSON file
const crmPack = PromptPackRegistry.loadFromFile(
  join(__dirname, 'packs/sales-assistant.json')
);


// Mock database
const mockDB = {
  customers: {
    'CUST-001': {
      id: 'CUST-001',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      tier: 'premium',
    },
    'CUST-002': {
      id: 'CUST-002',
      name: 'Bob Smith',
      email: 'bob@example.com',
      tier: 'standard',
    },
  },
  products: [
    { id: 'PROD-001', name: 'Laptop Pro', category: 'computers', price: 1299 },
    { id: 'PROD-002', name: 'Wireless Mouse', category: 'accessories', price: 29 },
    { id: 'PROD-003', name: 'USB-C Cable', category: 'accessories', price: 15 },
  ],
  orders: [] as Array<any>,
};

// Convert PromptPack tools to LangChain tools (matching sales-assistant.json)
function createLangChainTools() {
  return [
    new DynamicStructuredTool({
      name: 'lookup_customer',
      description: 'Look up customer information by customer ID or email address',
      schema: z.object({
        customer_id: z.string().describe('The customer ID to look up'),
      }),
      func: async ({ customer_id }) => {
        console.log(`🔧 Tool called: lookup_customer(${customer_id})`);
        const customer = mockDB.customers[customer_id as keyof typeof mockDB.customers];
        if (!customer) {
          return JSON.stringify({ error: 'Customer not found' });
        }
        return JSON.stringify(customer);
      },
    }),

    new DynamicStructuredTool({
      name: 'check_inventory',
      description: 'Check current inventory levels for a product',
      schema: z.object({
        product_id: z.string().describe('Product SKU or ID'),
      }),
      func: async ({ product_id }) => {
        console.log(`🔧 Tool called: check_inventory("${product_id}")`);
        const product = mockDB.products.find((p) => p.id === product_id);
        if (!product) {
          return JSON.stringify({ error: 'Product not found' });
        }
        return JSON.stringify({ ...product, in_stock: true, quantity: 50 });
      },
    }),

    new DynamicStructuredTool({
      name: 'create_order',
      description: 'Create a new sales order for a customer',
      schema: z.object({
        customer_id: z.string().describe('Customer ID'),
        items: z.array(z.object({
          product_id: z.string(),
          quantity: z.number(),
        })).describe('Items to order'),
      }),
      func: async ({ customer_id, items }) => {
        console.log(
          `🔧 Tool called: create_order(customer: ${customer_id}, items: ${items.length})`
        );

        const order = {
          order_id: `ORD-${Date.now()}`,
          customer_id,
          items,
          status: 'created',
          created_at: new Date().toISOString(),
        };

        mockDB.orders.push(order);
        return JSON.stringify(order);
      },
    }),

    new DynamicStructuredTool({
      name: 'calculate_discount',
      description: 'Calculate available discounts for a customer and order',
      schema: z.object({
        customer_id: z.string().describe('Customer ID'),
        order_total: z.number().describe('Total order amount'),
      }),
      func: async ({ customer_id, order_total }) => {
        console.log(`🔧 Tool called: calculate_discount(${customer_id}, $${order_total})`);
        const customer = mockDB.customers[customer_id as keyof typeof mockDB.customers];
        const discount = customer?.tier === 'premium' ? 0.15 : 0.05;
        return JSON.stringify({
          discount_percentage: discount * 100,
          discount_amount: order_total * discount,
        });
      },
    }),

    new DynamicStructuredTool({
      name: 'check_order_status',
      description: 'Check the current status of an existing order',
      schema: z.object({
        order_id: z.string().describe('Order ID to check'),
      }),
      func: async ({ order_id }) => {
        console.log(`🔧 Tool called: check_order_status(${order_id})`);
        const order = mockDB.orders.find((o) => o.order_id === order_id);
        if (!order) {
          return JSON.stringify({ error: 'Order not found' });
        }
        return JSON.stringify({ ...order, tracking: 'TRK-123456', status: 'shipped' });
      },
    }),
  ];
}

async function manualToolExecutionExample() {
  console.log(chalk.bold('=== Manual Tool Execution (Basic) ===\n'));
  console.log(chalk.gray('Shows how PromptPack filters tools and works with LangChain\'s .bindTools()\n'));

  // 1. Create template from pack
  const template = new PromptPackTemplate({
    pack: crmPack,
    promptId: 'sales',
  });

  // Show system prompt
  const systemPrompt = await template.formatPromptValue({
    company: 'Acme Corp',
    user_message: '',
  });
  const systemMsg = systemPrompt.toChatMessages().find(m => m._getType() === 'system');
  if (systemMsg) {
    console.log(chalk.blue.bold('🔧 SYSTEM:'));
    console.log(chalk.blue(systemMsg.content));
  }

  // 2. Create all your tools
  const allTools = createLangChainTools();
  console.log(chalk.cyan('\nAll tools:'), allTools.map(t => t.name).join(', '));
  
  // 3. Filter to only allowed tools (PromptPack governance)
  const tools = template.filterTools(allTools);
  console.log(chalk.cyan('Allowed tools:'), tools.map(t => t.name).join(', '));

  // 4. Create model with filtered tools
  const model = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0.7,
  }).bindTools(tools);

  // 5. Create chain
  const chain = template.pipe(model);


  // Example 1: Customer lookup
  console.log(chalk.bold('\n--- Example 1: Customer Lookup ---'));
  console.log(chalk.green.bold('\n👤 USER:'));
  console.log(chalk.green('Can you tell me about customer CUST-001?'));

  const result1 = await chain.invoke({
    company: 'Acme Corp',
    user_message: 'Can you tell me about customer CUST-001?'
  });
  
  if (result1.tool_calls && result1.tool_calls.length > 0) {
    console.log(chalk.yellow.bold('\n🔧 TOOL CALLS:'));
    for (const tc of result1.tool_calls) {
      console.log(chalk.yellow(`  ${tc.name}(${JSON.stringify(tc.args)})`));
      // Execute the tool
      const tool = tools.find(t => t.name === tc.name);
      if (tool) {
        const toolResult = await tool.invoke(tc.args);
        console.log(chalk.gray(`  → ${toolResult}`));
      }
    }
  }
  console.log(chalk.magenta.bold('\n🤖 ASSISTANT:'));
  console.log(chalk.magenta(result1.content || '[Made tool calls - awaiting results]'));

  // Example 2: Inventory check
  console.log(chalk.bold('\n--- Example 2: Inventory Check ---'));
  console.log(chalk.green.bold('\n👤 USER:'));
  console.log(chalk.green('Do you have the Laptop Pro in stock?'));

  const result2 = await chain.invoke({
    company: 'Acme Corp',
    user_message: 'Do you have the Laptop Pro (PROD-001) in stock?'
  });
  
  if (result2.tool_calls && result2.tool_calls.length > 0) {
    console.log(chalk.yellow.bold('\n🔧 TOOL CALLS:'));
    for (const tc of result2.tool_calls) {
      console.log(chalk.yellow(`  ${tc.name}(${JSON.stringify(tc.args)})`));
      // Execute the tool
      const tool = tools.find(t => t.name === tc.name);
      if (tool) {
        const toolResult = await tool.invoke(tc.args);
        console.log(chalk.gray(`  → ${toolResult}`));
      }
    }
  }
  console.log(chalk.magenta.bold('\n🤖 ASSISTANT:'));
  console.log(chalk.magenta(result2.content || '[Made tool calls - awaiting results]'));

  // Example 3: Order creation
  console.log(chalk.bold('\n--- Example 3: Order Creation ---'));
  console.log(chalk.green.bold('\n👤 USER:'));
  console.log(chalk.green('Please create an order for customer CUST-002: 2 mice and 1 laptop'));

  const result3 = await chain.invoke({
    company: 'Acme Corp',
    user_message: 'Please create an order for customer CUST-002 with these items: product PROD-002 quantity 2, and product PROD-001 quantity 1. Create the order now.'
  });
  
  if (result3.tool_calls && result3.tool_calls.length > 0) {
    console.log(chalk.yellow.bold('\n🔧 TOOL CALLS:'));
    for (const tc of result3.tool_calls) {
      console.log(chalk.yellow(`  ${tc.name}(${JSON.stringify(tc.args)})`));
      // Execute the tool
      const tool = tools.find(t => t.name === tc.name);
      if (tool) {
        const toolResult = await tool.invoke(tc.args);
        console.log(chalk.gray(`  → ${toolResult}`));
      }
    }
  }
  console.log(chalk.magenta.bold('\n🤖 ASSISTANT:'));
  console.log(chalk.magenta(result3.content || '[Made tool calls - awaiting results]'));
  console.log(chalk.cyan('\n📦 Orders in database:'), mockDB.orders.length);
  console.log(chalk.gray('\n💡 Note: With .bindTools(), you manually execute tools.'));
  console.log(chalk.gray('   For automatic execution, use LangChain agents (see next example)'));
}

async function withAgentExample() {
  console.log(chalk.bold('\n\n=== With LangChain Agent (Auto-execution) ===\n'));
  console.log(chalk.gray('Agent automatically executes tools in a loop until task is complete\n'));
  
  try {
    // Dynamic import since langgraph might not be installed
    const { createReactAgent } = await import('@langchain/langgraph/prebuilt');
    
    // 1. Create template
    const template = new PromptPackTemplate({
      pack: crmPack,
      promptId: 'sales',
    });

    // 2. Get filtered tools
    const allTools = createLangChainTools();
    const tools = template.filterTools(allTools);

    // 3. Format the system prompt
    const systemPrompt = await template.format({ company: 'Acme Corp' });

    console.log(chalk.blue.bold('🔧 SYSTEM:'));
    console.log(chalk.blue(systemPrompt));

    // 4. Create agent - automatically executes tools
    const agent = createReactAgent({
      llm: new ChatOpenAI({ modelName: 'gpt-4o-mini', temperature: 0.7 }),
      tools,
      prompt: systemPrompt,
    });

    // 5. Agent automatically executes tools and continues until done
    console.log(chalk.green.bold('\n👤 USER:'));
    console.log(chalk.green('Create an order for customer CUST-002: 2 mice and 1 laptop'));
    
    const result = await agent.invoke({
      messages: [{ 
        role: 'user', 
        content: 'Create an order for customer CUST-002 with 2 wireless mice (PROD-002) and 1 laptop (PROD-001)' 
      }]
    });

    const lastMessage = result.messages[result.messages.length - 1];
    console.log(chalk.magenta.bold('\n🤖 ASSISTANT:'));
    console.log(chalk.magenta(lastMessage.content));
    console.log(chalk.cyan('\n📦 Orders in database:'), mockDB.orders.length);
    console.log(chalk.green('\n✅ The agent automatically executed tools and created the order!'));
    
  } catch (error: any) {
    if (error.code === 'ERR_MODULE_NOT_FOUND') {
      console.log(chalk.yellow('⚠️  @langchain/langgraph not installed. To use agents:'));
      console.log(chalk.yellow('   npm install @langchain/langgraph'));
      console.log();
      console.log(chalk.gray('With agents, tools are executed automatically in a loop:'));
      console.log(chalk.gray('  1. Model decides which tools to call'));
      console.log(chalk.gray('  2. Agent executes them automatically'));
      console.log(chalk.gray('  3. Feeds results back to the model'));
      console.log(chalk.gray('  4. Repeats until the task is complete'));
    } else {
      throw error;
    }
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   PromptPack + LangChain Tools Integration            ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    await manualToolExecutionExample();
    await withAgentExample();
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
}

await main();
