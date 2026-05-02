# Farm For Your Life: Game Flow And User Experience

## Purpose

This document describes the full player journey from launch to endgame, based on the current implemented behavior. It reflects the state of the codebase as of May 2026 and serves as the authoritative reference for UX decisions going forward.

---

## Core Experience Summary

High level loop:

1. First launch shows controls card. Player dismisses it and enters the title screen.
2. Choose a play mode and proceed through lobby.
3. Spawn into the farm map with tools, seeds, energy, and water.
4. Left click for primary world actions (dig, mine, fish, drop/sell when carrying).
5. Right click to water (or open shop near merchant).
6. Number keys 1-9 to plant seeds (instantly if seed instant-plant mode is on).
7. Earn resources, buy upgrades, repeat the farm-combat-economy loop.
8. Reach the win condition (badge count) to show the win screen.

Rhythm layer:

1. Actions are judged against the beat: Poor, Okay, Good, Great, Perfect.
2. Judgement drives score and combo display.
3. Judgement also drives variable energy cost per action (5 down to 1).
4. A floating energy delta (e.g. -2) appears above the player after each judged action.

---

## End-To-End Flow

## 1) First Launch And Controls Card

Player view:

1. Controls card overlay appears on the first visit (localStorage flag `ffyl_controls_seen` absent).
2. Card shows: WASD move, left click actions, right click water/shop, 1-9 seeds, Shift+click attack, WASD to wake from sleep.
3. Energy cost scale is shown in matching judgement colors: Poor 5 > Okay 4 > Good 3 > Great 2 > Perfect 1.
4. Player clicks "Got it!" or clicks outside the card to dismiss. Flag is set; card will not reappear.

Implementation notes:

1. `ControlsCardComponent.shouldShow()` checks localStorage.
2. `AppComponent.showControlsCard` is set at init time and bound in the template.
3. The card can be re-shown programmatically by clearing the flag and setting `showControlsCard = true`.

UX status: good.

## 2) Title Screen And Frontend Entry

Player view:

1. Title screen appears.
2. Player chooses mode and proceeds toward game/lobby.

UX status: standard front-door, no issues.

## 3) Lobby And Match Start

Player view:

1. Lobby initializes and players load.
2. Scene transitions into the active map.

UX status: functional. Per-player ready indicator is a future nice-to-have.

## 4) Spawn And Immediate Orientation

Player view:

1. Character appears at the map start position.
2. HUD shows: energy bar, water bar, gold, badge count, seed hotbar.
3. Reachable tile overlay (pale blue tint) appears around the player, drawn under the character sprite.
4. Tool action panel shows left-click and right-click hints immediately.

Current behavior details:

1. Reach grid uses tile-rectangle world intersection, not a static pixel grid.
2. Seed hotbar is always visible (not hidden behind a basket toggle).
3. Rhythm HUD (score, combo, judgement) is shown at top center when rhythm is enabled.
4. Energy cost legend (P:5 Ok:4 G:3 Gr:2 ★:1) is visible under the judgement display.

UX status: good. Players have enough information to start acting immediately.

## 5) Movement And Navigation

Player view:

1. Move with WASD. Character facing and animation update while moving.
2. Movement speed scales with BPM (anchor: 120 BPM = velocity 4).

Current behavior details:

1. Movement can be re-initiated anytime.
2. If player is sleeping, any movement key wakes them immediately.
3. Hero walk/idle animations run on a 2-beat cycle to match the goblin merchant.

UX status: good.

## 6) Primary Action — Left Click

Current behavior:

1. If carrying: left click drops/sells contextually.
2. If Shift held: left click attacks (costs 10 energy).
3. Otherwise: always routes to dig/mine/fish action for the hovered area.
4. Re-clicking during an animation restarts the animation immediately.
5. Dig input buffer: if the player clicks when `mayFarm` is briefly false between frames, the click is held for up to 250 ms and replayed as soon as the condition clears.

