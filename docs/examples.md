# Examples

Complete code examples for @promptpack/langchain.

## Running Examples

All examples are in the `examples/` directory. To run them:

```bash
# Install dependencies
npm install

# Set API key (required for most examples)
export OPENAI_API_KEY=your-api-key-here

# Run examples
npx tsx examples/basic-usage.ts
npx tsx examples/conversation.ts
npx tsx examples/integration.ts
npx tsx examples/tools.ts
npx tsx examples/validation-native.ts

# Test error handling (no API key needed)
npx tsx examples/validation-error-test.ts
```

## Basic Usage

### Simple Chain

```typescript
import { PromptPackRegistry, PromptPackTemplate } from '@promptpack/langchain';
import { ChatOpenAI } from '@langchain/openai';

// Load pack
const pack = PromptPackRegistry.loadFromFile('./pack.json');

// Create template
const template = new PromptPackTemplate({ pack, promptId: 'support' });

// Create chain
const model = new ChatOpenAI({ model: 'gpt-4o-mini' });
const chain = template.pipe(model);

// Invoke
const response = await chain.invoke({
  role: 'helpful support agent',
  company: 'TechCorp',
  issue_type: 'billing'
});

console.log(response.content);
```

### With Variables

```typescript
// PromptPack with variables
{
  "prompts": {
    "greeter": {
      "id": "greeter",
      "system_template": "You are a {{personality}} assistant for {{company}}.",
      "variables": {
        "personality": {
          "type": "string",
          "required": true,
          "description": "Assistant personality"
        },
        "company": {
          "type": "string",
          "required": true
        }
      }
    }
  }
}

// Usage
const response = await chain.invoke({
  personality: 'friendly and helpful',
  company: 'Acme Corp'
});
```

## Tools Examples

### Basic Tool Usage

```typescript
import { PromptPackTemplate } from '@promptpack/langchain';
import { ChatOpenAI } from '@langchain/openai';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

// Load pack with tools
const pack = PromptPackRegistry.loadFromFile('./pack.json');
const template = new PromptPackTemplate({ pack, promptId: 'agent' });

// Create LangChain tools
const getWeatherTool = new DynamicStructuredTool({
  name: 'get_weather',
  description: 'Get current weather',
  schema: z.object({
    location: z.string().describe('City and state'),
  }),
  func: async ({ location }) => {
    return `Weather in ${location}: 72°F, sunny`;
  },
});

const tools = [getWeatherTool];

// Filter based on prompt's allowed list
const allowedTools = template.filterTools(tools);

// Bind tools to model
const model = new ChatOpenAI({ model: 'gpt-4o-mini' }).bindTools(allowedTools);

// Create chain
const chain = template.pipe(model);

// Invoke
const response = await chain.invoke({
  /* variables */
});

// Handle tool calls
if (response.tool_calls && response.tool_calls.length > 0) {
  for (const toolCall of response.tool_calls) {
    const tool = allowedTools.find(t => t.name === toolCall.name);
    if (tool) {
      const result = await tool.invoke(toolCall.args);
      console.log(`${toolCall.name}:`, result);
    }
  }
}
```

### Agent with Automatic Tool Execution

```typescript
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';

// Setup
const template = new PromptPackTemplate({ pack, promptId: 'agent' });
const tools = template.filterTools(allTools);
const systemPrompt = await template.format({ /* variables */ });

// Create agent
const agent = createReactAgent({
  llm: new ChatOpenAI({ model: 'gpt-4o-mini' }),
  tools,
  prompt: systemPrompt,
});

// Invoke - tools execute automatically
const result = await agent.invoke({
  messages: [{ role: 'user', content: 'What is the weather in SF?' }]
});

console.log(result.messages[result.messages.length - 1].content);
```

### Multiple Tools with Governance

```typescript
// PromptPack definition
{
  "tools": {
    "lookup_order": {
      "name": "lookup_order",
      "description": "Look up order by ID",
      "parameters": {
        "type": "object",
        "properties": {
          "order_id": { "type": "string" }
        },
        "required": ["order_id"]
      }
    },
    "create_ticket": {
      "name": "create_ticket",
      "description": "Create support ticket",
      "parameters": {
        "type": "object",
        "properties": {
          "title": { "type": "string" },
          "description": { "type": "string" }
        },
        "required": ["title", "description"]
      }
    }
  },
  "prompts": {
    "support_agent": {
      "id": "support_agent",
      "system_template": "You are a support agent.",
      "tools": ["lookup_order", "create_ticket"],
      "tool_policy": {
        "tool_choice": "auto",
        "max_rounds": 5,
        "max_tool_calls_per_turn": 3
      }
    },
    "readonly_agent": {
      "id": "readonly_agent",
      "system_template": "You can only view orders.",
      "tools": ["lookup_order"],
      "tool_policy": {
        "tool_choice": "auto",
        "blocklist": ["create_ticket"]
      }
    }
  }
}

// Implementation
const lookupTool = new DynamicStructuredTool({
  name: 'lookup_order',
  schema: z.object({ order_id: z.string() }),
  func: async ({ order_id }) => {
    return JSON.stringify(await db.orders.find(order_id));
  },
});

const createTicketTool = new DynamicStructuredTool({
  name: 'create_ticket',
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
  func: async ({ title, description }) => {
    const ticket = await db.tickets.create({ title, description });
    return `Created ticket #${ticket.id}`;
  },
});

