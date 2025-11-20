[**@promptpack/langchain**](../README.md)

***

[@promptpack/langchain](../README.md) / PromptPackTemplateEngine

# Class: PromptPackTemplateEngine

Defined in: template-engine.ts:55

Template engine for rendering PromptPack templates

## Constructors

### Constructor

> **new PromptPackTemplateEngine**(`engine`): `PromptPackTemplateEngine`

Defined in: template-engine.ts:58

#### Parameters

##### engine

[`TemplateEngine`](../interfaces/TemplateEngine.md)

#### Returns

`PromptPackTemplateEngine`

## Methods

### render()

> **render**(`template`, `options`): `string`

Defined in: template-engine.ts:65

Render a template with the given variables and fragments

#### Parameters

##### template

`string`

##### options

[`RenderOptions`](../interfaces/RenderOptions.md) = `{}`

#### Returns

`string`

***

### validateVariables()

> **validateVariables**(`variableDefinitions`, `values`): `void`

Defined in: template-engine.ts:80

Validate variables against their definitions

#### Parameters

##### variableDefinitions

[`Variable`](../interfaces/Variable.md)[] | `undefined`

##### values

`Record`\<`string`, `unknown`\>

#### Returns

`void`

***

### applyDefaults()

> **applyDefaults**(`variableDefinitions`, `values`): `Record`\<`string`, `unknown`\>

Defined in: template-engine.ts:116

Get variable values with defaults applied

#### Parameters

##### variableDefinitions

[`Variable`](../interfaces/Variable.md)[] | `undefined`

##### values

`Record`\<`string`, `unknown`\>

#### Returns

`Record`\<`string`, `unknown`\>

***

### extractVariables()

> **extractVariables**(`template`): `string`[]

Defined in: template-engine.ts:138

Extract variable names from a template

#### Parameters

##### template

`string`

#### Returns

`string`[]
