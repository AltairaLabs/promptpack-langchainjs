# Response Validation & Guardrails

PromptPack includes built-in support for response validation using JSON Schema, ensuring LLM outputs meet your requirements.

## Overview

Validators allow you to:
- **Enforce structure** - Require specific JSON formats
- **Validate data types** - Ensure correct types (string, number, boolean, etc.)
- **Apply constraints** - Min/max values, string patterns, required fields
- **Add guardrails** - Prevent unsafe or inappropriate outputs

## Defining Validators

Validators use JSON Schema and are defined at the pack level:

```json
{
  "validators": {
    "contact_info": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "minLength": 1,
          "maxLength": 100
        },
        "email": {
          "type": "string",
          "format": "email"
        },
        "phone": {
          "type": "string",
          "pattern": "^\\+?[1-9]\\d{1,14}$"
        },
        "age": {
          "type": "integer",
          "minimum": 0,
          "maximum": 150
        }
      },
      "required": ["name", "email"],
      "additionalProperties": false
    }
  }
}
```

## Assigning Validators to Prompts

Link validators to prompts via `response_schema`:

```json
{
  "prompts": {
    "extract_contact": {
      "id": "extract_contact",
      "system_template": "Extract contact information from the text.",
      "response_schema": "contact_info"
    }
  }
}
```

## Using with LangChain

### Basic Validation

```typescript
import { PromptPackTemplate } from '@promptpack/langchain';
import { ChatOpenAI } from '@langchain/openai';
import { JsonOutputParser } from '@langchain/core/output_parsers';

// 1. Load pack and template
const pack = PromptPackRegistry.loadFromFile('./pack.json');
const template = new PromptPackTemplate({ 
  pack, 
  promptId: 'extract_contact' 
});

// 2. Get validator
const validator = template.getValidator();

// 3. Create chain with JSON output
const model = new ChatOpenAI({ 
  model: 'gpt-4o-mini',
  temperature: 0 
});

const chain = template
  .pipe(model)
  .pipe(new JsonOutputParser());

// 4. Invoke
const result = await chain.invoke({
  text: 'Contact John Doe at john@example.com or call +1-555-0123'
});

// 5. Validate
if (validator) {
  const validation = validator.validate(result);
  
  if (validation.valid) {
    console.log('Valid:', result);
  } else {
    console.error('Validation errors:', validation.errors);
  }
}
```

### With Structured Output

Use `withStructuredOutput` for automatic validation:

```typescript
import { z } from 'zod';

// Convert JSON Schema to Zod
const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  age: z.number().int().min(0).max(150).optional()
});

// Use structured output
const modelWithStructure = model.withStructuredOutput(contactSchema);

const chain = template.pipe(modelWithStructure);

// Result is automatically validated and typed
const result = await chain.invoke({
  text: 'Contact John Doe at john@example.com'
});

// TypeScript knows the type!
console.log(result.name); // string
console.log(result.email); // string
```

## Validator Examples

### Simple String Validation

```json
{
  "validators": {
    "sentiment": {
      "type": "string",
      "enum": ["positive", "negative", "neutral"]
    }
  }
}
```

### Array Validation

```json
{
  "validators": {
    "tag_list": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 50
      },
      "minItems": 1,
      "maxItems": 10,
      "uniqueItems": true
    }
  }
}
```

### Nested Object Validation

```json
{
  "validators": {
    "user_profile": {
      "type": "object",
      "properties": {
        "user": {
          "type": "object",
          "properties": {
            "id": { "type": "string", "format": "uuid" },
            "name": { "type": "string" },
            "roles": {
              "type": "array",
              "items": {
                "type": "string",
                "enum": ["admin", "user", "guest"]
              }
            }
          },
          "required": ["id", "name"]
        },
        "settings": {
          "type": "object",
          "properties": {
            "theme": { 
              "type": "string", 
              "enum": ["light", "dark"] 
            },
            "notifications": { "type": "boolean" }
          }
        }
      },
      "required": ["user"]
    }
  }
}
```

### Number Constraints

```json
{
  "validators": {
    "product": {
      "type": "object",
      "properties": {
        "price": {
          "type": "number",
          "minimum": 0,
          "exclusiveMaximum": 10000
        },
        "quantity": {
          "type": "integer",
          "minimum": 0,
          "multipleOf": 1
        },
        "discount": {
          "type": "number",
          "minimum": 0,
          "maximum": 1
        }
      },
      "required": ["price", "quantity"]
    }
  }
}
```

### String Patterns

