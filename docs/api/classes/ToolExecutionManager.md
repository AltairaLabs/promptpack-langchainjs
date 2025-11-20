[**@promptpack/langchain**](../README.md)

***

[@promptpack/langchain](../README.md) / ToolExecutionManager

# Class: ToolExecutionManager

Defined in: tools.ts:74

Tool execution manager that enforces policy

## Constructors

### Constructor

> **new ToolExecutionManager**(`policy?`): `ToolExecutionManager`

Defined in: tools.ts:79

#### Parameters

##### policy?

[`ToolPolicy`](../interfaces/ToolPolicy.md)

#### Returns

`ToolExecutionManager`

## Methods

### canExecuteRound()

> **canExecuteRound**(): `boolean`

Defined in: tools.ts:90

Check if another tool round is allowed

#### Returns

`boolean`

***

### canExecuteCall()

> **canExecuteCall**(): `boolean`

Defined in: tools.ts:98

Check if more tool calls are allowed in this turn

#### Returns

`boolean`

***

### startRound()

> **startRound**(): `void`

Defined in: tools.ts:106

Record a new round

#### Returns

`void`

***

### recordCall()

> **recordCall**(): `void`

Defined in: tools.ts:113

Record a tool call

#### Returns

`void`

***

### reset()

> **reset**(): `void`

Defined in: tools.ts:120

Reset counters for a new turn

#### Returns

`void`

***

### getStatus()

> **getStatus**(): `object`

Defined in: tools.ts:128

Get current status

#### Returns

`object`

##### roundCount

> **roundCount**: `number`

##### callCount

> **callCount**: `number`

##### maxRounds

> **maxRounds**: `number`

##### maxCalls

> **maxCalls**: `number`
