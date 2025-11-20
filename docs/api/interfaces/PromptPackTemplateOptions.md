[**@promptpack/langchain**](../README.md)

***

[@promptpack/langchain](../README.md) / PromptPackTemplateOptions

# Interface: PromptPackTemplateOptions

Defined in: template.ts:18

Options for creating a PromptPackTemplate

## Extends

- `Partial`\<`BasePromptTemplateInput`\>

## Properties

### pack

> **pack**: [`PromptPack`](PromptPack.md)

Defined in: template.ts:22

The PromptPack to use

***

### promptId

> **promptId**: `string`

Defined in: template.ts:27

The prompt ID (task type) to use from the pack

***

### modelId?

> `optional` **modelId**: `string`

Defined in: template.ts:32

Optional model identifier for model-specific overrides

***

### renderOptions?

> `optional` **renderOptions**: `Partial`\<[`RenderOptions`](RenderOptions.md)\>

Defined in: template.ts:37

Additional template rendering options
