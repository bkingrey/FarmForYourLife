# Farm For Your Life — Optimization & Fix-Up Notes

Audit of the Angular 18 + NgRx 18 + Phaser 3.85 codebase. Findings are grouped
by category. Each item has: where it lives, why it matters, and a concrete fix.
Line numbers are 1-based and approximate — refactors will shift them.

> ⚠ **Critical** = active bug, perceptible perf regression, or build/CI risk
> ⚙ **High** = noticeable perf or maintainability cost
> 📌 **Medium** = code-smell or latent risk
> 🧹 **Low** = polish / dead code

---

## Quick-win priority list (do these first)

1. ⚠ Replace ~12 occurrences of `array.filter(x => x.id === id)[0]` in the
   render loop with a precomputed `Map<id, area>` lookup. Single biggest CPU
   win, especially in `plantSeed` (9 scans of `farmableArea` per click).
2. ⚠ Run `requestAnimationFrame` inside `NgZone.runOutsideAngular(...)`. The
   60 fps draw loop currently triggers full Angular change detection on every
   tick because `animate` is bound in the constructor without a zone hop.
3. ⚠ Move the static map + foreground map blits to an `OffscreenCanvas`
   pre-render. They are redrawn 60×/s but never change.
4. ⚠ Replace per-tick `setInterval` lobby gate with a one-shot
   `loadedPlayers$` subscription that resolves when the lobby is ready.
5. ⚠ Convert `assets/music/Quacks-120.wav` (27 MB) and `Quacks-130.wav`
   (25 MB) to `.ogg` (~3 MB each). 50 MB → 6 MB on first play.
6. ⚙ Lazy-load Phaser via dynamic `import('phaser')`. Phaser is currently in
   the main bundle (~600 KB minified) but is only used for music + a corner
   pulse + floating judgement text. main.js is 8.35 MB raw.
7. ⚙ Refactor the 250-line `plantSeed` and 600-line `drawFarmable` into
   data-driven loops keyed by `cropName` / `growthStage`.

---

## 0. Online vs Offline applicability

Most items in this document apply equally to **solo offline** and **online
multiplayer**. The exceptions are flagged here.

| Item                                         |  Solo offline  | Online | Notes                                                                                                            |
| -------------------------------------------- | :------------: | :----: | ---------------------------------------------------------------------------------------------------------------- |
| 1.x render hot-path                          |       ✅       |   ✅   | Pure rendering; mode-agnostic.                                                                                   |
| 2.x Map/Set lookups                          |       ✅       |   ✅   |                                                                                                                  |
| 3.x NgZone / OnPush                          |       ✅       |   ✅   |                                                                                                                  |
| 4.1, 4.2, 4.4–4.6 subscription/timer cleanup |       ✅       |   ✅   |                                                                                                                  |
| 4.3 replace `loadLobby` interval             |      ✅ ⚠      |   ✅   | The replacement predicate must resolve in solo (single player loaded in), not require `lobbyPlayers.length > 1`. |
| 5.x NgRx hygiene                             |       ✅       |   ✅   |                                                                                                                  |
| 6.x asset loading                            |       ✅       |   ✅   |                                                                                                                  |
| 7.x bundle / lazy-load Phaser                |       ✅       |   ✅   |                                                                                                                  |
| 8.x long-method refactors                    |       ✅       |   ✅   |                                                                                                                  |
| 9.x math redundancy                          |       ✅       |   ✅   |                                                                                                                  |
| 10.1 defer `io(...)` connect                 |   ✅ **win**   |   ✅   | Solo should never open a socket. Gate behind `environment.enableMultiplayer`.                                    |
| 10.2 sender-excluded broadcast fix           |      n/a       |   ✅   | Local-handler-always-runs pattern is harmless offline (no socket fires).                                         |
| 10.3 reconnect UI                            |      n/a       |   ✅   |                                                                                                                  |
| 10.4 server-authoritative crops              |    ❌ skip     |   ✅   | Keep local `startWaterTimer` for solo. See guard below.                                                          |
| 10.5 server-authoritative money              |    ❌ skip     |   ✅   | Same.                                                                                                            |
| 11.x timing (`performance.now`, delta-time)  |       ✅       |   ✅   |                                                                                                                  |
| 12.x drawing optimizations                   |       ✅       |   ✅   |                                                                                                                  |
| 13.x spatial indexing                        |       ✅       |   ✅   |                                                                                                                  |
| 14.x type safety                             |       ✅       |   ✅   |                                                                                                                  |
| 15.x dead code                               |       ✅       |   ✅   |                                                                                                                  |
| 16.1 update specs                            |       ✅       |   ✅   |                                                                                                                  |
| 16.2 socket fallback test                    |      n/a       |   ✅   |                                                                                                                  |
| 17.x UX / a11y                               |       ✅       |   ✅   |                                                                                                                  |
| 18.1–18.3 build / CI                         |       ✅       |   ✅   |                                                                                                                  |
| 18.4 `enableMultiplayer` flag                | ✅ **enables** |   ✅   | This is the switch that makes everything else mode-aware.                                                        |
| 19.x audio polish                            |       ✅       |   ✅   |                                                                                                                  |
| §20 multiplayer authority epic               |       ❌       |   ✅   | Explicitly online.                                                                                               |

