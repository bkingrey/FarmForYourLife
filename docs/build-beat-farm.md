# Build Beat Farm Fusion

This document describes how we will turn the existing `C:/Projects/FarmForYourLife` game into a working game inside this `BeatFarmFusion` Angular project, while adding a rhythm mechanic. The goal is to keep the feel, functionality, map, character behavior, farming loop, screens, and UI as close to the original as possible, but move the game rendering, animation, movement, collision, and click-action execution into Phaser.

## Source And Target

Source project:

- `C:/Projects/FarmForYourLife`
- Angular 13 app
- Uses NgRx for game state
- Main game rendering currently lives in `src/app/game/game.component.ts`
- Game UI is already separate in Angular components such as `game-ui`, `merchant`, `upgrade`, `shade`, `title-screen`, `game-select`, `play-lobby`, and `win-screen`
- Assets live under `src/assets/characters`, `src/assets/crops`, `src/assets/carrying`, `src/assets/pickable`, `src/assets/ui`, `src/assets/maps`, and `src/assets/json`

Target project:

- `C:/Projects/FarmForYourLife`
- latest angular app
- Currently has a starter Angular shell and `src/assets/music`
- Will add Phaser for the in-game scene only
- Will keep Angular responsible for the app shell, screens, buttons, menus, shop, upgrades, inventory/hotbar, meters, overlays, and routing/state coordination where practical

## High-Level Direction

We will port the original game in two layers:

1. Angular layer: keep or port the existing UI components, screens, store models, reducers, effects, and facade patterns.
2. Phaser layer: replace the manual `<canvas>` drawing loop, image loading, keyboard movement, collision checks, sprite animation frame counters, action animations, floating text, and map rendering with Phaser scenes and systems.

The result should still look and play like `FarmForYourLife`, but the core game canvas will be Phaser-powered. Angular will host the Phaser canvas and remain the source for menus and UI controls.

## What Should Stay The Same

The following behavior should be preserved unless we intentionally revise it later:

- The same map layout and collision areas.
- The same player starting position, movement speed progression, and WASD movement feel.
- The same farming area targeting rules.
- The same tools and equipped tool behavior: shovel, watering, seeds, basket/carrying, pickaxe, fishing rod, selling/drop flow.
- The same crop list, seed counts, plant costs, crop readiness, harvest values, and money flow.
- The same energy and water meter rules.
- The same well refill, house/sleep, merchant/shop, upgrades, badge/progression, and win-screen behavior.
- The same cursor/hover intent where possible, including showing when an action is available.
- The same screen flow: title, game select, lobby, game, shop, upgrades, win screen.
- The same local multiplayer/lobby data shape if we keep that feature active.

## What Should Move To Phaser

The original `GameComponent` manually manages a canvas and many frame counters. Phaser should own that work instead.

Move these responsibilities into Phaser:

- Loading and displaying the background map and foreground map.
- Loading spritesheets and creating named animations.
- Player movement and animation state: idle, walk, dig, water, hammer, pickaxe, mine, broom, fish, plant, carry, sleep effects.
- Camera/canvas sizing at the original 1024 x 576 game resolution.
- Collision against map boundaries and untargetable tiles.
- Hit/target zones for farmable, waterable, fishable, minable, house, well, and merchant areas.
- Mouse pointer world coordinate conversion.
- Highlighting/previewing valid action tiles.
- Running action animations and timing their completion.
- Dropped/pickupable item rendering.
- Floating feedback text above the player or action tile.
- Beat/rhythm timing visualization inside the game canvas, if we choose to render a pulse indicator in-world.

Keep these responsibilities in Angular where practical:

- App shell and layout.
- Screen switching and modal/overlay components.
- Buttons, shop, upgrades, seed/tool UI, money, energy, water, and player badges.
- NgRx store, actions, selectors, and facade.
- Music selection/controls if they are part of the UI.
- Dispatching game state changes caused by Phaser events.

## Proposed Folder Structure

