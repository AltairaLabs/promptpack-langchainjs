[**@promptpack/langchain**](../README.md)

***

[@promptpack/langchain](../README.md) / Prompt

# Interface: Prompt

Defined in: types.ts:42

Individual prompt configuration

## Properties

### id

> **id**: `string`

Defined in: types.ts:43

***

### name

> **name**: `string`

Defined in: types.ts:44

***

### description?

> `optional` **description**: `string`

Defined in: types.ts:45

***

### version

> **version**: `string`

Defined in: types.ts:46

***

### system\_template

> **system\_template**: `string`

Defined in: types.ts:47

***

### variables?

> `optional` **variables**: [`Variable`](Variable.md)[]

Defined in: types.ts:48

***

### tools?

> `optional` **tools**: `string`[]

Defined in: types.ts:49

***

### tool\_policy?

> `optional` **tool\_policy**: [`ToolPolicy`](ToolPolicy.md)

Defined in: types.ts:50

***

### pipeline?

> `optional` **pipeline**: [`PipelineConfig`](PipelineConfig.md)

Defined in: types.ts:51

***

### parameters?

> `optional` **parameters**: [`Parameters`](Parameters.md)

Defined in: types.ts:52

***

### validators?

> `optional` **validators**: [`Validator`](Validator.md)[]

Defined in: types.ts:53

***

### tested\_models?

> `optional` **tested\_models**: [`TestedModel`](TestedModel.md)[]

Defined in: types.ts:54

***

### model\_overrides?

> `optional` **model\_overrides**: `Record`\<`string`, [`ModelOverride`](ModelOverride.md)\>

Defined in: types.ts:55

***

### media?

> `optional` **media**: [`MediaConfig`](MediaConfig.md)

Defined in: types.ts:56