Left-click HUD label:

1. Shows Dig (shovel), Mine (pickaxe), or Fish (rod) depending on equipped tool.
2. Shows Drop/Sell (coin) when carrying.
3. Entire left panel fades when nothing is in range.

UX status: good. Action role is unambiguous.

## 7) Secondary Action — Right Click

Current behavior:

1. Right click always attempts to water the hovered area.
2. Exception: if near merchant and shop is not already open and not carrying, right click opens shop instead.
3. Right click is a no-op while sleeping or mid-water animation.

Right-click HUD:

1. Shows water icon + "Water" label when a watering target is in range.
2. Shows water-fill icon + "Refill" label when near a well.
3. Shows coins icon + "Open Shop" label when near merchant.
4. All stale go-back and bed icons have been removed.

UX status: good. Context is always visible before the player clicks.

## 8) Seeds And Planting

Current behavior:

1. Seed hotbar is always open (no basket toggle).
2. Number keys 1-9: equip the seed. If seed instant-plant mode is on (default), also plant immediately on valid soil-3 tiles in range.
3. Left click no longer plants seeds.

Seed mode toggle:

1. A small button sits above the seed hotbar (green = instant plant, grey = equip only).
2. Toggle emits `toggleSeedMode` -> dispatches `ToggleSeedInstantPlant` action -> flips `GameState.seedInstantPlant`.
3. State persists for the session (not currently saved to localStorage).

UX status: good. Instant-plant is convenient; equip-only mode available for players who prefer deliberate placement.

## 9) Water Management

Current behavior:

1. Right click waters targeted area, costs 8 water per use.
2. Near-well auto-refill: entering well range refills water to max once per enter event (gate flag `autoRefillRequested` resets on exit).
3. Right-click HUD shows "Refill" label near wells.

Floating hint behavior:

1. "Need Water!" head text appears if watering is attempted with no water.

UX status: good. Low friction; well proximity removes the manual refill step.

## 10) Energy And Fatigue

Current behavior:

1. Every farm action (dig, water, plant, harvest, mine, fish) costs energy based on rhythm judgement.
2. Poor = 5, Okay = 4, Good = 3, Great = 2, Perfect = 1.
3. Pre-action affordability check uses worst-case cost (5) so actions are never blocked mid-animation.
4. If energy is too low, "Too tired..." head text appears.
5. Near-house auto-rest triggers when too tired and at the house door area.

Rhythm feedback:

1. Judgement label (Poor / Okay / Good / Great / Perfect) flashes in the rhythm HUD in matching color.
2. After each judged action a small amber floating text (e.g. -2) rises above the player and fades out over ~1.2 seconds.
3. Energy cost legend is always visible in the rhythm HUD: P:5 Ok:4 G:3 Gr:2 ★:1 in matching colors.

UX status: good. The rhythm-energy link is now transparent at all levels of detail.

## 11) House And Rest

Current behavior:

1. Auto-rest triggers when energy is too low and the player is at the house door.
2. Pressing WASD wakes the player and restores control.
3. While sleeping a pulsing overlay reads: "Zzz… Press WASD to wake".

UX status: good. The stuck-sleeping trap is resolved; the hint eliminates confusion.

## 12) Merchant And Economy

Current behavior:

1. Carry crops/items, then left click to drop/sell on merchant.
2. Right click near merchant opens shop.
3. Right-click HUD clearly shows "Open Shop" with the coins icon when merchant is targeted.
4. Left-click HUD shows "Drop/Sell" with the coin icon when carrying.

UX status: good. Both sell and buy paths are clearly labeled.

## 13) Upgrades, Progression, Win

Player view:

1. Earn money and badges through repeated actions.
2. Buy upgrades to improve movement, tools, and economy.
3. Reach badge win condition and show win screen.

UX status: functional.

---

## Current Control Reference

