[**@promptpack/langchain**](../README.md)

***

[@promptpack/langchain](../README.md) / ValidatedOutput

# Interface: ValidatedOutput\<T\>

Defined in: validation-runnable.ts:52

Validation result with content

## Type Parameters

### T

`T` = `unknown`

## Properties

### content

> **content**: `T`

Defined in: validation-runnable.ts:56

Original content from LLM

***

### validation

> **validation**: `object`

Defined in: validation-runnable.ts:61

Validation results

#### passed

> **passed**: `boolean`

#### results

> **results**: [`ValidationResult`](ValidationResult.md)[]

#### failed

> **failed**: [`ValidationResult`](ValidationResult.md)[]