Add the ported code in a way that clearly separates Angular UI from Phaser gameplay.

```text
src/
	app/
		game/
			game.component.ts          # Angular host for Phaser
			game.component.html        # Phaser container only
			game.component.scss
			phaser/
				beat-farm.scene.ts       # Main gameplay scene
				preload.scene.ts         # Optional loading scene
				phaser-game.service.ts   # Creates/destroys Phaser.Game
				angular-game-bridge.ts   # Typed event bridge between Phaser and Angular
				systems/
					action.system.ts       # Dig/water/plant/harvest/fish/mine/open-shop decisions
					beat.system.ts         # Music clock, beat windows, score labels
					collision.system.ts    # Map and object collision helpers
					crop.system.ts         # Crop state/render helpers
					movement.system.ts     # Player movement and input helpers
				types/
					phaser-events.ts
					rhythm.ts
		_store/
			actions.ts
			models.ts
			reducer.ts
			selectors.ts
			effects.ts
		game-ui/
		merchant/
		upgrade/
		shade/
		title-screen/
		game-select/
		play-lobby/
		win-screen/
	assets/
		characters/
		crops/
		carrying/
		pickable/
		ui/
		maps/
		json/
		music/
```

## Dependencies

Install Phaser in `BeatFarmFusion`:

```powershell
npm install phaser
```

We should keep the Angular 15 dependency set already in this project. When porting from Angular 13, update imports and tests rather than downgrading Angular.

If we keep NgRx, install Angular 15-compatible NgRx packages:

```powershell
npm install @ngrx/store@15 @ngrx/effects@15 @ngrx/store-devtools@15
```

## Asset Migration

Copy these source asset folders into `BeatFarmFusion/src/assets`:

- `characters`
- `crops`
- `carrying`
- `pickable`
- `ui`
- `maps`
- `json`

Keep `BeatFarmFusion/src/assets/music` for the rhythm tracks. We should place at least one gameplay music track there before implementing rhythm timing.

The map assets to preserve are:

- `SunnyMap.png`
- `SunnyMapForeground.png`
- `SunnyMap.json`
- `SunnyMap.tmx`
- `SunnyTileset.tsx`
- `Collision.tsx`

The source game currently also has a generated `jsonData.js` file that includes resolution, collision arrays, farmable areas, fishable areas, minable areas, house areas, well areas, untargetable areas, map image position, player state, upgrades, and sprite animation metadata. We should initially port that data exactly, then gradually replace any manual parsing with Phaser tilemap/object-layer data if the `SunnyMap.json` file contains all needed layers cleanly.

## Angular And Phaser Boundary

Angular should mount Phaser, pass store snapshots into it, and listen for Phaser events. Phaser should not directly dispatch NgRx actions or reach into Angular components.

Recommended flow:

1. `GameComponent` subscribes to `gameData$` from the facade.
2. `GameComponent` creates `Phaser.Game` once when the Angular game screen appears.
3. `GameComponent` passes the initial `GameState` into the Phaser scene.
4. Phaser emits typed events such as `actionRequested`, `actionCompleted`, `rhythmJudged`, `openShopRequested`, `waterChanged`, `energyChanged`, and `moneyChanged`.
5. `GameComponent` translates those events into existing Angular outputs or direct facade dispatches.
6. Angular store changes are pushed back into Phaser through a typed `stateChanged` bridge event.

This keeps Phaser focused on gameplay and keeps Angular in charge of app state and UI.

## Phaser Host Component

The old `game.component.html` canvas should be replaced with a Phaser container.

```html
<div class="game-shell">
  <div #phaserHost class="phaser-host"></div>
</div>
```

The Angular `GameComponent` should:

- Create the Phaser game in `ngAfterViewInit`.
- Destroy it in `ngOnDestroy`.
- Forward latest `gameData` changes to the scene.
- Forward events from the scene back to Angular/NgRx.
- Keep focus management so WASD movement works after UI button clicks.

## State Model