### Recommended `enableMultiplayer` gating pattern

```ts
// src/environments/environment.ts
export const environment = {
  production: false,
  enableMultiplayer: false,
  socketUrl: "http://localhost:3000",
};

// src/app/socket.service.ts (new)
@Injectable({ providedIn: "root" })
export class SocketService {
  private socket?: Socket;
  connect(): void {
    if (!environment.enableMultiplayer) return;
    this.socket = io(environment.socketUrl);
  }
  on<T>(evt: string, cb: (payload: T) => void): void {
    this.socket?.on(evt, cb);
  }
  emit(evt: string, payload?: unknown): void {
    this.socket?.emit(evt, payload);
  }
  get connected(): boolean {
    return this.socket?.connected ?? false;
  }
}
```

With that in place every site in `app.component.ts` keeps calling the local
handler unconditionally (which is what we already patched for the planting /
digging / watering bug). `socket.emit(...)` becomes a no-op offline, so no
further branching is needed.

### Solo-safe guard for crop growth (item 10.4)

```ts
private scheduleCropGrowth(area: FarmableArea): void {
  // In online mode the server emits `cropGrew` deltas; clients just render.
  if (environment.enableMultiplayer && this.socket.connected) return;

  // Offline (or online-but-disconnected) → fall back to local timer.
  this.startWaterTimer(area);
}
```

This keeps solo identical to today's behavior while letting online mode
become server-authoritative without breaking offline play.

---

## 1. Render-loop hot path (60 fps `drawingCode`)

| #   | Finding                                                                                    | Where                                                                                        | Severity | Fix                                                                                                                                                   |
| --- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1 | Static map redrawn each frame                                                              | [game.component.ts](../src/app/game/game.component.ts) `drawingCode` ~L337                   | ⚠        | Pre-render to an `OffscreenCanvas` once on `map.onload`, then `ctx.drawImage(staticLayer, 0, 0)` once per frame.                                      |
| 1.2 | Foreground map (overlay) blitted per frame                                                 | game.component.ts ~L469                                                                      | ⚙        | Same as 1.1.                                                                                                                                          |
| 1.3 | `ctx.save()` / `ctx.restore()` wraps the whole loop unnecessarily                          | game.component.ts ~L337–L338                                                                 | 🧹       | Remove if no contextual state varies; if it does, scope the save to the smallest section that needs it.                                               |
| 1.4 | Repeated `farmableArea.filter(a => a.id === ...)[0]` inside per-frame loops                | game.component.ts ~L365, plus `plantSeed` ~L2343 (×9), `changeStateOfHoveredFarmable` ~L2167 | ⚠        | Precompute `private areaById = new Map<number, FarmableArea>()` after `loadCanvas` populates `farmableArea`. Keep the map in sync on add/remove only. |
| 1.5 | `lobbyPlayers.filter(p => p.name === ...)[0]` inside multiplayer hot paths                 | game.component.ts ~L718, ~L1330, ~L4517                                                      | ⚙        | `playersByName: Map<string, LobbyPlayer>` rebuilt only when `lobbyPlayers` reference changes.                                                         |
| 1.6 | `globalAlpha` toggled per draw rather than batched                                         | game.component.ts `drawSpriteAnimation` ~L1820                                               | 📌       | Group sleepers; one alpha set per pass.                                                                                                               |
| 1.7 | Player center / position recomputed inside `drawSpriteAnimation` every frame               | game.component.ts ~L1851–L1858                                                               | 📌       | Compute on canvas init / resize only; player is locked to canvas center.                                                                              |
| 1.8 | Yellow corner brackets and water rectangle stroked per frame even when areas are unchanged | `drawBrokenSquare` ~L4279, `drawWaterSquare` ~L4322                                          | 📌       | Cache stroke `Path2D` per area; redraw only when hover/water state changes.                                                                           |
| 1.9 | Commented hitbox debug blocks left inline in the hot path                                  | game.component.ts ~L399–L411, ~L1860–L1870                                                   | 🧹       | Delete; gate behind `environment.debugHitboxes`.                                                                                                      |