```json
{
  "validators": {
    "identifiers": {
      "type": "object",
      "properties": {
        "username": {
          "type": "string",
          "pattern": "^[a-z0-9_-]{3,16}$"
        },
        "hex_color": {
          "type": "string",
          "pattern": "^#[0-9A-Fa-f]{6}$"
        },
        "iso_date": {
          "type": "string",
          "format": "date"
        },
        "url": {
          "type": "string",
          "format": "uri"
        }
      }
    }
  }
}
```

## Validation Methods

### Direct Validation

```typescript
const validator = template.getValidator();

if (validator) {
  const result = validator.validate(data);
  
  if (result.valid) {
    console.log('Data is valid');
  } else {
    console.log('Validation errors:');
    result.errors?.forEach(error => {
      console.log(`- ${error.instancePath}: ${error.message}`);
    });
  }
}
```

### Validation with Error Handling

```typescript
async function validateResponse(data: unknown) {
  const validator = template.getValidator();
  
  if (!validator) {
    return { valid: true, data };
  }
  
  const validation = validator.validate(data);
  
  if (!validation.valid) {
    throw new Error(
      `Validation failed: ${validation.errors
        ?.map(e => `${e.instancePath} ${e.message}`)
        .join(', ')}`
    );
  }
  
  return { valid: true, data };
}

try {
  const result = await chain.invoke(input);
  const validated = await validateResponse(result);
  console.log('Success:', validated.data);
} catch (error) {
  console.error('Error:', error.message);
}
```

## Guardrails

Use validators to implement content guardrails:

### Content Safety

```json
{
  "validators": {
    "safe_response": {
      "type": "object",
      "properties": {
        "content": { "type": "string" },
        "safe": { "type": "boolean", "const": true },
        "categories": {
          "type": "object",
          "properties": {
            "hate": { "type": "boolean", "const": false },
            "violence": { "type": "boolean", "const": false },
            "sexual": { "type": "boolean", "const": false }
          },
          "required": ["hate", "violence", "sexual"]
        }
      },
      "required": ["content", "safe", "categories"]
    }
  }
}
```

### Data Quality

```json
{
  "validators": {
    "quality_check": {
      "type": "object",
      "properties": {
        "response": { "type": "string", "minLength": 10 },
        "confidence": { 
          "type": "number", 
          "minimum": 0.8,
          "maximum": 1.0
        },
        "sources": {
          "type": "array",
          "items": { "type": "string", "format": "uri" },
          "minItems": 2
        }
      },
      "required": ["response", "confidence", "sources"]
    }
  }
}
```

### Business Rules

```json
{
  "validators": {
    "order": {
      "type": "object",
      "properties": {
        "items": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": { "type": "string" },
              "quantity": { 
                "type": "integer", 
                "minimum": 1,
                "maximum": 100
              },
              "price": { 
                "type": "number", 
                "minimum": 0.01
              }
            },
            "required": ["id", "quantity", "price"]
          },
          "minItems": 1,
          "maxItems": 50
        },
        "total": { 
          "type": "number",
          "minimum": 0.01,
          "maximum": 100000
        }
      },
      "required": ["items", "total"]
    }
  }
}
```

## Complete Example

See `examples/validators.ts`:

```typescript
import { PromptPackTemplate, PromptPackRegistry } from '@promptpack/langchain';
import { ChatOpenAI } from '@langchain/openai';
import { JsonOutputParser } from '@langchain/core/output_parsers';

const pack = PromptPackRegistry.loadFromFile('./examples/packs/validators.json');
const template = new PromptPackTemplate({ 
  pack, 
  promptId: 'extract_entities' 
});

const chain = template
  .pipe(new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0 }))
  .pipe(new JsonOutputParser());

const result = await chain.invoke({
  text: 'Apple Inc. acquired startup for $100M in California'
});

const validator = template.getValidator();
const validation = validator?.validate(result);

if (validation?.valid) {
  console.log('Validated entities:', result);
} else {
  console.error('Validation failed:', validation?.errors);
}
```

## JSON Schema Support

PromptPack supports JSON Schema Draft 7:

- **Types**: string, number, integer, boolean, array, object, null
- **Formats**: email, uri, uuid, date, date-time, ipv4, ipv6, hostname
- **String**: minLength, maxLength, pattern
- **Number**: minimum, maximum, exclusiveMinimum, exclusiveMaximum, multipleOf
- **Array**: minItems, maxItems, uniqueItems, items
- **Object**: properties, required, additionalProperties, minProperties, maxProperties
- **Combining**: enum, const, allOf, anyOf, oneOf, not

## LangChain-Native Validation (Recommended)

