# Progress Badge Upgrades - Current Status

This file lists every upgrade path that can be rolled from buying `Progress Badge`, whether it currently works, and whether it is still needed in the current game flow.

## How Progress Badge Upgrades Are Offered

1. Buying `Progress Badge` increments badge count.
2. Upgrade choices are built from the next tier of each learned target.
3. You see 3 random choices at a time.
4. Choosing one upgrade replaces that target in `learnedUpgrades`.

Code paths:

- Upgrade choice generation: `selectUpgradeChoices`
- Applying chosen upgrade: `GetUpgrade` reducer
- Applying derived stats (water/energy/move/bargain/miner/fisher): `UpgradeChanges$` effect + reducer actions

## Upgrade Matrix

| Target     | Tiers                  | Works Now?          | Needed Now?   | Notes                                                                                                   |
| ---------- | ---------------------- | ------------------- | ------------- | ------------------------------------------------------------------------------------------------------- |
| `dig`      | Dig I, Dig II, Dig III | No practical effect | No (obsolete) | Digging now forces soil directly to `soil-3` in one action. Old step-based tilling behavior is gone.    |
| `plow`     | Plow I, II, III        | Yes                 | Yes           | Changes multi-tile dig selection shape (`1x3`, `2x3`, `3x3`) via `areasByAreas(..., upg.plow)`.         |
| `sow`      | Sow I, II, III         | Yes                 | Yes           | Changes multi-tile seed planting coverage (`1x3`, `2x3`, `3x3`) via `areasByAreas(..., upg.sow)`.       |
| `water`    | Water I, II, III       | Yes                 | Yes           | Increases water max through `ChangeWaterMax` (`water.max = 100 * value`).                               |
| `irrigate` | Irrigate I, II, III    | Yes                 | Yes           | Changes multi-tile watering coverage (`1x3`, `2x3`, `3x3`) via `areasByAreas(..., upg.irrigate)`.       |
| `move`     | Move I, II, III        | Yes                 | Yes           | Multiplies movement speed factor used when movement is active/wake state restores velocity.             |
| `energy`   | Energy Up I, II, III   | Yes                 | Yes           | Increases energy max through `ChangeEnergyMax` (`energy.max = 100 * value`).                            |
| `bargain`  | Bargain I, II, III     | Yes                 | Yes           | Affects both buy and sell: shop prices divide by bargain value, sell payouts multiply by bargain value. |
| `miner`    | Miner I, II, III       | Yes                 | Yes           | Increases mine nugget chance (`minerValue` scaling).                                                    |
| `fisher`   | Fisherman I, II, III   | Yes                 | Yes           | Increases better fish odds by shifting random thresholds (`fisherValue` scaling).                       |

## Full Upgrade List By Name

### Dig (obsolete)

1. Dig I (`target: dig`, `value: 1`)
2. Dig II (`target: dig`, `value: 2`)
3. Dig III (`target: dig`, `value: 3`)

Status: obsolete due to one-click till logic.

### Plow

1. Plow I (`value: 1x3`)
2. Plow II (`value: 2x3`)
3. Plow III (`value: 3x3`)

Status: active and useful for tilling only.

### Sow

1. Sow I (`value: 1x3`)
2. Sow II (`value: 2x3`)
3. Sow III (`value: 3x3`)

Status: active and useful for multi-tile planting.

### Water Capacity

1. Water I (`value: 1.25`)
2. Water II (`value: 1.6`)
3. Water III (`value: 2`)

Status: active and useful.

### Irrigate

1. Irrigate I (`value: 1x3`)
2. Irrigate II (`value: 2x3`)
3. Irrigate III (`value: 3x3`)

Status: active and useful.

### Move Speed

1. Move I (`value: 1.25`)
2. Move II (`value: 1.5`)
3. Move III (`value: 1.75`)

Status: active and useful.

### Energy Capacity

1. Energy Up I (`value: 1.25`)
2. Energy Up II (`value: 1.6`)
3. Energy Up III (`value: 2`)

Status: active and useful.

### Bargain

1. Bargain I (`value: 1.1`)
2. Bargain II (`value: 1.2`)
3. Bargain III (`value: 1.3`)

Status: active and useful.

### Miner

1. Miner I (`value: 2`)
2. Miner II (`value: 3`)
3. Miner III (`value: 4`)

Status: active and useful.

### Fisherman

1. Fisherman I (`value: 2`)
2. Fisherman II (`value: 3`)
3. Fisherman III (`value: 4`)

Status: active and useful.

## Recommendation

1. Remove `dig` upgrades from the upgrade pool, or repurpose them (for example lower rhythm energy cost for dig actions, faster cultivate animation, or bonus crop yield on dig/harvest).
2. Keep all other upgrade targets. They are still connected to live gameplay systems.
