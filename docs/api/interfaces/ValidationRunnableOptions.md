[**@promptpack/langchain**](../README.md)

***

[@promptpack/langchain](../README.md) / ValidationRunnableOptions

# Interface: ValidationRunnableOptions

Defined in: validation-runnable.ts:26

Options for validation runnable

## Properties

### validators

> **validators**: [`Validator`](Validator.md)[]

Defined in: validation-runnable.ts:30

Validators to apply

***

### customValidators?

> `optional` **customValidators**: `Record`\<`string`, [`CustomValidatorFn`](../type-aliases/CustomValidatorFn.md)\>

Defined in: validation-runnable.ts:35

Custom validator implementations (e.g., sentiment, PII, toxicity)

***

### throwOnFailure?

> `optional` **throwOnFailure**: `boolean`

Defined in: validation-runnable.ts:41

Whether to throw on validation failure
If false, returns result with validation metadata

***

### validationKey?

> `optional` **validationKey**: `string`

Defined in: validation-runnable.ts:46

Key to store validation results in output