## 2. Array scans you can replace with `Map`/`Set`

Every one of these is an O(n) scan invoked at click rate or frame rate.

| #   | Site                                                                                                  | Where                                                      | Fix                                                                        |
| --- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------- |
| 2.1 | `plantSeed` does **9** identical `.filter(a => a.id === ...)[0]` reads per planting click             | game.component.ts `plantSeed` ~L2343                       | Use `areaById.get(id)` once into a local.                                  |
| 2.2 | `changeStateOfHoveredFarmable` filters 4× per dig/water                                               | game.component.ts ~L2167                                   | Same `areaById` cache.                                                     |
| 2.3 | `cultivateOthers` / `waterOtherAnimation` filter `lobbyPlayers`                                       | game.component.ts ~L718, ~L4517                            | `playersByName` map.                                                       |
| 2.4 | `targetNearestSquare` rebuilds `otherFarmableArea` and `waterableArea` via `.filter(...)` every frame | game.component.ts ~L4181                                   | Maintain `Set<number>` and add/remove on hover transitions only.           |
| 2.5 | `learnedUpgrades.filter(u => u.target === 'move')[0]` etc.                                            | game.component.ts ~L614, effects.ts `UpgradeChanges$` ~L57 | Add `selectUpgradesByTarget` selector returning `Record<string, Upgrade>`. |
| 2.6 | `pickupables` linear scan to find a hovered item                                                      | game.component.ts ~L1330                                   | Cap to ~64 entries server-side; or grid-index if many.                     |

## 3. Angular change detection / zone

| #   | Finding                                                                                                             | Where                                                                                                             | Severity           | Fix                                                                                                                                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 3.1 | `requestAnimationFrame(this.animate)` runs inside the Angular zone                                                  | game.component.ts constructor ~L283                                                                               | ⚠                  | Inject `NgZone`. Wrap the whole animate body in `this.ngZone.runOutsideAngular(...)`. Re-enter via `this.ngZone.run(...)` only when emitting state-changing outputs (`changeMoney`, `updatePlayer`, etc.). |
| 3.2 | `GameComponent` uses default change detection but receives a large `gameData` `@Input`                              | game.component.ts ~L29                                                                                            | ⚙                  | `changeDetection: ChangeDetectionStrategy.OnPush`. Same for `GameUiComponent`, `ShadeComponent`, `MerchantComponent`, `UpgradeComponent`.                                                                  |
| 3.3 | `*ngFor` over `lobbyPlayers` in [game-ui.component.html](../src/app/game-ui/game-ui.component.html) lacks `trackBy` | game-ui.component.html ~L20                                                                                       | 📌                 | `trackBy: trackPlayer` returning `player.name`.                                                                                                                                                            |
| 3.4 | `app.component.html` calls `facade.gameData$                                                                        | async`in 10+ bindings inside one`ng-container` — fine — but template also calls expensive getters on each CD pass | app.component.html | 📌                                                                                                                                                                                                         | Already wrapped in `*ngIf="… as gameData"` so this is OK; just ensure pure pipes when computing displayed values. |
| 3.5 | `displayScale` subscription in `AppComponent.ngOnInit` is never unsubscribed                                        | app.component.ts ~L46                                                                                             | ⚙                  | Use `takeUntilDestroyed()` (Angular 16+) or a `destroy$` subject.                                                                                                                                          |

