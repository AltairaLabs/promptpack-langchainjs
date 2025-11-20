[**@promptpack/langchain**](../README.md)

***

[@promptpack/langchain](../README.md) / createStrictValidationRunnable

# Function: createStrictValidationRunnable()

> **createStrictValidationRunnable**(`validators`, `customValidators?`): [`ValidationRunnable`](../classes/ValidationRunnable.md)

Defined in: validation-runnable.ts:236

Create a strict validation runnable that throws on failure

Use with .withFallbacks() for graceful degradation:

  const strictChain = template
    .pipe(model)
    .pipe(createStrictValidationRunnable(validators));
  
  const withFallback = strictChain.withFallbacks([fallbackChain]);

## Parameters

### validators

[`Validator`](../interfaces/Validator.md)[]

### customValidators?

`Record`\<`string`, [`CustomValidatorFn`](../type-aliases/CustomValidatorFn.md)\>

## Returns

[`ValidationRunnable`](../classes/ValidationRunnable.md)
