[**@promptpack/langchain**](../README.md)

***

[@promptpack/langchain](../README.md) / Validator

# Interface: Validator

Defined in: types.ts:138

Validation rule (guardrail)

## Properties

### type

> **type**: `"banned_words"` \| `"max_length"` \| `"min_length"` \| `"regex_match"` \| `"json_schema"` \| `"sentiment"` \| `"toxicity"` \| `"pii_detection"` \| `"custom"`

Defined in: types.ts:139

***

### enabled

> **enabled**: `boolean`

Defined in: types.ts:149

***

### fail\_on\_violation?

> `optional` **fail\_on\_violation**: `boolean`

Defined in: types.ts:150

***

### params?

> `optional` **params**: `Record`\<`string`, `unknown`\>

Defined in: types.ts:151
