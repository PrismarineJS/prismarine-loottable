# prismarine-loottable

[![NPM version](https://img.shields.io/npm/v/prismarine-loottable.svg)](http://npmjs.com/package/prismarine-loottable)
[![Build Status](https://github.com/PrismarineJS/prismarine-loottable/workflows/CI/badge.svg)](https://github.com/PrismarineJS/prismarine-loottable/actions?query=workflow%3A%22CI%22)
[![Discord](https://img.shields.io/badge/chat-on%20discord-brightgreen.svg)](https://discord.gg/GsEFRM8)
[![Gitter](https://img.shields.io/badge/chat-on%20gitter-brightgreen.svg)](https://gitter.im/PrismarineJS/general)
[![Irc](https://img.shields.io/badge/chat-on%20irc-brightgreen.svg)](https://irc.gitter.im/)
[![Try it on gitpod](https://img.shields.io/badge/try-on%20gitpod-brightgreen.svg)](https://gitpod.io/#https://github.com/PrismarineJS/prismarine-loottable)

A utility package for parsing Minecraft loot table files.

Based on Loot Table format: https://minecraft.gamepedia.com/Loot_table

## Usage

```js
const getPotentialDrops = require("prismarine-loottable").getPotentialDrops;
const lootTable = require('./path/to/table.json')

const drops = getPotentialDrops(lootTable)

const itemType = drops[0].itemType
const silkTouch = drops[0].conditions[0].isSilkTouch()
```

## API

### Global Functions

`getPotentialDrops(lootTable: MinecaftLootTable): LootItemDrop[]`

This function can be used to directly parse a raw Minecraft loot table to pull out all potential drops as well as conditions required for that item to drop and functions that applied to the item (or user) in order. It returns a list of potential item drops.

### Classes

_**LootItemDrop**_

This object is the main object returned from the `getPotentialDrops` function. It contains information about the details involved in getting this item to drop from the table.

* `lootItemDrop.itemType: string`
<br/> Gets the name of the item type which is dropped. This is a namespaced value.

* `lootItemDrop.minCount: number`
<br/> The smallest number of this item type which can be dropped, assuming all conditions are met. This does not take functions into consideration, which may change this value.

* `lootItemDrop.maxCount: number`
<br/> The maximum number of this item type which can be dropped assuming all conditions are met. This does not take functions into consideration, which may change this value.

* `lootItemDrop.functions: LootFunction[]`
<br/> The list of all functions that should be applied to this item drop, in order. Some functions may contain additional conditions required for them to occur.

* `lootItemDrop.conditions: LootCondition[]`
<br/> The list of all conditions which are required for this item drop to occur. This list contain conditions from both the item drop entry as well as the pool the item drop is in. These conditions do not have to be applied in any other but all conditions must be true.

* `lootItemDrop.weight: number`
<br/> The randomness weight of this item drop within the pool, relative to other entries in the pool. Items with a higher weight are more likely to be dropped than items with a lower weight compared to other entries in the same pool.

* `lootItemDrop.quality: number`
<br/> The bonus weight to add for each point of luck being used. The new weight value is calculated via the formula: `floor(weight + (quality * generic.luck))` More information can be found on the Minecraft wiki page.

_**LootFunction**_

Contains information about a function to be applied to an item drop. The properties within this class match the properties of the given type as defined within the Minecraft Loot Table format.

* `lootFunction.type: string`
<br/> The namespaced type of function that is being applied.

_**LootCondition**_

Contains information about a condition required for an item drop to occur. The properties within this class match the properties of the given type as defined within the Minecraft Loot Table format.

* `lootCondition.type: string`
<br/> The namespaced type of condition that is being applied.

* `lootCondition.isSilkTouch(): boolean`
<br/> Checks if the condition is a silk touch check.