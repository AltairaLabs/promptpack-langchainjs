[**@promptpack/langchain**](../README.md)

***

[@promptpack/langchain](../README.md) / PromptPackTemplate

# Class: PromptPackTemplate

Defined in: template.ts:43

LangChain prompt template that uses PromptPack configuration

## Extends

- `BasePromptTemplate`

## Constructors

### Constructor

> **new PromptPackTemplate**(`options`): `PromptPackTemplate`

Defined in: template.ts:52

#### Parameters

##### options

[`PromptPackTemplateOptions`](../interfaces/PromptPackTemplateOptions.md)

#### Returns

`PromptPackTemplate`

#### Overrides

`BasePromptTemplate.constructor`

## Properties

### lc\_namespace

> **lc\_namespace**: `string`[]

Defined in: template.ts:50

#### Overrides

`BasePromptTemplate.lc_namespace`

## Accessors

### template

#### Get Signature

> **get** **template**(): `string`

Defined in: template.ts:95

Get the template string (for compatibility)

##### Returns

`string`

## Methods

### fromRegistry()

> `static` **fromRegistry**(`registry`, `packId`, `promptId`, `options?`): `PromptPackTemplate`

Defined in: template.ts:78

Create a PromptPackTemplate from a registry

#### Parameters

##### registry

[`PromptPackRegistry`](PromptPackRegistry.md)

##### packId

`string`

##### promptId

`string`

##### options?

`Partial`\<[`PromptPackTemplateOptions`](../interfaces/PromptPackTemplateOptions.md)\>

#### Returns

`PromptPackTemplate`

***

### getSystemTemplate()

> **getSystemTemplate**(): `string`

Defined in: template.ts:102

Get the system template with model-specific overrides applied

#### Returns

`string`

***

### getParameters()

> **getParameters**(): [`Parameters`](../interfaces/Parameters.md) \| `undefined`

Defined in: template.ts:129

Get LLM parameters with model-specific overrides

#### Returns

[`Parameters`](../interfaces/Parameters.md) \| `undefined`

***

### format()

> **format**(`values`): `Promise`\<`string`\>

Defined in: template.ts:146

Format the prompt with the given input values

#### Parameters

##### values

`InputValues`

#### Returns

`Promise`\<`string`\>

#### Overrides

`BasePromptTemplate.format`

***

### formatMessages()

> **formatMessages**(`values`): `Promise`\<`BaseMessage`\<`MessageStructure`, `MessageType`\>[]\>

Defined in: template.ts:170

Format the prompt as messages (for chat models)

#### Parameters

##### values

`InputValues`

#### Returns

`Promise`\<`BaseMessage`\<`MessageStructure`, `MessageType`\>[]\>

***

### formatPromptValue()

> **formatPromptValue**(`values`): `Promise`\<`BasePromptValue`\>

Defined in: template.ts:190

Format the prompt as a PromptValue (required by LangChain)

#### Parameters

##### values

`InputValues`

#### Returns

`Promise`\<`BasePromptValue`\>

#### Overrides

`BasePromptTemplate.formatPromptValue`

***

### filterTools()

> **filterTools**\<`T`\>(`tools`, `options`): `T`[]

Defined in: template.ts:210

Filter tools to only those allowed by this prompt's configuration.
Use this to filter a large toolset down to what the PromptPack allows.

#### Type Parameters

##### T

`T` *extends* `object`

#### Parameters

##### tools

`T`[]

Array of tools to filter

##### options

###### warn?

`boolean`

Whether to log warnings (default: true)

#### Returns

`T`[]

Filtered array of tools allowed by this prompt

#### Example

```typescript
const allTools = createAllTools();
const allowedTools = template.filterTools(allTools);
const model = new ChatOpenAI().bind({ tools: allowedTools });
```

***

### pipe()

> **pipe**\<`NewRunOutput`\>(`coerceable`): `Runnable`\<`InputValues`, `Exclude`\<`NewRunOutput`, `Error`\>\>

