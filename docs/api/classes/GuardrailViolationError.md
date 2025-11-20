[**@promptpack/langchain**](../README.md)

***

[@promptpack/langchain](../README.md) / GuardrailViolationError

# Class: GuardrailViolationError

Defined in: validators.ts:10

Error thrown when validation fails

## Extends

- `Error`

## Constructors

### Constructor

> **new GuardrailViolationError**(`message`, `validatorType`, `details?`): `GuardrailViolationError`

Defined in: validators.ts:11

#### Parameters

##### message

`string`

##### validatorType

`string`

##### details?

`Record`\<`string`, `unknown`\>

#### Returns

`GuardrailViolationError`

#### Overrides

`Error.constructor`

## Properties

### validatorType

> **validatorType**: `string`

Defined in: validators.ts:13

***

### details?

> `optional` **details**: `Record`\<`string`, `unknown`\>

Defined in: validators.ts:14
