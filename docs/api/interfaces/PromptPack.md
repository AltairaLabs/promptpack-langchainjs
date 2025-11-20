[**@promptpack/langchain**](../README.md)

***

[@promptpack/langchain](../README.md) / PromptPack

# Interface: PromptPack

Defined in: types.ts:9

Complete PromptPack specification

## Properties

### $schema?

> `optional` **$schema**: `string`

Defined in: types.ts:10

***

### id

> **id**: `string`

Defined in: types.ts:11

***

### name

> **name**: `string`

Defined in: types.ts:12

***

### version

> **version**: `string`

Defined in: types.ts:13

***

### description?

> `optional` **description**: `string`

Defined in: types.ts:14

***

### template\_engine

> **template\_engine**: [`TemplateEngine`](TemplateEngine.md)

Defined in: types.ts:15

***

### prompts

> **prompts**: `Record`\<`string`, [`Prompt`](Prompt.md)\>

Defined in: types.ts:16

***

### fragments?

> `optional` **fragments**: `Record`\<`string`, `string`\>

Defined in: types.ts:17

***

### tools?

> `optional` **tools**: `Record`\<`string`, [`Tool`](Tool.md)\>

Defined in: types.ts:18

***

### metadata?

> `optional` **metadata**: [`PackMetadata`](PackMetadata.md)

Defined in: types.ts:19

***

### compilation?

> `optional` **compilation**: [`CompilationInfo`](CompilationInfo.md)

Defined in: types.ts:20