Defined in: template.ts:252

Override pipe to warn about tool mismatches when chaining with a model

#### Type Parameters

##### NewRunOutput

`NewRunOutput`

#### Parameters

##### coerceable

`any`

#### Returns

`Runnable`\<`InputValues`, `Exclude`\<`NewRunOutput`, `Error`\>\>

#### Overrides

`BasePromptTemplate.pipe`

***

### partial()

> **partial**(`values`): `Promise`\<`PromptPackTemplate`\>

Defined in: template.ts:296

Get partial prompt template (for partial variable substitution)

#### Parameters

##### values

`PartialValues`

#### Returns

`Promise`\<`PromptPackTemplate`\>

#### Overrides

`BasePromptTemplate.partial`

***

### serialize()

> **serialize**(): `object`

Defined in: template.ts:312

Serialize the template

#### Returns

`object`

***

### \_getPromptType()

> **\_getPromptType**(): `string`

Defined in: template.ts:324

Get the template type identifier

#### Returns

`string`

#### Overrides

`BasePromptTemplate._getPromptType`

***

### getTools()

> **getTools**(): `string`[]

Defined in: template.ts:331

Get tools defined for this prompt

#### Returns

`string`[]

***

### getToolPolicy()

> **getToolPolicy**(): [`ToolPolicy`](../interfaces/ToolPolicy.md) \| `undefined`

Defined in: template.ts:338

Get tool policy for this prompt

#### Returns

[`ToolPolicy`](../interfaces/ToolPolicy.md) \| `undefined`

***

### getValidators()

> **getValidators**(): [`Validator`](../interfaces/Validator.md)[]

Defined in: template.ts:345

Get validators (guardrails) for this prompt

#### Returns

[`Validator`](../interfaces/Validator.md)[]

***

### createValidationRunnable()

> **createValidationRunnable**(`customValidators?`, `options?`): [`ValidationRunnable`](ValidationRunnable.md)\<`unknown`, [`ValidatedOutput`](../interfaces/ValidatedOutput.md)\<`unknown`\>\>

Defined in: template.ts:369

Create a validation runnable with this prompt's validators.
Similar to filterTools(), this provides validators from the PromptPack.

#### Parameters

##### customValidators?

`Record`\<`string`, (`response`, `validator`) => [`ValidationResult`](../interfaces/ValidationResult.md)\>

Registry of custom validator implementations

##### options?

###### strict?

`boolean`

Whether to throw on validation failure (default: false)

#### Returns

[`ValidationRunnable`](ValidationRunnable.md)\<`unknown`, [`ValidatedOutput`](../interfaces/ValidatedOutput.md)\<`unknown`\>\>

ValidationRunnable configured with prompt's validators

#### Example

```typescript
const customValidators = {
  sentiment: (response, validator) => ({ passed: true, validatorType: 'sentiment' }),
  pii_detection: (response, validator) => ({ passed: true, validatorType: 'pii_detection' })
};

const chain = template
  .pipe(model)
  .pipe(template.createValidationRunnable(customValidators));
```

***

### getMediaConfig()

> **getMediaConfig**(): [`MediaConfig`](../interfaces/MediaConfig.md) \| `undefined`

Defined in: template.ts:385

Get media configuration for this prompt

#### Returns

[`MediaConfig`](../interfaces/MediaConfig.md) \| `undefined`

***

### isMultimodal()

> **isMultimodal**(): `boolean`

Defined in: template.ts:392

Check if this prompt supports multimodal content

#### Returns

`boolean`

***

### getPromptConfig()

> **getPromptConfig**(): [`Prompt`](../interfaces/Prompt.md)

Defined in: template.ts:399

Get the prompt configuration

#### Returns

[`Prompt`](../interfaces/Prompt.md)

***

### getPack()

> **getPack**(): [`PromptPack`](../interfaces/PromptPack.md)

Defined in: template.ts:406

Get the full pack

#### Returns

[`PromptPack`](../interfaces/PromptPack.md)
