# Tools & Function Calling

PromptPack provides comprehensive support for tool/function calling with built-in governance and policy enforcement.

## Overview

Tools are defined at the pack level and can be selectively enabled for specific prompts with configurable policies to control their usage.

## Defining Tools

Tools are defined in the `tools` section of your PromptPack:

```json
{
  "tools": {
    "get_weather": {
      "name": "get_weather",
      "description": "Get the current weather in a given location",
      "parameters": {
        "type": "object",
        "properties": {
          "location": {
            "type": "string",
            "description": "The city and state, e.g. San Francisco, CA"
          },
          "unit": {
            "type": "string",
            "enum": ["celsius", "fahrenheit"],
            "description": "Temperature unit"
          }
        },
        "required": ["location"]
      }
    },
    "search_database": {
      "name": "search_database",
      "description": "Search the product database",
      "parameters": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "description": "Search query"
          }
        },
        "required": ["query"]
      }
    }
  }
}
```

## Enabling Tools for Prompts

Each prompt specifies which tools it can access:

```json
{
  "prompts": {
    "weather_agent": {
      "id": "weather_agent",
      "system_template": "You are a weather assistant.",
      "tools": ["get_weather"],
      "tool_policy": {
        "tool_choice": "auto",
        "max_rounds": 5,
        "max_tool_calls_per_turn": 3
      }
    },
    "full_agent": {
      "id": "full_agent",
      "system_template": "You are a general assistant.",
      "tools": ["get_weather", "search_database"],
      "tool_policy": {
        "tool_choice": "auto",
        "max_rounds": 10
      }
    }
  }
}
```

## Tool Policy

The `tool_policy` object controls how tools are used:

### Policy Options

```json
{
  "tool_policy": {
    "tool_choice": "auto",              // "auto", "required", "none", or specific tool name
    "max_rounds": 5,                    // Max LLM → tool → LLM cycles (default: 5)
    "max_tool_calls_per_turn": 10,     // Max tool calls in single turn (default: 10)
    "blocklist": ["dangerous_tool"]     // Tools to explicitly block
  }
}
```

### Tool Choice Values

- **`"auto"`** - Model decides whether to use tools
- **`"required"`** - Model must use at least one tool
- **`"none"`** - Model cannot use any tools
- **Specific tool name** - Model must use that specific tool

## Using Tools with LangChain

### Basic Usage

```typescript
import { PromptPackTemplate } from '@promptpack/langchain';
import { ChatOpenAI } from '@langchain/openai';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

// 1. Load pack and create template
const pack = PromptPackRegistry.loadFromFile('./pack.json');
const template = new PromptPackTemplate({ pack, promptId: 'weather_agent' });

// 2. Create LangChain tools
const tools = [
  new DynamicStructuredTool({
    name: 'get_weather',
    description: 'Get the current weather',
    schema: z.object({
      location: z.string().describe('City and state'),
      unit: z.enum(['celsius', 'fahrenheit']).optional(),
    }),
    func: async ({ location, unit }) => {
      // Your implementation
      return `Weather in ${location}: 72°${unit === 'celsius' ? 'C' : 'F'}`;
    },
  }),
];

// 3. Filter tools based on prompt's allowed list
const allowedTools = template.filterTools(tools);

// 4. Bind tools to model
const model = new ChatOpenAI({ model: 'gpt-4o-mini' }).bindTools(allowedTools);

// 5. Create chain
const chain = template.pipe(model);

// 6. Invoke
const response = await chain.invoke({
  // your variables
});

// 7. Handle tool calls (if any)
if (response.tool_calls && response.tool_calls.length > 0) {
  for (const toolCall of response.tool_calls) {
    const tool = allowedTools.find(t => t.name === toolCall.name);
    if (tool) {
      const result = await tool.invoke(toolCall.args);
      console.log(`Tool ${toolCall.name} result:`, result);
    }
  }
}
```