Start by porting these source files with minimal behavior changes:

- `_store/models.ts`
- `_store/actions.ts`
- `_store/reducer.ts`
- `_store/selectors.ts`
- `_store/effects.ts`
- `app.facade.ts`

Then add rhythm-specific state only where it affects UI or persistence.

Suggested additions:

```ts
export interface RhythmState {
  enabled: boolean;
  track: string;
  bpm: number;
  beatOffsetMs: number;
  lastJudgement?: RhythmJudgement;
  score: number;
  combo: number;
  bestCombo: number;
}

export interface RhythmJudgement {
  label: "Poor" | "Okay" | "Good" | "Great" | "Perfect";
  score: 0 | 1 | 2 | 3 | 4;
  timingErrorMs: number;
  action: FarmActionType;
  createdAt: number;
}

export type FarmActionType = "dig" | "water" | "plant" | "harvest" | "mine" | "fish" | "drop" | "sell" | "open-shop" | "buy-item" | "sleep" | "fill-water";
```

Only click-driven actions should receive rhythm judgement. Movement should stay normal and should not be rhythm-gated.

## Rhythm Mechanic

When the player clicks to do an action, Phaser should judge the click against the current music beat. The action should still execute if it was valid in the original game. The rhythm result adds feedback and optional bonus rewards without breaking the original farming loop.

Click actions to judge:

- Dig/cultivate.
- Plant seed.
- Water crop.
- Harvest crop.
- Mine.
- Fish.
- Drop/sell carried item.
- Fill water at the well.
- Open merchant/shop.
- Buy item from the shop.
- Enter/leave house or sleep, if triggered by click.

Clicks that should not be judged:

- Angular UI clicks such as changing seeds/tools in the hotbar.
- Menu buttons, title screen buttons, upgrade selections, lobby buttons, and other non-gameplay UI controls.
- Shop purchases are the exception: they should be scoreable because buying happens during active online play.
- Invalid clicks that do not cause an in-game action.
- WASD movement.

## Beat Timing Rules

The first implementation should use a simple BPM clock tied to the active music track.

Recommended starting values:

```ts
const rhythmWindows = [
  { label: "Perfect", maxErrorMs: 45, score: 4 },
  { label: "Great", maxErrorMs: 90, score: 3 },
  { label: "Good", maxErrorMs: 140, score: 2 },
  { label: "Okay", maxErrorMs: 200, score: 1 },
  { label: "Poor", maxErrorMs: Infinity, score: 0 },
];
```

Judgement algorithm:

1. Get current music time from Phaser audio in milliseconds.
2. Apply the configured `beatOffsetMs` for the track.
3. Calculate beat length: `60000 / bpm`.
4. Find the nearest beat to the adjusted music time.
5. Calculate absolute timing error in milliseconds.
6. Pick the first judgement window that contains that error.
7. Emit the judgement and spawn floating text.

Pseudo-code:

```ts
function judgeClick(nowMs: number, bpm: number, beatOffsetMs: number): RhythmJudgementLabel {
  const beatMs = 60000 / bpm;
  const adjustedMs = nowMs - beatOffsetMs;
  const nearestBeat = Math.round(adjustedMs / beatMs) * beatMs;
  const errorMs = Math.abs(adjustedMs - nearestBeat);

  if (errorMs <= 45) return "Perfect";
  if (errorMs <= 90) return "Great";
  if (errorMs <= 140) return "Good";
  if (errorMs <= 200) return "Okay";
  return "Poor";
}
```

Later improvements can add per-song beat maps, intro offsets, calibration UI, downbeat emphasis, combo rewards, and accessibility options.

## Rhythm Feedback And Score Design

The first version should give colorful timing feedback and points. Economy-changing bonuses can come later once the base battle/farming loop feels good.

Initial point values:

- `Poor`: 0 points.
- `Okay`: 10 points.
- `Good`: 25 points.
- `Great`: 50 points.
- `Perfect`: 100 points.