// Agent can use both tools
const supportTemplate = new PromptPackTemplate({ 
  pack, 
  promptId: 'support_agent' 
});
const supportTools = supportTemplate.filterTools([lookupTool, createTicketTool]);

// Readonly agent can only lookup
const readonlyTemplate = new PromptPackTemplate({ 
  pack, 
  promptId: 'readonly_agent' 
});
const readonlyTools = readonlyTemplate.filterTools([lookupTool, createTicketTool]);
// readonlyTools will only contain lookupTool
```

## Multimodal Examples

### Image Analysis

```typescript
import { HumanMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';

const pack = PromptPackRegistry.loadFromFile('./pack.json');
const template = new PromptPackTemplate({ pack, promptId: 'image_analyzer' });

// Format system prompt
const messages = await template.format({
  analysis_type: 'detailed description'
});

// Add image
messages.push(new HumanMessage({
  content: [
    { type: 'text', text: 'Describe this image in detail' },
    {
      type: 'image_url',
      image_url: {
        url: 'https://example.com/photo.jpg',
        detail: 'high'
      }
    }
  ]
}));

// Use vision model
const model = new ChatOpenAI({ model: 'gpt-4o' });
const response = await model.invoke(messages);

console.log(response.content);
```

### Multiple Images

```typescript
const messages = await template.format({ task: 'compare images' });

messages.push(new HumanMessage({
  content: [
    { type: 'text', text: 'What are the differences?' },
    { type: 'image_url', image_url: { url: image1Url } },
    { type: 'image_url', image_url: { url: image2Url } }
  ]
}));

const response = await model.invoke(messages);
```

### Base64 Images

```typescript
import { readFileSync } from 'fs';

const imageBuffer = readFileSync('./photo.jpg');
const base64Image = imageBuffer.toString('base64');

messages.push(new HumanMessage({
  content: [
    { type: 'text', text: 'Analyze this image' },
    {
      type: 'image_url',
      image_url: {
        url: `data:image/jpeg;base64,${base64Image}`,
        detail: 'high'
      }
    }
  ]
}));
```

## Validation Examples

### JSON Schema Validation

```typescript
import { JsonOutputParser } from '@langchain/core/output_parsers';

// PromptPack with validator
{
  "validators": {
    "contact_info": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "email": { "type": "string", "format": "email" },
        "phone": { "type": "string" }
      },
      "required": ["name", "email"]
    }
  },
  "prompts": {
    "extractor": {
      "id": "extractor",
      "system_template": "Extract contact information.",
      "response_schema": "contact_info"
    }
  }
}

// Usage
const template = new PromptPackTemplate({ pack, promptId: 'extractor' });
const chain = template
  .pipe(new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0 }))
  .pipe(new JsonOutputParser());

const result = await chain.invoke({
  text: 'Contact John at john@example.com'
});

// Validate
const validator = template.getValidator();
if (validator) {
  const validation = validator.validate(result);
  
  if (validation.valid) {
    console.log('Valid:', result);
  } else {
    console.error('Errors:', validation.errors);
  }
}
```

### Structured Output with Zod

```typescript
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional()
});

const model = new ChatOpenAI({ model: 'gpt-4o-mini' })
  .withStructuredOutput(contactSchema);

const chain = template.pipe(model);

const result = await chain.invoke({
  text: 'Contact John at john@example.com'
});

// result is automatically validated and typed
console.log(result.name); // TypeScript knows this is a string
```

## Advanced Examples

### Multi-Step Pipeline

```typescript
// Step 1: Extract entities
const extractTemplate = new PromptPackTemplate({ 
  pack, 
  promptId: 'extractor' 
});
const extractor = extractTemplate.pipe(
  new ChatOpenAI({ model: 'gpt-4o-mini' })
);
const entities = await extractor.invoke({ text: input });

// Step 2: Enrich data
const enrichTemplate = new PromptPackTemplate({ 
  pack, 
  promptId: 'enricher' 
});
const enricher = enrichTemplate.pipe(
  new ChatOpenAI({ model: 'gpt-4o' })
);
const enriched = await enricher.invoke({ 
  entities: JSON.stringify(entities) 
});