Validators work exactly like tools - the PromptPack defines **which** validators are used (governance), and your code provides **how** to validate (implementation).

### Validator Types

**OOTB (Out-of-the-Box)** - Always available, built into the system:
- `banned_words` - Check for prohibited words/phrases
- `max_length` - Enforce maximum response length
- `min_length` - Enforce minimum response length
- `regex_match` - Pattern matching validation

**Custom** - Must be provided by your code:
- `sentiment` - Analyze response sentiment
- `pii_detection` - Detect personally identifiable information
- `toxicity` - Check for toxic/harmful content
- `factuality` - Verify factual accuracy
- Any other specialized validators you need

### Usage Pattern

```typescript
import { 
  PromptPackTemplate, 
  CustomValidatorFn, 
  OOTB_VALIDATORS 
} from '@promptpack/langchain';
import { ChatOpenAI } from '@langchain/openai';

// 1. Define custom validator implementations
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

// 2. Check what's available vs required
const available = [...OOTB_VALIDATORS, ...Object.keys(customValidators)];
// ['banned_words', 'max_length', 'min_length', 'regex_match', 'sentiment', 'pii_detection']

const required = template.getValidators().map(v => v.type);
// ['banned_words', 'pii_detection', 'sentiment']

// 3. Create chain - validators automatically pulled from pack
const chain = template
  .pipe(model)
  .pipe(template.createValidationRunnable(customValidators));

// 4. Use LangChain's built-in capabilities
const chainWithRetry = chain.withRetry({ stopAfterAttempt: 3 });
const result = await chainWithRetry.invoke(input);
console.log('Passed:', result.validation.passed);
```

### Error Handling

If a PromptPack requires a custom validator that you don't provide:

```typescript
// Pack requires: banned_words, pii_detection, sentiment
// You only provide: sentiment

const incompleteValidators = {
  sentiment: (response) => ({ passed: true, validatorType: 'sentiment' }),
  // Missing pii_detection!
};

// This throws an error immediately:
// Error: Missing validator implementations: pii_detection.
// These validators are required by the PromptPack but no implementation was provided.
template
  .pipe(model)
  .pipe(template.createValidationRunnable(incompleteValidators));
```

### Pattern Similarity with Tools

Validators follow the same pattern as tools for consistency:

```typescript
// Tools: filterTools() reconciles pack tools with implementations
const allowedTools = template.filterTools(allTools);
const chain = template.pipe(model.bindTools(allowedTools));

// Validators: createValidationRunnable() reconciles pack validators with implementations
const chain = template
  .pipe(model)
  .pipe(template.createValidationRunnable(customValidators));
```

### Benefits

- ✅ **Governance**: PromptPack controls which validators are active
- ✅ **Flexibility**: Easy to add/remove validators per prompt
- ✅ **Safety**: Error thrown if required validator is missing
- ✅ **LangChain-native**: Works with `.pipe()`, `.withRetry()`, `.withFallbacks()`
- ✅ **Consistent pattern**: Same approach as tools

### Strict Mode and Fallbacks

```typescript
// Strict validation (throws on failure)
const strictChain = template
  .pipe(model)
  .pipe(template.createValidationRunnable(customValidators, { strict: true }));

// Combine with fallbacks for graceful degradation
const relaxedTemplate = new PromptPackTemplate({ pack, promptId: 'relaxed' });
const fallbackChain = relaxedTemplate
  .pipe(model)
  .pipe(relaxedTemplate.createValidationRunnable(customValidators));

const chainWithFallback = strictChain.withFallbacks({ 
  fallbacks: [fallbackChain] 
});

// Tries strict validation first, falls back to relaxed if it fails
const result = await chainWithFallback.invoke(input);
```

### Complete Examples

See `examples/validation-native.ts` for complete examples showing:
- Basic validation with `.pipe()`
- Automatic retry with `.withRetry()`
- Fallback chains with `.withFallbacks()`
- Different validation levels (strict vs relaxed)
- Available vs required validator display

See `examples/validation-error-test.ts` for focused error handling demonstration.

## Custom Validators

PromptPack supports custom validator types for specialized validation needs.

### Built-in Validator Types

- `banned_words` - Check for prohibited words
- `max_length` / `min_length` - Length constraints
- `regex_match` - Pattern matching
- `json_schema` - JSON Schema validation

### Custom Validator Types

For specialized validation (sentiment, PII, toxicity, etc.), implement custom validators:

