function removeNamespace (value) {
  if (value.startsWith('minecraft:')) return value.substring(10)
  else return value
}

function applyFunctions (item, functions) {}

function applyConditions (item, conditions) {}

function parseLootTable (table) {
  const type = removeNamespace(table.type)
  const lootTable = new LootTable(type)

  for (const pool of table.pools || []) {
    for (const entry of table.entries || []) {
      const item = new PotentialDrop(entry.type)
      applyFunctions(item, pool.functions || [])
      applyConditions(item, pool.conditions || [])
      lootTable.items.push(item)
    }
  }

  return lootTable
}

class PotentialDrop {
  constructor (itemType) {
    this.itemType = itemType
    this.conditions = []
  }
}

class LootTable {
  /**
   * Creates a new loot table parser from the given Minecraft loot table.
   *
   * @param type - The type of table being represented.
   */
  constructor (type) {
    this.type = type
    this.items = []
  }
}

module.exports = { parseLootTable, LootTable }
