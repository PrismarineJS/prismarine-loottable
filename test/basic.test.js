/* eslint-env mocha */
const assert = require('assert')
const { getPotentialDrops } = require('prismarine-loottable')

function drops (table) {
  return getPotentialDrops(table).map(d => ({ item: d.itemType, range: d.getStackSizeRange(), chance: d.estimateDropChance(), silk: d.requiresSilkTouch(), noSilk: d.requiresNoSilkTouch(), player: d.requiresPlayerKill() }))
}

describe('loot table formats', () => {
  it('reads number-provider counts and limit_count minimums (1.14+)', () => {
    const [stick] = drops({ pools: [{ rolls: 1, entries: [{ type: 'minecraft:item', name: 'minecraft:stick', functions: [{ function: 'minecraft:set_count', count: { min: 1, max: 2, type: 'minecraft:uniform' } }] }] }] })
    assert.deepStrictEqual(stick.range, [1, 2])
    const [mushroom] = drops({ pools: [{ rolls: 1, entries: [{ type: 'minecraft:item', name: 'minecraft:brown_mushroom', functions: [{ function: 'minecraft:set_count', count: { type: 'minecraft:uniform', min: -6, max: 2 } }, { function: 'minecraft:limit_count', limit: { min: 0 } }] }] }] })
    assert.deepStrictEqual(mushroom.range, [0, 2])
    const [constant] = drops({ pools: [{ rolls: { type: 'minecraft:constant', value: 2 }, entries: [{ type: 'minecraft:item', name: 'minecraft:bone', functions: [{ function: 'minecraft:set_count', count: { type: 'minecraft:constant', value: 3 } }] }] }] })
    assert.deepStrictEqual(constant.range, [3, 3])
  })

  it('accepts any_of / all_of conditions and unknown condition or function types (1.20.3+)', () => {
    const table = { pools: [{ rolls: 1, entries: [{ type: 'minecraft:item', name: 'minecraft:short_grass', conditions: [{ condition: 'minecraft:any_of', terms: [{ condition: 'minecraft:survives_explosion' }, { condition: 'minecraft:enchantment_active_check', active: true }] }], functions: [{ function: 'minecraft:set_components', components: {} }] }] }] }
    assert.strictEqual(drops(table)[0].item, 'minecraft:short_grass')
  })

  it('reads the 1.21 silk touch predicate and the enchanted bonus chance', () => {
    const table = { pools: [{ rolls: 1, entries: [{ type: 'minecraft:alternatives', children: [{ type: 'minecraft:item', name: 'minecraft:diamond_ore', conditions: [{ condition: 'minecraft:match_tool', predicate: { predicates: { 'minecraft:enchantments': [{ enchantments: 'minecraft:silk_touch', levels: { min: 1 } }] } } }] }, { type: 'minecraft:item', name: 'minecraft:diamond' }] }] }, { rolls: 1, entries: [{ type: 'minecraft:item', name: 'minecraft:iron_ingot', conditions: [{ condition: 'minecraft:killed_by_player' }, { condition: 'minecraft:random_chance_with_enchanted_bonus', unenchanted_chance: 0.025, enchanted_chance: { type: 'minecraft:linear', base: 0.035, per_level_above_first: 0.01 } }] }] }] }
    const [ore, diamond, ingot] = drops(table)
    assert.strictEqual(ore.silk, true)
    assert.strictEqual(diamond.noSilk, true)
    assert.strictEqual(ingot.player, true)
    assert.strictEqual(ingot.chance, 0.025)
  })

  it('still reads the 1.13 set_count form and looting_enchant', () => {
    const [d] = drops({ pools: [{ rolls: 1, entries: [{ type: 'minecraft:item', name: 'minecraft:rotten_flesh', functions: [{ function: 'minecraft:set_count', count: { min: 0, max: 2 } }, { function: 'minecraft:looting_enchant', count: { min: 0, max: 1 } }] }] }] })
    assert.deepStrictEqual(d.range, [0, 2])
  })
})
