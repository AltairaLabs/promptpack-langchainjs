[**@promptpack/langchain**](../README.md)

***

[@promptpack/langchain](../README.md) / ValidationRunnable

# Class: ValidationRunnable\<InputType, OutputType\>

Defined in: validation-runnable.ts:79

LangChain Runnable for PromptPack validation

Usage:
  const chain = template
    .pipe(model)
    .pipe(new ValidationRunnable({ validators }));

  // With retry
  const chainWithRetry = chain.withRetry({ stopAfterAttempt: 3 });

## Extends

- `Runnable`\<`InputType`, `OutputType`\>

## Type Parameters

### InputType

`InputType` = `unknown`

### OutputType

`OutputType` = [`ValidatedOutput`](../interfaces/ValidatedOutput.md)

## Constructors

### Constructor

> **new ValidationRunnable**\<`InputType`, `OutputType`\>(`options`): `ValidationRunnable`\<`InputType`, `OutputType`\>

Defined in: validation-runnable.ts:90

#### Parameters

##### options

[`ValidationRunnableOptions`](../interfaces/ValidationRunnableOptions.md)

#### Returns

`ValidationRunnable`\<`InputType`, `OutputType`\>

#### Overrides

`Runnable<InputType, OutputType>.constructor`

## Properties

### lc\_namespace

> **lc\_namespace**: `string`[]

Defined in: validation-runnable.ts:83

A path to the module that contains the class, eg. ["langchain", "llms"]
Usually should be the same as the entrypoint the class is exported from.

#### Overrides

`Runnable.lc_namespace`

## Methods

### invoke()

> **invoke**(`input`): `Promise`\<`OutputType`\>

Defined in: validation-runnable.ts:101

Invoke validation on input

#### Parameters

##### input

`InputType`

#### Returns

`Promise`\<`OutputType`\>

#### Overrides

`Runnable.invoke`
