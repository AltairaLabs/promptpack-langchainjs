# Advanced Features

Advanced PromptPack capabilities including model overrides, fragments, pipelines, and composition patterns.

## Model Overrides

Configure model parameters at the prompt level:

```json
{
  "prompts": {
    "creative_writer": {
      "id": "creative_writer",
      "system_template": "You are a creative writer.",
      "model_config": {
        "model": "gpt-4o",
        "temperature": 0.9,
        "max_tokens": 2000,
        "top_p": 0.95,
        "frequency_penalty": 0.5,
        "presence_penalty": 0.3
      }
    },
    "fact_checker": {
      "id": "fact_checker",
      "system_template": "You verify facts precisely.",
      "model_config": {
        "model": "gpt-4o-mini",
        "temperature": 0,
        "max_tokens": 500
      }
    }
  }
}
```

### Using Model Config

```typescript
import { PromptPackTemplate } from '@promptpack/langchain';
import { ChatOpenAI } from '@langchain/openai';

const template = new PromptPackTemplate({ pack, promptId: 'creative_writer' });

// Get recommended model config
const modelConfig = template.getModelConfig();

// Apply to model
const model = new ChatOpenAI({
  ...modelConfig,
  apiKey: process.env.OPENAI_API_KEY
});

const chain = template.pipe(model);
const response = await chain.invoke({ topic: 'space exploration' });
```

### Config Merging

Override config at runtime:

```typescript
const baseConfig = template.getModelConfig();

const model = new ChatOpenAI({
  ...baseConfig,
  temperature: 0.5, // Override
  maxTokens: 1000,  // Override
  apiKey: process.env.OPENAI_API_KEY
});
```

## Prompt Fragments

Reusable prompt components that can be composed:

```json
{
  "fragments": {
    "safety_guidelines": {
      "content": "Always follow these safety guidelines:\n- Be respectful\n- Avoid harmful content\n- Verify information"
    },
    "output_format": {
      "content": "Format your response as:\n1. Summary\n2. Details\n3. Conclusion"
    },
    "expertise_level": {
      "content": "Adjust your language for {{audience_level}} understanding."
    }
  },
  "prompts": {
    "assistant": {
      "id": "assistant",
      "system_template": "You are a helpful assistant.\n\n{{fragment:safety_guidelines}}\n\n{{fragment:output_format}}",
      "user_template": "{{user_input}}"
    }
  }
}
```

### Fragment Variables

Fragments can contain variables:

```json
{
  "fragments": {
    "context_loader": {
      "content": "Use this context:\n{{context_data}}"
    }
  },
  "prompts": {
    "qa": {
      "system_template": "Answer questions.\n\n{{fragment:context_loader}}",
      "variables": {
        "context_data": {
          "type": "string",
          "description": "Contextual information"
        }
      }
    }
  }
}
```

```typescript
const response = await chain.invoke({
  context_data: 'Company founded in 2020...',
  user_input: 'When was the company founded?'
});
```

## Multi-Step Pipelines

Chain multiple prompts for complex workflows:

### Sequential Processing

```typescript
import { PromptPackTemplate } from '@promptpack/langchain';
import { ChatOpenAI } from '@langchain/openai';

const pack = PromptPackRegistry.loadFromFile('./pack.json');

// Step 1: Extract entities
const extractorTemplate = new PromptPackTemplate({ 
  pack, 
  promptId: 'entity_extractor' 
});

const extractor = extractorTemplate.pipe(
  new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0 })
);

const entities = await extractor.invoke({
  text: 'Apple acquired Startup Inc. for $100M'
});

// Step 2: Enrich entities
const enricherTemplate = new PromptPackTemplate({ 
  pack, 
  promptId: 'entity_enricher' 
});

const enricher = enricherTemplate.pipe(
  new ChatOpenAI({ model: 'gpt-4o', temperature: 0 })
);

const enriched = await enricher.invoke({
  entities: JSON.stringify(entities)
});

// Step 3: Generate report
const reporterTemplate = new PromptPackTemplate({ 
  pack, 
  promptId: 'report_generator' 
});

const reporter = reporterTemplate.pipe(
  new ChatOpenAI({ model: 'gpt-4o', temperature: 0.7 })
);

const report = await reporter.invoke({
  data: JSON.stringify(enriched)
});
```

### Pipeline with Error Handling

```typescript
async function runPipeline(input: string) {
  try {
    // Step 1
    const step1Result = await step1Chain.invoke({ input });
    console.log('Step 1 complete');
    
    // Step 2
    const step2Result = await step2Chain.invoke({ 
      data: step1Result.content 
    });
    console.log('Step 2 complete');
    
    // Step 3
    const step3Result = await step3Chain.invoke({ 
      data: step2Result.content 
    });
    console.log('Pipeline complete');
    
    return step3Result;
  } catch (error) {
    console.error('Pipeline failed:', error);
    throw error;
  }
}
```

## Prompt Composition

Combine multiple prompts dynamically:

### Dynamic System Prompt

