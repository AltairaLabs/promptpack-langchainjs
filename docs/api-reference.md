# API Reference

Complete API documentation for @promptpack/langchain.

## Classes

### PromptPackRegistry

Manages collections of PromptPacks.

#### Constructor

```typescript
new PromptPackRegistry()
```

#### Methods

##### `register(pack: PromptPack): void`

Register a PromptPack in the registry.

```typescript
const registry = new PromptPackRegistry();
registry.register(pack);
```

##### `getPack(packId: string): PromptPack | undefined`

Get a PromptPack by ID.

```typescript
const pack = registry.getPack('customer-support');
```

##### `getPrompt(packId: string, promptId: string): Prompt | undefined`

Get a specific prompt from a pack.

```typescript
const prompt = registry.getPrompt('customer-support', 'support');
```

##### `listPacks(): string[]`

Get list of all registered pack IDs.

```typescript
const packIds = registry.listPacks();
```

##### `static loadFromFile(path: string): PromptPack`

Load a PromptPack from a JSON/YAML file.

```typescript
const pack = PromptPackRegistry.loadFromFile('./pack.json');
```

##### `static loadFromDirectory(path: string): PromptPack[]`

Load all PromptPacks from a directory.

```typescript
const packs = PromptPackRegistry.loadFromDirectory('./packs');
```

##### `static fromDirectory(path: string): PromptPackRegistry`

Create a registry and load all packs from a directory.

```typescript
const registry = PromptPackRegistry.fromDirectory('./packs');
```

---

### PromptPackTemplate

LangChain-compatible template for PromptPack prompts.

#### Constructor

```typescript
new PromptPackTemplate(options: {
  pack: PromptPack;
  promptId: string;
  modelId?: string;
})
```

**Parameters:**
- `pack` - The PromptPack containing the prompt
- `promptId` - ID of the prompt to use
- `modelId` - Optional model ID for model-specific overrides

```typescript
const template = new PromptPackTemplate({
  pack,
  promptId: 'support',
  modelId: 'gpt-4o'
});
```

#### Static Methods

##### `fromRegistry(registry: PromptPackRegistry, packId: string, promptId: string, modelId?: string): PromptPackTemplate`

Create a template from a registry.

```typescript
const template = PromptPackTemplate.fromRegistry(
  registry,
  'customer-support',
  'support'
);
```

#### Methods

##### `format(values: InputValues): Promise<BaseMessage[]>`

Format the prompt with variables, returns array of messages.

```typescript
const messages = await template.format({
  role: 'support agent',
  company: 'TechCorp'
});
```

##### `formatPromptValue(values: InputValues): Promise<PromptValue>`

Format the prompt, returns a PromptValue (LangChain native).

```typescript
const promptValue = await template.formatPromptValue(values);
```

##### `pipe(model: Runnable): RunnableSequence`

Create a chain by piping to a model or runnable.

```typescript
const chain = template.pipe(model);
```

##### `getSystemTemplate(): string`

Get the system template with model-specific overrides applied.

```typescript
const systemPrompt = template.getSystemTemplate();
```

##### `getUserTemplate(): string | undefined`

Get the user template if defined.

```typescript
const userPrompt = template.getUserTemplate();
```

##### `getVariables(): Variable[]`

Get variable definitions.

```typescript
const variables = template.getVariables();
```

##### `getModelConfig(): Record<string, any> | undefined`

Get model configuration (temperature, max_tokens, etc.).

```typescript
const config = template.getModelConfig();
const model = new ChatOpenAI(config);
```

##### `getTools(): string[]`

Get list of allowed tool names.

```typescript
const toolNames = template.getTools();
```

##### `getToolPolicy(): ToolPolicy | undefined`

Get tool policy configuration.

```typescript
const policy = template.getToolPolicy();
```

##### `filterTools(tools: StructuredToolInterface[]): StructuredToolInterface[]`

Filter tools based on prompt's allowed list.

```typescript
const allowedTools = template.filterTools(allTools);
```

**Parameters:**
- `tools` - Array of LangChain tools
- Options:
  - `warn: boolean` - Log warnings for mismatched tools (default: true)

##### `getValidator(): Validator | undefined`

Get the validator for response validation.

```typescript
const validator = template.getValidator();
if (validator) {
  const result = validator.validate(response);
}
```

##### `isMultimodal(): boolean`

Check if prompt supports multimodal content.

```typescript
if (template.isMultimodal()) {
  // Can use images, audio, etc.
}
```

---

### PromptPackTemplateEngine

Template rendering engine for variable substitution.

#### Constructor

```typescript
new PromptPackTemplateEngine(config: {
  version: string;
  syntax: string;
})
```

```typescript
const engine = new PromptPackTemplateEngine({
  version: 'v1',
  syntax: '{{variable}}'
});
```

#### Methods

##### `render(template: string, options: RenderOptions): string`

Render a template with variables and fragments.

```typescript
const result = engine.render(
  'Hello {{name}}, welcome to {{company}}!',
  {
    variables: { name: 'Alice', company: 'TechCorp' },
    fragments: {}
  }
);
```

**Options:**
- `variables: Record<string, any>` - Variable values
- `fragments: Record<string, string>` - Fragment content

##### `validateVariables(definitions: Variable[], values: Record<string, unknown>): void`

Validate variable values against definitions.

```typescript
engine.validateVariables(variableDefinitions, inputValues);
```

Throws `VariableValidationError` if validation fails.

