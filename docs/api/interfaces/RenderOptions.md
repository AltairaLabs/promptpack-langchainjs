[**@promptpack/langchain**](../README.md)

***

[@promptpack/langchain](../README.md) / RenderOptions

# Interface: RenderOptions

Defined in: template-engine.ts:30

Options for template rendering

## Properties

### variables?

> `optional` **variables**: `Record`\<`string`, `unknown`\>

Defined in: template-engine.ts:34

Variable values to substitute

***

### fragments?

> `optional` **fragments**: `Record`\<`string`, `string`\>

Defined in: template-engine.ts:39

Fragment definitions for substitution

***

### validate?

> `optional` **validate**: `boolean`

Defined in: template-engine.ts:44

Whether to validate variables before rendering

***

### allowUndefined?

> `optional` **allowUndefined**: `boolean`

Defined in: template-engine.ts:49

Whether to allow undefined variables (will be left as-is)
