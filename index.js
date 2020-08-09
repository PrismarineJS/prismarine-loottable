function parseFunction (func) {
  const lootFunction = new LootFunction(func.function)
  // TODO
  return lootFunction
}

function parseCondition (condition) {
  const lootCondition = new LootCondition(condition.contition)
  // TODO
  return lootCondition
}

function handleItemEntry(drops, entry, pool) {
  const item = new LootItemDrop(entry.name)
  item.weight = entry.weight
  item.quality = entry.quality
  item.minCount = Array.isArray(pool.rolls) ? pool.rolls[0] : pool.rolls
  item.maxCount = Array.isArray(pool.rolls) ? pool.rolls[1] : pool.rolls

  for (const func of entry.functions || []) {
    item.functions.push(parseFunction(func))
  }

  for (const func of pool.functions || []) {
    item.functions.push(parseFunction(func))
  }

  for (const condition of entry.conditions || []) {
    item.conditions.push(parseCondition(condition))
  }

  for (const condition of pool.conditions || []) {
    item.conditions.push(parseCondition(condition))
  }

  drops.push(itemDrop)
}

function handleEntry(drops, entry, pool) {
  switch(entry.type) {
    case 'minecraft:item':
      handleItemEntry(drops, entry, pool)
      break

    case 'minecraft:tag':
      // TODO Implement tags
      // Would rely on MC-Data to retrieve all items from a tag list.
      break

    case 'minecraft:loot_table':
      // TODO Combine with data from another loot table
      // Figure out a clean API for loot tables to reference each other.
      break
    
    case 'minecraft:group':
    case 'minecraft:alternatives':
    case 'minecraft:sequence':
      for (const e of entry.children) {
        handleEntry(drops, e, pool)
      }
      break
    
    case 'minecraft:dynamic':
      // These are special cases, so not much we can do with these.
      break

    case 'minecraft:empty':
      break // Do nothing

    default:
      throw new Error(`Unknown entry type ${entry.type}!`)
  }
}

/**
 * Gets a list of all drops which can be provided from the given loot table
 * as well as the conditions required for the item to be dropped.
 * 
 * @param {*} lootTable - The raw loot table.
 * 
 * @return A list of all potential item drops and the conditions required.
 */
function getPotentialDrops(lootTable, mcVersion) {
  const drops = []

  for (const pool of lootTable.pools || []) {
    for (const entry of pool.entries || []) {
      handleEntry(drops, entry, pool)
    }
  }

  return drops
}

/**
 * Takes the given input type and generates a set of item drops which would come from the table
 * as a result. This applies randomness and conditionals as needed.
 * 
 * @param {*} lootTable - The raw loot table to read from.
 * @param {*} options - The options to use when calculating the loot.
 * 
 * @returns a List of prismarine items.
 */
function generateLoot(lootTable, options = {}) {
  // TODO
  return []
}

class LootItemDrop {
  constructor (itemType) {
    this.itemType = itemType
    this.minCount = 1
    this.maxCount = 1
    this.item = item
    this.functions = []
    this.conditions = []
    this.weight = 1.0
    this.quality = 1.0
  }
}

class LootCondition {
  constructor (name) {
    this.name = name
  }
}

class LootFunction {
  constructor(name) {
    this.name = name
  }
}

module.exports = { LootItemDrop, LootCondition, LootFunction, getPotentialDrops, generateLoot }