| Input         | Action                                  |
| ------------- | --------------------------------------- |
| WASD          | Move / wake from sleep                  |
| Left Click    | Dig / Mine / Fish / Drop+Sell (context) |
| Right Click   | Water / Open Shop (context)             |
| 1-9           | Equip seed (+ instant plant if mode on) |
| Shift + Click | Attack                                  |

---

## HUD Reference

| Element               | Location        | Description                                                |
| --------------------- | --------------- | ---------------------------------------------------------- |
| Energy bar            | Top left        | Current / max energy with green fill                       |
| Gold                  | Below energy    | Coin icon + amount                                         |
| Rhythm score          | Top center      | Score, combo, last judgement label                         |
| Energy cost legend    | Under judgement | P:5 Ok:4 G:3 Gr:2 ★:1 in judgement colors                  |
| Floating energy delta | Above player    | Fades up after each judged action (-1 to -5)               |
| Left-click panel      | Bottom left     | Tool icon + Dig / Mine / Fish / Drop/Sell label            |
| Right-click panel     | Bottom left     | Water/Refill/Open Shop icon + label + water bar            |
| Seed hotbar           | Bottom right    | Always visible; active seed highlighted; seed counts shown |
| Seed mode button      | Above hotbar    | Green = instant plant, grey = equip only                   |
| Sleep hint            | Screen center   | Pulsing overlay while sleeping                             |
| Range overlay         | World canvas    | Pale blue tint on reachable tiles, drawn under player      |

---

## Validation Checklist

1. Controls card shows on first session and does not reappear after dismissal.
2. Left click on farm tile always digs, never plants.
3. Re-click during dig restarts animation immediately.
4. Buffered dig: click during brief mayFarm=false gap replays within 250 ms.
5. Right click waters in normal world interactions.
6. Right click on merchant opens shop.
7. Right-click HUD label changes to "Open Shop" near merchant.
8. Right-click HUD label changes to "Refill" near well.
9. No go-back or bed icons appear in the right-click panel.
10. Seed hotbar is always visible.
11. Number key equips and plants instantly when seedInstantPlant is true.
12. Number key only equips when seedInstantPlant is false.
13. Seed mode toggle button reflects current mode in real time.
14. Near-well auto-refill triggers once per enter.
15. Too-tired near-house auto-rest triggers.
16. Movement while sleeping wakes player.
17. Sleep hint overlay shows while sleeping.
18. Rhythm judgement applies variable action energy cost (5 to 1).
19. Floating energy delta appears after each judged action.
20. Energy cost legend visible in rhythm HUD.
21. Hero walk animation runs on 2-beat cycle (matches goblin).

---

## Known Gaps / Future Work

1. Seed instant-plant mode is not persisted across sessions (localStorage not used for this setting).
2. No per-player ready indicator in lobby.
3. No in-game re-openable controls/help panel (controls card only shows once without clearing localStorage).
4. Dual progression goals (economy vs rhythm score) are not yet separated in the UI.
5. No floating "Water Refilled" text near well on auto-refill.

## Purpose

This document describes the full player journey from launch to endgame, based on the current implemented behavior. It also evaluates whether each step makes sense from a user-experience perspective and proposes concrete improvements.

The goal is to answer:

1. What does the player do from start to finish?
2. What does the game communicate at each step?
3. Where can players get confused or blocked?
4. What should we change to make the flow clearer and more satisfying?

---

## Core Experience Summary

High level loop:

1. Enter the game and choose a play mode/lobby flow.
2. Spawn into the farm map with tools, seeds, energy, and water.
3. Use left click for primary actions (dig, mine, fish, harvest, sell/drop when carrying).
4. Use right click for watering, except on merchant where right click opens shop.
5. Use number keys for instant seed planting (if valid target/range).
6. Keep earning resources and upgrading efficiency.
7. Repeat farm-combat-economy loop until win condition/badge progression is met.

Rhythm layer:

1. Gameplay actions are judged against beat timing (Poor, Okay, Good, Great, Perfect).
2. Judgement drives score feedback.
3. Judgement now also drives variable action energy cost.

---

## End-To-End Flow

## 1) Launch And Frontend Entry

Player view:

1. Title screen appears.
2. Player chooses mode and proceeds toward game/lobby.

UX check:

1. Makes sense: yes, standard front-door flow.
2. Risk: if controls/mechanics are complex, onboarding is too light.

Recommended change:

1. Add a short one-screen controls summary before first match.

## 2) Lobby And Match Start

Player view:

1. Lobby initializes and players load.
2. Scene transitions into active map.

UX check:

1. Makes sense: yes.
2. Risk: waiting state clarity (who is loaded, who is not).

Recommended change:

1. Explicit per-player ready state indicator and countdown.

## 3) Spawn And Immediate Orientation

Player view:

1. Character appears at the farm map start position.
2. UI shows energy, water, money, seeds, and action hints.
3. Reachable tile overlay appears around player.

Current behavior details:

1. Reach grid highlights reachable world tiles.
2. Overlay is intentionally light and drawn under the player.
3. Seed hotbar is always visible.

UX check:

1. Makes sense: mostly yes.
2. Risk: players may not understand why some highlighted tiles are not valid for the currently equipped interaction type.

Recommended change:

1. Keep range highlight base color.
2. Add context tint layer for actionable tiles by current input intent:
3. Left click actionable = yellow border.
4. Right click actionable (water) = blue border.

## 4) Movement And Navigation

Player view:

1. Move with WASD.
2. Character facing and animation update while moving.

Current behavior details:

1. Movement can be re-initiated anytime.
2. If player was sleeping in house, movement key now exits sleep state.

UX check:

1. Makes sense: yes.
2. This is now responsive and predictable.

## 5) Primary Action Input (Left Click)

Player expectation:

1. Left click should be primary world action.

Current behavior details:

1. If carrying item: left click drops/sells contextually.
2. If shift held: left click attacks.
3. On farmable ground: left click now always routes to dig behavior (not plant).
4. Re-clicking while dig animation is mid-progress restarts animation immediately.
5. Outside normal farm context:
6. Fishable tile => fish action path.
7. Minable tile => mine action path.
8. Merchant interaction can still route to open-shop action based on context.

UX check:

1. Makes sense: yes, this is coherent primary action behavior.
2. Better than before because seed mode no longer hijacks left click into plant unexpectedly.

## 6) Secondary Action Input (Right Click)

Player expectation:

1. Right click should consistently water.
2. Merchant should be special-cased for buying.

Current behavior details:

1. Right click is watering path by default.
2. If interacting with merchant, right click opens shop instead of watering.

UX check:

1. Makes sense: yes.
2. This exception is understandable and useful.

Recommended change:

1. Update right-click icon logic to show coins when merchant-targeted, water otherwise.
2. Remove any stale go-back icon states entirely.

## 7) Seeds And Planting

Current behavior details:

1. Seed hotbar is always open.
2. Number keys 1-9 select seed and immediately plant when valid target exists.
3. Left click no longer implicitly plants from seed mode.

UX check:

1. Makes sense: mostly yes.
2. Risk: instant plant on keypress can surprise players if they intended only to equip.

Recommended change:

1. Optional setting: number key behavior mode.
2. Mode A (current): equip and plant instantly if valid.
3. Mode B: equip only.

## 8) Water Management

Current behavior details:

1. Watering uses right click.
2. Water can auto-refill when near well.

UX check:

1. Makes sense: yes, very low friction.
2. Risk: if refill is silent, players may miss why water jumped to max.

Recommended change:

1. Show tiny floating text near well: Water Refilled.
2. Add subtle refill SFX.

## 9) Energy And Fatigue

Current behavior details:

1. Rhythm judgement now controls energy cost per action:
2. Poor = 5
3. Okay = 4
4. Good = 3
5. Great = 2
6. Perfect = 1
7. If energy is too low, player gets Too tired feedback.
8. When too tired and near house door, resting auto-triggers.