```typescript
function buildSystemPrompt(
  basePrompt: string,
  features: string[]
): string {
  const fragments: string[] = [basePrompt];
  
  if (features.includes('safety')) {
    fragments.push('\n\nSafety: Avoid harmful content.');
  }
  
  if (features.includes('citations')) {
    fragments.push('\n\nAlways cite sources.');
  }
  
  if (features.includes('structured')) {
    fragments.push('\n\nUse JSON format for responses.');
  }
  
  return fragments.join('');
}

const systemPrompt = buildSystemPrompt(
  'You are an assistant.',
  ['safety', 'citations']
);
```

### Prompt Switching

```typescript
function selectPrompt(task: string): string {
  const prompts = {
    summarize: 'summarizer',
    translate: 'translator',
    analyze: 'analyzer',
    generate: 'generator'
  };
  
  return prompts[task] || 'default';
}

const promptId = selectPrompt(userTask);
const template = new PromptPackTemplate({ pack, promptId });
```

## Conditional Logic

### Variable-Based Conditions

```json
{
  "prompts": {
    "adaptive": {
      "system_template": "You are {{role}}.\n\n{% if verbose %}Provide detailed explanations.{% else %}Be concise.{% endif %}",
      "variables": {
        "role": { "type": "string" },
        "verbose": { "type": "boolean", "default": false }
      }
    }
  }
}
```

### Runtime Conditions

```typescript
async function adaptiveInvoke(
  chain: any,
  input: string,
  complexity: 'simple' | 'complex'
) {
  const config = complexity === 'simple'
    ? { temperature: 0, max_tokens: 500 }
    : { temperature: 0.7, max_tokens: 2000 };
  
  const model = new ChatOpenAI(config);
  const adaptiveChain = template.pipe(model);
  
  return await adaptiveChain.invoke({ input });
}
```

## Streaming Responses

Stream responses for better UX:

```typescript
import { ChatOpenAI } from '@langchain/openai';

const template = new PromptPackTemplate({ pack, promptId: 'writer' });
const model = new ChatOpenAI({ 
  model: 'gpt-4o',
  streaming: true 
});

const chain = template.pipe(model);

// Stream
const stream = await chain.stream({ topic: 'AI' });

for await (const chunk of stream) {
  process.stdout.write(chunk.content);
}
```

## Batch Processing

Process multiple inputs efficiently:

```typescript
const inputs = [
  { text: 'First document...' },
  { text: 'Second document...' },
  { text: 'Third document...' }
];

// Parallel processing
const results = await Promise.all(
  inputs.map(input => chain.invoke(input))
);

// Sequential processing (for rate limiting)
const results2 = [];
for (const input of inputs) {
  const result = await chain.invoke(input);
  results2.push(result);
  await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
}
```

## Caching

Cache results for repeated queries:

```typescript
class PromptCache {
  private cache = new Map<string, any>();
  
  async invoke(
    chain: any,
    input: any,
    ttl: number = 3600000 // 1 hour
  ) {
    const key = JSON.stringify(input);
    
    // Check cache
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      console.log('Cache hit');
      return cached.result;
    }
    
    // Invoke chain
    const result = await chain.invoke(input);
    
    // Store in cache
    this.cache.set(key, {
      result,
      timestamp: Date.now()
    });
    
    return result;
  }
  
  clear() {
    this.cache.clear();
  }
}

// Usage
const cache = new PromptCache();
const result = await cache.invoke(chain, { input: 'hello' });
```

## Error Recovery

Handle and retry failures:

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
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
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

## Custom Middleware

Add custom processing:

```typescript
class PromptMiddleware {
  constructor(
    private template: PromptPackTemplate,
    private model: ChatOpenAI
  ) {}
  
  async invoke(input: any) {
    // Pre-processing
    console.log('Input:', input);
    const sanitized = this.sanitizeInput(input);
    
    // Format and invoke
    const messages = await this.template.format(sanitized);
    const response = await this.model.invoke(messages);
    
    // Post-processing
    const processed = this.processResponse(response);
    console.log('Output:', processed);
    
    return processed;
  }
  
  private sanitizeInput(input: any): any {
    // Remove sensitive data, validate, etc.
    return input;
  }
  
  private processResponse(response: any): any {
    // Transform, filter, enhance response
    return response;
  }
}

// Usage
const middleware = new PromptMiddleware(template, model);
const result = await middleware.invoke({ input: 'test' });
```

## Complete Examples

See advanced examples:

- `examples/langchain-pipeline.ts` - Multi-step processing
- `examples/langchain-streaming.ts` - Streaming responses
- `examples/langchain-batch.ts` - Batch processing
- `examples/langchain-caching.ts` - Result caching

## Best Practices

1. **Use model configs** - Define optimal parameters per prompt
2. **Compose fragments** - Reuse common prompt components
3. **Pipeline carefully** - Each step should have clear purpose
4. **Handle errors** - Always implement retry/fallback logic
5. **Cache intelligently** - Cache expensive operations
6. **Monitor performance** - Track latency and token usage
7. **Test configurations** - Validate model configs with real data

## Next Steps

- **[API Reference](./api-reference.md)** - Complete API documentation
- **[Examples](./examples.md)** - See complete code examples
- **[Core Concepts](./core-concepts.md)** - Review fundamentals