// Step 3: Generate report
const reportTemplate = new PromptPackTemplate({ 
  pack, 
  promptId: 'reporter' 
});
const reporter = reportTemplate.pipe(
  new ChatOpenAI({ model: 'gpt-4o' })
);
const report = await reporter.invoke({ 
  data: JSON.stringify(enriched) 
});

console.log(report.content);
```

### Streaming

```typescript
const template = new PromptPackTemplate({ pack, promptId: 'writer' });
const model = new ChatOpenAI({ 
  model: 'gpt-4o',
  streaming: true 
});

const chain = template.pipe(model);
const stream = await chain.stream({ topic: 'AI' });

for await (const chunk of stream) {
  process.stdout.write(chunk.content);
}
```

### Error Handling

```typescript
async function invokeWithRetry(
  chain: any,
  input: any,
  maxRetries: number = 3
) {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await chain.invoke(input);
    } catch (error) {
      lastError = error as Error;
      console.log(`Attempt ${attempt + 1} failed:`, error.message);
      
      // Exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
  
  throw new Error(`Failed after ${maxRetries} attempts: ${lastError?.message}`);
}

// Usage
try {
  const result = await invokeWithRetry(chain, { input: 'test' });
} catch (error) {
  console.error('All retries failed:', error);
}
```

### Caching

```typescript
const cache = new Map<string, any>();

async function cachedInvoke(chain: any, input: any, ttl: number = 3600000) {
  const key = JSON.stringify(input);
  
  // Check cache
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.result;
  }
  
  // Invoke chain
  const result = await chain.invoke(input);
  
  // Store
  cache.set(key, { result, timestamp: Date.now() });
  
  return result;
}

// Usage
const result = await cachedInvoke(chain, { input: 'hello' });
```

## Complete Example Files

The `examples/` directory contains these complete working examples:

### `basic-usage.ts`

Basic usage with JSON pack loading:
- Loading packs from JSON files using `registry.loadAndRegister()`
- Getting templates with `registry.getTemplate()`
- Creating LangChain chains
- Multi-turn conversations with message history
- Colorized console output with chalk

### `conversation.ts`

Multi-turn conversations with memory:
- Manual message array management
- LangChain's `RunnableWithMessageHistory` integration
- Incremental display (only new messages per turn)
- System prompt display
- Two different approaches to conversation state

### `integration.ts`

Advanced LangChain integration features:
- Streaming responses
- Batch processing multiple inputs
- Chain composition with `StringOutputParser`
- Model parameter configuration

### `tools.ts`

Tool calling with governance:
- Multiple tool definitions (CRM operations)
- Tool filtering based on prompt's allowed list
- Manual tool execution with `.bindTools()`
- Automatic execution with LangChain agents
- Mock database integration
- Displays available vs allowed tools

### `validation-native.ts`

**LangChain-native validation using Runnables:**
- Uses `ValidationRunnable` that integrates with `.pipe()`
- Leverages LangChain's `.withRetry()` for automatic retries
- Uses `.withFallbacks()` for graceful degradation
- Custom validator implementations (sentiment, PII detection)
- OOTB validators (banned_words, max_length, min_length, regex_match)
- Shows available vs required validators
- Multiple examples demonstrating different validation patterns
- **Reuses existing LangChain capabilities** instead of custom wrappers

### `validation-error-test.ts`

Missing validator error handling:
- Demonstrates error when required validator is missing
- Shows OOTB vs custom validator distinction
- Validates that governance is enforced

This approach follows LangChain's native patterns and integrates seamlessly with the ecosystem.

## Example Packs

### `packs/customer-support.json`

Customer support pack with multiple prompts:

- Variable definitions with validation
- Reusable fragments (company_context, tone_guidelines, response_format)
- Model configuration per prompt
- OOTB validators (banned_words, max_length)
- Two prompts: 'support' (general) and 'escalation' (senior specialist)

Used by: `basic-usage.ts`, `conversation.ts`

### `packs/sales-assistant.json`

Sales assistant with tool governance:

- CRM tool definitions
- Tool policies per prompt
- Multi-prompt setup with different tool access
- Demonstrates governance patterns

Used by: `tools.ts`

### `packs/validation-demo.json`

Validation examples pack:

- Two prompts with different validation levels
- 'responder': strict validation (banned_words, pii_detection, sentiment)
- 'relaxed': lenient validation (banned_words only)
- Demonstrates fallback chains

Used by: `validation-native.ts`, `validation-error-test.ts`

## Next Steps

- **[Getting Started](./getting-started.md)** - Setup and installation
- **[Core Concepts](./core-concepts.md)** - Understanding the fundamentals
- **[API Reference](./api-reference.md)** - Complete API documentation