## 4. Subscriptions / memory leaks

| #   | Finding                                                                                                              | Where                                | Severity | Fix                                                                                                                                            |
| --- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 4.1 | Long-lived `gameData$` subscription in `AppComponent.ngOnInit`                                                       | app.component.ts ~L46                | ⚙        | `takeUntilDestroyed`.                                                                                                                          |
| 4.2 | Socket `socket.on(...)` listeners in `AppComponent.ngAfterViewInit` are never removed                                | app.component.ts ~L54+               | ⚙        | On destroy: iterate registered events and call `socket.off(name)`. Wrap with `fromEvent(socket, name).pipe(takeUntilDestroyed())` for clarity. |
| 4.3 | `loadLobby` `setInterval(1000)` only `clearInterval`s once both real players are loaded; in solo it can keep ticking | game.component.ts `loadLobby` ~L1248 | ⚠        | Convert to a one-shot subscription on `facade.gameData$.pipe(filter(g => g.lobbyPlayers[0]?.loadedIn), take(1))`. Drop the interval.           |
| 4.4 | `tickMoney`'s `setInterval(40ms)` is not stored                                                                      | game.component.ts ~L4582             | 📌       | Store id, clear on destroy and on next click.                                                                                                  |
| 4.5 | `startWaterTimer`'s `setTimeout(30000)` is queued per-area with no central cancel                                    | game.component.ts ~L2236             | 📌       | `Map<areaId, NodeJS.Timeout>`; clear all in `ngOnDestroy`.                                                                                     |
| 4.6 | `setHeadText`, `carryCoolDown` setTimeouts not tracked                                                               | game.component.ts ~L4523, ~L2299     | 🧹       | Track per-target timer; cancel on overlap.                                                                                                     |

## 5. NgRx store hygiene

| #   | Finding                                                                                          | Where                                          | Severity | Fix                                                                                                                                         |
| --- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 5.1 | Reducer is one ~700-line file with ~40 handlers                                                  | [reducer.ts](../src/app/_store/reducer.ts)     | ⚙        | Split into feature reducers (`playerReducer`, `farmReducer`, `upgradeReducer`, `rhythmReducer`) and `combineReducers`.                      |
| 5.2 | `selectors.ts` doesn't memoize derived collections                                               | [selectors.ts](../src/app/_store/selectors.ts) | 📌       | Use `createSelector` chains; expose `selectUpgradesByTarget`, `selectLobbyPlayersByName`, `selectFarmableAreasById` with stable references. |
| 5.3 | `selectUpgradeChoices` shuffles inside the selector → non-deterministic, not memoized            | selectors.ts                                   | ⚙        | Shuffle once on `OpenUpgrades` action; store result in state.                                                                               |
| 5.4 | `lobbyPlayers` is a positional array; full array reference replaced for any single-player change | reducer.ts                                     | ⚙        | Use `@ngrx/entity` adapter (`createEntityAdapter<LobbyPlayer>()`) or normalize to `playersById`.                                            |
| 5.5 | `spriteAnimations` payload is huge and lives in initial state                                    | reducer.ts                                     | 🧹       | Load metadata only per active scene; or move to a static const file imported lazily by the game scene.                                      |
| 5.6 | `effects.ts` `UpgradeChanges$` filters `learnedUpgrades` 5 times                                 | [effects.ts](../src/app/_store/effects.ts)     | 📌       | Read from `selectUpgradesByTarget` once.                                                                                                    |

## 6. Asset loading

