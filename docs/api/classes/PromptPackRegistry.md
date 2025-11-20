[**@promptpack/langchain**](../README.md)

***

[@promptpack/langchain](../README.md) / PromptPackRegistry

# Class: PromptPackRegistry

Defined in: registry.ts:32

Registry for storing and retrieving PromptPacks

## Constructors

### Constructor

> **new PromptPackRegistry**(): `PromptPackRegistry`

#### Returns

`PromptPackRegistry`

## Methods

### loadFromFile()

> `static` **loadFromFile**(`filePath`, `options`): [`PromptPack`](../interfaces/PromptPack.md)

Defined in: registry.ts:136

Load a PromptPack from a JSON file

#### Parameters

##### filePath

`string`

##### options

[`LoadOptions`](../interfaces/LoadOptions.md) = `{}`

#### Returns

[`PromptPack`](../interfaces/PromptPack.md)

***

### loadFromString()

> `static` **loadFromString**(`json`, `options`): [`PromptPack`](../interfaces/PromptPack.md)

Defined in: registry.ts:157

Load a PromptPack from a JSON string

#### Parameters

##### json

`string`

##### options

[`LoadOptions`](../interfaces/LoadOptions.md) = `{}`

#### Returns

[`PromptPack`](../interfaces/PromptPack.md)

***

### loadFromDirectory()

> `static` **loadFromDirectory**(`dirPath`, `options`): [`PromptPack`](../interfaces/PromptPack.md)[]

Defined in: registry.ts:177

Load all PromptPacks from a directory

#### Parameters

##### dirPath

`string`

##### options

[`LoadOptions`](../interfaces/LoadOptions.md) = `{}`

#### Returns

[`PromptPack`](../interfaces/PromptPack.md)[]

***

### fromDirectory()

> `static` **fromDirectory**(`dirPath`, `options`): `PromptPackRegistry`

Defined in: registry.ts:246

Create a registry and load packs from a directory

#### Parameters

##### dirPath

`string`

##### options

[`LoadOptions`](../interfaces/LoadOptions.md) = `{}`

#### Returns

`PromptPackRegistry`

***

### register()

> **register**(`pack`): `void`

Defined in: registry.ts:38

Register a PromptPack in the registry

#### Parameters

##### pack

[`PromptPack`](../interfaces/PromptPack.md)

#### Returns

`void`

***

### registerMany()

> **registerMany**(`packs`): `void`

Defined in: registry.ts:45

Register multiple PromptPacks

#### Parameters

##### packs

[`PromptPack`](../interfaces/PromptPack.md)[]

#### Returns

`void`

***

### getPack()

> **getPack**(`packId`): [`PromptPack`](../interfaces/PromptPack.md)

Defined in: registry.ts:54

Get a PromptPack by ID

#### Parameters

##### packId

`string`

#### Returns

[`PromptPack`](../interfaces/PromptPack.md)

***

### getPrompt()

> **getPrompt**(`packId`, `promptId`): [`Prompt`](../interfaces/Prompt.md)

Defined in: registry.ts:65

Get a specific prompt from a pack

#### Parameters

##### packId

`string`

##### promptId

`string`

#### Returns

[`Prompt`](../interfaces/Prompt.md)

***

### hasPack()

> **hasPack**(`packId`): `boolean`

Defined in: registry.ts:81

Check if a pack exists in the registry

#### Parameters

##### packId

`string`

#### Returns

`boolean`

***

### hasPrompt()

> **hasPrompt**(`packId`, `promptId`): `boolean`

Defined in: registry.ts:88

Check if a prompt exists in a pack

#### Parameters

##### packId

`string`

##### promptId

`string`

#### Returns

`boolean`

***

### listPacks()

> **listPacks**(): `string`[]

Defined in: registry.ts:100

List all pack IDs in the registry

#### Returns

`string`[]

***

### listPrompts()

> **listPrompts**(`packId`): `string`[]

Defined in: registry.ts:107

List all prompt IDs in a pack

#### Parameters

##### packId

`string`

#### Returns

`string`[]

***

### unregister()

> **unregister**(`packId`): `boolean`

Defined in: registry.ts:115

Remove a pack from the registry

#### Parameters

##### packId

`string`

#### Returns

`boolean`

***

### clear()

> **clear**(): `void`

Defined in: registry.ts:122

Clear all packs from the registry

#### Returns

`void`

***

### size()

> **size**(): `number`

Defined in: registry.ts:129

Get the number of packs in the registry

#### Returns

`number`

***

### getPackMetadata()

> **getPackMetadata**(`packId`): `object`

Defined in: registry.ts:256

Get pack metadata

#### Parameters

##### packId

`string`

#### Returns

`object`

##### id

> **id**: `string`

##### name

> **name**: `string`

##### version

> **version**: `string`

##### description?

> `optional` **description**: `string`

##### promptCount

> **promptCount**: `number`