### Tool Filtering

The `filterTools` method ensures only approved tools are used:

```typescript
const allTools = [tool1, tool2, tool3, tool4];

// Only returns tools listed in prompt's "tools" array
const allowedTools = template.filterTools(allTools);

// With warnings disabled
const allowedTools = template.filterTools(allTools, { warn: false });
```

**Warnings logged:**
- Tools in prompt but not provided
- Tools provided but not allowed by prompt

### Tool Execution Manager

Use `ToolExecutionManager` to enforce policy limits:

```typescript
import { ToolExecutionManager } from '@promptpack/langchain';

const policy = template.getToolPolicy();
const manager = new ToolExecutionManager(policy);

// Track execution
for (let round = 0; round < 10; round++) {
  if (!manager.canExecuteRound()) {
    console.log('Max rounds reached');
    break;
  }
  
  manager.startRound();
  
  // Execute tool calls in this round
  for (const toolCall of toolCalls) {
    if (!manager.canExecuteCall()) {
      console.log('Max calls per turn reached');
      break;
    }
    
    manager.recordCall();
    await executeTool(toolCall);
  }
}

// Get statistics
const status = manager.getStatus();
console.log(`Rounds: ${status.roundCount}/${status.maxRounds}`);
console.log(`Calls this turn: ${status.callCount}/${status.maxCalls}`);

// Reset for new conversation
manager.reset();
```

## Agent Pattern (Automatic Execution)

For automatic tool execution, use LangGraph agents:

```typescript
import { createReactAgent } from '@langchain/langgraph/prebuilt';

// 1. Setup
const template = new PromptPackTemplate({ pack, promptId: 'agent' });
const tools = template.filterTools(allTools);
const systemPrompt = await template.format({ /* variables */ });

// 2. Create agent
const agent = createReactAgent({
  llm: new ChatOpenAI({ model: 'gpt-4o-mini' }),
  tools,
  prompt: systemPrompt,
});

// 3. Invoke - tools execute automatically
const result = await agent.invoke({
  messages: [{ role: 'user', content: 'What is the weather in SF?' }]
});

// Agent automatically:
// - Decides which tools to call
// - Executes the tools
// - Feeds results back to model
// - Repeats until task complete
```

## Tool Governance Examples

### Read-Only Access

```json
{
  "prompts": {
    "viewer": {
      "tools": ["lookup_data", "search"],
      "tool_policy": {
        "tool_choice": "auto",
        "blocklist": ["delete", "update", "create"]
      }
    }
  }
}
```

### Limited Rounds

```json
{
  "prompts": {
    "quick_lookup": {
      "tools": ["search"],
      "tool_policy": {
        "tool_choice": "auto",
        "max_rounds": 2,
        "max_tool_calls_per_turn": 1
      }
    }
  }
}
```

### Required Tool Usage

```json
{
  "prompts": {
    "analyst": {
      "tools": ["query_database", "generate_chart"],
      "tool_policy": {
        "tool_choice": "required"
      }
    }
  }
}
```

## Complete Example

See `examples/tools.ts` and `examples/packs/sales-assistant.json` for a complete working example with:

- Multiple tools (lookup, create, check status, calculate)
- Tool governance with policies
- Both manual and automatic execution patterns
- Mock database integration

## Best Practices

1. **Define tools at pack level** - Reuse across multiple prompts
2. **Use specific tool lists** - Only enable what each prompt needs
3. **Set reasonable limits** - Prevent infinite loops with max_rounds
4. **Use blocklists** - Explicitly prevent dangerous operations
5. **Implement proper error handling** - Tools can fail or return errors
6. **Log tool usage** - Track what tools are called and when
7. **Test with real tools** - Don't just mock - test actual implementations

## Next Steps

- **[Multimodal](./multimodal.md)** - Add image and media support
- **[Validators](./validators.md)** - Add response validation
- **[Examples](./examples.md)** - See complete code examples