First-version behavior:

- Do not change success/failure of the base action.
- Show floating text for every valid click action.
- Keep judgement score internal to the rhythm system instead of showing a top-of-screen score HUD.
- Use color, scale, and motion to make better judgements feel stronger.
- Track combo in state if it is cheap to add, but progression and win state should be communicated through earned badges.
- Buying items should also be scoreable because shop actions happen during online play.

Later reward ideas:

- `Great` or `Perfect` can reduce shop item cost.
- `Great` or `Perfect` can improve crop value, fish value, mining value, or reduce energy/water cost.
- Combo can multiply score or improve future reward odds.

Those later rewards should not be part of the first implementation unless the scoring loop is already stable.

## Floating Text

Floating text should be rendered in Phaser, not Angular, because it belongs to the game world and should appear near the character or clicked tile.

Behavior:

- Spawn at the action target position, falling back to the player position.
- Text labels: `Poor`, `Okay`, `Good`, `Great`, `Perfect`.
- Float upward and fade out over about 700 to 1000 ms.
- Use stronger scale/color for better timings.
- Do not block input.

Suggested colors:

- `Poor`: gray
- `Okay`: white
- `Good`: green
- `Great`: blue
- `Perfect`: gold

## Music Plan

Phaser should control gameplay music because rhythm judgement needs accurate playback time. Angular can still show music controls, but Phaser should expose the music state through the bridge.

First gameplay track:

- Use `assets/music/Quacks-120.wav`.
- Treat it as 120 BPM.
- Start with `beatOffsetMs: 0` and tune only if playtesting shows the downbeat is late or early.

Future track/BPM selection:

- The user should eventually be able to choose the BPM/version of a song.
- BPM should be parsed from the trailing filename suffix, such as `Quacks-120.wav` or `Quacks-130.wav`.
- The selected file should drive both playback and `BeatSystem.bpm`.
- If a file does not end with `-<bpm>.wav`, require explicit metadata instead of guessing.

Implementation steps:

1. Load `Quacks-120.wav` from `src/assets/music`.
2. Define a track config with `key`, `src`, `bpm: 120`, and `beatOffsetMs: 0`.
3. Load the track in the Phaser preload scene.
4. Start playback when entering the game scene.
5. Use Phaser sound seek/time for judgement.
6. Keep gameplay music running through shop and upgrade overlays.

Shop/upgrades should not pause the beat. This is an online battle game, so stopping the music for one player's overlay would feel wrong. Shop purchases should be scoreable in the first version, and later a `Perfect` purchase can reduce the item cost or trigger another shop-specific reward.

## Map And Collision Plan

We should take advantage of Phaser for the map, tiles, and collisions while preserving the exact source layout and gameplay boundaries.

Primary path:

- Load `SunnyMap.json` as a Phaser tilemap.
- Load the source tileset image and preserve the same tile dimensions, map dimensions, layer order, and foreground rendering.
- Create Phaser tilemap layers for the same visible map and foreground data.
- Enable Phaser collisions from the same collision data used by the source map.
- Derive farmable, fishable, minable, house, well, merchant, and untargetable interaction zones from the Tiled layers or source arrays, whichever keeps the behavior identical.
- Keep `jsonData.js` available as a compatibility/reference source while verifying the Phaser tilemap implementation.

Fallback path:

- If any zone data is missing or unreliable in the Tiled JSON, keep that specific zone from the original arrays while still rendering the map and collisions through Phaser.
- Do not visually redesign the map during the port.

The intent is not to simplify the map into a static background. Phaser should own the map implementation, but the result should match `FarmForYourLife` tile-for-tile and collision-for-collision.

## Player Movement Plan

Movement should feel like the original:

- WASD input.
- Same base velocity and upgrade-modified velocity.
- Same blocked movement against collision zones.
- Same left/right facing behavior.
- Same action lockouts while watering, cultivating, sleeping, attacking, or carrying if those lockouts exist in the source.

Implementation details:

- Use Phaser cursor/key objects for WASD.
- Use arcade physics or direct position math with collision checks. Arcade physics is preferred if it does not change feel.
- Keep the source coordinate system and scale initially: 1024 x 576 resolution, `scale = 0.5`, `squareSize = 64`, map offset around `{ x: 237, y: -40 }`.
- Create named animations from the original sprite frame metadata.

## Farming And Action Plan

The source game has click behavior split across left click and right click:

- Left click handles carry/drop, tired checks, attack when shift is held, and cultivating/harvesting valid farmable areas.
- Right click handles cancelling seed/basket, opening shop, refilling water, and watering valid areas.

In Phaser, this should become an explicit action pipeline:

```text
Pointer click
	-> identify world position
	-> identify hovered/targeted zone
	-> determine intended action from button + equipped tool + state
	-> validate energy/water/range/tool rules
	-> judge rhythm if valid click action
	-> execute original action behavior
	-> play Phaser animation
	-> emit Angular/NgRx events
	-> show floating judgement text
```

This makes it clear where the rhythm mechanic plugs in: after validation and before execution/feedback.

## Angular UI Port Plan

Port the existing Angular components mostly as-is, then adjust imports/styles for Angular 15:

- `title-screen`
- `game-select`
- `play-lobby`
- `game-ui`
- `merchant`
- `upgrade`
- `shade`
- `win-screen`

The `game-ui` component should continue to show:

- Energy bar.
- Score at the top of the UI.
- Money.
- Badge/progress count.
- Current left-click and right-click tool/action hints.
- Water bar.
- Seed/tool selection.

The Angular UI should not render the Phaser floating rhythm text. It can later show rhythm combo, current grade, calibration, or track controls if we want.

## Multiplayer And Socket Notes

Multiplayer should be included in the first working version. The source project already has most of the multiplayer/lobby shape in place, so the port should fix it up for this Angular 15 + Phaser version instead of deferring it.

Implementation direction:

1. Preserve the source `LobbyPlayer` model and lobby screen flow.
2. Port the socket/client wiring needed for online play.
3. Have Phaser render local and remote players from the shared lobby/player state.
4. Broadcast movement, action, carrying, watering, cultivating, score, badge, and rhythm judgement state as needed.
5. Keep music running locally for every player; do not pause global gameplay because one player opens a shop or upgrade overlay.
6. Keep shop purchases scoreable and later allow timing-based discounts or rewards.

The first implementation can still bring systems up in a practical order, but the target is online battle gameplay, not a single-player-only prototype.

## Implementation Phases

### Phase 1: Project Setup

- Install Phaser, NgRx packages, and multiplayer/socket dependencies needed from the source game.
- Copy source assets into `src/assets`.
- Copy source Angular store/facade/components into the Angular 15 project.
- Replace the Angular starter component content with the source app shell.
- Confirm `npm start` and Angular compilation.

### Phase 2: Phaser Shell

- Create `PhaserGameService`.
- Create a Phaser host version of `GameComponent`.
- Add `BeatFarmScene` with preload/create/update lifecycle.
- Load and render the source map through Phaser tilemap layers.
- Keep the source map, tiles, foreground, and collision behavior identical.
- Confirm Phaser canvas appears at 1024 x 576.

### Phase 3: Movement And Collision

- Load player spritesheets.
- Create idle/walk animations.
- Add WASD movement.
- Recreate collision boundaries through Phaser tilemap collision data, using the original arrays only as compatibility checks or zone fallback data.
- Tune speed and camera/map offset until it matches the source.

### Phase 4: Interaction Zones

- Convert farmable, fishable, minable, house, well, merchant, and untargetable arrays into Phaser zones.
- Add hover detection and range checks.
- Recreate cursor/action availability behavior.
- Emit can-harvest, can-fill-water, can-open-shop, and can-enter-house state changes.

### Phase 5: Core Actions

