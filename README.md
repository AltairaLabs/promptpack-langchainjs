# @promptpack/langchain

[![npm version](https://badge.fury.io/js/@promptpack%2Flangchain.svg)](https://www.npmjs.com/package/@promptpack/langchain)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=AltairaLabs_promptpack-langchainjs&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=AltairaLabs_promptpack-langchainjs)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=AltairaLabs_promptpack-langchainjs&metric=coverage)](https://sonarcloud.io/summary/new_code?id=AltairaLabs_promptpack-langchainjs)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=AltairaLabs_promptpack-langchainjs&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=AltairaLabs_promptpack-langchainjs)

LangChain.js integration for [PromptPack](https://promptpack.org) - organize, version, and manage AI prompts with built-in governance and tools.

## Features

- 🎯 **Prompt Registry** - Load and manage PromptPacks from JSON/YAML
- 🔧 **Tool Integration** - Built-in tool calling with governance policies
- ✅ **Validation** - Response validation and guardrails
- 🔄 **LangChain Native** - Seamless integration with LangChain templates
- 📦 **Type Safe** - Full TypeScript support

## Installation

```bash
npm install @promptpack/langchain
```

**Peer Dependencies:**
```bash
npm install @langchain/core langchain
```

## Quick Start

### 1. Create a PromptPack

Create a JSON file `customer-support.json`:

```json
{
  "$schema": "https://promptpack.org/schema/v1.0/promptpack.schema.json",
  "id": "customer-support",
  "name": "Customer Support Pack",
  "version": "1.0.0",
  "description": "Customer support prompts with multiple task types",
  "template_engine": {
    "version": "v1",
    "syntax": "{{variable}}"
  },
  "prompts": {
    "support": {
      "id": "support",
      "name": "Support Agent",
      "version": "1.0.0",
      "system_template": "You are a {{role}} for {{company}}. Help customers with their {{issue_type}} issues.",
      "variables": [
        {
          "name": "role",
          "type": "string",
          "required": true,
          "description": "The role of the assistant",
          "example": "helpful support agent"
        },
        {
          "name": "company",
          "type": "string",
          "required": true,
          "description": "Company name"
        },
        {
          "name": "issue_type",
          "type": "string",
          "required": false,
          "default": "general",
          "validation": {
            "enum": ["billing", "technical", "general"]
          }
        }
      ],
      "parameters": {
        "temperature": 0.7,
        "max_tokens": 1500
      }
    }
  }
}
```

### 2. Use with LangChain

```typescript
import { PromptPackRegistry, PromptPackTemplate } from '@promptpack/langchain';
import { ChatOpenAI } from '@langchain/openai';

// Load the pack
const pack = PromptPackRegistry.loadFromFile('./customer-support.json');

// Create a template
const template = new PromptPackTemplate({
  pack,
  promptId: 'support',
});

// Use with LangChain
const model = new ChatOpenAI({ modelName: 'gpt-4' });
const chain = template.pipe(model);

// Invoke with variables
const response = await chain.invoke({
  role: 'helpful support agent',
  company: 'TechCorp',
  issue_type: 'billing',
});

console.log(response.content);
```

## Documentation

- **[Getting Started](./docs/getting-started.md)** - Installation, quick start, basic usage
- **[Core Concepts](./docs/core-concepts.md)** - Registry, templates, variables
- **[Tools](./docs/tools.md)** - Function calling with governance
- **[Validators](./docs/validators.md)** - Response validation and guardrails
- **[API Reference](./docs/api-reference.md)** - Complete API documentation
- **[Examples](./docs/examples.md)** - Code examples and tutorials

## Core Concepts

### Registry

Load and manage PromptPacks:

```typescript
import { PromptPackRegistry } from '@promptpack/langchain';

// Load from file
const pack = PromptPackRegistry.loadFromFile('./pack.json');

// Or from directory
const registry = PromptPackRegistry.fromDirectory('./packs');

// Get a specific prompt
const prompt = registry.getPrompt('pack-id', 'prompt-id');
```

See [Core Concepts](./docs/core-concepts.md) for details.

### Templates

Use PromptPackTemplate with LangChain:

```typescript
const template = new PromptPackTemplate({
  pack,
  promptId: 'support',
});

const chain = template.pipe(model);
const response = await chain.invoke({ role: 'agent', company: 'TechCorp' });
```

See [Core Concepts](./docs/core-concepts.md) for variables, validation, and advanced features.

### Tools

Define tools at pack level with governance policies:

```typescript
const tools = template.filterTools(allTools);
const model = new ChatOpenAI({ model: 'gpt-4o-mini' }).bindTools(tools);
const chain = template.pipe(model);
```

See [Tools Documentation](./docs/tools.md) for governance, policies, and examples.

### Validators

Validators work like tools - define them in your PromptPack, provide custom implementations:

```typescript
import { OOTB_VALIDATORS, CustomValidatorFn } from '@promptpack/langchain';

// Custom validator implementations
const customValidators: Record<string, CustomValidatorFn> = {
  sentiment: (response, validator) => {
    // Your validation logic
    return { passed: true, validatorType: 'sentiment' };
  },
  pii_detection: (response, validator) => {
    // Your PII detection logic
    return { passed: true, validatorType: 'pii_detection' };
  },
};

// Create chain - validators come from pack definition
const chain = template
  .pipe(model)
  .pipe(template.createValidationRunnable(customValidators));

// Use with LangChain features
const result = await chain
  .withRetry({ stopAfterAttempt: 3 })
  .invoke(input);
```

**Validator Types:**
- **OOTB** (always available): `banned_words`, `max_length`, `min_length`, `regex_match`
- **Custom** (you provide): `sentiment`, `pii_detection`, `toxicity`, etc.

See [Validators Documentation](./docs/validators.md) for complete guide.

## Examples

The `examples/` directory contains complete working examples:

- `examples/basic-usage.ts` - Basic usage and JSON pack loading
- `examples/conversation.ts` - Multi-turn conversations with memory
- `examples/integration.ts` - LangChain features (streaming, batching, chaining)
- `examples/tools.ts` - Tool calling with governance
- `examples/validation-native.ts` - LangChain-native validation with `.pipe()`, `.withRetry()`, `.withFallbacks()`
- `examples/validation-error-test.ts` - Missing validator error handling

## Advanced Usage

For advanced features like model overrides, fragments, pipelines, and caching, see:

- **[Advanced Documentation](./docs/advanced.md)**
- **[API Reference](./docs/api-reference.md)**

## Contributing

Contributions welcome! See our contributing guidelines.

## License

MIT

## Links

- [PromptPack Specification](https://promptpack.org)
- [LangChain.js](https://js.langchain.com/)
- [GitHub Repository](https://github.com/AltairaLabs/prommptpack-langchainjs)
