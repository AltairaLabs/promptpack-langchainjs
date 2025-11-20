[**@promptpack/langchain**](../README.md)

***

[@promptpack/langchain](../README.md) / filterToolsForPrompt

# Function: filterToolsForPrompt()

> **filterToolsForPrompt**(`allTools`, `promptTools`, `policy?`): [`LangChainTool`](../interfaces/LangChainTool.md)[]

Defined in: tools.ts:34

Filter tools based on a prompt's allowed tools list

## Parameters

### allTools

`Record`\<`string`, [`Tool`](../interfaces/Tool.md)\>

### promptTools

`string`[] | `undefined`

### policy?

[`ToolPolicy`](../interfaces/ToolPolicy.md)

## Returns

[`LangChainTool`](../interfaces/LangChainTool.md)[]