- Port dig/cultivate.
- Port planting seeds.
- Port watering.
- Port crop growth/readiness/harvest.
- Port carrying, dropping, and selling.
- Port mining and fishing.
- Port well refill, merchant open, house/sleep.
- Keep energy, water, money, seed count, upgrade effects, and tool state aligned with NgRx.

### Phase 6: Rhythm Mechanic

- Add gameplay music track config.
- Use `Quacks-120.wav` as the first track with `bpm: 120` and `beatOffsetMs: 0`.
- Add `BeatSystem` with BPM parsing support for filename suffixes such as `-120` and `-130`.
- Judge every valid in-game click action.
- Show floating judgement text in Phaser.
- Emit rhythm judgement to Angular state.
- Add score at the top of the game UI.
- Add points for judgements and shop purchases.

### Phase 7: Polish And Verification

- Match original animation timing and movement feel.
- Verify UI overlays still receive clicks and do not accidentally trigger Phaser actions.
- Verify Phaser regains focus after Angular UI interactions.
- Test all core loops: dig, plant, water, harvest, sell, shop, upgrade, refill water, sleep, mine, fish.
- Test multiplayer lobby, remote movement, remote action animation, and score updates.
- Test rhythm judgement at multiple BPM values and offsets.
- Tune timing windows after playing with real music.

## Acceptance Checklist

The implementation is ready when:

- The app starts in `BeatFarmFusion` with Angular 15.
- The original screen flow works.
- The Phaser scene renders the original map, tiles, collisions, and foreground with the same behavior as the source.
- The player can move with WASD and collide with the same blocked areas.
- The original farming loop works: dig, plant, water, harvest, sell.
- Energy, water, money, seeds, tools, upgrades, and UI update correctly.
- Merchant, well, house/sleep, mining, and fishing behavior match the source.
- Multiplayer lobby, remote players, remote actions, and score state work in this project.
- Valid in-game click actions produce rhythm judgement text from `Poor` to `Perfect`.
- Valid judgement results add points to a visible score at the top of the UI.
- `Quacks-120.wav` plays as the first gameplay rhythm track at 120 BPM.
- The beat system can select BPM from filenames such as `Quacks-120.wav` and `Quacks-130.wav`.
- UI/menu clicks do not produce rhythm judgement text.
- Shop purchase clicks can produce score and later support timing-based discounts.
- Shop/upgrades do not pause gameplay music.
- Music playback stays synchronized enough for click judgement.
- The game can be built with `npm run build`.

## Decisions For First Implementation

- First gameplay rhythm track: `assets/music/Quacks-120.wav`.
- First BPM: 120.
- Starting offset: `0 ms`, then tune by playtesting if needed.
- Future BPM choice: parse the trailing `-120`, `-130`, etc. suffix from the selected filename.
- First rhythm reward: colorful floating judgement text plus points shown in a top score UI.
- Later rhythm rewards: cost discounts, stronger economy bonuses, and combo effects.
- Shop/upgrades: music continues while overlays are open.
- Shop purchases: scoreable now, discountable later.
- Multiplayer: included in the first working version by fixing up the source game's nearly complete multiplayer flow.
- Map/collision: use Phaser tilemaps and collisions while preserving the same source map, tiles, collision behavior, and interaction zones.

## Recommended First Implementation Choice

Build the first working version with the least behavior risk:

- Keep Angular UI and NgRx patterns from `FarmForYourLife`.
- Use Phaser only for the game canvas, movement, animations, collisions, interactions, audio timing, and floating text.
- Use Phaser tilemaps for the original map, tiles, and collisions, with `jsonData.js` as a reference/fallback for exact zone behavior.
- Add `Quacks-120.wav` as the first track at 120 BPM.
- Add rhythm feedback and score without changing action success or economy rewards yet.
- Include multiplayer in the first working port.
- After the game is playable, add discounts, economy bonuses, combo UI, calibration, and deeper tilemap cleanup.

That gives us a playable port quickly while preserving the original game and making the new rhythm identity visible right away.
