# Getting Started

## Installation

```bash
npm install @promptpack/langchain
```

**Required Peer Dependencies:**
```bash
npm install @langchain/core langchain
```

**Optional Dependencies:**
```bash
# For OpenAI models
npm install @langchain/openai

# For agent support with automatic tool execution
npm install @langchain/langgraph

# For conversation memory features
npm install @langchain/community
```

## Your First PromptPack

Create a file `hello.json`:

```json
{
  "$schema": "https://promptpack.org/schema/v1/promptpack.schema.json",
  "id": "hello",
  "name": "Hello World Pack",
  "version": "1.0.0",
  "template_engine": {
    "version": "v1",
    "syntax": "{{variable}}"
  },
  "prompts": {
    "greeter": {
      "id": "greeter",
      "name": "Simple Greeter",
      "version": "1.0.0",
      "system_template": "You are a friendly assistant. Greet {{name}} warmly.",
      "variables": [
        {
          "name": "name",
          "type": "string",
          "required": true,
          "description": "Name of the person to greet"
        }
      ],
      "parameters": {
        "temperature": 0.7,
        "max_tokens": 100
      }
    }
  }
}
```

## Using the Pack

```typescript
import { PromptPackRegistry, PromptPackTemplate } from '@promptpack/langchain';
import { ChatOpenAI } from '@langchain/openai';

// 1. Load the pack
const pack = PromptPackRegistry.loadFromFile('./hello.json');

// 2. Create a template for a specific prompt
const template = new PromptPackTemplate({
  pack,
  promptId: 'greeter',
});

// 3. Use with LangChain
const model = new ChatOpenAI({ 
  model: 'gpt-4o-mini',
  temperature: template.getParameters()?.temperature,
});

const chain = template.pipe(model);

// 4. Invoke with variables
const response = await chain.invoke({
  name: 'Alice',
});

console.log(response.content);
// Output: "Hello Alice! It's wonderful to meet you..."
```

## Loading Multiple Packs

Use a registry to manage multiple packs:

```typescript
import { PromptPackRegistry } from '@promptpack/langchain';

// Method 1: Load from directory
const registry = PromptPackRegistry.fromDirectory('./packs');

// Method 2: Load individually
const registry2 = new PromptPackRegistry();
registry2.register(PromptPackRegistry.loadFromFile('./pack1.json'));
registry2.register(PromptPackRegistry.loadFromFile('./pack2.json'));

// Get a specific prompt
const prompt = registry.getPrompt('hello', 'greeter');

// Create template from registry
const template = PromptPackTemplate.fromRegistry(
  registry,
  'hello',
  'greeter'
);
```

## Working with Variables

Variables can have defaults and validation:

```json
{
  "variables": [
    {
      "name": "email",
      "type": "string",
      "required": true,
      "validation": {
        "pattern": "^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$"
      }
    },
    {
      "name": "priority",
      "type": "string",
      "required": false,
      "default": "medium",
      "validation": {
        "enum": ["low", "medium", "high"]
      }
    }
  ]
}
```

```typescript
// Will use default for priority
const response = await chain.invoke({
  email: 'user@example.com',
  // priority defaults to 'medium'
});

// Override the default
const response2 = await chain.invoke({
  email: 'user@example.com',
  priority: 'high',
});
```

## Error Handling

```typescript
import { 
  ValidationError, 
  TemplateError, 
  NotFoundError 
} from '@promptpack/langchain';

try {
  const response = await chain.invoke({ name: 'Bob' });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Variable validation failed:', error.message);
  } else if (error instanceof TemplateError) {
    console.error('Template rendering failed:', error.message);
  } else if (error instanceof NotFoundError) {
    console.error('Pack or prompt not found:', error.message);
  }
}
```

## Next Steps

- **[Core Concepts](./core-concepts.md)** - Learn about registries, templates, and engines
- **[Tools](./tools.md)** - Add function calling with governance
- **[Multimodal](./multimodal.md)** - Work with images and other media
- **[Examples](./examples.md)** - See complete working examples