| #   | Finding                                                                                                                                   | Where                                                                                                                | Severity | Fix                                                                                                                                                                            |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 6.1 | 90+ sprites loaded sequentially via `new Image(); .onload` chains. `spriteSheetSoil.onload` → `startAnimating(60)` is the chosen sentinel | game.component.ts `loadPlayer`/`loadCrops` ~L1345+, ~L1565                                                           | ⚠        | `Promise.all(sources.map(loadImage))` then call `startAnimating`. Add `.onerror` fallback.                                                                                     |
| 6.2 | No preloader UI between asset load start and `MapLoaded(true)`                                                                            | game.component.ts ~L1296                                                                                             | 📌       | Already have a loading overlay — extend it to track image load progress count/total.                                                                                           |
| 6.3 | 27 MB and 25 MB WAV music files loaded by Phaser                                                                                          | [src/assets/music](../src/assets/music) + [beat-overlay.scene.ts](../src/app/game/phaser/beat-overlay.scene.ts) ~L41 | ⚠        | Convert to OGG Vorbis q4 (~3 MB) using `ffmpeg -i Quacks-120.wav -c:a libvorbis -q:a 4 Quacks-120.ogg`. Update `phaser-game.service.ts` and `mountPhaserOverlay` track string. |
| 6.4 | Single point of failure: any sprite 404 hangs `startAnimating` forever                                                                    | game.component.ts ~L1565                                                                                             | ⚠        | Bundle preload + timeout of 10 s; on failure, dispatch `MapLoaded(true)` with a placeholder texture so user sees feedback.                                                     |
| 6.5 | Cursor URLs declared in many SCSS files                                                                                                   | [game.component.scss](../src/app/game/game.component.scss) etc.                                                      | 🧹       | Move to a single `@mixin cursor-default` and include where needed.                                                                                                             |

## 7. Bundle size

`main.js` raw size: **8.35 MB** (target: ≤ 1.5 MB raw / ~500 KB gzip). Per
[angular.json](../angular.json) the configured budget is 2 MB warning / 5 MB
error — already exceeded.

| #   | Finding                                                                          | Severity                             | Fix                                                                                                |
| --- | -------------------------------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 7.1 | Phaser is statically imported in `phaser-game.service.ts`                        | ⚠                                    | `await import('phaser')` inside `mount()`. Lazy-load only when entering game scene.                |
| 7.2 | `allowedCommonJsDependencies: ['phaser']` blocks tree-shaking                    | [angular.json](../angular.json) ~L30 | 📌                                                                                                 | Use Phaser's ESM build (`phaser/dist/phaser.esm.js`) and remove the allow-list entry. |
| 7.3 | No code splitting between scenes (title / game-select / lobby / game / merchant) | ⚙                                    | Migrate to Angular standalone components + lazy `loadComponent`. Each scene becomes its own chunk. |
| 7.4 | Source maps off in production                                                    | 📌                                   | Enable `sourceMap: { hidden: true, scripts: true }` and upload to error tracker.                   |
| 7.5 | No service worker                                                                | 🧹                                   | `ng add @angular/pwa` for offline play once assets are sized down.                                 |

## 8. Long methods / data-driven refactors