##### `applyDefaults(definitions: Variable[], values: Record<string, unknown>): Record<string, unknown>`

Apply default values for missing variables.

```typescript
const withDefaults = engine.applyDefaults(definitions, values);
```

##### `extractVariables(template: string): string[]`

Extract variable names from a template.

```typescript
const vars = engine.extractVariables('Hello {{name}}, {{greeting}}');
// Returns: ['name', 'greeting']
```

---

### ToolExecutionManager

Manages tool execution with policy enforcement.

#### Constructor

```typescript
new ToolExecutionManager(policy?: ToolPolicy)
```

```typescript
const manager = new ToolExecutionManager({
  tool_choice: 'auto',
  max_rounds: 5,
  max_tool_calls_per_turn: 10
});
```

#### Methods

##### `canExecuteRound(): boolean`

Check if another round can be executed.

```typescript
if (manager.canExecuteRound()) {
  manager.startRound();
}
```

##### `startRound(): void`

Start a new round (increments round count, resets call count).

```typescript
manager.startRound();
```

##### `canExecuteCall(): boolean`

Check if another tool call can be executed in current round.

```typescript
if (manager.canExecuteCall()) {
  manager.recordCall();
  await executeTool();
}
```

##### `recordCall(): void`

Record a tool call execution.

```typescript
manager.recordCall();
```

##### `getStatus(): ExecutionStatus`

Get current execution status.

```typescript
const status = manager.getStatus();
console.log(`Round ${status.roundCount}/${status.maxRounds}`);
console.log(`Calls ${status.callCount}/${status.maxCalls}`);
```

##### `reset(): void`

Reset counters for new conversation.

```typescript
manager.reset();
```

---

### Validator

JSON Schema validator for response validation.

#### Constructor

Created internally from PromptPack schema.

#### Methods

##### `validate(data: unknown): ValidationResult`

Validate data against schema.

```typescript
const result = validator.validate(responseData);

if (result.valid) {
  console.log('Valid data');
} else {
  console.error('Errors:', result.errors);
}
```

**Returns:**
```typescript
interface ValidationResult {
  valid: boolean;
  errors?: Array<{
    instancePath: string;
    message: string;
    keyword: string;
    params: any;
  }>;
}
```

## Type Definitions

### PromptPack

```typescript
interface PromptPack {
  id: string;
  name: string;
  version: string;
  description?: string;
  template_engine: {
    version: string;
    syntax: string;
  };
  prompts: Record<string, Prompt>;
  tools?: Record<string, Tool>;
  validators?: Record<string, JSONSchema>;
  fragments?: Record<string, string>;
}
```

### Prompt

```typescript
interface Prompt {
  id: string;
  name?: string;
  version?: string;
  system_template: string;
  user_template?: string;
  variables?: Variable[];
  model_config?: ModelConfig;
  tools?: string[];
  tool_policy?: ToolPolicy;
  response_schema?: string;
}
```

### Variable

```typescript
interface Variable {
  name: string;
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
  description?: string;
  required?: boolean;
  default?: any;
  example?: any;
  validation?: {
    pattern?: string;
    enum?: any[];
    minimum?: number;
    maximum?: number;
    minLength?: number;
    maxLength?: number;
    minItems?: number;
    maxItems?: number;
  };
}
```

### ModelConfig

```typescript
interface ModelConfig {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string[];
  [key: string]: any;
}
```

### Tool

```typescript
interface Tool {
  name: string;
  description: string;
  parameters: JSONSchema;
}
```

### ToolPolicy

```typescript
interface ToolPolicy {
  tool_choice?: 'auto' | 'required' | 'none' | string;
  max_rounds?: number;
  max_tool_calls_per_turn?: number;
  blocklist?: string[];
}
```

### JSONSchema

```typescript
interface JSONSchema {
  type: string;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema;
  enum?: any[];
  pattern?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  [key: string]: any;
}
```

## Errors

### VariableValidationError

Thrown when variable validation fails.

```typescript
try {
  await template.format(values);
} catch (error) {
  if (error instanceof VariableValidationError) {
    console.error('Variable validation failed:', error.message);
    console.error('Variable:', error.variableName);
    console.error('Value:', error.value);
  }
}
```

### PromptNotFoundError

Thrown when a prompt is not found in registry.

```typescript
try {
  const prompt = registry.getPrompt('pack-id', 'invalid-id');
} catch (error) {
  if (error instanceof PromptNotFoundError) {
    console.error('Prompt not found');
  }
}
```

### ToolPolicyViolationError

Thrown when tool policy limits are exceeded.

```typescript
try {
  manager.startRound();
} catch (error) {
  if (error instanceof ToolPolicyViolationError) {
    console.error('Policy violation:', error.message);
  }
}
```

## Utility Functions

### `createMultimodalContent(parts: ContentPart[]): MessageContent`

Create multimodal message content.

```typescript
const content = createMultimodalContent([
  { type: 'text', text: 'What is in this image?' },
  { type: 'image_url', image_url: { url: imageUrl } }
]);
```

### `convertToolToLangChain(tool: Tool): DynamicStructuredTool`

Convert PromptPack tool to LangChain tool (requires implementation function).

```typescript
const langchainTool = convertToolToLangChain(packTool, async (input) => {
  // Your implementation
  return result;
});
```

## Next Steps

- **[Getting Started](./getting-started.md)** - Installation and quick start
- **[Core Concepts](./core-concepts.md)** - Learn the fundamentals
- **[Examples](./examples.md)** - See complete code examples
