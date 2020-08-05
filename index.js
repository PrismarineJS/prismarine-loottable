function removeNamespace (value) {
  if (value.startsWith('minecraft:')) return value.substring(10)
  else return value
}

class LootTable {
  /**
   * Creates a new loot table parser from the given Minecraft loot table.
   *
   * @param lootTable - The raw Minecraft loot table object.
   */
  constructor (lootTable) {
    this._lootTable = lootTable
    this.type = removeNamespace(lootTable.type)
  }

  /**
   * Gets the type of loot table this is.
   */
  get type () {
    return this.type
  }
}

module.exports = { LootTable }
