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

  it('handles additive set_count (resin_clump: +1 per face, then an unconditional -1)', () => {
    const faces = ['down', 'up', 'north', 'south', 'west', 'east']
    const functions = faces.map(f => ({ function: 'minecraft:set_count', add: true, count: 1, conditions: [{ condition: 'minecraft:block_state_property', block: 'minecraft:resin_clump', properties: { [f]: 'true' } }] }))
    functions.push({ function: 'minecraft:set_count', add: true, count: -1 }) // unconditional
    functions.push({ function: 'minecraft:explosion_decay' })
    const [clump] = drops({ pools: [{ rolls: 1, entries: [{ type: 'minecraft:item', name: 'minecraft:resin_clump', functions }] }] })
    // base 1 + up to 6 conditional adds - 1 unconditional = 0..6 (a one-face state yields 1, six faces yield 6);
    // the old replacement behavior produced [-1, -1] from the trailing unconditional -1.
    assert.deepStrictEqual(clump.range, [0, 6])
  })

  it('handles a negative conditional additive set_count (spans both outcomes)', () => {
    const functions = [
      { function: 'minecraft:set_count', count: 3 },
      { function: 'minecraft:set_count', add: true, count: -1, conditions: [{ condition: 'minecraft:random_chance', chance: 0.5 }] }
    ]
    const [d] = drops({ pools: [{ rolls: 1, entries: [{ type: 'minecraft:item', name: 'minecraft:stick', functions }] }] })
    // base 3, then an optional -1: the possible counts are 2 and 3, so the range is [2, 3], not the inverted [3, 2].
    assert.deepStrictEqual(d.range, [2, 3])
  })

  it('handles a conditional additive number provider that crosses zero', () => {
    const functions = [
      { function: 'minecraft:set_count', count: 5 },
      { function: 'minecraft:set_count', add: true, count: { type: 'minecraft:uniform', min: -2, max: 3 }, conditions: [{ condition: 'minecraft:random_chance', chance: 0.5 }] }
    ]
    const [d] = drops({ pools: [{ rolls: 1, entries: [{ type: 'minecraft:item', name: 'minecraft:stick', functions }] }] })
    // base 5, optional add of [-2, 3]: low extends by min(0,-2) -> 3, high by max(0,3) -> 8.
    assert.deepStrictEqual(d.range, [3, 8])
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