| #   | Site                                                                                            | Where                            | Fix                                                                                                                                                                                               |
| --- | ----------------------------------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 8.1 | `plantSeed` 9× repeated blocks per crop                                                         | game.component.ts ~L2343         | Map `equippedTool → cropKey`: `const SEED_TO_CROP = new Map([['potato-seeds','potato'], …])`. One block: lookup, check `seedsOwned[crop].count > 0`, set `area.state = '${crop}-0'`, emit reduce. |
| 8.2 | `drawFarmable` ~600 lines of `state === 'beets-0'`, `'beets-1'`, …                              | game.component.ts ~L2586         | Parse `state` into `[cropKey, frame]`; lookup spritesheet from `Record<cropKey, HTMLImageElement>`; single `drawImage`.                                                                           |
| 8.3 | `getCultivateSpriteSheet` and its "Others" twin                                                 | game.component.ts ~L3585, ~L3686 | Single map keyed by tool returning `{ left, right, leftKey, rightKey }`. Drop the duplicate function for other players (just pass the player's tool).                                             |
| 8.4 | `farmAction` step transitions are nested switches by `upg.dig`                                  | game.component.ts ~L2504         | Replace with `nextSoil(state, upg.dig)` table indexed `[currentStage][digLevel]`.                                                                                                                 |
| 8.5 | `cultivatable` lists every seed name                                                            | game.component.ts ~L538          | `const SEED_SET = new Set([...]); SEED_SET.has(tool)`.                                                                                                                                            |
| 8.6 | Crop carrying / dropping has the same long if-chain in `drawSpriteBasedOnTool` and `moveOthers` | game.component.ts ~L4865, ~L758  | Same map lookup as 8.3.                                                                                                                                                                           |

## 9. Coordinate / math redundancy

| #   | Finding                                                              | Where                    | Fix                                                                                 |
| --- | -------------------------------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------- |
| 9.1 | `mousePos` divides by `scale` every mousemove                        | game.component.ts ~L4789 | `scale` never changes; precompute `inverseScale = 1 / scale`.                       |
| 9.2 | `isMouseCloseToPlayer` called 5+ times per frame with the same args  | game.component.ts ~L490+ | Memoize for the current frame: store on `this._frameCache.mouseInRange`.            |
| 9.3 | `areasByAreas` parses upgrade strings (`'1x1'`, `'1x3'`, …) per call | game.component.ts ~L4095 | Resolve once at upgrade unlock time into `{ width, height }`; store on the upgrade. |

## 10. Networking & socket semantics

| #    | Finding                                                                                                                                                                                                                                                                        | Where                                      | Severity                                                     | Fix                                                                                                                                                                                                                                                       |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 10.1 | `socket = io(environment.socketUrl)` runs at module construction even on title screen                                                                                                                                                                                          | app.component.ts ~L42                      | 📌                                                           | Move to a `SocketService` whose `connect()` is called from `startSoloOnline` / multiplayer. Solo offline never opens a socket.                                                                                                                            |
| 10.2 | Server uses `socket.broadcast.emit` (sender-excluded) for many events. Client `app.component.ts` partially mirrors locally for 4 of them; others (`changePlayerState`, `updatePlayer`, `playerCultivate`, `playerIsWatering`) are emit-only — sender doesn't see its own state | app.component.ts ~L307+                    | ⚠                                                            | Either (a) make server `io.emit` so the sender also receives, or (b) call the local handler unconditionally on the sender, like we do for `changeHoveredFarm`. We already documented this for the planting bug; check the rest for similar latent issues. |
| 10.3 | No reconnect handler / connection-state UI                                                                                                                                                                                                                                     | ⚙                                          | Add `socket.on('disconnect', …)` → toast; backoff reconnect. |
| 10.4 | All 30s crop timers are client-local — multiplayer clients desync                                                                                                                                                                                                              | game.component.ts `startWaterTimer` ~L2236 | ⚠                                                            | Make server authoritative on crop growth. Server emits `cropGrew { areaId, newState }`. Clients read state, never call `setTimeout`.                                                                                                                      |
| 10.5 | Money is computed on each client                                                                                                                                                                                                                                               | game.component.ts `tickMoney` ~L4582       | 📌                                                           | Move to server.                                                                                                                                                                                                                                           |

## 11. Game-loop timing

| #    | Finding                                                                                    | Where                             | Fix                                                                                                                                                                                                  |
| ---- | ------------------------------------------------------------------------------------------ | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 11.1 | `Date.now()` used as time base                                                             | game.component.ts ~L286           | Use `performance.now()` — monotonic, immune to NTP jumps.                                                                                                                                            |
| 11.2 | Movement is fixed pixels per frame, not per ms                                             | game.component.ts ~L4829          | Apply `delta = (now - then) / 16.67` and multiply velocity by `delta`. Already partially BPM-scaled but still tied to frames.                                                                        |
| 11.3 | Animations use a custom "every Nth tick" cadence — works but is fragile if framerate drops | game.component.ts `animThreshold` | The recent BPM-driven `animThreshold` is the correct direction. Consider migrating fully to ms-based `accumulatedMs >= frameDurationMs` so all animations behave identically when the tab throttles. |

## 12. Drawing / texture optimizations

| #    | Idea                                                                                                                                     | Effort | Win                          |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------- |
| 12.1 | Pre-render static map + collisions to `OffscreenCanvas`                                                                                  | M      | ~30% fewer draw calls/frame  |
| 12.2 | Pack crops into a single texture atlas (one PNG per crop is fine, but stage frames already are atlased — extend to all carrying sprites) | M      | Fewer GPU texture binds      |
| 12.3 | Replace stroked `Path2D` outlines with cached `Path2D` instances per area                                                                | S      | Removes per-frame path build |
| 12.4 | Use `ctx.imageSmoothingEnabled = false` once, not per frame                                                                              | S      | trivial                      |
| 12.5 | Skip drawing tiles outside the visible viewport (camera culling)                                                                         | M      | Big win on larger maps       |

## 13. Tilemap / collision

| #    | Finding                                                                                                      | Where                             | Fix                                                                                                                 |
| ---- | ------------------------------------------------------------------------------------------------------------ | --------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 13.1 | Collision boundary checks iterate the whole `boundaries` array per direction, per frame                      | game.component.ts movement ~L4829 | Build a uniform spatial grid `Map<gridKey, Boundary[]>` at load time; query the 3×3 neighborhood around the player. |
| 13.2 | `targetNearestSquare` walks every farmable area                                                              | game.component.ts ~L4181          | Same grid, query around mouse.                                                                                      |
| 13.3 | `boundaries`, `wellAreas`, `houseAreas`, etc., are duplicated state living both in NgRx and on the component | game.component.ts L162+           | Pick one source of truth. The NgRx data is sufficient; component should hold derived spatial indexes only.          |

## 14. Type safety

| #    | Finding                                                                 | Where                                  | Fix                                                                                               |
| ---- | ----------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 14.1 | Almost every callback is typed `evt`, `area`, `player` (implicit `any`) | game.component.ts and app.component.ts | Annotate with `MouseEvent`, `FarmableArea`, `LobbyPlayer`.                                        |
| 14.2 | `tsconfig.json` doesn't enable `strict` / `strictNullChecks`            | [tsconfig.json](../tsconfig.json)      | Enable `strict: true`, then resolve the resulting errors incrementally per feature folder.        |
| 14.3 | Socket event payloads are untyped                                       | app.component.ts ~L54+                 | Define `interface SocketEvents { changeHoveredFarm: ChangeFarmEvt; … }` and a thin typed wrapper. |
| 14.4 | `AppComponent` properties (e.g. `gameComponent: GameComponent           | null`) accessed via `?.` everywhere    | app.component.ts                                                                                  | OK as a defensive style, but a guarded narrowing helper (`withGame(fn)`) reduces noise. |

## 15. Dead / unused code

| #    | Finding                                                                        | Where                           |
| ---- | ------------------------------------------------------------------------------ | ------------------------------- | ----------------------------------------------------------- |
| 15.1 | `console.log('Loading screen maybe?')`                                         | game.component.ts ~L1284        |
| 15.2 | `this.canvas;` and `this.pickupables;` no-op statements                        | game.component.ts ~L1294, ~L500 |
| 15.3 | Commented `playerIsWatering` socket block                                      | app.component.ts ~L89           |
| 15.4 | Commented hitbox debug                                                         | game.component.ts ~L399, ~L1860 |
| 15.5 | `mainFrameIndex`, `mainFrameCount` declared but unused                         | game.component.ts ~L271         |
| 15.6 | `framesDrawn = [0,0,0,0,0,0,0,0,0,0,0,0]` — fixed length 12 with 4-player game | game.component.ts ~L188         | Replace with `Array.from({ length: maxPlayers }, () => 0)`. |

## 16. Tests

| #    | Finding                                                                                      | Fix                                                                                                                       |
| ---- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 16.1 | Spec files exist (`*.spec.ts`) but were last touched against the Angular 13 testbed          | `npx ng test` and either fix or delete obsolete specs.                                                                    |
| 16.2 | No coverage of `app.component.ts` socket fallback logic — exactly where the planting bug hid | Add a Jest/Karma test that fires `changeHoveredFarm` and asserts `gameComponent.changeStateOfHoveredFarmable` was called. |
| 16.3 | No e2e                                                                                       | Optional: Playwright smoke for "title → solo → dig → plant → water → harvest".                                            |

## 17. UX / accessibility

| #    | Finding                                                                                | Where                                                      | Fix                                                                                                                     |
| ---- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 17.1 | No pause on window blur — battery drain                                                | game.component.ts                                          | `window.addEventListener('blur', stop)`.                                                                                |
| 17.2 | Phaser overlay text is CSS-scaled along with the game canvas → blurry at 1.5× / 1.875× | [game.component.scss](../src/app/game/game.component.scss) | Render Phaser at the actual scaled resolution; use Phaser's `Scale.Manager` `RESIZE` mode and pass scaled width/height. |
| 17.3 | Cursor URL fallback chain ends at `pointer` only                                       | many `*.scss`                                              | Add `default` as final fallback.                                                                                        |
| 17.4 | No fullscreen affordance                                                               | app.component.html                                         | Optional `Fullscreen API` button on title.                                                                              |

## 18. Build / runtime config

| #    | Finding                                           | Where                                                | Fix                                                                                  |
| ---- | ------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 18.1 | Production budget exceeded (8.35 MB > 5 MB error) | [angular.json](../angular.json) ~L26                 | Bring main.js under 2 MB via items 7.1–7.3.                                          |
| 18.2 | No build artifact analysis in CI                  | n/a                                                  | Add `source-map-explorer dist/.../main.*.js` step.                                   |
| 18.3 | No CSP, no `Cross-Origin-Opener-Policy`           | [src/index.html](../src/index.html)                  | Add `<meta http-equiv="Content-Security-Policy" …>` and harden when ready to deploy. |
| 18.4 | No environment flag for `enableSocket`            | [environment.ts](../src/environments/environment.ts) | Add `enableMultiplayer: boolean`; gate the `io(...)` call.                           |

## 19. Audio polish

| #    | Finding                                                                     | Where                                                                      | Fix                                                                                                                  |
| ---- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 19.1 | `startMusic()` rebuilds the `Phaser.Sound.BaseSound` on every overlay mount | [beat-overlay.scene.ts](../src/app/game/phaser/beat-overlay.scene.ts) ~L51 | Cache via Phaser cache; reuse on remount.                                                                            |
| 19.2 | Volume is hard-coded `0.6`                                                  | beat-overlay.scene.ts ~L60                                                 | Persist in NgRx (`rhythm.volume`) so a future settings menu can wire it.                                             |
| 19.3 | No second audio channel for SFX (dig, drop, coin)                           | n/a                                                                        | Add `Phaser.Sound.HTML5AudioSoundManager`-based SFX channel; or a small `AudioContext` service if Phaser is removed. |

## 20. Multiplayer state authority (longer-term)

The architecture as-is leaks server-side concerns into every client:

- Crop ripening, money, energy regen all run on each client's own `setTimeout`.
- Tile state changes (`dig`, `plant`, `water`) update locally and via socket
  broadcast, but the server only proxies — it doesn't reject or validate.
- A malicious client can mint money or harvest infinitely.

Recommended path:

1. Move `farmableArea`, `pickupables`, and `money` into server state.
2. Clients send _intents_ (`{ type: 'dig', areaId }`).
3. Server validates (energy ≥ 3, area cultivatable, not already in use),
   updates state, broadcasts `state-delta` to all clients.
4. Clients render from delta. Local optimistic update is fine for animation
   start, but the authoritative state wins after the next server tick.

This is a meaningful refactor; only worth it if multiplayer becomes a real
feature.

---

## Suggested ordering

**Phase 1 — performance & stability (1–2 days):**
items 1.1, 1.4, 2.1, 3.1, 3.2, 4.3, 6.1, 7.1, 19.1.

**Phase 2 — bundle & assets (½–1 day):**
items 6.3, 7.2, 7.3, 18.1, 18.4.

**Phase 3 — refactors (2–3 days):**
items 5.1, 5.4, 8.1, 8.2, 8.3, 13.1, 14.1, 14.2.

**Phase 4 — UX polish (½ day):**
items 11.1, 11.2, 17.1, 17.2.

**Phase 5 — multiplayer authority (separate epic):** §20.