UX check:

1. Makes sense conceptually: yes, strong rhythm-reward link.
2. Potential confusion: pre-action checks use worst-case affordability, but actual cost varies by performance.

Recommended change:

1. In UI, show projected energy cost range next to rhythm hint: Cost 1-5.
2. On judgement popup, add small energy delta text (for example Great -2).

## 10) House And Rest

Current behavior details:

1. Auto-rest can trigger when too tired and at house door.
2. Pressing movement keys exits rest and returns control.

UX check:

1. Makes sense: yes.
2. This resolves prior trap state where players felt stuck.

Recommended change:

1. Add on-screen hint while sleeping: Press WASD to wake.

## 11) Merchant And Economy

Current behavior details:

1. Carry crops/items, then drop/sell on merchant interaction.
2. Right click near merchant opens shop.

UX check:

1. Makes sense: yes.
2. Keep interaction language explicit because one target supports both shopping and selling depending on context.

Recommended change:

1. When merchant is targeted, display two prompts:
2. Left Click: Sell Carried Item
3. Right Click: Open Shop

## 12) Upgrades, Progression, Win

Player view:

1. Earn money and badges through repeated actions.
2. Buy upgrades to improve movement/tools/economy.
3. Reach win condition and show win screen.

UX check:

1. Makes sense: yes.
2. Risk: if rhythm score and economic progression are both active, players need clearer prioritization.

Recommended change:

1. Separate progression goals in UI:
2. Economy objective
3. Rhythm score objective

---

## Does The Flow Make Sense Overall?

Short answer: yes, it now mostly makes sense.

What is now good:

1. Left click and right click roles are much clearer than before.
2. Seed UI is persistent and direct.
3. Rest and refill quality-of-life behaviors reduce friction.
4. Dig re-triggering feels responsive.

What is still a little confusing:

1. Right-click HUD icon states can drift from actual behavior.
2. Seed hotkey instant-plant may feel too aggressive for some players.
3. Variable rhythm energy costs are powerful but not yet well-explained in UI.

---

## Proposed Changes (Prioritized)

## P0: Clarity And Consistency

1. Remove any remaining go-back/right-click icon conditions in game UI.
2. Make right-click prompt context-sensitive and explicit (Water vs Open Shop).
3. Add sleep wake hint text while resting.

## P1: Input Comfort

1. Add setting for seed hotkeys: instant plant vs equip only.
2. Add optional input buffer for rapid dig taps so every click is guaranteed to restart cleanly.

## P2: Rhythm Transparency

1. Show action energy cost by judgement in HUD legend.
2. Show per-action energy spent in floating feedback.

## P3: Onboarding

1. One-page controls card on first session.
2. Optional re-openable controls/help panel from pause/settings.

---

## Suggested UX Copy

Use short, persistent hints near cursor or in top-left action panel:

1. Left: Dig / Mine / Fish / Sell
2. Right: Water
3. Merchant targeted: Right: Shop
4. Too tired: Go home to rest
5. Sleeping: Press WASD to wake

---

## Validation Checklist For Current Flow

1. Left click on farm tile always digs, never plants.
2. Re-click during dig restarts animation immediately.
3. Right click waters in normal world interactions.
4. Right click on merchant opens shop.
5. Seed hotbar is always visible.
6. Number key can plant when valid.
7. Near-well auto-refill triggers once per enter.
8. Too-tired near-house auto-rest triggers.
9. Movement while sleeping wakes player.
10. Rhythm judgement applies variable action energy cost.

---

## Conclusion

The game flow is close to coherent and playable end-to-end. Most major interaction contradictions have been resolved. Remaining work is primarily UX communication: making sure the player can always predict what each click will do and why resources changed.

If we address the P0 items above, the experience will feel significantly more intentional and easier to learn without sacrificing depth.
