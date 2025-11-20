# Core Concepts

## PromptPack Structure

A PromptPack is a JSON file that contains:

```json
{
  "$schema": "https://promptpack.org/schema/v1/promptpack.schema.json",
  "id": "my-pack",              // Unique pack identifier
  "name": "My Pack",             // Human-readable name
  "version": "1.0.0",            // Semantic version
  "description": "Description",  // Optional description
  
  "template_engine": {
    "version": "v1",
    "syntax": "{{variable}}"
  },
  
  "fragments": {                 // Reusable text snippets
    "greeting": "Hello!"
  },
  
  "tools": {                     // Tool definitions (optional)
    "tool_name": { /* ... */ }
  },
  
  "prompts": {                   // One or more prompts
    "prompt_id": { /* ... */ }
  }
}
```

## Registry

The `PromptPackRegistry` manages collections of packs:

### Creating a Registry

```typescript
import { PromptPackRegistry } from '@promptpack/langchain';

// Empty registry
const registry = new PromptPackRegistry();

// Load from a directory (loads all .json files)
const registry = PromptPackRegistry.fromDirectory('./packs');
```

### Adding Packs

```typescript
// Load and register individual packs
const pack1 = PromptPackRegistry.loadFromFile('./pack1.json');
const pack2 = PromptPackRegistry.loadFromFile('./pack2.json');

registry.register(pack1);
registry.register(pack2);

// Or load from directory
const packs = PromptPackRegistry.loadFromDirectory('./my-packs');
packs.forEach(pack => registry.register(pack));
```

### Retrieving from Registry

```typescript
// Get a pack by ID
const pack = registry.getPack('customer-support');

// Get a specific prompt
const prompt = registry.getPrompt('customer-support', 'agent');

// List all packs
const allPacks = registry.listPacks();
console.log('Available packs:', allPacks.map(p => p.id));
```

## Templates

The `PromptPackTemplate` extends LangChain's `BasePromptTemplate`:

### Creating Templates

```typescript
import { PromptPackTemplate } from '@promptpack/langchain';

// From a pack object
const template = new PromptPackTemplate({
  pack: myPack,
  promptId: 'agent',
});

// From a registry
const template = PromptPackTemplate.fromRegistry(
  registry,
  'customer-support',  // pack ID
  'agent'              // prompt ID
);

// With model-specific overrides
const template = new PromptPackTemplate({
  pack: myPack,
  promptId: 'agent',
  modelId: 'claude-3-opus',  // Apply model overrides if defined
});
```

### Using Templates

```typescript
// As a string
const text = await template.format({ 
  name: 'Alice',
  role: 'agent' 
});

// As LangChain messages
const messages = await template.formatMessages({
  name: 'Alice',
  role: 'agent'
});

// In a chain
const model = new ChatOpenAI({ model: 'gpt-4' });
const chain = template.pipe(model);
const response = await chain.invoke({ name: 'Alice', role: 'agent' });
```

## Template Engine

The `PromptPackTemplateEngine` handles variable substitution:

### Variable Syntax

```typescript
// Basic substitution
"Hello {{name}}"  // Variables use double curly braces

// Fragments (reusable snippets)
"{{greeting}} {{name}}"  // Can reference fragments defined in the pack
```

### Using the Engine Directly

```typescript
import { PromptPackTemplateEngine } from '@promptpack/langchain';

const engine = new PromptPackTemplateEngine({
  version: 'v1',
  syntax: '{{variable}}',
});

// Render with variables
const result = engine.render(
  'Hello {{name}}, welcome to {{company}}!',
  {
    variables: { 
      name: 'Alice', 
      company: 'TechCorp' 
    },
  }
);
// Output: "Hello Alice, welcome to TechCorp!"

// Use fragments
const result = engine.render(
  '{{greeting}}\nTask: {{task}}',
  {
    variables: { task: 'Help the customer' },
    fragments: { greeting: 'You are a helpful assistant.' },
  }
);
```

### Variable Validation

The engine validates variables based on their definitions:

```typescript
// These throw ValidationError if validation fails
engine.validateVariables(variableDefinitions, values);

// Apply defaults for missing optional variables
const valuesWithDefaults = engine.applyDefaults(variableDefinitions, values);
```

## Variables

Variables are defined in the prompt with type information and validation:

### Variable Definition

```json
{
  "variables": [
    {
      "name": "email",
      "type": "string",
      "required": true,
      "description": "User's email address",
      "example": "user@example.com",
      "validation": {
        "pattern": "^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$"
      }
    },
    {
      "name": "age",
      "type": "number",
      "required": false,
      "default": 30,
      "validation": {
        "minimum": 0,
        "maximum": 150
      }
    },
    {
      "name": "plan",
      "type": "string",
      "required": true,
      "validation": {
        "enum": ["free", "pro", "enterprise"]
      }
    },
    {
      "name": "active",
      "type": "boolean",
      "required": false,
      "default": true
    }
  ]
}
```

### Variable Types

- **`string`** - Text values
- **`number`** - Numeric values (integer or float)
- **`boolean`** - True/false values
- **`array`** - Lists of values
- **`object`** - Structured data

### Validation Rules

```json
{
  "validation": {
    // String validation
    "pattern": "^[A-Z]+$",           // Regex pattern
    "min_length": 5,                 // Minimum length
    "max_length": 100,               // Maximum length
    "enum": ["opt1", "opt2"],        // Allowed values
    
    // Number validation
    "minimum": 0,                    // Minimum value
    "maximum": 100,                  // Maximum value
    "exclusive_minimum": true,       // > instead of >=
    "exclusive_maximum": true,       // < instead of <=
    
    // Array validation
    "min_items": 1,                  // Minimum array length
    "max_items": 10,                 // Maximum array length
    "unique_items": true             // All items must be unique
  }
}
```

## Fragments

Fragments are reusable text snippets defined at the pack level:

```json
{
  "fragments": {
    "company_info": "TechCorp - We build amazing software",
    "greeting": "Hello! How can I help you today?",
    "signature": "Best regards,\nThe TechCorp Team"
  },
  "prompts": {
    "support": {
      "system_template": "{{company_info}}\n\n{{greeting}}\n\nYou should help with {{issue_type}} issues.\n\n{{signature}}"
    }
  }
}
```

Fragments are substituted before variables, so you can use variables inside fragments:

```json
{
  "fragments": {
    "header": "Company: {{company}}\nUser: {{user_name}}"
  }
}
```

## Parameters

LLM parameters can be specified in the prompt:

```json
{
  "prompts": {
    "creative": {
      "parameters": {
        "temperature": 0.9,
        "max_tokens": 2000,
        "top_p": 0.95,
        "frequency_penalty": 0.5,
        "presence_penalty": 0.5
      }
    }
  }
}
```

Access in code:

```typescript
const params = template.getParameters();

const model = new ChatOpenAI({
  model: 'gpt-4',
  temperature: params?.temperature,
  maxTokens: params?.max_tokens,
  topP: params?.top_p,
});
```

## Next Steps

- **[Tools](./tools.md)** - Add function calling capabilities
- **[Multimodal](./multimodal.md)** - Work with images and media
- **[Advanced Features](./advanced.md)** - Model overrides and more
