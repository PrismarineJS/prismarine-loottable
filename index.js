function parseFunction (func, onPool) {
  const lootFunction = new LootFunction(func.function, onPool)

  switch (lootFunction.type) {
    case 'minecraft:apply_bonus':
    case 'minecraft:copy_name':
    case 'minecraft:copy_nbt':
    case 'minecraft:copy_state':
    case 'minecraft:enchant_randomly':
    case 'minecraft:enchant_with_levels':
    case 'minecraft:exploration_map':
    case 'minecraft:explosion_decay':
    case 'minecraft:furnace_smelt':
    case 'minecraft:fill_player_head':
    case 'minecraft:limit_count':
    case 'minecraft:looting_enchant':
    case 'minecraft:set_attributes':
    case 'minecraft:set_contents':
    case 'minecraft:set_count':
    case 'minecraft:set_damage':
    case 'minecraft:set_loot_table':
    case 'minecraft:set_lore':
    case 'minecraft:set_name':
    case 'minecraft:set_nbt':
    case 'minecraft:set_stew_effect':
      for (const prop in func) {
        lootFunction[prop] = func[prop]
      }
      break

    default:
      throw new Error(`Unknown condition type ${lootFunction.type}!`)
  }

  return lootFunction
}

function parseCondition (condition, onPool) {
  const lootCondition = new LootCondition(condition.condition, onPool)

  switch (lootCondition.type) {
    case 'minecraft:alternative':
      lootCondition.terms = []
      for (const term of condition.terms) {
        lootCondition.terms.push(parseCondition(term))
      }
      break

    case 'minecraft:inverted':
      lootCondition.term = parseCondition(condition.term)
      break

    case 'minecraft:reference':
      // TODO
      break

    case 'minecraft:block_state_property':
    case 'minecraft:damage_source_properties':
    case 'minecraft:entity_properties':
    case 'minecraft:entity_scores':
    case 'minecraft:killed_by_player':
    case 'minecraft:location_check':
    case 'minecraft:match_tool':
    case 'minecraft:random_chance':
    case 'minecraft:random_chance_with_looting':
    case 'minecraft:survives_explosion':
    case 'minecraft:table_bonus':
    case 'minecraft:time_check':
    case 'minecraft:weather_check':
      for (const prop in condition) {
        lootCondition[prop] = condition[prop]
      }
      break

    default:
      throw new Error(`Unknown condition type ${lootCondition.type}!`)
  }

  return lootCondition
}

function handleItemEntry (drops, entry, pool, poolIndex, entryType) {
  const item = new LootItemDrop(entry.name, entryType)

  if (entry.weight !== undefined) item.weight = entry.weight
  if (entry.quality !== undefined) item.quality = entry.quality

  if (typeof pool.rolls === 'object') {
    item.minCount = pool.rolls.min
    item.maxCount = pool.rolls.max
  } else {
    item.minCount = pool.rolls
    item.maxCount = pool.rolls
  }

  item.poolIndex = poolIndex
  item.entryType = entryType

  // Since other entries exist in this pool, entries may not be selected.
  if (pool.entries.length > 1) { item.minCount = 0 }

  for (const func of entry.functions || []) {
    item.functions.push(parseFunction(func, false))
  }

  for (const func of pool.functions || []) {
    item.functions.push(parseFunction(func, true))
  }

  for (const condition of entry.conditions || []) {
    item.conditions.push(parseCondition(condition, false))
  }

  for (const condition of pool.conditions || []) {
    item.conditions.push(parseCondition(condition, true))
  }

  drops.push(item)
}

function handleEntry (drops, entry, pool, poolIndex, parentEntryType) {
  switch (entry.type) {
    case 'minecraft:item':
      if (parentEntryType === undefined) parentEntryType = entry.type
      handleItemEntry(drops, entry, pool, poolIndex, parentEntryType)
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
        handleEntry(drops, e, pool, poolIndex, entry.type)
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
function getPotentialDrops (lootTable, mcVersion) {
  const drops = []

  let poolIndex = -1
  for (const pool of lootTable.pools || []) {
    const firstIndex = drops.length
    poolIndex++

    for (const entry of pool.entries || []) {
      handleEntry(drops, entry, pool, poolIndex)
    }

    for (let i = firstIndex; i < drops.length; i++) {
      for (let j = firstIndex; j < drops.length; j++) {
        drops[i].siblings.push(drops[j])
      }
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
function generateLoot (lootTable, options = {}) {
  // TODO
  return []
}

class LootItemDrop {
  constructor (itemType) {
    this.itemType = itemType
    this.minCount = 1
    this.maxCount = 1
    this.functions = []
    this.conditions = []
    this.weight = 1.0
    this.quality = 1.0
    this.poolIndex = 0
    this.entryType = ''
    this.siblings = []
  }

  requiresSilkTouch () {
    for (const condition of this.conditions) {
      if (condition.isSilkTouch()) return true
    }

    return false
  }

  requiresNoSilkTouch () {
    if (this.entryType !== 'minecraft:alternatives') return false

    const selfIndex = this.siblings.indexOf(this)
    for (let i = 0; i < selfIndex; i++) {
      if (this.siblings[i].requiresSilkTouch()) return true
    }

    return false
  }

  requiresPlayerKill () {
    for (const condition of this.conditions) {
      if (condition.type === 'minecraft:killed_by_player') {
        return !condition.inverse
      }
    }

    return false
  }

  estimateDropChance (looting = 0, luck = 0) {
    const myWeight = Math.floor(this.weight + (this.quality * luck))

    let maxWeight = 0
    for (const sib of this.siblings) maxWeight += Math.floor(sib.weight + (sib.quality * luck))

    const individualChance = myWeight / maxWeight
    let chance = 1

    for (const condition of this.conditions) {
      if (condition.type === 'minecraft:random_chance') {
        chance *= condition.chance
      }

      if (condition.type === 'minecraft:random_chance_with_looting') {
        let lootValue = looting
        if (condition.onPool) lootValue /= individualChance

        chance *= condition.chance + condition.looting_multiplier * lootValue
      }
    }

    return chance * individualChance
  }

  getRequiredBlockAge () {
    for (const condition of this.conditions) {
      if (condition.type === 'minecraft:block_state_property' &&
            condition.properties &&
            condition.properties.age) {
        return condition.properties.age
      }
    }

    return 0
  }
}

class LootCondition {
  constructor (type, onPool) {
    this.type = type
    this.onPool = onPool
  }

  isSilkTouch () {
    if (this.type !== 'minecraft:match_tool') return false
    if (!this.predicate || !this.predicate.enchantments) return false

    for (const enchantment of this.predicate.enchantments) {
      if (enchantment.enchantment === 'minecraft:silk_touch') return true
    }

    return false
  }
}

class LootFunction {
  constructor (type, onPool) {
    this.type = type
    this.onPool = onPool
  }
}

module.exports = { LootItemDrop, LootCondition, LootFunction, getPotentialDrops, generateLoot }
