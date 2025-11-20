[**@promptpack/langchain**](../README.md)

***

[@promptpack/langchain](../README.md) / createValidationRunnable

# Function: createValidationRunnable()

> **createValidationRunnable**(`validators`, `customValidators?`): [`ValidationRunnable`](../classes/ValidationRunnable.md)

Defined in: validation-runnable.ts:214

Create a validation runnable with custom validators registry.

This is typically called from PromptPackTemplate.createValidationRunnable()
which automatically gets validators from the pack definition.

## Parameters

### validators

[`Validator`](../interfaces/Validator.md)[]

### customValidators?

`Record`\<`string`, [`CustomValidatorFn`](../type-aliases/CustomValidatorFn.md)\>

## Returns

[`ValidationRunnable`](../classes/ValidationRunnable.md)

## Example

```typescript
// Preferred: Use template.createValidationRunnable()
const chain = template
  .pipe(model)
  .pipe(template.createValidationRunnable(customValidators));

// Alternative: Create directly with validator array
const validators = template.getValidators();
const chain = template
  .pipe(model)
  .pipe(createValidationRunnable(validators, customValidators));
```