```typescript
import { Validator, ValidationResult } from '@promptpack/langchain';

// Custom validator function signature
type ValidatorFunction = (
  response: string,
  validator: Validator
) => ValidationResult;

// Example: Custom sentiment validator
function validateSentiment(response: string, validator: Validator): ValidationResult {
  const expectedSentiment = validator.params?.expected_sentiment as string;
  
  // Your sentiment analysis logic
  const sentiment = analyzeSentiment(response);
  
  if (expectedSentiment && sentiment !== expectedSentiment) {
    return {
      passed: false,
      validatorType: 'sentiment',
      message: `Sentiment '${sentiment}' does not match expected '${expectedSentiment}'`,
      details: { detected: sentiment, expected: expectedSentiment },
    };
  }
  
  return {
    passed: true,
    validatorType: 'sentiment',
    details: { sentiment },
  };
}

// Register custom validators
const customValidators: Record<string, ValidatorFunction> = {
  sentiment: validateSentiment,
  pii_detection: validatePII,
  toxicity: validateToxicity,
};

// Enhanced validation with custom validators
function validateWithCustom(response: string, validators: Validator[]): ValidationResult[] {
  const results: ValidationResult[] = [];
  
  for (const validator of validators) {
    if (!validator.enabled) continue;
    
    // Check for custom validator
    const customValidator = customValidators[validator.type];
    
    const result = customValidator
      ? customValidator(response, validator)
      : validateResponse(response, [validator])[0];
    
    results.push(result);
    
    if (!result.passed && validator.fail_on_violation) {
      throw new GuardrailViolationError(
        result.message || 'Validation failed',
        validator.type,
        result.details
      );
    }
  }
  
  return results;
}
```

### Integrating with LangChain Pipeline

Use the fluent validation API for a clean, chainable interface:

```typescript
// Create a validated chain
const validatedChain = createValidatedChain(chain, validators);

// Basic usage: invoke and validate
const result = await validatedChain
  .invoke({ messages: [{ role: 'user', content: 'Hello' }] })
  .then(r => r.validate());

if (result.passed()) {
  console.log('Response:', result.getContent());
} else {
  console.log('Validation failed:', result.failed());
}

// Print validation summary
result.printValidation({ verbose: true });

// With automatic retry on validation failure
const result = await validatedChain.invokeWithRetry(
  { messages: [{ role: 'user', content: 'Hello' }] },
  3, // max retries
  { verbose: true, feedbackKey: 'feedback' }
);

console.log(`Passed after ${result.getAttempts()} attempts`);
console.log('Response:', result.getContent());
```

**ValidatedChain API:**
- `.invoke(input)` - Invoke the chain
- `.validate()` - Validate the response
- `.invokeAndValidate(input)` - Invoke and validate in one call
- `.invokeWithRetry(input, maxRetries, options)` - Automatic retry with feedback
- `.passed()` - Check if all validators passed
- `.failed()` - Get failed validators
- `.getContent()` - Get response content as string
- `.getResponse<T>()` - Get raw response
- `.getValidationResults()` - Get all validation results
- `.getAttempts()` - Get number of attempts (for retry)
- `.printValidation(options)` - Print validation summary

### Complete Example

See `examples/langchain-guardrails.ts` for a complete working example with:
- Custom sentiment analysis validator
- Custom PII detection validator
- Custom toxicity detection validator
- LangChain pipeline integration
- Validation with automatic retry

## Best Practices

1. **Start simple** - Basic schema first, add constraints gradually
2. **Test with real data** - Use actual LLM outputs to refine schema
3. **Provide examples** - Include examples in prompt for better adherence
4. **Handle failures** - Have retry logic for validation errors
5. **Use structured output** - Combine with LangChain's structured output for best results
6. **Document schema** - Use `description` fields for clarity
7. **Version validators** - Track schema changes over time
8. **Custom validators** - Implement specialized validation for your use case
9. **Fail gracefully** - Use `fail_on_violation` strategically
10. **Add feedback loops** - Use validation results to improve subsequent attempts

## Troubleshooting

### Model doesn't follow schema
- Add schema explicitly in system prompt
- Use temperature=0 for more consistent outputs
- Try `response_format: { type: "json_object" }` in model config
- Use examples in prompt showing desired format

### Validation too strict
- Relax constraints (minLength, minimum, etc.)
- Make fields optional instead of required
- Allow additional properties
- Use broader patterns

### Performance issues
- Simplify schema - complex validation takes time
- Cache validators - don't recreate on each request
- Validate async if possible
- Consider validating only critical fields

## Next Steps

- **[Advanced](./advanced.md)** - Model overrides and composition
- **[API Reference](./api-reference.md)** - Complete API documentation
- **[Examples](./examples.md)** - See complete code examples
