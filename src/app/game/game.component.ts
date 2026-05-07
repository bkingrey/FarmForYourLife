import { GameUtils } from './game.util';
import {
  GameState,
  SpriteMetrics,
  KeyWASD,
  Pickupable,
  PLANT_COSTS,
  PLANT_MULTIPLIER,
  LobbyPlayer,
  FarmActionType,
} from './../_store/models';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { intializeState } from '../_store/reducer';
import { PhaserGameService } from './phaser/phaser-game.service';
import { AppFacade } from '../app.facade';
import { AddRhythmJudgement, MapLoaded } from '../_store/actions';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
})
export class GameComponent
  extends GameUtils
  implements AfterViewInit, OnChanges, OnDestroy
{
  protected override get interactionRangePx(): number {
    return 88 * Number(this.upg?.range ?? 1);
  }

  @Input() gameData: GameState = intializeState();
  @ViewChild('phaserHost', { static: true })
  phaserHost: ElementRef<HTMLDivElement> | null = null;
  private phaserSub: Subscription | null = null;
  @Output() keyChange = new EventEmitter();
  @Output() removeKeyDown = new EventEmitter();
  @Output() changeTool = new EventEmitter();
  @Output() reduceSeedCount = new EventEmitter();
  @Output() changeEnergy = new EventEmitter();
  @Output() changeVelocity = new EventEmitter();
  @Output() changeWaterMeter = new EventEmitter();
  @Output() changeMoney = new EventEmitter();
  @Output() canHarvest = new EventEmitter();
  @Output() canOpenShop = new EventEmitter();
  @Output() canFillWater = new EventEmitter();
  @Output() canEnterHouse = new EventEmitter();
  @Output() isSleeping = new EventEmitter();
  @Output() goInHouse = new EventEmitter();
  @Output() openShop = new EventEmitter();
  @Output() changePlayerState = new EventEmitter();
  @Output() changeHoveredFarm = new EventEmitter();
  @Output() cultivateOther = new EventEmitter();
  @Output() updatePlayer = new EventEmitter();
  @Output() playerFromMiddle = new EventEmitter();
  @Output() dropPickupable = new EventEmitter();
  @Output() removePickupable = new EventEmitter();
  @Output() playerCultivate = new EventEmitter();
  @Output() playerIsWatering = new EventEmitter();
  /** Base velocity scales linearly with the music tempo (anchor: 120 BPM). */
  get defaultVelocity(): number {
    return 4 * (this.currentBpm / 120);
  }
  upg: any;
  isWatering = false;
  scale: number = 0.5;
  squareSize: number = 64;
  canvasId: string = 'game-canvas';
  canvas: HTMLCanvasElement | null = null;
  ctx: CanvasRenderingContext2D | null = null;
  player: SpriteMetrics = {
    width: 0,
    height: 0,
    position: {
      x: 0,
      y: 0,
    },
    center: {
      x: 0,
      y: 0,
    },
  };
  map = new Image();
  foregroundMap = new Image();
  mapImage = {
    position: {
      x: 237,
      y: -40,
    },
  };
  boundary = {
    position: { x: this.mapImage.position.x, y: this.mapImage.position.y },
    width: 64,
    height: 64,
  };
  boundaries: any = [];
  farmableArea: any = [];
  /**
   * O(1) lookup map for farmable areas by id. Built in createFarmableArea
   * after the area objects exist; mutations to area.state happen in-place
   * on the same object references the array holds, so no further sync is
   * needed. Replaces the previous farmableArea.filter(a=>a.id===id)[0]
   * pattern (9× per plantSeed click).
   */
  private areaById: Map<string, any> = new Map();
  fishableArea: any = [];
  minableArea: any = [];
  houseArea: any = [];
  wellArea: any = [];
  untargetableArea: any = [];
  /** Cached flat array of all interactive areas for range-overlay; rebuilt once after map init. */
  private _reachableAreas: any[] = [];
  /** Throttle: last key used to guard changePlayerState.emit. */
  private _lastPlayerStateKey = '';
  /** Throttle: last emitted playerFromMiddle position. */
  private _lastFromMiddleX: number | null = null;
  private _lastFromMiddleY: number | null = null;
  traders: any = [];
  /** How many of the same item the player is currently carrying (1-4). */
  carryCount = 0;
  isShiftDown = false;
  attackInitiated = false;
  headText = '';
  /** Energy cost shown briefly after each rhythm judgement (e.g. "-2"). */
  private energyDeltaText = '';
  private energyDeltaExpiresMs = 0;

  spriteSheetIdleRight = new Image();
  spriteSheetIdleLeft = new Image();
  spriteSheetWalkRight = new Image();
  spriteSheetWalkLeft = new Image();
  spriteSheetDigRight = new Image();
  spriteSheetDigLeft = new Image();
  spriteSheetWaterRight = new Image();
  spriteSheetWaterLeft = new Image();
  spriteSheetHammerRight = new Image();
  spriteSheetHammerLeft = new Image();
  spriteSheetPickaxeRight = new Image();
  spriteSheetPickaxeLeft = new Image();
  spriteSheetMineRight = new Image();
  spriteSheetMineLeft = new Image();
  spriteSheetBroomRight = new Image();
  spriteSheetBroomLeft = new Image();
  spriteSheetFishRight = new Image();
  spriteSheetFishLeft = new Image();
  spriteSheetPlantRight = new Image();
  spriteSheetPlantLeft = new Image();
  spriteSheetSoil = new Image();
  spriteSheetBeets = new Image();
  spriteSheetCabbage = new Image();
  spriteSheetCarrot = new Image();
  spriteSheetCauliflower = new Image();
  spriteSheetKale = new Image();
  spriteSheetPotato = new Image();
  spriteSheetRadish = new Image();
  spriteSheetSunflower = new Image();
  spriteSheetWheat = new Image();
  spriteReadyBeets = new Image();
  spriteReadyCabbage = new Image();
  spriteReadyCarrot = new Image();
  spriteReadyCauliflower = new Image();
  spriteReadyKale = new Image();
  spriteReadyPotato = new Image();
  spriteReadyRadish = new Image();
  spriteReadySunflower = new Image();
  spriteReadyWheat = new Image();
  spriteReadySmallFish = new Image();
  spriteReadyMediumFish = new Image();
  spriteReadyHugeFish = new Image();
  spriteReadyNugget = new Image();
  spriteCarryBeetsLeft = new Image();
  spriteCarryBeetsRight = new Image();
  spriteCarryCabbageLeft = new Image();
  spriteCarryCabbageRight = new Image();
  spriteCarryCarrotLeft = new Image();
  spriteCarryCarrotRight = new Image();
  spriteCarryCauliflowerLeft = new Image();
  spriteCarryCauliflowerRight = new Image();
  spriteCarryKaleLeft = new Image();
  spriteCarryKaleRight = new Image();
  spriteCarryPotatoLeft = new Image();
  spriteCarryPotatoRight = new Image();
  spriteCarryRadishLeft = new Image();
  spriteCarryRadishRight = new Image();
  spriteCarrySunflowerLeft = new Image();
  spriteCarrySunflowerRight = new Image();
  spriteCarryWheatLeft = new Image();
  spriteCarryWheatRight = new Image();
  spriteCarrySmallFishLeft = new Image();
  spriteCarrySmallFishRight = new Image();
  spriteCarryMediumFishLeft = new Image();
  spriteCarryMediumFishRight = new Image();
  spriteCarryHugeFishLeft = new Image();
  spriteCarryHugeFishRight = new Image();
  spriteCarryNuggetLeft = new Image();
  spriteCarryNuggetRight = new Image();
  spriteSleepBubbles = new Image();
  goblinMerchantRight = new Image();
  goblinMerchantLeft = new Image();
  goblinFramesDrawn = 0;
  goblinFrameIndex = 0;

  movables: Array<any> = [];
  animate: any;
  frameIndex = 0;
  framesDrawn = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  actionsDrawn = 0;
  otherPlayersFrameIndex = [0, 0, 0, 0];
  otherPlayersFramesDrawn = [0, 0, 0, 0];
  otherCultivateFrameIndex = [0, 0, 0, 0];
  otherCultivateFramesDrawn = [0, 0, 0, 0];
  actionFrameIndex = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  attackAnimationFrameIndex = 0;
  attackAnimationFramesDrawn = 0;
  pickupableFrameIndex: Array<number> = [];

  pickupableFramesDrawn: Array<number> = [];
  mousePos = {
    x: 0,
    y: 0,
  };
  queuedActivation = false;
  mayFarm = false;
  /** If the player left-clicks while mayFarm is momentarily false, buffer the
   *  request and replay it on the next frame when mayFarm becomes true. */
  private pendingDigUntilMs = 0;
  otherFarmableArea: any = [];
  waterableArea: any = [];
  sowableArea: any = [];
  hoveredFarmableArea = {
    position: {
      x: -1,
      y: -1,
    },
    center: {
      x: -1,
      y: -1,
    },
    width: -1,
    height: -1,
    state: 'none',
    watered: false,
    id: '',
  };
  clickedFarmableArea: any = [];
  activatedArea = {
    position: {
      x: -1,
      y: -1,
    },
    center: {
      x: -1,
      y: -1,
    },
    width: -1,
    height: -1,
    state: 'none',
    id: '',
  };
  defaultFarmState = {
    position: {
      x: -1,
      y: -1,
    },
    center: {
      x: -1,
      y: -1,
    },
    width: -1,
    height: -1,
    state: 'none',
    watered: false,
    id: '',
  };
  pickupables: Array<Pickupable> = [];
  bubblesFramesDrawn: number = 0;
  bubblesFrameIndex: number = 0;
  private sleepEnergyBeatIndex = -1;
  private sleepBeatAnchorMs: number | null = null;
  private sleepEnteredAtMs = 0;
  memoryKeys: KeyWASD = {
    w: {
      pressed: false,
    },
    a: {
      pressed: false,
    },
    s: {
      pressed: false,
    },
    d: {
      pressed: false,
    },
  };
  lobbyPlayers: Array<LobbyPlayer> = [];
  mainFrameIndex = 0;
  mainFrameCount = 0;
  fpsInterval = 0;
  now = 0;
  then = 0;
  startTime = 0;
  elaspsed = 0;
  private autoRefillRequested = false;
  private static readonly MAX_ACTION_ENERGY_COST = 5;
  private readonly countdownLabels = ['5', '4', '3', '2', '1', 'GO'];
  private countdownStartMs: number | null = null;
  private countdownStepMs = 1000;
  private countdownUnlocked = true;
  private miningMisses = 0;
  startupCountdownLabel = '';

  /** Current music BPM (defaults to 120). */
  private get currentBpm(): number {
    return this.gameData.rhythm?.bpm ?? 120;
  }

  /**
   * Game tick threshold ("framesDrawn > N" style) so that a `frames`-frame
   * animation completes in `beats` musical beats at the current BPM.
   * The game loop runs at 60 FPS (16.67ms / tick).
   */
  private animThreshold(frames: number, beats = 2): number {
    const safeFrames = Math.max(1, frames);
    const safeBpm = Math.max(1, this.currentBpm);
    const durationMs = (60000 / safeBpm) * beats;
    const ticksPerFrame = (durationMs * 60) / (safeFrames * 1000);
    return Math.max(0, Math.round(ticksPerFrame) - 1);
  }

  /** Beat length per cultivate animation, keyed by equipped tool. */
  private cultivateBeats(): number {
    switch (this.gameData.equippedTool) {
      case 'rod':
        return 4;
      case 'pickaxe':
      case 'hammer':
      case 'broom':
        return 2;
      case 'shovel':
        return 1;
      default:
        // seeds + watering + misc
        return 1;
    }
  }

  private get beatMs(): number {
    return 60000 / Math.max(1, this.currentBpm);
  }

  private get countdownBeatsPerStep(): number {
    return Math.max(1, Math.round(500 / this.beatMs));
  }

  private get isStartupCountdownLocked(): boolean {
    return !this.countdownUnlocked;
  }

  private beginStartupCountdown() {
    this.countdownUnlocked = false;
    this.countdownStartMs = null;
    this.countdownStepMs = this.beatMs * this.countdownBeatsPerStep;
    this.pendingDigUntilMs = 0;
    this.attackInitiated = false;
    this.clickedFarmableArea = [];
    this.memoryKeys.w.pressed = false;
    this.memoryKeys.a.pressed = false;
    this.memoryKeys.s.pressed = false;
    this.memoryKeys.d.pressed = false;
  }

  private updateStartupCountdown(now = performance.now()): string {
    if (this.countdownUnlocked && this.countdownStartMs === null) {
      this.setStartupCountdownLabel('');
      return '';
    }

    if (this.countdownStartMs === null) {
      const nextBeat = this.phaserService.nextBeatWallMs();
      this.countdownStartMs = nextBeat ?? now + this.beatMs;
      this.countdownStepMs = this.beatMs * this.countdownBeatsPerStep;
    }

    if (now < this.countdownStartMs) {
      const label = this.countdownLabels[0];
      this.setStartupCountdownLabel(label);
      return label;
    }

    const step = Math.floor(
      (now - this.countdownStartMs) / this.countdownStepMs,
    );
    if (step >= this.countdownLabels.length) {
      this.countdownStartMs = null;
      this.setStartupCountdownLabel('');
      return '';
    }

    if (step >= this.countdownLabels.length - 1) {
      this.countdownUnlocked = true;
    }

    const label = this.countdownLabels[Math.max(0, step)];
    this.setStartupCountdownLabel(label);
    return label;
  }

  private setStartupCountdownLabel(label: string) {
    if (this.startupCountdownLabel === label) return;

    this.ngZone.run(() => {
      this.startupCountdownLabel = label;
    });
  }

  /** setInterval handle for the lobby-load polling timer. */
  private lobbyTickInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private phaserService: PhaserGameService,
    private facade: AppFacade,
    private ngZone: NgZone,
  ) {
    super();
    // performance.now() is monotonic and immune to NTP / system-clock jumps.
    // The 60 fps animate loop is started inside ngZone.runOutsideAngular(...)
    // (see startAnimating) so requestAnimationFrame ticks do not trigger
    // global change detection. Output emitters re-enter the zone naturally.
    this.animate = () => {
      requestAnimationFrame(this.animate);
      this.now = performance.now();
      this.elaspsed = this.now - this.then;

      if (this.elaspsed > this.fpsInterval) {
        this.then = this.now - (this.elaspsed % this.fpsInterval);
        this.drawingCode();
      }
    };
  }

  /** Send a click action through Phaser to be judged against the beat. */
  private judgeRhythm(
    action: FarmActionType,
    screenX?: number,
    screenY?: number,
  ) {
    if (!this.gameData.rhythm?.enabled) {
      if (this.actionConsumesEnergy(action)) {
        this.changeEnergy.emit(-this.energyCostForJudgementLabel('Good'));
      }
      return;
    }
    this.phaserService.judge(action, screenX, screenY);
  }

  private actionConsumesEnergy(action: FarmActionType): boolean {
    return (
      action === 'dig' ||
      action === 'water' ||
      action === 'plant' ||
      action === 'harvest' ||
      action === 'mine' ||
      action === 'fish'
    );
  }

  private tryAwardMiningNugget(): boolean {
    const chance = Math.min(
      0.8,
      Math.max(0.1, Number(this.gameData.minerValue) || 0.1),
    );
    const guaranteedAttempt = Math.max(1, Math.ceil(1 / chance));
    const awarded =
      Math.random() < chance || this.miningMisses + 1 >= guaranteedAttempt;

    if (awarded) {
      this.miningMisses = 0;
      this.changeTool.emit('nugget');
      return true;
    }

    this.miningMisses++;
    return false;
  }

  private energyCostForJudgementLabel(label: string): number {
    switch (label) {
      case 'Perfect':
        return 1;
      case 'Great':
        return 2;
      case 'Good':
        return 3;
      case 'Okay':
        return 4;
      case 'Poor':
      default:
        return 5;
    }
  }

  drawingCode() {
    if (this.ctx && this.canvas) {
      this.ctx.save();
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.scale(this.scale, this.scale);
      this.ctx.drawImage(
        this.map,
        this.mapImage.position.x,
        this.mapImage.position.y,
      );
      // Boundaries used to be drawn here as transparent rects (a no-op that
      // still cost ~200 forEach iterations per frame). Removed.
      // Likewise untargetableArea: state 'untargetable' falls through
      // drawFarmable to a transparent fillRect, and targetNearestSquare
      // filters 'untargetable' out of every interactive branch.
      //
      // Prune out-of-range selections once per frame (moved here from
      // targetNearestSquare which ran this filter once *per tile* per frame).
      if (this.otherFarmableArea.length) {
        this.otherFarmableArea = this.otherFarmableArea.filter((a) =>
          this.areasByAreas(a, this.currentCultivateAreaUpgrade()),
        );
      }
      if (this.waterableArea.length) {
        this.waterableArea = this.waterableArea.filter((a) =>
          this.areasByAreas(a, this.upg.irrigate),
        );
      }
      if (this.sowableArea.length) {
        this.sowableArea = this.sowableArea.filter((a) =>
          this.areasByAreas(a, this.upg.sow),
        );
      }
      this.farmableArea.forEach((farmableArea) => {
        if (this.ctx) {
          this.drawFarmable(farmableArea);
        }
      });
      this.fishableArea.forEach((fishableArea) => {
        if (this.ctx) {
          this.drawFarmable(fishableArea);
        }
      });
      this.minableArea.forEach((minableArea) => {
        if (this.ctx) {
          this.drawFarmable(minableArea);
        }
      });
      this.houseArea.forEach((houseTile) => {
        if (this.ctx) {
          this.drawFarmable(houseTile);
        }
      });
      this.wellArea.forEach((wellTile) => {
        if (this.ctx) {
          this.drawFarmable(wellTile);
        }
      });
      this.advanceMerchantAnimation();
      this.traders.forEach((trader) => {
        this.drawMerchant(trader);
      });

      this.lobbyPlayers.forEach((player, i) => {
        if (player) {
          if (this.ctx && this.player.width && this.player.height) {
            // this.ctx.strokeStyle = 'white';
            // this.ctx.beginPath();
            // this.ctx.rect(
            //   player.position.x,
            //   player.position.y,
            //   this.player.width * 4,
            //   this.player.height * 4
            // );
            // this.ctx.stroke();
            if (player.name !== this.gameData.me) {
              this.ctx.font = '20px "Press Start 2P", cursive';
              this.ctx.fillStyle = 'white';
              this.ctx.textAlign = 'center';
              this.ctx.fillText(
                player.name,
                player.position.x + 26,
                player.position.y,
              );
              this.getOtherPlayerSpriteSheet(player, i);
            }
          }
        }
      });

      this.getPlayerAndMultiplayerPositions();
      this.maybeAutoRefillAtWell();

      this.drawHeroRangeOverlay();
      this.updateStartupCountdown();

      if (this.gameData.isCarrying) {
        this.cancelActiveWatering();
      }

      this.handlePickupables();

      // SLEEP
      if (!this.isStartupCountdownLocked && this.queuedActivation) {
        this.activatable();
      }
      // MOVEMENT
      if (this.isStartupCountdownLocked) {
        this.movement(0);
      } else if (this.attackInitiated && this.gameData.energy.current >= 10) {
        const spriteSheet = this.getCultivateSpriteSheet();
        if (spriteSheet) {
          this.drawAttackAnimation(
            this.useRightAnims() ? spriteSheet.right : spriteSheet.left,
            this.useRightAnims()
              ? this.gameData.spriteAnimations[spriteSheet.rightKey].frames
              : this.gameData.spriteAnimations[spriteSheet.leftKey].frames,
          );
          this.movement(this.gameData.velocity, true);
        }
      } else if (this.clickedFarmableArea.length) {
        this.clickedFarmableArea.forEach((area, i) => {
          if (
            area.queuedCultivate &&
            this.cultivatable(area, i) &&
            !this.isWatering
          ) {
            const cultivator = this.gameData.me;
            this.playerCultivate.emit(cultivator);
            this.cultivate(area, i);
          } else if (this.isWatering) {
            const waterer = this.gameData.me;
            this.playerIsWatering.emit(waterer);
            this.waterAnimation(area, i);
          }
        });
        if (!this.clickedFarmableArea[0].queuedCultivate) {
          this.movement(this.gameData.velocity);
        }
      } else {
        this.movement(this.gameData.velocity);
      }

      this.drawPickupables();
      this.ctx.drawImage(
        this.foregroundMap,
        this.mapImage.position.x,
        this.mapImage.position.y,
      );
      this.ctx.font = '20px "Press Start 2P", cursive';
      this.ctx.fillStyle = 'white';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        this.headText,
        this.player.position.x + 26,
        this.player.position.y,
      );
      // Draw energy delta feedback (e.g. "-2") floating briefly above the player.
      if (
        this.energyDeltaText &&
        performance.now() <= this.energyDeltaExpiresMs
      ) {
        const remaining = this.energyDeltaExpiresMs - performance.now();
        const alpha = Math.min(1, remaining / 400);
        const rise = (1 - remaining / 1200) * 18;
        this.ctx.font = '14px "Press Start 2P", cursive';
        this.ctx.fillStyle = `rgba(255, 220, 80, ${alpha})`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
          this.energyDeltaText,
          this.player.position.x + 26,
          this.player.position.y - 20 - rise,
        );
      } else {
        this.energyDeltaText = '';
      }
      // Draw carry-stack count (x2 / x3 / x4) above player when holding multiple items.
      if (this.gameData.isCarrying && this.carryCount > 1) {
        this.ctx.font = '14px "Press Start 2P", cursive';
        this.ctx.fillStyle = 'rgba(255, 255, 100, 1)';
        this.ctx.textAlign = 'center';
        this.ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        this.ctx.lineWidth = 3;
        const tx = this.player.position.x + 26;
        const ty = this.player.position.y - 100;
        this.ctx.strokeText(`x${this.carryCount}`, tx, ty);
        this.ctx.fillText(`x${this.carryCount}`, tx, ty);
      }
      this.ctx.restore();
      if (!this.isTargetCloseToPlayer(this.player, this.hoveredFarmableArea)) {
        if (this.gameData.canHarvest === true) {
          this.canHarvest.emit(false);
        }
        // this.hoveredFarmableArea = this.defaultFarmState;
        // this.otherFarmableArea = [];
        // this.removeMouseProperties();
      } else {
        if (
          this.gameData.canHarvest === false &&
          this.hoveredFarmableArea.state !== 'untargetable' &&
          this.hoveredFarmableArea.state !== 'house' &&
          this.hoveredFarmableArea.state !== 'merchant' &&
          this.hoveredFarmableArea.state !== 'well'
        ) {
          this.canHarvest.emit(true);
        }
        if (
          this.hoveredFarmableArea.state === 'well' ||
          this.hoveredFarmableArea.state === 'fishable'
        ) {
          if (!this.gameData.canFillWater) this.canFillWater.emit(true);
        } else {
          if (this.gameData.canFillWater) this.canFillWater.emit(false);
        }
        if (this.hoveredFarmableArea.state === 'merchant') {
          if (!this.gameData.canOpenShop) this.canOpenShop.emit(true);
        } else {
          if (this.gameData.canOpenShop) this.canOpenShop.emit(false);
        }
        if (this.hoveredFarmableArea.state === 'house') {
          if (!this.gameData.canEnterHouse) this.canEnterHouse.emit(true);
        } else {
          if (this.gameData.canEnterHouse) this.canEnterHouse.emit(false);
        }
      }
    }
  }

  startAnimating(fps) {
    setTimeout(() => {
      this.setPlayersInPosition();
    });

    this.fpsInterval = 1000 / fps;
    this.then = performance.now();
    this.startTime = this.then;
    // Drive the animation loop outside the Angular zone (60×/sec rAF would
    // otherwise schedule a full change-detection pass per frame).
    this.ngZone.runOutsideAngular(() => this.animate());
  }

  removePickupableFromArray(data) {
    this.pickupables = this.pickupables.filter(
      (pickupable) => pickupable.id !== data.id,
    );
  }

  private handlePickupables() {
    if (!this.pickupables.length) return;

    const items = [...this.pickupables];
    for (const item of items) {
      item.width = this.squareSize;
      item.height = this.squareSize;
      if (this.playerIsPickingUpItem(item)) {
        this.removePickupable.emit(item);
      }
    }
  }

  private drawPickupables() {
    if (!this.pickupables.length) return;

    this.pickupables.forEach((item: Pickupable, i) => {
      if (!item) return;

      item.width = this.squareSize;
      item.height = this.squareSize;
      if (this.ctx) {
        this.drawPickupableAnimation(item, 16, i);
      }
    });
  }

  private cancelActiveWatering() {
    if (!this.isWatering) return;

    this.isWatering = false;
    this.clickedFarmableArea.forEach((area, i) => {
      if (area) area.queuedCultivate = false;
      this.actionFrameIndex[i] = 0;
      this.framesDrawn[i] = 0;
    });
    this.clickedFarmableArea = [];
  }

  playerIsPickingUpItem(item: Pickupable) {
    if (this.isStartupCountdownLocked) return false;
    const lobbyPlayer = this.lobbyPlayers.filter(
      (player) => player.name === this.gameData.me,
    )[0];
    // Carrying a different item type — can't stack.
    if (this.gameData.isCarrying && item.plant !== this.gameData.equippedTool)
      return false;
    if (lobbyPlayer?.canCarry === false) return false;
    const itemWidth = item.width ?? this.squareSize;
    const itemHeight = item.height ?? this.squareSize;
    if (this.player.center) {
      const itemCenter = {
        x: item.position.x + itemWidth / 2,
        y: item.position.y + itemHeight / 2,
      };
      const distance = Math.hypot(
        this.player.center.x - itemCenter.x,
        this.player.center.y - itemCenter.y,
      );
      if (distance <= this.interactionRangePx) {
        this.cancelActiveWatering();
        if (this.carryCount === 0) {
          // First pickup — set the equipped tool / isCarrying via the store.
          this.changeTool.emit(item.plant);
        }
        this.carryCount++;
        return true;
      }
    }
    return false;
  }

  cultivatable(area, i) {
    if (area.queuedCultivate) {
      if (
        area.state === 'minable' &&
        this.gameData.equippedTool === 'pickaxe'
      ) {
        return true;
      }
      if (area.state === 'fishable' && this.gameData.equippedTool === 'rod') {
        return true;
      }
      // If holding a seed tool, the player must actually have seeds in
      // inventory. Otherwise, abort the queued cultivate without playing
      // the planting animation and surface a "Need seeds!" head-text.
      if (this.isAPlantSeed(this.gameData.equippedTool)) {
        if (!this.canPlantInArea(area)) {
          area.queuedCultivate = false;
          this.actionFrameIndex[i] = 0;
          return false;
        }
        const crop = GameComponent.SEED_TO_CROP[this.gameData.equippedTool];
        const owned = crop && this.gameData.seedsOwned[crop.keyname];
        if (!owned || owned.count <= 0) {
          this.setHeadText('Need seeds!');
          area.queuedCultivate = false;
          this.actionFrameIndex[i] = 0;
          return false;
        }
      }
      if (
        area.state !== 'minable' &&
        area.state !== 'fishable' &&
        area.state !== 'untargetable' &&
        area.state !== 'merchant' &&
        area.state !== 'merchant-left' &&
        area.state !== 'merchant-right' &&
        (this.gameData.equippedTool === 'shovel' ||
          this.gameData.equippedTool === 'beet-seeds' ||
          this.gameData.equippedTool === 'cabbage-seeds' ||
          this.gameData.equippedTool === 'carrot-seeds' ||
          this.gameData.equippedTool === 'cauliflower-seeds' ||
          this.gameData.equippedTool === 'kale-seeds' ||
          this.gameData.equippedTool === 'potato-seeds' ||
          this.gameData.equippedTool === 'radish-seeds' ||
          this.gameData.equippedTool === 'sunflower-seeds' ||
          this.gameData.equippedTool === 'wheat-seeds')
      ) {
        return true;
      }
      area.queuedCultivate = false;
      this.actionFrameIndex[i] = 0;
      return false;
    }
    area.queuedCultivate = false;
    return false;
  }

  activatable() {
    if (this.activatedArea.state === 'house' && !this.gameData.isSleeping) {
      this.goInHouse.emit(this.gameData.me);
    } else {
      this.isSleeping.emit(false);
      this.sleepEnergyBeatIndex = -1;
      this.sleepBeatAnchorMs = null;
      this.changeVelocity.emit(
        this.defaultVelocity *
          Number(
            this.gameData.learnedUpgrades.filter(
              (upg) => upg.target === 'move',
            )[0].value,
          ),
      );
    }

    this.queuedActivation = false;
    this.activatedArea = this.defaultFarmState;
  }

  goIntoHouse(playerName) {
    const lobbyPlayer = this.lobbyPlayers.filter(
      (p) => p.name === playerName,
    )[0];
    const map = this.mapImage.position;
    let house;
    let enteredHouse = false;
    if (lobbyPlayer.name === this.gameData.me && this.traders) {
      if (
        lobbyPlayer.name === this.lobbyPlayers[0].name &&
        this.traders[0].position.x > 0 &&
        this.traders[0].position.y > 0
      ) {
        house = {
          x: 735,
          y: 287,
        };
        if (house) {
          const difference = {
            x: house.x - map.x,
            y: house.y - map.y,
          };
          this.isSleeping.emit(true);
          this.sleepEnteredAtMs = performance.now();
          this.sleepEnergyBeatIndex = this.getCurrentBeatIndex();
          this.changeVelocity.emit(0);
          this.moveAllMovables(difference);
          enteredHouse = true;
        }
      } else if (
        this.lobbyPlayers[1] &&
        lobbyPlayer.name === this.lobbyPlayers[1].name &&
        this.traders[0].position.x < 0 &&
        this.traders[0].position.y > 0
      ) {
        house = {
          x: -990,
          y: 287,
        };
        if (house) {
          const difference = {
            x: house.x - map.x,
            y: house.y - map.y,
          };
          this.isSleeping.emit(true);
          this.sleepEnteredAtMs = performance.now();
          this.sleepEnergyBeatIndex = this.getCurrentBeatIndex();
          this.changeVelocity.emit(0);
          this.moveAllMovables(difference);
          enteredHouse = true;
        }
      } else if (
        this.lobbyPlayers[2] &&
        lobbyPlayer.name === this.lobbyPlayers[2].name &&
        this.traders[0].position.x < 0 &&
        this.traders[0].position.y < 0
      ) {
        house = {
          x: -990,
          y: -1350,
        };
        if (house) {
          const difference = {
            x: house.x - map.x,
            y: house.y - map.y,
          };
          this.isSleeping.emit(true);
          this.sleepEnteredAtMs = performance.now();
          this.sleepEnergyBeatIndex = this.getCurrentBeatIndex();
          this.changeVelocity.emit(0);
          this.moveAllMovables(difference);
          enteredHouse = true;
        }
      } else if (
        this.lobbyPlayers[3] &&
        lobbyPlayer.name === this.lobbyPlayers[3].name &&
        this.traders[0].position.x > 0 &&
        this.traders[0].position.y < 0
      ) {
        house = {
          x: 735,
          y: -1350,
        };
        if (house) {
          const difference = {
            x: house.x - map.x,
            y: house.y - map.y,
          };
          this.isSleeping.emit(true);
          this.sleepEnteredAtMs = performance.now();
          this.sleepEnergyBeatIndex = this.getCurrentBeatIndex();
          this.changeVelocity.emit(0);
          this.moveAllMovables(difference);
          enteredHouse = true;
        }
      }
    }
    if (lobbyPlayer.name === this.gameData.me && !enteredHouse) {
      this.setHeadText('Not your house');
    }
  }

  cultivateOthers(play, i) {
    const player = this.lobbyPlayers.filter((p) => p.name === play.name)[0];
    const spriteSheet = this.getCultivateOthersSpriteSheet(player);

    if (spriteSheet) {
      this.drawOtherCultivateAnimation(
        player.useRightAnims ? spriteSheet.right : spriteSheet.left,
        player.useRightAnims
          ? this.gameData.spriteAnimations[spriteSheet.rightKey].frames
          : this.gameData.spriteAnimations[spriteSheet.leftKey].frames,
        player,
        i,
      );
    }
  }

  moveOthers(player, i) {
    if (player.moveup) {
      if (player.moving || player.canMoveVertical) {
        player.position.y -= this.gameData.velocity;
      }
    }
    if (player.movedown) {
      if (player.moving || player.canMoveVertical) {
        player.position.y += this.gameData.velocity;
      }
    }
    if (player.moveright) {
      if (player.moving || player.canMoveHorizontal) {
        player.position.x += this.gameData.velocity;
      }
    }
    if (player.moveleft) {
      if (player.moving || player.canMoveHorizontal) {
        player.position.x -= this.gameData.velocity;
      }
    }
    // if (player.isSleeping) {
    // player.canMoveHorizontal = false;
    // moving = false;
    //this.drawSleepAnimation();
    // }

    if (
      !player.moveup &&
      !player.moveleft &&
      !player.movedown &&
      !player.moveright &&
      !player.isSleeping
    ) {
      if (!player.isCultivating && this.otherCultivateFrameIndex[i] !== 0) {
        this.otherCultivateFrameIndex[i] = 0;
      }
      if (player.isWatering) {
        this.waterOtherAnimation(player, i);
      } else if (player.isCultivating) {
        this.cultivateOthers(player, i);
      } else if (player.equippedTool === 'beets') {
        this.drawOtherSpriteAnimation(
          player.useRightAnims
            ? this.spriteCarryBeetsRight
            : this.spriteCarryBeetsLeft,
          player.useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryBeetsRight'].frames
            : this.gameData.spriteAnimations['spriteCarryBeetsLeft'].frames,
          player,
          i,
        );
      } else if (player.equippedTool === 'cabbage') {
        this.drawOtherSpriteAnimation(
          player.useRightAnims
            ? this.spriteCarryCabbageRight
            : this.spriteCarryCabbageLeft,
          player.useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryCabbageRight'].frames
            : this.gameData.spriteAnimations['spriteCarryCabbageLeft'].frames,
          player,
          i,
        );
      } else if (player.equippedTool === 'carrot') {
        this.drawOtherSpriteAnimation(
          player.useRightAnims
            ? this.spriteCarryCarrotRight
            : this.spriteCarryCarrotLeft,
          player.useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryCarrotRight'].frames
            : this.gameData.spriteAnimations['spriteCarryCarrotLeft'].frames,
          player,
          i,
        );
      } else if (player.equippedTool === 'cauliflower') {
        this.drawOtherSpriteAnimation(
          player.useRightAnims
            ? this.spriteCarryCauliflowerRight
            : this.spriteCarryCauliflowerLeft,
          player.useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryCauliflowerRight']
                .frames
            : this.gameData.spriteAnimations['spriteCarryCauliflowerLeft']
                .frames,
          player,
          i,
        );
      } else if (player.equippedTool === 'kale') {
        this.drawOtherSpriteAnimation(
          player.useRightAnims
            ? this.spriteCarryKaleRight
            : this.spriteCarryKaleLeft,
          player.useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryKaleRight'].frames
            : this.gameData.spriteAnimations['spriteCarryKaleLeft'].frames,
          player,
          i,
        );
      } else if (player.equippedTool === 'potato') {
        this.drawOtherSpriteAnimation(
          player.useRightAnims
            ? this.spriteCarryPotatoRight
            : this.spriteCarryPotatoLeft,
          player.useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryPotatoRight'].frames
            : this.gameData.spriteAnimations['spriteCarryPotatoLeft'].frames,
          player,
          i,
        );
      } else if (player.equippedTool === 'radish') {
        this.drawOtherSpriteAnimation(
          player.useRightAnims
            ? this.spriteCarryRadishRight
            : this.spriteCarryRadishLeft,
          player.useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryRadishRight'].frames
            : this.gameData.spriteAnimations['spriteCarryRadishLeft'].frames,
          player,
          i,
        );
      } else if (player.equippedTool === 'sunflower') {
        this.drawOtherSpriteAnimation(
          player.useRightAnims
            ? this.spriteCarrySunflowerRight
            : this.spriteCarrySunflowerLeft,
          player.useRightAnims
            ? this.gameData.spriteAnimations['spriteCarrySunflowerRight'].frames
            : this.gameData.spriteAnimations['spriteCarrySunflowerLeft'].frames,
          player,
          i,
        );
      } else if (player.equippedTool === 'wheat') {
        this.drawOtherSpriteAnimation(
          player.useRightAnims
            ? this.spriteCarryWheatRight
            : this.spriteCarryWheatLeft,
          player.useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryWheatRight'].frames
            : this.gameData.spriteAnimations['spriteCarryWheatLeft'].frames,
          player,
          i,
        );
      } else if (player.equippedTool === 'smallfish') {
        this.drawOtherSpriteAnimation(
          player.useRightAnims
            ? this.spriteCarrySmallFishRight
            : this.spriteCarrySmallFishLeft,
          player.useRightAnims
            ? this.gameData.spriteAnimations['spriteCarrySmallFishRight'].frames
            : this.gameData.spriteAnimations['spriteCarrySmallFishLeft'].frames,
          player,
          i,
        );
      } else if (player.equippedTool === 'mediumfish') {
        this.drawOtherSpriteAnimation(
          player.useRightAnims
            ? this.spriteCarryMediumFishRight
            : this.spriteCarryMediumFishLeft,
          player.useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryMediumFishRight']
                .frames
            : this.gameData.spriteAnimations['spriteCarryMediumFishLeft']
                .frames,
          player,
          i,
        );
      } else if (player.equippedTool === 'hugefish') {
        this.drawOtherSpriteAnimation(
          player.useRightAnims
            ? this.spriteCarryHugeFishRight
            : this.spriteCarryHugeFishLeft,
          player.useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryHugeFishRight'].frames
            : this.gameData.spriteAnimations['spriteCarryHugeFishLeft'].frames,
          player,
          i,
        );
      } else if (player.equippedTool === 'nugget') {
        this.drawOtherSpriteAnimation(
          player.useRightAnims
            ? this.spriteCarryNuggetRight
            : this.spriteCarryNuggetLeft,
          player.useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryNuggetRight'].frames
            : this.gameData.spriteAnimations['spriteCarryNuggetLeft'].frames,
          player,
          i,
        );
      } else {
        this.drawOtherSpriteAnimation(
          player.useRightAnims
            ? this.spriteSheetIdleRight
            : this.spriteSheetIdleLeft,
          player.useRightAnims
            ? this.gameData.spriteAnimations['playerIdleRight'].frames
            : this.gameData.spriteAnimations['playerIdleLeft'].frames,
          player,
          i,
        );
      }
    } else {
      if (!player.isCultivating && this.otherCultivateFrameIndex[i] !== 0) {
        this.otherCultivateFrameIndex[i] = 0;
      }
      if (player.isWatering) {
        this.waterOtherAnimation(player, i);
      } else if (player.isCultivating) {
        this.cultivateOthers(player, i);
      } else if (player.equippedTool === 'beets') {
        this.drawOtherSpriteAnimation(
          player.useRightAnims
            ? this.spriteCarryBeetsRight
            : this.spriteCarryBeetsLeft,
          player.useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryBeetsRight'].frames
            : this.gameData.spriteAnimations['spriteCarryBeetsLeft'].frames,
          player,
          i,
        );
      } else if (player.equippedTool === 'cabbage') {
        this.drawOtherSpriteAnimation(
          player.useRightAnims
            ? this.spriteCarryCabbageRight
            : this.spriteCarryCabbageLeft,
          player.useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryCabbageRight'].frames
            : this.gameData.spriteAnimations['spriteCarryCabbageLeft'].frames,
          player,
          i,
        );
      } else if (player.equippedTool === 'carrot') {
        this.drawOtherSpriteAnimation(
          player.useRightAnims
            ? this.spriteCarryCarrotRight
            : this.spriteCarryCarrotLeft,
          player.useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryCarrotRight'].frames
            : this.gameData.spriteAnimations['spriteCarryCarrotLeft'].frames,
          player,
          i,
        );
      } else if (player.equippedTool === 'cauliflower') {
        this.drawOtherSpriteAnimation(
          player.useRightAnims
            ? this.spriteCarryCauliflowerRight
            : this.spriteCarryCauliflowerLeft,
          player.useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryCauliflowerRight']
                .frames
            : this.gameData.spriteAnimations['spriteCarryCauliflowerLeft']
                .frames,
          player,
          i,
        );
      } else if (player.equippedTool === 'kale') {
        this.drawOtherSpriteAnimation(
          player.useRightAnims
            ? this.spriteCarryKaleRight
            : this.spriteCarryKaleLeft,
          player.useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryKaleRight'].frames
            : this.gameData.spriteAnimations['spriteCarryKaleLeft'].frames,
          player,
          i,
        );
      } else if (player.equippedTool === 'potato') {
        this.drawOtherSpriteAnimation(
          player.useRightAnims
            ? this.spriteCarryPotatoRight
            : this.spriteCarryPotatoLeft,
          player.useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryPotatoRight'].frames
            : this.gameData.spriteAnimations['spriteCarryPotatoLeft'].frames,
          player,
          i,
        );
      } else if (player.equippedTool === 'radish') {
        this.drawOtherSpriteAnimation(
          player.useRightAnims
            ? this.spriteCarryRadishRight
            : this.spriteCarryRadishLeft,
          player.useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryRadishRight'].frames
            : this.gameData.spriteAnimations['spriteCarryRadishLeft'].frames,
          player,
          i,
        );
      } else if (player.equippedTool === 'sunflower') {
        this.drawOtherSpriteAnimation(
          player.useRightAnims
            ? this.spriteCarrySunflowerRight
            : this.spriteCarrySunflowerLeft,
          player.useRightAnims
            ? this.gameData.spriteAnimations['spriteCarrySunflowerRight'].frames
            : this.gameData.spriteAnimations['spriteCarrySunflowerLeft'].frames,
          player,
          i,
        );
      } else if (player.equippedTool === 'wheat') {
        this.drawOtherSpriteAnimation(
          player.useRightAnims
            ? this.spriteCarryWheatRight
            : this.spriteCarryWheatLeft,
          player.useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryWheatRight'].frames
            : this.gameData.spriteAnimations['spriteCarryWheatLeft'].frames,
          player,
          i,
        );
      } else if (player.equippedTool === 'smallfish') {
        this.drawOtherSpriteAnimation(
          player.useRightAnims
            ? this.spriteCarrySmallFishRight
            : this.spriteCarrySmallFishLeft,
          player.useRightAnims
            ? this.gameData.spriteAnimations['spriteCarrySmallFishRight'].frames
            : this.gameData.spriteAnimations['spriteCarrySmallFishLeft'].frames,
          player,
          i,
        );
      } else if (player.equippedTool === 'mediumfish') {
        this.drawOtherSpriteAnimation(
          player.useRightAnims
            ? this.spriteCarryMediumFishRight
            : this.spriteCarryMediumFishLeft,
          player.useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryMediumFishRight']
                .frames
            : this.gameData.spriteAnimations['spriteCarryMediumFishLeft']
                .frames,
          player,
          i,
        );
      } else if (player.equippedTool === 'hugefish') {
        this.drawOtherSpriteAnimation(
          player.useRightAnims
            ? this.spriteCarryHugeFishRight
            : this.spriteCarryHugeFishLeft,
          player.useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryHugeFishRight'].frames
            : this.gameData.spriteAnimations['spriteCarryHugeFishLeft'].frames,
          player,
          i,
        );
      } else if (player.equippedTool === 'nugget') {
        this.drawOtherSpriteAnimation(
          player.useRightAnims
            ? this.spriteCarryNuggetRight
            : this.spriteCarryNuggetLeft,
          player.useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryNuggetRight'].frames
            : this.gameData.spriteAnimations['spriteCarryNuggetLeft'].frames,
          player,
          i,
        );
      } else {
        this.drawOtherSpriteAnimation(
          player.useRightAnims
            ? this.spriteSheetWalkRight
            : this.spriteSheetWalkLeft,
          player.useRightAnims
            ? this.gameData.spriteAnimations['playerWalkRight'].frames
            : this.gameData.spriteAnimations['playerWalkLeft'].frames,
          player,
          i,
        );
      }
    }
  }

  fixOtherPlayerPosition(playerFromMiddle) {
    const latencyFix = 2;
    const player = this.lobbyPlayers.filter(
      (player) => player.name === playerFromMiddle.name,
    )[0];
    if (player && this.traders[0]) {
      const localPlayerFromTraderX =
        player.position.x - this.traders[0].position.x;
      const localPlayerFromTraderY =
        player.position.y - this.traders[0].position.y;
      if (
        localPlayerFromTraderX <
        playerFromMiddle.distanceFromMiddle.x - latencyFix
      ) {
        player.position.x += 1;
      } else if (
        localPlayerFromTraderX >
        playerFromMiddle.distanceFromMiddle.x + latencyFix
      ) {
        player.position.x -= 1;
      }
      if (
        localPlayerFromTraderY <
        playerFromMiddle.distanceFromMiddle.y - latencyFix
      ) {
        player.position.y += 1;
      } else if (
        localPlayerFromTraderY >
        playerFromMiddle.distanceFromMiddle.y + latencyFix
      ) {
        player.position.y -= 1;
      }
    }
  }

  moveOtherPlayer(event) {
    const player = this.lobbyPlayers.filter(
      (player) => player.name === event.player.name,
    )[0];
    if (
      player &&
      event.roomId === player.roomId &&
      !player.isCultivating &&
      !player.isWatering
    ) {
      if (event.move === 'up-left') {
        player.moveup = true;
        player.moveleft = true;
        player.moveright = false;
        player.movedown = false;
      } else if (event.move === 'up-right') {
        player.moveup = true;
        player.moveright = true;
        player.moveleft = false;
        player.movedown = false;
      } else if (event.move === 'down-left') {
        player.movedown = true;
        player.moveleft = true;
        player.moveup = false;
        player.moveright = false;
      } else if (event.move === 'down-right') {
        player.movedown = true;
        player.moveright = true;
        player.moveup = false;
        player.moveleft = false;
      } else if (event.move === 'up') {
        player.moveup = true;
        player.movedown = false;
        player.moveleft = false;
        player.moveright = false;
      } else if (event.move === 'down') {
        player.movedown = true;
        player.moveup = false;
        player.moveleft = false;
        player.moveright = false;
      } else if (event.move === 'left') {
        player.moveleft = true;
        player.movedown = false;
        player.moveright = false;
        player.moveup = false;
      } else if (event.move === 'right') {
        player.moveright = true;
        player.movedown = false;
        player.moveleft = false;
        player.moveup = false;
      } else if (event.move === 'none') {
        player.moveup = false;
        player.movedown = false;
        player.moveleft = false;
        player.moveright = false;
      }
    }
  }

  setPlayersInPosition() {
    const map = this.mapImage.position;
    let difference = {
      x: 0,
      y: 0,
    };

    if (this.gameData.me === this.lobbyPlayers[0].name) {
      difference = {
        x: 242,
        y: -25,
      };
    } else if (
      this.lobbyPlayers[1] &&
      this.gameData.me === this.lobbyPlayers[1].name
    ) {
      difference = {
        x: -972,
        y: -25,
      };
    } else if (
      this.lobbyPlayers[2] &&
      this.gameData.me === this.lobbyPlayers[2].name
    ) {
      difference = {
        x: -972,
        y: -862,
      };
    } else if (
      this.lobbyPlayers[3] &&
      this.gameData.me === this.lobbyPlayers[3].name
    ) {
      difference = {
        x: 242,
        y: -862,
      };
    }

    this.moveAllMovables(difference);
  }

  moveAllMovables(difference) {
    this.movables.forEach((element) => {
      element.position.y += difference.y;
    });
    this.pickupables.forEach((element) => {
      if (element.dropped) {
        element.position.y += difference.y;
      }
    });
    this.movables.forEach((element) => {
      element.position.x += difference.x;
    });
    this.pickupables.forEach((element) => {
      if (element.dropped) {
        element.position.x += difference.x;
      }
    });
  }

  ngAfterViewInit(): void {
    this.loadLobby();
    this.mountPhaserOverlay();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['gameData']) {
      this.syncUpgradeValues();
    }
  }

  private syncUpgradeValues() {
    if (this.gameData?.learnedUpgrades?.length) {
      this.upg = this.getUpgradeVaules(this.gameData.learnedUpgrades);
    }
  }

  ngOnDestroy(): void {
    this.phaserSub?.unsubscribe();
    this.phaserSub = null;
    if (this.lobbyTickInterval !== null) {
      clearInterval(this.lobbyTickInterval);
      this.lobbyTickInterval = null;
    }
    this.phaserService.destroy();
  }

  private mountPhaserOverlay(): void {
    if (!this.phaserHost) return;
    const r = this.gameData.rhythm;
    // mount() is async (Phaser is dynamically imported); fire-and-forget,
    // but log mount errors instead of swallowing them.
    this.phaserService
      .mount({
        parent: this.phaserHost.nativeElement,
        width: this.gameData.resolution.x,
        height: this.gameData.resolution.y,
        track: r?.track ?? 'assets/music/Quacks-120.ogg',
        bpm: r?.bpm ?? 120,
        beatOffsetMs: r?.beatOffsetMs ?? 0,
      })
      .catch((err) => console.error('[Phaser] mount failed', err));
    this.phaserSub = this.phaserService.judgements.subscribe((judgement) => {
      if (this.actionConsumesEnergy(judgement.action)) {
        const cost = this.energyCostForJudgementLabel(judgement.label);
        this.changeEnergy.emit(-cost);
        this.energyDeltaText = `-${cost}`;
        this.energyDeltaExpiresMs = performance.now() + 1200;
      }
      this.facade.dispatch(AddRhythmJudgement({ payload: judgement }));
    });
  }

  loadLobby() {
    // Polling timer kept outside Angular zone to avoid CD ticks while idle.
    this.ngZone.runOutsideAngular(() => {
      this.lobbyTickInterval = setInterval(() => {
        this.lobbyPlayers = this.gameData.lobbyPlayers.map((player) => {
          return {
            ...player,
            position: {
              ...player.position,
              writable: true,
            },
            width: this.player.width ? this.player.width * 4 : 0,
            height: this.player.height ? this.player.height * 4 : 0,
            canCarry: true,
          };
        });
        this.updateLobbyPlayers();
        if (!this.lobbyPlayers[0] || !this.lobbyPlayers[0].loadedIn) {
          // Quietly retry until the local player has loaded in.
          return;
        }
        if (this.lobbyTickInterval !== null) {
          clearInterval(this.lobbyTickInterval);
          this.lobbyTickInterval = null;
        }
        this.createCollisionsAndMovables();
        this.createUntargetableArea(this.gameData.untargetableAreaMap);
        this.createFarmableArea(this.gameData.farmableAreaMap);
        this.createFishableArea(this.gameData.fishableAreaMap);
        this.createMinableArea(this.gameData.minableAreaMap);
        this.createHouseArea(this.gameData.houseAreaMap);
        this.createWellArea(this.gameData.wellAreaMap);
        // Build cached flat array used by drawHeroRangeOverlay every frame.
        this._reachableAreas = [
          ...this.farmableArea,
          ...this.fishableArea,
          ...this.minableArea,
          ...this.houseArea,
          ...this.wellArea,
        ];
        this.createTraders();
        this.createMovables();
        this.loadCanvas();
        this.syncUpgradeValues();
      }, 1000);
    });
  }

  loadCanvas() {
    if (document.getElementById(this.canvasId)) {
      this.canvas = document.getElementById(this.canvasId) as HTMLCanvasElement;
      this.canvas.width = this.gameData.resolution.x;
      this.canvas.height = this.gameData.resolution.y;
      this.loadMap();
    }
  }

  loadMap() {
    this.facade.dispatch(MapLoaded({ payload: false }));
    this.map.src = this.gameData.spriteAnimations['map'].src;
    this.foregroundMap.src =
      this.gameData.spriteAnimations['mapForeground'].src;
    this.map.onload = () => {
      if (this.canvas) {
        this.ctx = this.canvas.getContext('2d');
        if (this.ctx) {
          this.ctx.imageSmoothingEnabled = false;
          this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
          this.ctx.drawImage(
            this.map,
            this.mapImage.position.x,
            this.mapImage.position.y,
          );
          this.loadPlayer();
          this.facade.dispatch(MapLoaded({ payload: true }));
          this.beginStartupCountdown();
        }
      }
    };
  }

  loadPlayer() {
    this.spriteSheetIdleRight.src =
      this.gameData.spriteAnimations['playerIdleRight'].src;
    this.spriteSheetIdleLeft.src =
      this.gameData.spriteAnimations['playerIdleLeft'].src;
    this.spriteSheetWalkRight.src =
      this.gameData.spriteAnimations['playerWalkRight'].src;
    this.spriteSheetWalkLeft.src =
      this.gameData.spriteAnimations['playerWalkLeft'].src;
    this.spriteSheetDigRight.src =
      this.gameData.spriteAnimations['spriteSheetDigRight'].src;
    this.spriteSheetDigLeft.src =
      this.gameData.spriteAnimations['spriteSheetDigLeft'].src;
    this.spriteSheetWaterRight.src =
      this.gameData.spriteAnimations['spriteSheetWaterRight'].src;
    this.spriteSheetWaterLeft.src =
      this.gameData.spriteAnimations['spriteSheetWaterLeft'].src;
    this.spriteSheetHammerRight.src =
      this.gameData.spriteAnimations['spriteSheetHammerRight'].src;
    this.spriteSheetHammerLeft.src =
      this.gameData.spriteAnimations['spriteSheetHammerLeft'].src;
    this.spriteSheetPickaxeRight.src =
      this.gameData.spriteAnimations['spriteSheetPickaxeRight'].src;
    this.spriteSheetPickaxeLeft.src =
      this.gameData.spriteAnimations['spriteSheetPickaxeLeft'].src;
    this.spriteSheetMineRight.src =
      this.gameData.spriteAnimations['spriteSheetMineRight'].src;
    this.spriteSheetMineLeft.src =
      this.gameData.spriteAnimations['spriteSheetMineLeft'].src;
    this.spriteSheetBroomRight.src =
      this.gameData.spriteAnimations['spriteSheetBroomRight'].src;
    this.spriteSheetBroomLeft.src =
      this.gameData.spriteAnimations['spriteSheetBroomLeft'].src;
    this.spriteSheetFishRight.src =
      this.gameData.spriteAnimations['spriteSheetFishRight'].src;
    this.spriteSheetFishLeft.src =
      this.gameData.spriteAnimations['spriteSheetFishLeft'].src;
    this.spriteSheetPlantRight.src =
      this.gameData.spriteAnimations['spriteSheetPlantRight'].src;
    this.spriteSheetPlantLeft.src =
      this.gameData.spriteAnimations['spriteSheetPlantLeft'].src;
    this.spriteCarryBeetsRight.src =
      this.gameData.spriteAnimations['spriteCarryBeetsRight'].src;
    this.spriteCarryBeetsLeft.src =
      this.gameData.spriteAnimations['spriteCarryBeetsLeft'].src;
    this.spriteCarryCabbageLeft.src =
      this.gameData.spriteAnimations['spriteCarryCabbageLeft'].src;
    this.spriteCarryCabbageRight.src =
      this.gameData.spriteAnimations['spriteCarryCabbageRight'].src;
    this.spriteCarryCarrotLeft.src =
      this.gameData.spriteAnimations['spriteCarryCarrotLeft'].src;
    this.spriteCarryCarrotRight.src =
      this.gameData.spriteAnimations['spriteCarryCarrotRight'].src;
    this.spriteCarryCauliflowerLeft.src =
      this.gameData.spriteAnimations['spriteCarryCauliflowerLeft'].src;
    this.spriteCarryCauliflowerRight.src =
      this.gameData.spriteAnimations['spriteCarryCauliflowerRight'].src;
    this.spriteCarryKaleLeft.src =
      this.gameData.spriteAnimations['spriteCarryKaleLeft'].src;
    this.spriteCarryKaleRight.src =
      this.gameData.spriteAnimations['spriteCarryKaleRight'].src;
    this.spriteCarryPotatoLeft.src =
      this.gameData.spriteAnimations['spriteCarryPotatoLeft'].src;
    this.spriteCarryPotatoRight.src =
      this.gameData.spriteAnimations['spriteCarryPotatoRight'].src;
    this.spriteCarryRadishLeft.src =
      this.gameData.spriteAnimations['spriteCarryRadishLeft'].src;
    this.spriteCarryRadishRight.src =
      this.gameData.spriteAnimations['spriteCarryRadishRight'].src;
    this.spriteCarrySunflowerLeft.src =
      this.gameData.spriteAnimations['spriteCarrySunflowerLeft'].src;
    this.spriteCarrySunflowerRight.src =
      this.gameData.spriteAnimations['spriteCarrySunflowerRight'].src;
    this.spriteCarryWheatLeft.src =
      this.gameData.spriteAnimations['spriteCarryWheatLeft'].src;
    this.spriteCarryWheatRight.src =
      this.gameData.spriteAnimations['spriteCarryWheatRight'].src;
    this.spriteCarryNuggetRight.src =
      this.gameData.spriteAnimations['spriteCarryNuggetRight'].src;
    this.spriteCarryNuggetLeft.src =
      this.gameData.spriteAnimations['spriteCarryNuggetLeft'].src;
    this.spriteCarrySmallFishRight.src =
      this.gameData.spriteAnimations['spriteCarrySmallFishRight'].src;
    this.spriteCarrySmallFishLeft.src =
      this.gameData.spriteAnimations['spriteCarrySmallFishLeft'].src;
    this.spriteCarryMediumFishRight.src =
      this.gameData.spriteAnimations['spriteCarryMediumFishRight'].src;
    this.spriteCarryMediumFishLeft.src =
      this.gameData.spriteAnimations['spriteCarryMediumFishLeft'].src;
    this.spriteCarryHugeFishRight.src =
      this.gameData.spriteAnimations['spriteCarryHugeFishRight'].src;
    this.spriteCarryHugeFishLeft.src =
      this.gameData.spriteAnimations['spriteCarryHugeFishLeft'].src;
    this.spriteSleepBubbles.src =
      this.gameData.spriteAnimations['spriteSleepBubbles'].src;
    this.goblinMerchantRight.src =
      this.gameData.spriteAnimations['goblinMerchantRight'].src;
    this.goblinMerchantLeft.src =
      this.gameData.spriteAnimations['goblinMerchantLeft'].src;
    this.spriteSheetFishRight.onload = () => {
      this.loadCursors();
    };
  }

  loadCursors() {
    const bed = new Image();
    bed.src = 'assets/ui/bed-big.png';
    const beets = new Image();
    beets.src = 'assets/ui/beets-ui.png';
    const cabbage = new Image();
    cabbage.src = 'assets/ui/cabbage-ui.png';
    const carrot = new Image();
    carrot.src = 'assets/ui/carrot-ui.png';
    const cauliflower = new Image();
    cauliflower.src = 'assets/ui/cauliflower-ui.png';
    const coins = new Image();
    coins.src = 'assets/ui/coins-big.png';
    const cursor = new Image();
    const hammer = new Image();
    hammer.src = 'assets/ui/hammer-big.png';
    const kale = new Image();
    kale.src = 'assets/ui/kale-ui.png';
    const mousedrop = new Image();
    mousedrop.src = 'assets/ui/mouse-drop.png';
    const mousedropRight = new Image();
    mousedropRight.src = 'assets/ui/mouse-drop-right.png';
    const pickaxe = new Image();
    pickaxe.src = 'assets/ui/pickaxe-big.png';
    const potato = new Image();
    potato.src = 'assets/ui/potato-ui.png';
    const radish = new Image();
    radish.src = 'assets/ui/raddish-ui.png';
    const rod = new Image();
    rod.src = 'assets/ui/rod-big.png';
    const seedBasket = new Image();
    seedBasket.src = 'assets/ui/seed-basket.png';
    const shovel = new Image();
    shovel.src = 'assets/ui/shovel-big.png';
    const shovelx = new Image();
    shovelx.src = 'assets/ui/shovel-x.png';
    const sunflower = new Image();
    sunflower.src = 'assets/ui/sunflower-ui.png';
    const water = new Image();
    water.src = 'assets/ui/water-big.png';
    const wheat = new Image();
    wheat.src = 'assets/ui/wheat-ui.png';
    cursor.src = 'assets/ui/cursor_big.png';
    const coin = new Image();
    coin.src = 'assets/ui/coin.png';
    cursor.onload = () => {
      this.loadCrops();
    };
  }

  loadCrops() {
    this.spriteSheetSoil.src =
      this.gameData.spriteAnimations['spriteSheetSoil'].src;
    this.spriteSheetBeets.src =
      this.gameData.spriteAnimations['spriteSheetBeets'].src;
    this.spriteSheetCabbage.src =
      this.gameData.spriteAnimations['spriteSheetCabbage'].src;
    this.spriteSheetCarrot.src =
      this.gameData.spriteAnimations['spriteSheetCarrot'].src;
    this.spriteSheetCauliflower.src =
      this.gameData.spriteAnimations['spriteSheetCauliflower'].src;
    this.spriteSheetKale.src =
      this.gameData.spriteAnimations['spriteSheetKale'].src;
    this.spriteSheetPotato.src =
      this.gameData.spriteAnimations['spriteSheetPotato'].src;
    this.spriteSheetRadish.src =
      this.gameData.spriteAnimations['spriteSheetRadish'].src;
    this.spriteSheetSunflower.src =
      this.gameData.spriteAnimations['spriteSheetSunflower'].src;
    this.spriteSheetWheat.src =
      this.gameData.spriteAnimations['spriteSheetWheat'].src;

    this.spriteReadyBeets.src =
      this.gameData.spriteAnimations['spriteReadyBeets'].src;

    this.spriteReadyCabbage.src =
      this.gameData.spriteAnimations['spriteReadyCabbage'].src;

    this.spriteReadyCarrot.src =
      this.gameData.spriteAnimations['spriteReadyCarrot'].src;

    this.spriteReadyCauliflower.src =
      this.gameData.spriteAnimations['spriteReadyCauliflower'].src;

    this.spriteReadyKale.src =
      this.gameData.spriteAnimations['spriteReadyKale'].src;

    this.spriteReadyPotato.src =
      this.gameData.spriteAnimations['spriteReadyPotato'].src;

    this.spriteReadyRadish.src =
      this.gameData.spriteAnimations['spriteReadyRadish'].src;

    this.spriteReadySunflower.src =
      this.gameData.spriteAnimations['spriteReadySunflower'].src;

    this.spriteReadyWheat.src =
      this.gameData.spriteAnimations['spriteReadyWheat'].src;

    this.spriteReadySmallFish.src =
      this.gameData.spriteAnimations['spriteReadySmallFish'].src;
    this.spriteReadyMediumFish.src =
      this.gameData.spriteAnimations['spriteReadyMediumFish'].src;
    this.spriteReadyHugeFish.src =
      this.gameData.spriteAnimations['spriteReadyHugeFish'].src;
    this.spriteReadyNugget.src =
      this.gameData.spriteAnimations['spriteReadyNugget'].src;

    this.spriteSheetSoil.onload = () => {
      this.startAnimating(60);
    };
  }

  drawPickupableAnimation(item, frames: number, index: number) {
    let spriteSheet;
    if (item.plant) {
      spriteSheet = this.getPickupabledSpriteSheet(item.plant);
    }
    if (this.pickupableFramesDrawn[index] > this.animThreshold(frames, 2)) {
      if (this.pickupableFrameIndex[index] < frames - 1) {
        this.pickupableFrameIndex[index]++;
      } else {
        this.pickupableFrameIndex[index] = 0;
      }
      this.pickupableFramesDrawn[index] = 0;
    } else {
      this.pickupableFramesDrawn[index]++;
    }
    if (this.canvas && this.ctx) {
      this.ctx.drawImage(
        spriteSheet,
        item.width * this.pickupableFrameIndex[index],
        0,
        item.width,
        item.height,
        item.position.x + 7,
        item.position.y + 7,
        50,
        50,
      );
    }
  }

  getPickupabledSpriteSheet(plant) {
    switch (plant) {
      case 'potato':
        return this.spriteReadyPotato;
      case 'beets':
        return this.spriteReadyBeets;
      case 'cabbage':
        return this.spriteReadyCabbage;
      case 'carrot':
        return this.spriteReadyCarrot;
      case 'cauliflower':
        return this.spriteReadyCauliflower;
      case 'kale':
        return this.spriteReadyKale;
      case 'radish':
        return this.spriteReadyRadish;
      case 'sunflower':
        return this.spriteReadySunflower;
      case 'wheat':
        return this.spriteReadyWheat;
      case 'smallfish':
        return this.spriteReadySmallFish;
      case 'mediumfish':
        return this.spriteReadyMediumFish;
      case 'hugefish':
        return this.spriteReadyHugeFish;
      case 'nugget':
        return this.spriteReadyNugget;
      default:
        return '';
    }
  }

  createTraders() {
    const newTrader1 = {
      position: {
        x: 1099,
        y: 930,
      },
      width: 96,
      height: 64,
      state: 'merchant-left',
    };
    this.traders.push(newTrader1);
    const newTrader2 = {
      position: {
        x: 1295,
        y: 930,
      },
      width: 96,
      height: 64,
      state: 'merchant-right',
    };
    this.traders.push(newTrader2);
  }

  private advanceMerchantAnimation() {
    const frames =
      this.gameData.spriteAnimations['goblinMerchantRight']?.frames ??
      this.gameData.spriteAnimations['goblinMerchantLeft']?.frames ??
      8;
    // Sample animation frame directly from beat phase so loop timing is
    // exact (counter stepping can drift due to tick quantization).
    // At 120 BPM, 2 beats = 1 second per full merchant idle loop.
    const safeFrames = Math.max(1, frames);
    const beatMs = 60000 / Math.max(1, this.currentBpm);
    const cycleMs = beatMs * 2;
    const now = performance.now();
    const nextBeat = this.phaserService.nextBeatWallMs();
    const anchor = nextBeat !== null ? nextBeat - beatMs : now;
    const elapsedInCycle = (((now - anchor) % cycleMs) + cycleMs) % cycleMs;
    this.goblinFrameIndex = Math.min(
      safeFrames - 1,
      Math.floor((elapsedInCycle / cycleMs) * safeFrames),
    );
    this.goblinFramesDrawn = 0;
  }

  drawMerchant(trader) {
    let traderHitbox = {
      position: {
        x: trader.position.x + 160,
        y: trader.position.y + 50,
      },
      width: trader.height,
      height: trader.height + 66,
      state: 'merchant',
    };
    const facingLeft = trader.state === 'merchant-left';
    const spriteSheet = facingLeft
      ? this.goblinMerchantLeft
      : this.goblinMerchantRight;
    if (this.canvas && this.ctx) {
      this.ctx.drawImage(
        spriteSheet,
        trader.width * this.goblinFrameIndex,
        0,
        trader.width,
        trader.height,
        trader.position.x,
        trader.position.y,
        trader.width * 4,
        225,
      );
      this.targetNearestSquare(traderHitbox);
    }
  }

  drawSleepAnimation() {
    this.applySleepBeatEnergyGain();

    if (this.bubblesFramesDrawn > this.animThreshold(16, 4)) {
      if (this.bubblesFrameIndex < 15) {
        this.bubblesFrameIndex++;
      } else {
        this.bubblesFrameIndex = 0;
      }
      this.bubblesFramesDrawn = 0;
    } else {
      this.bubblesFramesDrawn++;
    }
    if (this.canvas && this.ctx) {
      this.ctx.drawImage(
        this.spriteSleepBubbles,
        128 * this.bubblesFrameIndex,
        0,
        128,
        128,
        1035,
        190,
        128,
        128,
      );
    }
  }

  getOtherPlayerSpriteSheet(player, i) {
    const useRightAnims = player.useRightAnims;
    // this.drawOtherSpriteAnimation(
    //   useRightAnims ? this.spriteSheetIdleRight : this.spriteSheetIdleLeft,
    //   useRightAnims
    //     ? this.gameData.spriteAnimations['playerIdleRight'].frames
    //     : this.gameData.spriteAnimations['playerIdleLeft'].frames,
    //   player,
    //   i
    // );
    if (player.isBeingHit) {
      this.playerHitRecoil(player, i);
    } else {
      this.moveOthers(player, i);
    }
  }

  playerHitRecoil(player, i) {
    let frames = 8;
    let canMove = true;
    if (this.otherPlayersFrameIndex[i] < frames) {
      this.boundaries.forEach((boundary) => {
        if (
          this.recoilHitCollision({
            rectangle1: player,
            rectangle2: {
              ...boundary,
              position: {
                x: boundary.position.x,
                y: boundary.position.y,
              },
            },
          })
        ) {
          canMove = false;
        }
      });
      if (canMove) {
        player.position.x += player.hitdirection.position.x / 10;
        player.position.y += player.hitdirection.position.y / 10;
      }
      if (this.gameData.me === player.name && canMove) {
        this.movables.forEach((element) => {
          if (canMove) {
            element.position.y -= player.hitdirection.position.y / 10;
            element.position.x -= player.hitdirection.position.x / 10;
          }
        });
        this.pickupables.forEach((element) => {
          if (canMove) {
            element.position.y -= player.hitdirection.position.y / 10;
            element.position.x -= player.hitdirection.position.x / 10;
          }
        });
      }
      this.otherPlayersFrameIndex[i]++;
    } else {
      this.otherPlayersFrameIndex[i] = 0;
      const updatedPlayer = {
        ...player,
        isBeingHit: false,
      };
      this.updatePlayer.emit(updatedPlayer);
    }
  }

  drawOtherSpriteAnimation(
    spriteSheet: HTMLImageElement,
    frames: number,
    otherplayer,
    i,
  ) {
    let width = 13;
    let height = 18;
    if (this.gameData.isSleeping && this.ctx) {
      this.ctx.globalAlpha = 0;
    } else {
      if (this.ctx) this.ctx.globalAlpha = 1;
    }
    const safeFrames = Math.max(1, frames);
    const beatMs = 60000 / Math.max(1, this.currentBpm);
    const cycleMs = beatMs * 2;
    const now = performance.now();
    const nextBeat = this.phaserService.nextBeatWallMs();
    const anchor = nextBeat !== null ? nextBeat - beatMs : now;
    const elapsedInCycle = (((now - anchor) % cycleMs) + cycleMs) % cycleMs;
    this.otherPlayersFrameIndex[i] = Math.min(
      safeFrames - 1,
      Math.floor((elapsedInCycle / cycleMs) * safeFrames),
    );
    this.otherPlayersFramesDrawn[i] = 0;
    if (this.canvas && this.ctx && this.player.width && this.player.height) {
      const spriteWidth = otherplayer.isCarrying ? 128 : width;
      const spriteHeight = otherplayer.isCarrying ? this.squareSize : height;
      const positionX = otherplayer.isCarrying
        ? otherplayer.position.x - 228
        : otherplayer.position.x;
      const positionY = otherplayer.isCarrying
        ? otherplayer.position.y - 84
        : otherplayer.position.y;
      const dx = otherplayer.isCarrying ? 128 * 4 : 52;
      const dy = spriteSheet.height * 4;
      this.ctx.drawImage(
        spriteSheet,
        spriteWidth * this.otherPlayersFrameIndex[i] + 0.1,
        0,
        spriteWidth,
        spriteHeight,
        positionX,
        positionY,
        dx,
        dy,
      );
      // ***** SHOWING HIT BOX *****
      // if (this.ctx && this.player.height && this.player.width) {
      //   this.ctx.beginPath();
      //   this.ctx.rect(positionX, positionY, dx, dy);
      //   this.ctx.stroke();
      // }
      // ***** SHOWING HIT BOX *****
    }
  }

  drawSpriteAnimation(spriteSheet: HTMLImageElement, frames: number) {
    this.drawBeatSyncedSpriteAnimation(spriteSheet, frames, 2);
  }

  private drawBeatSyncedSpriteAnimation(
    spriteSheet: HTMLImageElement,
    frames: number,
    beatsPerLoop = 1,
  ) {
    if (this.gameData.isSleeping && this.ctx) {
      this.ctx.globalAlpha = 0;
    } else {
      if (this.ctx) this.ctx.globalAlpha = 1;
    }
    if (this.canvas && this.ctx && !this.isWatering) {
      this.player.width = 13;
      this.player.height = 18;
      const spriteWidth = this.gameData.isCarrying ? 128 : 13;
      const spriteHeight = this.gameData.isCarrying
        ? this.squareSize
        : this.player.height;
      const positionX = this.gameData.isCarrying
        ? this.player.position.x - 228
        : this.player.position.x;
      const positionY = this.gameData.isCarrying
        ? this.player.position.y - 84
        : this.player.position.y;
      const dx = this.gameData.isCarrying ? 128 * 4 : 52;
      const dy = spriteSheet.height * 4;
      this.player.position = {
        x: (this.canvas.width / 2 - this.player.width) / this.scale,
        y: (this.canvas.height / 2 - this.player.height) / this.scale,
      };
      this.player.center = {
        x: this.player.position.x + this.player.width * 2,
        y: this.player.position.y + this.player.height * 2,
      };

      const safeFrames = Math.max(1, frames);
      const safeBeats = Math.max(0.01, beatsPerLoop);
      const beatMs = 60000 / Math.max(1, this.currentBpm);
      const cycleMs = beatMs * safeBeats;
      const now = performance.now();
      const nextBeat = this.phaserService.nextBeatWallMs();
      // Anchor player loops to the global beat clock when available so
      // transitions (move <-> idle) stay phase-locked.
      const anchor = nextBeat !== null ? nextBeat - beatMs : now;
      const elapsedInCycle = (((now - anchor) % cycleMs) + cycleMs) % cycleMs;
      const beatFrame = Math.floor((elapsedInCycle / cycleMs) * safeFrames);

      this.ctx.drawImage(
        spriteSheet,
        spriteWidth * beatFrame,
        0,
        spriteWidth,
        spriteHeight,
        positionX,
        positionY,
        dx,
        dy,
      );
    }
  }

  drawAttackAnimation(spriteSheet: HTMLImageElement, frames) {
    let width = 128;
    let height = 65;
    if (this.ctx) {
      if (this.attackAnimationFramesDrawn > this.animThreshold(frames, 1)) {
        if (this.attackAnimationFrameIndex < frames - 1) {
          this.attackAnimationFrameIndex++;
        } else {
          if (this.ctx) {
            this.ctx.drawImage(
              spriteSheet,
              width,
              0,
              width,
              spriteSheet.height,
              this.player.position.x - 224,
              this.player.position.y - 84,
              width * 4,
              height * 4,
            );
          }
          this.attackAnimationFrameIndex = 0;
          this.attackInitiated = false;
        }
        this.attackAnimationFramesDrawn = 0;
      } else {
        this.attackAnimationFramesDrawn++;
      }
      this.drawBroomHitbox(this.attackAnimationFrameIndex);
      this.ctx.drawImage(
        spriteSheet,
        width * this.attackAnimationFrameIndex,
        0,
        width,
        spriteSheet.height,
        this.player.position.x - 224,
        this.player.position.y - 84,
        width * 4,
        height * 4,
      );
    }
  }

  drawBroomHitbox(frame) {
    if (
      this.ctx &&
      this.player &&
      this.player.width &&
      this.player.height &&
      this.player.center &&
      frame > 1 &&
      frame < 8
    ) {
      const xMult = this.useRightAnims() ? -1 : 1;
      let hitbox = {
        width: 0,
        height: 0,
        position: {
          x: 0,
          y: 0,
        },
      };
      if (frame < 4) {
        hitbox = {
          width: 100 * xMult,
          height: 40,
          position: {
            x: this.player.center.x,
            y: this.player.center.y,
          },
        };
      } else if (frame < 5) {
        hitbox = {
          width: 120,
          height: -90,
          position: {
            x: this.player.center.x - 60,
            y: this.player.center.y,
          },
        };
      } else {
        hitbox = {
          width: -130 * xMult,
          height: 40,
          position: {
            x: this.player.center.x,
            y: this.player.center.y,
          },
        };
      }

      this.ctx.beginPath();
      this.ctx.strokeStyle = 'black';
      this.ctx.rect(
        hitbox.position.x,
        hitbox.position.y,
        hitbox.width,
        hitbox.height,
      );
      this.ctx.stroke();

      this.lobbyPlayers.forEach((player) => {
        if (!player.isBeingHit) {
          if (
            this.rectangularHitCollision({
              rectangle1: hitbox,
              rectangle2: player,
            })
          ) {
            const updatedPlayer = {
              ...player,
              isBeingHit: true,
              isCarrying: false,
              hitdirection: {
                ...player.hitdirection,
                position: {
                  x: this.getHitPos(player, hitbox, 'x'),
                  y: this.getHitPos(player, hitbox, 'y'),
                },
              },
            };
            if (player.name !== this.gameData.me)
              this.updatePlayer.emit(updatedPlayer);
          }
        }
      });
    }
  }

  drawCultivateAnimation(
    spriteSheet: HTMLImageElement,
    frames: number,
    area,
    i,
  ) {
    let width = 128;
    let height = 65;
    let clickedFarmEvent = {
      clickedFarmableArea: area,
      isWatering: this.isWatering,
      equippedTool: this.gameData.equippedTool,
      allowSeedPlanting: false,
      me: this.gameData.me,
      upg: this.upg,
    };
    if (
      this.framesDrawn[i] > this.animThreshold(frames, this.cultivateBeats())
    ) {
      if (this.actionFrameIndex[i] < frames - 1) {
        if (
          this.actionFrameIndex[i] === 3 &&
          this.gameData.equippedTool !== 'rod' &&
          this.gameData.equippedTool !== 'pickaxe'
        ) {
          this.changeHoveredFarm.emit(clickedFarmEvent);
        } else if (
          this.actionFrameIndex[i] > 7 &&
          this.gameData.equippedTool === 'pickaxe'
        ) {
          this.changeHoveredFarm.emit(clickedFarmEvent);
        } else if (
          this.actionFrameIndex[i] > 39 &&
          this.gameData.equippedTool === 'rod'
        ) {
          this.changeHoveredFarm.emit(clickedFarmEvent);
        }
        this.actionFrameIndex[i]++;
      } else {
        if (this.ctx) {
          this.ctx.drawImage(
            spriteSheet,
            width * 12,
            0,
            width,
            spriteSheet.height,
            this.player.position.x - 224,
            this.player.position.y - 84,
            width * 4,
            height * 4,
          );
          this.cultivateOther.emit(this.gameData.me);
        }

        this.actionFrameIndex[i] = 0;
        area.queuedCultivate = false;
        this.attackInitiated = false;
      }
      this.framesDrawn[i] = 0;
    } else {
      this.framesDrawn[i]++;
    }

    if (this.ctx) {
      this.ctx.drawImage(
        spriteSheet,
        width * this.actionFrameIndex[i],
        0,
        width,
        spriteSheet.height,
        this.player.position.x - 224,
        this.player.position.y - 84,
        width * 4,
        height * 4,
      );
    }
  }

  drawOtherCultivateAnimation(
    spriteSheet: HTMLImageElement,
    frames: number,
    player: LobbyPlayer,
    i: number,
  ) {
    let width = 128;
    let height = 65;
    if (
      this.otherCultivateFramesDrawn[i] >
      this.animThreshold(frames, this.cultivateBeats())
    ) {
      if (this.otherCultivateFrameIndex[i] < frames - 1) {
        this.otherCultivateFrameIndex[i]++;
      } else {
        if (this.ctx) {
          this.ctx.drawImage(
            spriteSheet,
            width * 12,
            0,
            width,
            spriteSheet.height,
            player.position.x - 224,
            player.position.y - 84,
            width * 4,
            height * 4,
          );
        }
        this.otherCultivateFrameIndex[i] = 0;
        player.isCultivating = false;
      }
      this.otherCultivateFramesDrawn[i] = 0;
    } else {
      this.otherCultivateFramesDrawn[i]++;
    }

    if (this.ctx) {
      this.ctx.drawImage(
        spriteSheet,
        width * this.otherCultivateFrameIndex[i],
        0,
        width,
        spriteSheet.height,
        player.position.x - 224,
        player.position.y - 84,
        width * 4,
        height * 4,
      );
    }
  }

  changeStateOfHoveredFarmable(evt) {
    if (evt.isWatering) {
      const area = this.areaById.get(evt.clickedFarmableArea.id);
      if (area) {
        if (!area.watered) {
          area.watered = true;
          // Beat-driven growth: align growth start to the next music-beat
          // boundary so a slightly-off watering still ticks on-beat.
          area.wateredAtMs =
            this.phaserService.nextBeatWallMs() ?? performance.now();
        }
      }
      if (evt.me === this.gameData.me && !this.isShiftDown) {
        this.isWatering = false;
        evt.clickedFarmableArea.queuedCultivate = false;
        this.actionFrameIndex = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        this.framesDrawn = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        this.carryCoolDown(this.gameData.me);
        this.changeTool.emit('shovel');
      }
      return;
    }
    if (
      evt.clickedFarmableArea.state === 'fishable' &&
      evt.me === this.gameData.me &&
      !this.gameData.isCarrying
    ) {
      const getRandom = Math.random() * 100;
      if (getRandom < 80 - this.gameData.fisherValue) {
        this.changeTool.emit('smallfish');
      } else if (getRandom < 100 - this.gameData.fisherValue) {
        this.changeTool.emit('mediumfish');
      } else {
        this.changeTool.emit('hugefish');
      }
    } else if (
      evt.clickedFarmableArea.state === 'minable' &&
      evt.me === this.gameData.me &&
      !this.gameData.isCarrying
    ) {
      this.tryAwardMiningNugget();
    }
    if (evt.equippedTool === 'shovel') {
      this.farmAction(evt.clickedFarmableArea, evt.upg);
    }
    if (
      this.isAPlantSeed(evt.equippedTool) &&
      evt.allowSeedPlanting !== false
    ) {
      this.plantSeed(evt);
    }
  }

  /** Beats of music a watered crop needs to advance to the next stage. */
  private static readonly GROW_BEATS = 12;

  /**
   * Replaces the old setTimeout-based growth. Called from drawFarmable()
   * for every watered crop tile so growth stays in sync with the music
   * beat clock — at 120 BPM, 12 beats = 12 seconds; at 130 BPM, ~11.1s.
   * Returns the 0..1 progress to render in the bar.
   */
  private advanceWateredGrowth(area: any): number {
    if (!area.watered || typeof area.wateredAtMs !== 'number') return 0;
    const dash = area.state.indexOf('-');
    if (dash <= 0) return 0;
    const prefix = area.state.substring(0, dash);
    if (prefix === 'soil') return 0;
    const beatMs = 60000 / Math.max(1, this.currentBpm);
    const elapsedBeats = (performance.now() - area.wateredAtMs) / beatMs;
    // Snap the bar to each whole beat so it ticks in time with the music
    // instead of sliding smoothly between beats. Clamp to >=0 so a
    // future-aligned wateredAtMs (next beat) doesn't read negative.
    const snappedBeats = Math.max(0, Math.floor(elapsedBeats));
    const progress = Math.min(1, snappedBeats / GameComponent.GROW_BEATS);
    if (progress >= 1) {
      const stage = +area.state.substring(dash + 1);
      if (stage === 4) {
        this.createPickupablePlantAtArea(
          prefix,
          area.position,
          area.id,
          this.gameData.me,
          false,
        );
        area.state = 'soil-1';
      } else if (Number.isFinite(stage)) {
        area.state = `${prefix}-${stage + 1}`;
      }
      area.watered = false;
      area.wateredAtMs = undefined;
      return 0;
    }
    return progress;
  }

  startWaterTimer(_area) {
    // Deprecated: growth is now beat-driven via advanceWateredGrowth().
    // Kept as a no-op so any stale callers don't blow up.
  }

  createPickupablePlantAtArea(plant, position, id, playerName, dropped) {
    const player = this.lobbyPlayers.filter(
      (player) => player.name === playerName,
    )[0];
    const playerFromMiddle = {
      name: player.name,
      position: {
        x: player.position.x,
        y: player.position.y,
      },
      distanceFromMiddle: {
        x: player.position.x - this.traders[0].position.x,
        y: player.position.y - this.traders[0].position.y,
      },
    };
    const newPosition =
      position && !dropped ? position : playerFromMiddle.position;
    this.pickupables.push({
      plant: plant,
      position: newPosition,
      id: id,
      dropped: dropped,
    });
    this.pickupableFramesDrawn[this.pickupables.length - 1] = 0;
    this.pickupableFrameIndex[this.pickupables.length - 1] = 0;
  }
  isAPlantSeed(tool) {
    return (
      tool === 'potato-seeds' ||
      tool === 'carrot-seeds' ||
      tool === 'wheat-seeds' ||
      tool === 'cabbage-seeds' ||
      tool === 'cauliflower-seeds' ||
      tool === 'beet-seeds' ||
      tool === 'radish-seeds' ||
      tool === 'kale-seeds' ||
      tool === 'sunflower-seeds'
    );
  }

  carryCoolDown(playerName) {
    this.lobbyPlayers = this.lobbyPlayers.map((player) => {
      if (player.name === playerName) {
        return {
          ...player,
          canCarry: false,
        };
      }
      return {
        ...player,
      };
    });
    setTimeout(() => {
      this.lobbyPlayers = this.lobbyPlayers.map((player) => {
        if (player.name === playerName) {
          return {
            ...player,
            canCarry: true,
          };
        }
        return {
          ...player,
        };
      });
    }, 1000);
  }

  /**
   * seed-tool name → crop metadata. Drives plantSeed so we don't need 9
   * nearly-identical if-blocks (one per crop).
   *
   * keyname = key under gameData.seedsOwned (inventory)
   * cropPrefix = prefix written into area.state, e.g. "potato-0"
   */
  private static readonly SEED_TO_CROP: Record<
    string,
    { keyname: string; cropPrefix: string }
  > = {
    'potato-seeds': { keyname: 'potato', cropPrefix: 'potato' },
    'carrot-seeds': { keyname: 'carrot', cropPrefix: 'carrot' },
    'wheat-seeds': { keyname: 'wheat', cropPrefix: 'wheat' },
    'cabbage-seeds': { keyname: 'cabbage', cropPrefix: 'cabbage' },
    'cauliflower-seeds': { keyname: 'cauliflower', cropPrefix: 'cauliflower' },
    'beet-seeds': { keyname: 'beets', cropPrefix: 'beets' },
    'radish-seeds': { keyname: 'radish', cropPrefix: 'radish' },
    'kale-seeds': { keyname: 'kale', cropPrefix: 'kale' },
    'sunflower-seeds': { keyname: 'sunflower', cropPrefix: 'sunflower' },
  };

  plantSeed(evt) {
    const clickedFarm = this.areaById.get(evt.clickedFarmableArea.id);
    if (!clickedFarm || clickedFarm.state !== 'soil-3') return;

    const crop = GameComponent.SEED_TO_CROP[evt.equippedTool];
    if (!crop) return;

    const owned = this.gameData.seedsOwned[crop.keyname];
    if (!owned || owned.count <= 0) return;

    clickedFarm.state = `${crop.cropPrefix}-0`;

    if (evt.me === this.gameData.me) {
      this.reduceSeedCount.emit({
        name: owned.name,
        count: owned.count,
        keyname: crop.keyname,
      });
      evt.clickedFarmableArea.queuedCultivate = false;
      this.clickedFarmableArea = [];
      this.actionFrameIndex = this.actionFrameIndex.map(() => 0);
      this.framesDrawn = this.framesDrawn.map(() => 0);
      this.changeTool.emit('shovel');
    }
  }

  farmAction(clickedFarmableArea, upg) {
    // One click tills to soil-3 (fully plantable) directly.
    const clickedFarm = this.areaById.get(clickedFarmableArea.id);
    if (clickedFarm) {
      clickedFarm.state = 'soil-3';
    }
  }

  drawBoundary(boundary) {
    if (this.ctx) {
      this.ctx.fillStyle = 'transparent';
      this.ctx.fillRect(
        boundary.position.x,
        boundary.position.y,
        boundary.width,
        boundary.height,
      );
    }
  }

  /**
   * Crop state prefix → Image instance field on this. Used by drawFarmable
   * to dispatch sprite rendering without 50+ if/else branches.
   */
  private static readonly CROP_SHEETS: Record<string, string> = {
    soil: 'spriteSheetSoil',
    beets: 'spriteSheetBeets',
    cabbage: 'spriteSheetCabbage',
    carrot: 'spriteSheetCarrot',
    cauliflower: 'spriteSheetCauliflower',
    kale: 'spriteSheetKale',
    potato: 'spriteSheetPotato',
    radish: 'spriteSheetRadish',
    sunflower: 'spriteSheetSunflower',
    wheat: 'spriteSheetWheat',
  };

  drawFarmable(area: any) {
    if (this.ctx) {
      const ctx = this.ctx;
      const size = this.squareSize;
      const state: string = area.state;
      // Crop / soil states are "<crop>-<frame>". Anything else (fishable,
      // house, merchant, well, untargetable, none) draws no sprite — the
      // transparent fillRect below preserves the hit-test bounds.
      const dash = state.indexOf('-');
      let drewSprite = false;
      if (dash > 0) {
        const prefix = state.substring(0, dash);
        const frame = +state.substring(dash + 1);
        const sheetKey = GameComponent.CROP_SHEETS[prefix];
        if (sheetKey && Number.isFinite(frame)) {
          const sheet = (this as any)[sheetKey] as HTMLImageElement;
          if (sheet) {
            ctx.drawImage(
              sheet,
              size * frame,
              0,
              size,
              size,
              area.position.x,
              area.position.y,
              size,
              size,
            );
            drewSprite = true;
          }
        }
      }
      if (!drewSprite) {
        ctx.fillStyle = 'transparent';
        ctx.fillRect(area.position.x, area.position.y, area.width, area.height);
      }
      if (area.watered) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(area.position.x, area.position.y, area.width, area.height);
        // Beat-driven growth + progress bar (crops only; soil tiles are
        // skipped inside advanceWateredGrowth).
        const progress = this.advanceWateredGrowth(area);
        if (progress > 0) {
          const barH = 4;
          const barY = area.position.y + 2;
          ctx.fillStyle = 'rgba(0,0,0,0.55)';
          ctx.fillRect(area.position.x + 2, barY, area.width - 4, barH);
          ctx.fillStyle = '#7CFC00';
          ctx.fillRect(
            area.position.x + 2,
            barY,
            (area.width - 4) * progress,
            barH,
          );
        }
      }
    }
    area.center = {
      x: area.position.x + area.width / 2,
      y: area.position.y + area.height / 2,
    };

    this.targetNearestSquare(area);
  }

  retangularCollision({ rectangle1, rectangle2 }) {
    // *4 is for width scale.

    return (
      rectangle1.position.x + rectangle1.width * 4 >= rectangle2.position.x &&
      rectangle1.position.x <= rectangle2.position.x + rectangle2.width &&
      rectangle1.position.y <= rectangle2.position.y + rectangle2.height &&
      rectangle1.position.y + rectangle1.height >= rectangle2.position.y
    );
  }

  /** Collision check with an offset applied to r2's position, avoiding object spread allocation. */
  private collisionWithOffset(
    r1: any,
    r2: any,
    ox: number,
    oy: number,
  ): boolean {
    const r2x = r2.position.x + ox;
    const r2y = r2.position.y + oy;
    return (
      r1.position.x + r1.width * 4 >= r2x &&
      r1.position.x <= r2x + r2.width &&
      r1.position.y <= r2y + r2.height &&
      r1.position.y + r1.height >= r2y
    );
  }

  recoilHitCollision({ rectangle1, rectangle2 }) {
    // *4 is for width scale.
    const EXTRA_BOUNDS = 30;
    return (
      rectangle1.position.x + rectangle1.width * 4 >=
        rectangle2.position.x - 60 &&
      rectangle1.position.x <=
        rectangle2.position.x + rectangle2.width + EXTRA_BOUNDS &&
      rectangle1.position.y <=
        rectangle2.position.y + rectangle2.height + EXTRA_BOUNDS &&
      rectangle1.position.y + rectangle1.height >=
        rectangle2.position.y - EXTRA_BOUNDS
    );
  }

  rectangularHitCollision({ rectangle1, rectangle2 }) {
    const rect2Width = this.player.width ? this.player.width * 4 : 0;
    const rect2Height = this.player.height ? this.player.height * 4 : 0;
    return (
      (rectangle1.position.x + rectangle1.width >= rectangle2.position.x &&
        rectangle1.position.x <= rectangle2.position.x + rect2Width &&
        rectangle1.position.y <= rectangle2.position.y + rect2Height &&
        rectangle1.position.y + rectangle1.height >= rectangle2.position.y) ||
      (rectangle1.position.x + rectangle1.width <=
        rectangle2.position.x + rect2Width &&
        rectangle1.position.x >= rectangle2.position.x + rect2Width &&
        rectangle1.position.y <= rectangle2.position.y + rect2Height &&
        rectangle1.position.y + rectangle1.height >= rectangle2.position.y) ||
      (rectangle1.position.x + rectangle1.width <= rectangle2.position.x &&
        rectangle1.position.x >= rectangle2.position.x + rect2Width &&
        rectangle1.position.y <= rectangle2.position.y + rect2Height &&
        rectangle1.position.y + rectangle1.height >= rectangle2.position.y) ||
      (rectangle1.position.x + rectangle1.width >= rectangle2.position.x &&
        rectangle1.position.x <= rectangle2.position.x + rect2Width &&
        rectangle1.position.y >= rectangle2.position.y + rect2Height &&
        rectangle1.position.y + rectangle1.height >= rectangle2.position.y)
    );
  }

  createCollisionsAndMovables() {
    this.gameData.collisionMap.forEach((row, i) => {
      row.forEach((symbol, j) => {
        if (symbol === 4097 && this.mapImage) {
          const newBoundary = {
            position: {
              x: j * this.boundary.width + this.mapImage.position.x,
              y: i * this.boundary.height + this.mapImage.position.y,
            },
            width: this.boundary.width,
            height: this.boundary.height,
            state: 'boundary',
          };
          this.boundaries.push(newBoundary);
        }
      });
    });
  }

  createUntargetableArea(map) {
    map.forEach((row, i) => {
      row.forEach((symbol, j) => {
        if (symbol !== 0 && this.mapImage) {
          const newUntargetableArea = {
            position: {
              x: j * this.boundary.width + this.mapImage.position.x,
              y: i * this.boundary.height + this.mapImage.position.y,
            },
            width: this.boundary.width,
            height: this.boundary.height,
            state: 'untargetable',
          };
          this.untargetableArea.push(newUntargetableArea);
        }
      });
    });
  }

  createFarmableArea(map) {
    map.forEach((row, i) => {
      row.forEach((symbol, j) => {
        if (symbol !== 0 && this.mapImage) {
          const newFarmableArea = {
            position: {
              x: j * this.boundary.width + this.mapImage.position.x,
              y: i * this.boundary.height + this.mapImage.position.y,
            },
            width: this.boundary.width,
            height: this.boundary.height,
            state: 'none',
            id: 'i' + i.toString() + 'j' + j.toString(),
          };
          this.farmableArea.push(newFarmableArea);
        }
      });
    });
    // Build the O(1) id → area lookup. Mutations later (plantSeed,
    // farmAction, watering) update the same object references the map
    // already holds, so no further sync is needed.
    this.areaById.clear();
    for (const area of this.farmableArea) {
      this.areaById.set(area.id, area);
    }
  }

  createFishableArea(map) {
    map.forEach((row, i) => {
      row.forEach((symbol, j) => {
        if (symbol !== 0 && this.mapImage) {
          const newFishableArea = {
            position: {
              x: j * this.boundary.width + this.mapImage.position.x,
              y: i * this.boundary.height + this.mapImage.position.y,
            },
            width: this.boundary.width,
            height: this.boundary.height,
            state: 'fishable',
          };
          this.fishableArea.push(newFishableArea);
        }
      });
    });
  }

  createMinableArea(map) {
    map.forEach((row, i) => {
      row.forEach((symbol, j) => {
        if (symbol !== 0 && this.mapImage) {
          const newMinableArea = {
            position: {
              x: j * this.boundary.width + this.mapImage.position.x,
              y: i * this.boundary.height + this.mapImage.position.y,
            },
            width: this.boundary.width,
            height: this.boundary.height,
            state: 'minable',
          };
          this.minableArea.push(newMinableArea);
        }
      });
    });
  }

  createHouseArea(map) {
    map.forEach((row, i) => {
      row.forEach((symbol, j) => {
        if (symbol !== 0 && this.mapImage) {
          const newHouseArea = {
            position: {
              x: j * this.boundary.width + this.mapImage.position.x,
              y: i * this.boundary.height + this.mapImage.position.y,
            },
            width: this.boundary.width,
            height: this.boundary.height,
            state: 'house',
          };
          this.houseArea.push(newHouseArea);
        }
      });
    });
  }

  createWellArea(map) {
    map.forEach((row, i) => {
      row.forEach((symbol, j) => {
        if (symbol !== 0 && this.mapImage) {
          const newWellArea = {
            position: {
              x: j * this.boundary.width + this.mapImage.position.x,
              y: i * this.boundary.height + this.mapImage.position.y,
            },
            width: this.boundary.width,
            height: this.boundary.height,
            state: 'well',
          };
          this.wellArea.push(newWellArea);
        }
      });
    });
  }

  createMovables() {
    this.movables = [
      this.mapImage,
      ...this.boundaries,
      ...this.untargetableArea,
      ...this.farmableArea,
      ...this.minableArea,
      ...this.fishableArea,
      ...this.houseArea,
      ...this.wellArea,
      ...this.traders,
      ...this.lobbyPlayers,
    ];
  }

  @HostListener('document:keydown', ['$event'])
  keyDownEvent(e: KeyboardEvent) {
    const isMoveKey = ['w', 'a', 's', 'd'].includes(e.key.toLowerCase());
    if (e.key === 'CapsLock') {
      e.preventDefault();
      return;
    }
    if (this.isStartupCountdownLocked) {
      if (isMoveKey || e.key === 'Shift' || /^[1-9]$/.test(e.key)) {
        e.preventDefault();
      }
      return;
    }
    if (isMoveKey && this.gameData.isSleeping) {
      return;
    }
    if (e.key === 'Shift' && !this.isShiftDown && !this.gameData.isCarrying) {
      this.isShiftDown = true;
      this.changeEquippedTool('broom');
    }
    if (!this.memoryKeys.w.pressed && e.key === 'w') {
      this.moveUp(true);
    }
    if (!this.memoryKeys.a.pressed && e.key === 'a') {
      this.moveLeft(true);
    }
    if (!this.memoryKeys.s.pressed && e.key === 's') {
      this.moveDown(true);
    }
    if (!this.memoryKeys.d.pressed && e.key === 'd') {
      this.moveRight(true);
    }
    if (!this.memoryKeys.w.pressed && e.key === 'W') {
      this.isShiftDown = true;
      this.moveUp(true);
    }
    if (!this.memoryKeys.a.pressed && e.key === 'A') {
      this.isShiftDown = true;
      this.moveLeft(true);
    }
    if (!this.memoryKeys.s.pressed && e.key === 'S') {
      this.isShiftDown = true;
      this.moveDown(true);
    }
    if (!this.memoryKeys.d.pressed && e.key === 'D') {
      this.isShiftDown = true;
      this.moveRight(true);
    }
    switch (e.key.toLowerCase()) {
      case '1':
        this.handleSeedHotkey('potato-seeds', 'potato');
        break;
      case '2':
        this.handleSeedHotkey('carrot-seeds', 'carrot');
        break;
      case '3':
        this.handleSeedHotkey('wheat-seeds', 'wheat');
        break;
      case '4':
        this.handleSeedHotkey('cabbage-seeds', 'cabbage');
        break;
      case '5':
        this.handleSeedHotkey('cauliflower-seeds', 'cauliflower');
        break;
      case '6':
        this.handleSeedHotkey('beet-seeds', 'beets');
        break;
      case '7':
        this.handleSeedHotkey('radish-seeds', 'radish');
        break;
      case '8':
        this.handleSeedHotkey('kale-seeds', 'kale');
        break;
      case '9':
        this.handleSeedHotkey('sunflower-seeds', 'sunflower');
        break;
      default:
        break;
    }
  }

  private handleSeedHotkey(seedTool: string, seedKey: string) {
    if (this.isStartupCountdownLocked) return;
    const owned = this.gameData.seedsOwned[seedKey];
    if (!owned || owned.count <= 0) {
      this.setHeadText('Need seeds!');
      return;
    }

    this.changeTool.emit(seedTool);

    if (!this.gameData.seedInstantPlant) return;

    const hovered = this.hoveredFarmableArea;
    const canPlantNow =
      !this.gameData.isSleeping &&
      !this.gameData.isCarrying &&
      !this.gameData.openShop &&
      !this.isShiftDown &&
      !this.isWatering &&
      this.gameData.energy.current >= GameComponent.MAX_ACTION_ENERGY_COST &&
      this.gameData.canHarvest &&
      hovered?.state === 'soil-3' &&
      this.isAreaCloseToPlayer(this.player, hovered);

    if (!canPlantNow) {
      if (this.gameData.energy.current < GameComponent.MAX_ACTION_ENERGY_COST) {
        this.setHeadText('Too tired...');
      }
      return;
    }

    const targets = this.sowableArea.filter((area) => area?.state === 'soil-3');
    const plantAreas = (targets.length ? targets : [hovered]).slice(
      0,
      owned.count,
    );

    for (const area of plantAreas) {
      this.changeStateOfHoveredFarmable({
        clickedFarmableArea: area,
        isWatering: false,
        equippedTool: seedTool,
        allowSeedPlanting: true,
        me: this.gameData.me,
        upg: this.upg,
      });
    }

    this.judgeRhythm('plant');
  }
  @HostListener('document:keyup', ['$event'])
  keyUpEvent(e: KeyboardEvent) {
    switch (e.key.toLowerCase()) {
      case 'shift':
        this.isShiftDown = false;
        this.changeEquippedTool('none');
        break;
      case 'w':
        if (this.memoryKeys.w.pressed) this.moveUp(false);
        break;
      case 'a':
        if (this.memoryKeys.a.pressed) this.moveLeft(false);
        break;
      case 's':
        if (this.memoryKeys.s.pressed) this.moveDown(false);
        break;
      case 'd':
        if (this.memoryKeys.d.pressed) this.moveRight(false);
        break;
      default:
        break;
    }
  }

  moveUp(bool: boolean) {
    this.memoryKeys.w.pressed = bool;
    this.keyChange.emit({
      w: {
        pressed: this.memoryKeys.w.pressed,
      },
      a: {
        pressed: this.memoryKeys.a.pressed,
      },
      s: {
        pressed: this.memoryKeys.s.pressed,
      },
      d: {
        pressed: this.memoryKeys.d.pressed,
      },
    } as KeyWASD);
  }
  moveLeft(bool: boolean) {
    this.memoryKeys.a.pressed = bool;
    this.keyChange.emit({
      w: {
        pressed: this.memoryKeys.w.pressed,
      },
      a: {
        pressed: this.memoryKeys.a.pressed,
      },
      s: {
        pressed: this.memoryKeys.s.pressed,
      },
      d: {
        pressed: this.memoryKeys.d.pressed,
      },
    } as KeyWASD);
  }
  moveRight(bool: boolean) {
    this.memoryKeys.d.pressed = bool;
    this.keyChange.emit({
      w: {
        pressed: this.memoryKeys.w.pressed,
      },
      a: {
        pressed: this.memoryKeys.a.pressed,
      },
      s: {
        pressed: this.memoryKeys.s.pressed,
      },
      d: {
        pressed: this.memoryKeys.d.pressed,
      },
    } as KeyWASD);
  }
  moveDown(bool: boolean) {
    this.memoryKeys.s.pressed = bool;
    this.keyChange.emit({
      w: {
        pressed: this.memoryKeys.w.pressed,
      },
      a: {
        pressed: this.memoryKeys.a.pressed,
      },
      s: {
        pressed: this.memoryKeys.s.pressed,
      },
      d: {
        pressed: this.memoryKeys.d.pressed,
      },
    } as KeyWASD);
  }

  getMousePos(evt) {
    if (this.canvas) {
      const rect = this.canvas.getBoundingClientRect();
      this.mousePos = {
        x:
          (((evt.clientX - rect.left) / (rect.right - rect.left)) *
            this.canvas.width) /
          this.scale,
        y:
          (((evt.clientY - rect.top) / (rect.bottom - rect.top)) *
            this.canvas.height) /
          this.scale,
      };
    }
    return;
  }

  useRightAnims() {
    if (this.mousePos.x > this.player.position.x) {
      this.lobbyPlayers.filter(
        (player) => player.name === this.gameData.me,
      )[0].useRightAnims = true;
      return true;
    } else {
      this.lobbyPlayers.filter(
        (player) => player.name === this.gameData.me,
      )[0].useRightAnims = false;
      return false;
    }
  }

  cultivate(area, i?) {
    const spriteSheet = this.getCultivateSpriteSheet();

    if (spriteSheet) {
      this.drawCultivateAnimation(
        this.useRightAnims() ? spriteSheet.right : spriteSheet.left,
        this.useRightAnims()
          ? this.gameData.spriteAnimations[spriteSheet.rightKey].frames
          : this.gameData.spriteAnimations[spriteSheet.leftKey].frames,
        area,
        i,
      );
    }
  }

  getCultivateSpriteSheet() {
    switch (this.gameData.equippedTool) {
      case 'shovel':
        return {
          right: this.spriteSheetDigRight,
          left: this.spriteSheetDigLeft,
          rightKey: 'spriteSheetDigRight',
          leftKey: 'spriteSheetDigLeft',
        };
      case 'hammer':
        return {
          right: this.spriteSheetHammerRight,
          left: this.spriteSheetHammerLeft,
          rightKey: 'spriteSheetHammerRight',
          leftKey: 'spriteSheetHammerLeft',
        };
      case 'pickaxe':
        return {
          right: this.spriteSheetPickaxeRight,
          left: this.spriteSheetPickaxeLeft,
          rightKey: 'spriteSheetMineRight',
          leftKey: 'spriteSheetMineLeft',
        };
      case 'broom':
        return {
          right: this.spriteSheetBroomRight,
          left: this.spriteSheetBroomLeft,
          rightKey: 'spriteSheetBroomRight',
          leftKey: 'spriteSheetBroomLeft',
        };
      case 'rod':
        return {
          right: this.spriteSheetFishRight,
          left: this.spriteSheetFishLeft,
          rightKey: 'spriteSheetFishRight',
          leftKey: 'spriteSheetFishLeft',
        };
      case 'potato-seeds':
      case 'carrot-seeds':
      case 'wheat-seeds':
      case 'cabbage-seeds':
      case 'cauliflower-seeds':
      case 'beet-seeds':
      case 'radish-seeds':
      case 'kale-seeds':
      case 'sunflower-seeds':
      case 'basket':
        return {
          right: this.spriteSheetPlantRight,
          left: this.spriteSheetPlantLeft,
          rightKey: 'spriteSheetPlantRight',
          leftKey: 'spriteSheetPlantLeft',
        };
    }
    return null;
  }

  getCultivateOthersSpriteSheet(player) {
    switch (player.equippedTool) {
      case 'shovel':
        return {
          right: this.spriteSheetDigRight,
          left: this.spriteSheetDigLeft,
          rightKey: 'spriteSheetDigRight',
          leftKey: 'spriteSheetDigLeft',
        };
      case 'hammer':
        return {
          right: this.spriteSheetHammerRight,
          left: this.spriteSheetHammerLeft,
          rightKey: 'spriteSheetHammerRight',
          leftKey: 'spriteSheetHammerLeft',
        };
      case 'pickaxe':
        return {
          right: this.spriteSheetPickaxeRight,
          left: this.spriteSheetPickaxeLeft,
          rightKey: 'spriteSheetMineRight',
          leftKey: 'spriteSheetMineLeft',
        };
      case 'broom':
        return {
          right: this.spriteSheetBroomRight,
          left: this.spriteSheetBroomLeft,
          rightKey: 'spriteSheetBroomRight',
          leftKey: 'spriteSheetBroomLeft',
        };
      case 'rod':
        return {
          right: this.spriteSheetFishRight,
          left: this.spriteSheetFishLeft,
          rightKey: 'spriteSheetFishRight',
          leftKey: 'spriteSheetFishLeft',
        };
      case 'potato-seeds':
      case 'carrot-seeds':
      case 'wheat-seeds':
      case 'cabbage-seeds':
      case 'cauliflower-seeds':
      case 'beet-seeds':
      case 'radish-seeds':
      case 'kale-seeds':
      case 'sunflower-seeds':
      case 'basket':
        return {
          right: this.spriteSheetPlantRight,
          left: this.spriteSheetPlantLeft,
          rightKey: 'spriteSheetPlantRight',
          leftKey: 'spriteSheetPlantLeft',
        };
    }
    return null;
  }

  movement(velocity, isAttacking?) {
    if (this.isStartupCountdownLocked) {
      if (!isAttacking && this.ctx) this.drawSpriteBasedOnTool(false);
      return;
    }
    let player = this.lobbyPlayers.filter(
      (p) => p.name === this.gameData.me,
    )[0];
    let useRightAnims;
    if (this.mousePos.x > this.player.position.x) {
      useRightAnims = true;
    } else {
      useRightAnims = false;
    }
    let moving = true;
    let canMoveHorizontal = true;
    let canMoveVertical = true;

    if (this.memoryKeys.w.pressed) {
      for (let i = 0; i < this.boundaries.length; i++) {
        const boundary = this.boundaries[i];
        if (this.collisionWithOffset(this.player, boundary, 0, 3)) {
          moving = false;
          canMoveHorizontal = true;
          canMoveVertical = false;
        }
      }
      if (moving || canMoveVertical) {
        this.movables.forEach((element) => {
          element.position.y += velocity;
        });
        this.pickupables.forEach((element) => {
          if (element.dropped) {
            element.position.y += velocity;
          }
        });
      }
    }
    if (this.memoryKeys.s.pressed) {
      for (let i = 0; i < this.boundaries.length; i++) {
        const boundary = this.boundaries[i];
        if (this.collisionWithOffset(this.player, boundary, 0, -30)) {
          moving = false;
          canMoveHorizontal = true;
          canMoveVertical = false;
        }
      }
      if (moving || canMoveVertical) {
        this.movables.forEach((element) => {
          element.position.y -= velocity;
        });
        this.pickupables.forEach((element) => {
          if (element.dropped) {
            element.position.y -= velocity;
          }
        });
      }
    }
    if (this.memoryKeys.d.pressed) {
      for (let i = 0; i < this.boundaries.length; i++) {
        const boundary = this.boundaries[i];
        if (this.collisionWithOffset(this.player, boundary, -3, 0)) {
          canMoveVertical = true;
          canMoveHorizontal = false;
          moving = false;
        }
      }
      if (moving || canMoveHorizontal) {
        this.movables.forEach((element) => {
          element.position.x -= velocity;
        });
        this.pickupables.forEach((element) => {
          if (element.dropped) {
            element.position.x -= velocity;
          }
        });
      }
    }
    if (this.memoryKeys.a.pressed) {
      for (let i = 0; i < this.boundaries.length; i++) {
        const boundary = this.boundaries[i];
        if (this.collisionWithOffset(this.player, boundary, 3, 0)) {
          canMoveHorizontal = false;
          moving = false;
        }
      }
      if (moving || canMoveHorizontal) {
        this.movables.forEach((element) => {
          element.position.x += velocity;
        });
        this.pickupables.forEach((element) => {
          if (element.dropped) {
            element.position.x += velocity;
          }
        });
      }
    }
    if (this.gameData.isSleeping) {
      canMoveHorizontal = false;
      moving = false;
      this.drawSleepAnimation();
    }

    if (
      !this.memoryKeys.w.pressed &&
      !this.memoryKeys.a.pressed &&
      !this.memoryKeys.s.pressed &&
      !this.memoryKeys.d.pressed &&
      !this.gameData.isSleeping
    ) {
      if (!isAttacking) this.drawSpriteBasedOnTool(false);
    } else {
      if (!isAttacking) this.drawSpriteBasedOnTool(true);
    }

    player.moving = moving;
    player.canMoveHorizontal = canMoveHorizontal;
    player.canMoveVertical = canMoveVertical;
    player.useRightAnims = useRightAnims;
    player.isCarrying = this.gameData.isCarrying;
    player.equippedTool = this.gameData.equippedTool;
    player.isWatering = this.isWatering;

    const _stateKey = `${moving}|${canMoveHorizontal}|${canMoveVertical}|${useRightAnims}|${this.gameData.isCarrying}|${this.isWatering}|${this.gameData.equippedTool}|${player.position.x}|${player.position.y}`;
    if (_stateKey !== this._lastPlayerStateKey) {
      this._lastPlayerStateKey = _stateKey;
      this.changePlayerState.emit({
        ...player,
        moving,
        canMoveHorizontal,
        canMoveVertical,
        useRightAnims,
        isCarrying: this.gameData.isCarrying,
        isWatering: this.isWatering,
        equippedTool: this.gameData.equippedTool,
      });
    }

    if (this.player.position.x - player.position.x !== 0) {
      if (player.position.x < this.player.position.x) {
        player.position.x += velocity;
      } else {
        player.position.x -= velocity;
      }
    }
    if (this.player.position.y - player.position.y !== 0) {
      if (player.position.y < this.player.position.y) {
        player.position.y += velocity;
      } else {
        player.position.y -= velocity;
      }
    }
  }

  private currentCultivateAreaUpgrade() {
    if (this.isAPlantSeed(this.gameData.equippedTool)) {
      return this.upg?.sow ?? '1x1';
    }
    return this.upg?.plow ?? '1x1';
  }

  drawSpriteBasedOnTool(isMoving) {
    let useRightAnims;
    if (this.mousePos.x > this.player.position.x) {
      useRightAnims = true;
    } else {
      useRightAnims = false;
    }
    if (this.gameData.equippedTool === 'beets') {
      this.drawSpriteAnimation(
        useRightAnims ? this.spriteCarryBeetsRight : this.spriteCarryBeetsLeft,
        useRightAnims
          ? this.gameData.spriteAnimations['spriteCarryBeetsRight'].frames
          : this.gameData.spriteAnimations['spriteCarryBeetsLeft'].frames,
      );
    } else if (this.gameData.equippedTool === 'cabbage') {
      this.drawSpriteAnimation(
        useRightAnims
          ? this.spriteCarryCabbageRight
          : this.spriteCarryCabbageLeft,
        useRightAnims
          ? this.gameData.spriteAnimations['spriteCarryCabbageRight'].frames
          : this.gameData.spriteAnimations['spriteCarryCabbageLeft'].frames,
      );
    } else if (this.gameData.equippedTool === 'carrot') {
      this.drawSpriteAnimation(
        useRightAnims
          ? this.spriteCarryCarrotRight
          : this.spriteCarryCarrotLeft,
        useRightAnims
          ? this.gameData.spriteAnimations['spriteCarryCarrotRight'].frames
          : this.gameData.spriteAnimations['spriteCarryCarrotLeft'].frames,
      );
    } else if (this.gameData.equippedTool === 'cauliflower') {
      this.drawSpriteAnimation(
        useRightAnims
          ? this.spriteCarryCauliflowerRight
          : this.spriteCarryCauliflowerLeft,
        useRightAnims
          ? this.gameData.spriteAnimations['spriteCarryCauliflowerRight'].frames
          : this.gameData.spriteAnimations['spriteCarryCauliflowerLeft'].frames,
      );
    } else if (this.gameData.equippedTool === 'kale') {
      this.drawSpriteAnimation(
        useRightAnims ? this.spriteCarryKaleRight : this.spriteCarryKaleLeft,
        useRightAnims
          ? this.gameData.spriteAnimations['spriteCarryKaleRight'].frames
          : this.gameData.spriteAnimations['spriteCarryKaleLeft'].frames,
      );
    } else if (this.gameData.equippedTool === 'potato') {
      this.drawSpriteAnimation(
        useRightAnims
          ? this.spriteCarryPotatoRight
          : this.spriteCarryPotatoLeft,
        useRightAnims
          ? this.gameData.spriteAnimations['spriteCarryPotatoRight'].frames
          : this.gameData.spriteAnimations['spriteCarryPotatoLeft'].frames,
      );
    } else if (this.gameData.equippedTool === 'radish') {
      this.drawSpriteAnimation(
        useRightAnims
          ? this.spriteCarryRadishRight
          : this.spriteCarryRadishLeft,
        useRightAnims
          ? this.gameData.spriteAnimations['spriteCarryRadishRight'].frames
          : this.gameData.spriteAnimations['spriteCarryRadishLeft'].frames,
      );
    } else if (this.gameData.equippedTool === 'sunflower') {
      this.drawSpriteAnimation(
        useRightAnims
          ? this.spriteCarrySunflowerRight
          : this.spriteCarrySunflowerLeft,
        useRightAnims
          ? this.gameData.spriteAnimations['spriteCarrySunflowerRight'].frames
          : this.gameData.spriteAnimations['spriteCarrySunflowerLeft'].frames,
      );
    } else if (this.gameData.equippedTool === 'wheat') {
      this.drawSpriteAnimation(
        useRightAnims ? this.spriteCarryWheatRight : this.spriteCarryWheatLeft,
        useRightAnims
          ? this.gameData.spriteAnimations['spriteCarryWheatRight'].frames
          : this.gameData.spriteAnimations['spriteCarryWheatLeft'].frames,
      );
    } else if (this.gameData.equippedTool === 'smallfish') {
      this.drawSpriteAnimation(
        useRightAnims
          ? this.spriteCarrySmallFishRight
          : this.spriteCarrySmallFishLeft,
        useRightAnims
          ? this.gameData.spriteAnimations['spriteCarrySmallFishRight'].frames
          : this.gameData.spriteAnimations['spriteCarrySmallFishLeft'].frames,
      );
    } else if (this.gameData.equippedTool === 'mediumfish') {
      this.drawSpriteAnimation(
        useRightAnims
          ? this.spriteCarryMediumFishRight
          : this.spriteCarryMediumFishLeft,
        useRightAnims
          ? this.gameData.spriteAnimations['spriteCarryMediumFishRight'].frames
          : this.gameData.spriteAnimations['spriteCarryMediumFishLeft'].frames,
      );
    } else if (this.gameData.equippedTool === 'hugefish') {
      this.drawSpriteAnimation(
        useRightAnims
          ? this.spriteCarryHugeFishRight
          : this.spriteCarryHugeFishLeft,
        useRightAnims
          ? this.gameData.spriteAnimations['spriteCarryHugeFishRight'].frames
          : this.gameData.spriteAnimations['spriteCarryHugeFishLeft'].frames,
      );
    } else if (this.gameData.equippedTool === 'nugget') {
      this.drawSpriteAnimation(
        useRightAnims
          ? this.spriteCarryNuggetRight
          : this.spriteCarryNuggetLeft,
        useRightAnims
          ? this.gameData.spriteAnimations['spriteCarryNuggetRight'].frames
          : this.gameData.spriteAnimations['spriteCarryNuggetLeft'].frames,
      );
    } else {
      if (!isMoving) {
        this.drawBeatSyncedSpriteAnimation(
          useRightAnims ? this.spriteSheetIdleRight : this.spriteSheetIdleLeft,
          useRightAnims
            ? this.gameData.spriteAnimations['playerIdleRight'].frames
            : this.gameData.spriteAnimations['playerIdleLeft'].frames,
          2,
        );
      } else {
        this.drawSpriteAnimation(
          useRightAnims ? this.spriteSheetWalkRight : this.spriteSheetWalkLeft,
          useRightAnims
            ? this.gameData.spriteAnimations['playerWalkRight'].frames
            : this.gameData.spriteAnimations['playerWalkLeft'].frames,
        );
      }
    }
  }

  get1x3Area(area) {
    let area1 = {
      ...area,
    };
    let area2 = {
      ...area,
      position: {
        x: area.position.x + area.width + 1,
        y: area.position.y + area.height + 1,
      },
      center: {
        x: area.x + area.width + 1 + area.width / 2,
        y: area.y + area.height + 1 + area.height / 2,
      },
    };
    let area3 = {
      ...area2,
      position: {
        x: area2.position.x + area2.width + 1,
        y: area2.position.y + area2.height + 1,
      },
      center: {
        x: area2.position.x + area2.width + 1 + area2.width / 2,
        y: area2.position.y + area2.height + 1 + area2.height / 2,
      },
    };
    return [area1, area2, area3];
  }

  areasByAreas(area, upgrade) {
    if (upgrade === '1x3') {
      return (
        this.mousePos.y >= area.position.y &&
        this.mousePos.y < area.position.y + area.height &&
        ((this.mousePos.x < area.position.x + area.width &&
          this.mousePos.x >= area.position.x) ||
          (this.mousePos.x > area.position.x + area.width &&
            this.mousePos.x < area.position.x + area.width + area.width) ||
          (this.mousePos.x < area.position.x &&
            this.mousePos.x >= area.position.x - area.width))
      );
    } else if (upgrade === '2x3') {
      return (
        (this.mousePos.y >= area.position.y &&
          this.mousePos.y < area.position.y + area.height &&
          ((this.mousePos.x < area.position.x + area.width &&
            this.mousePos.x >= area.position.x) ||
            (this.mousePos.x > area.position.x + area.width &&
              this.mousePos.x < area.position.x + area.width + area.width) ||
            (this.mousePos.x < area.position.x &&
              this.mousePos.x >= area.position.x - area.width))) ||
        (this.mousePos.y >= area.position.y + area.height &&
          this.mousePos.y < area.position.y + area.height + area.height &&
          ((this.mousePos.x < area.position.x + area.width &&
            this.mousePos.x >= area.position.x) ||
            (this.mousePos.x > area.position.x + area.width &&
              this.mousePos.x < area.position.x + area.width + area.width) ||
            (this.mousePos.x < area.position.x &&
              this.mousePos.x >= area.position.x - area.width)))
      );
    } else if (upgrade === '3x3') {
      return (
        (this.mousePos.y >= area.position.y &&
          this.mousePos.y < area.position.y + area.height &&
          ((this.mousePos.x < area.position.x + area.width &&
            this.mousePos.x >= area.position.x) ||
            (this.mousePos.x > area.position.x + area.width &&
              this.mousePos.x < area.position.x + area.width + area.width) ||
            (this.mousePos.x < area.position.x &&
              this.mousePos.x >= area.position.x - area.width))) ||
        (this.mousePos.y >= area.position.y + area.height &&
          this.mousePos.y < area.position.y + area.height + area.height &&
          ((this.mousePos.x < area.position.x + area.width &&
            this.mousePos.x >= area.position.x) ||
            (this.mousePos.x > area.position.x + area.width &&
              this.mousePos.x < area.position.x + area.width + area.width) ||
            (this.mousePos.x < area.position.x &&
              this.mousePos.x >= area.position.x - area.width))) ||
        (this.mousePos.y >= area.position.y + area.height + area.height &&
          this.mousePos.y <
            area.position.y + area.height + area.height + area.height &&
          ((this.mousePos.x < area.position.x + area.width &&
            this.mousePos.x >= area.position.x) ||
            (this.mousePos.x > area.position.x + area.width &&
              this.mousePos.x < area.position.x + area.width + area.width) ||
            (this.mousePos.x < area.position.x &&
              this.mousePos.x >= area.position.x - area.width)))
      );
    } else {
      return (
        this.mousePos.y >= area.position.y &&
        this.mousePos.y < area.position.y + area.height &&
        this.mousePos.x < area.position.x + area.width &&
        this.mousePos.x >= area.position.x
      );
    }
  }

  isMouseInArea(area) {
    return (
      this.mousePos.y >= area.position.y &&
      this.mousePos.y < area.position.y + area.height &&
      this.mousePos.x < area.position.x + area.width &&
      this.mousePos.x >= area.position.x
    );
  }

  targetNearestSquare(area) {
    if (
      this.ctx &&
      this.player.width &&
      this.player.height &&
      this.player.center
    ) {
      // Note: otherFarmableArea / waterableArea pruning moved to once-per-frame
      // in drawingCode() to avoid running per-tile-per-frame.
      if (this.areasByAreas(area, this.currentCultivateAreaUpgrade())) {
        if (this.isAreaCloseToPlayer(this.player, area) && !this.isShiftDown) {
          this.changeEquippedTool(area.state);
          this.hoveredFarmableArea = area;
          if (!this.otherFarmableArea.includes(area))
            this.otherFarmableArea.push(area);

          this.mayFarm = true;
          // Consume a buffered dig click if one arrived while mayFarm was false.
          if (
            this.pendingDigUntilMs > 0 &&
            performance.now() <= this.pendingDigUntilMs
          ) {
            this.pendingDigUntilMs = 0;
            this.actionFrameIndex = this.actionFrameIndex.map(() => 0);
            this.framesDrawn = this.framesDrawn.map(() => 0);
            this.clickedFarmableArea = this.getCurrentCultivateTargets();
            if (!this.clickedFarmableArea.length) return;
            this.clickedFarmableArea.forEach((a) => {
              a.queuedCultivate = true;
            });
            this.judgeRhythm(this.actionForHoveredArea());
          }
          this.hoveredFarmableArea.center = {
            x: area.position.x + 32,
            y: area.position.y + 32,
          };
        }
      }
      if (this.areasByAreas(area, this.upg?.plow ?? '1x1')) {
        if (this.isAreaCloseToPlayer(this.player, area) && !this.isShiftDown) {
          if (this.canShowFarmActionIndicator(area)) {
            this.drawBrokenSquare(area);
          }
        }
      }
      if (this.areasByAreas(area, this.upg.sow)) {
        if (this.isAreaCloseToPlayer(this.player, area) && !this.isShiftDown) {
          if (!this.sowableArea.includes(area)) this.sowableArea.push(area);
          if (
            this.canShowFarmActionIndicator(area) &&
            this.canPlantInArea(area)
          )
            this.drawPlantCircle(area);
        }
      }
      if (this.areasByAreas(area, this.upg.irrigate)) {
        if (this.isAreaCloseToPlayer(this.player, area) && !this.isShiftDown) {
          if (!this.waterableArea.includes(area)) this.waterableArea.push(area);
          if (this.canShowFarmActionIndicator(area))
            this.drawWaterSquare(area, 10);
        }
      }
    }
  }

  private canShowFarmActionIndicator(area) {
    return (
      area.state !== 'house' &&
      area.state !== 'well' &&
      area.state !== 'merchant' &&
      area.state !== 'merchant-left' &&
      area.state !== 'merchant-right' &&
      area.state !== 'untargetable' &&
      area.state !== 'minable' &&
      area.state !== 'fishable'
    );
  }

  private canPlantInArea(area) {
    return area?.state === 'soil-3';
  }

  changeEquippedTool(state) {
    if (this.gameData.isCarrying) {
      return;
    }
    if (this.isShiftDown || this.attackInitiated) {
      this.changeTool.emit('broom');
      return;
    }
    if (state === this.hoveredFarmableArea.state) {
      return;
    }
    if (state === 'fishable') {
      this.changeTool.emit('rod');
      this.canHarvest.emit(true);
    } else if (state === 'minable') {
      this.changeTool.emit('pickaxe');
      this.canHarvest.emit(true);
    } else if (state === 'well') {
      this.canHarvest.emit(false);
    } else if (
      (state === 'untargetable' ||
        state === 'well' ||
        state === 'house' ||
        state === 'merchant' ||
        state === 'merchant-left' ||
        state === 'merchant-right') &&
      !this.gameData.openShop
    ) {
      this.canHarvest.emit(false);
      //this.changeTool.emit('shovel');
    } else if (
      !this.isHoldingSeed(this.gameData.equippedTool) &&
      !this.gameData.openShop
    ) {
      this.changeTool.emit('shovel');
      this.canHarvest.emit(true);
    }
    if (!this.isTargetCloseToPlayer(this.player, this.hoveredFarmableArea)) {
      this.canHarvest.emit(false);
    }
  }

  drawBrokenSquare(area) {
    if (this.ctx) {
      this.ctx.beginPath();
      this.ctx.lineWidth = 6;
      this.ctx.strokeStyle = 'yellow';
      this.ctx.moveTo(area.position.x, area.position.y);
      this.ctx.lineTo(area.position.x + area.width / 4, area.position.y);
      this.ctx.moveTo(area.position.x, area.position.y);
      this.ctx.lineTo(area.position.x, area.position.y + area.height / 4);

      this.ctx.moveTo(area.position.x, area.position.y + area.height);
      this.ctx.lineTo(
        area.position.x,
        area.position.y + area.height - area.height / 4,
      );
      this.ctx.moveTo(area.position.x, area.position.y + area.height);
      this.ctx.lineTo(
        area.position.x + area.width / 4,
        area.position.y + area.height,
      );

      this.ctx.moveTo(
        area.position.x + area.width,
        area.position.y + area.height,
      );
      this.ctx.lineTo(
        area.position.x + area.width - area.width / 4,
        area.position.y + area.height,
      );
      this.ctx.moveTo(
        area.position.x + area.width,
        area.position.y + area.height,
      );
      this.ctx.lineTo(
        area.position.x + area.width,
        area.position.y + area.height - area.height / 4,
      );
      this.ctx.moveTo(area.position.x + area.width, area.position.y);
      this.ctx.lineTo(
        area.position.x + area.width - area.width / 4,
        area.position.y,
      );
      this.ctx.moveTo(area.position.x + area.width, area.position.y);
      this.ctx.lineTo(
        area.position.x + area.width,
        area.position.y + area.height / 4,
      );
      this.ctx.stroke();
    }
  }

  drawWaterSquare(area, offset) {
    if (this.ctx) {
      this.ctx.beginPath();
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = 'blue';
      //TOP LEFT CORNER
      this.ctx.moveTo(area.position.x + offset, area.position.y + offset);
      this.ctx.lineTo(
        area.position.x + offset + area.width / 6,
        area.position.y + offset,
      );
      this.ctx.moveTo(area.position.x + offset, area.position.y + offset);
      this.ctx.lineTo(
        area.position.x + offset,
        area.position.y + area.height / 6 + offset,
      );
      //BOTTOM LEFT CORNER
      this.ctx.moveTo(
        area.position.x + offset,
        area.position.y + area.height - offset,
      );
      this.ctx.lineTo(
        area.position.x + offset,
        area.position.y + area.height - offset - area.height / 6,
      );
      this.ctx.moveTo(
        area.position.x + offset,
        area.position.y + area.height - offset,
      );
      this.ctx.lineTo(
        area.position.x + offset + area.width / 6,
        area.position.y + area.height - offset,
      );

      //BOTTOM RIGHT CORNER
      this.ctx.moveTo(
        area.position.x + area.width - offset,
        area.position.y + area.height - offset,
      );
      this.ctx.lineTo(
        area.position.x - offset + area.width - area.width / 6,
        area.position.y - offset + area.height,
      );
      this.ctx.moveTo(
        area.position.x + area.width - offset,
        area.position.y + area.height - offset,
      );
      this.ctx.lineTo(
        area.position.x + area.width - offset,
        area.position.y + area.height - offset - area.height / 6,
      );

      //TOP RIGHT CORNER
      this.ctx.moveTo(
        area.position.x + area.width - offset,
        area.position.y + offset,
      );
      this.ctx.lineTo(
        area.position.x + area.width - offset - area.width / 6,
        area.position.y + offset,
      );
      this.ctx.moveTo(
        area.position.x + area.width - offset,
        area.position.y + offset,
      );
      this.ctx.lineTo(
        area.position.x + area.width - offset,
        area.position.y + offset + area.height / 6,
      );
      this.ctx.strokeStyle = 'blue';
      this.ctx.stroke();
    }
  }

  drawPlantCircle(area) {
    if (this.ctx) {
      this.ctx.beginPath();
      this.ctx.lineWidth = 3;
      this.ctx.strokeStyle = 'red';
      this.ctx.arc(
        area.position.x + area.width / 2,
        area.position.y + area.height / 2,
        Math.max(6, area.width / 8),
        0,
        Math.PI * 2,
      );
      this.ctx.stroke();
    }
  }

  removeMouseProperties() {
    this.mayFarm = false;
    this.hoveredFarmableArea = this.defaultFarmState;
    this.otherFarmableArea = [];
    this.waterableArea = [];
    this.sowableArea = [];
    this.clickedFarmableArea = [];
    this.activatedArea = this.defaultFarmState;
  }

  private getReachableWaterTargets() {
    const targets = this.waterableArea.filter((area) =>
      this.isShovelable(area.state, this.player, area),
    );

    if (targets.length) {
      return targets;
    }

    if (
      this.isShovelable(
        this.hoveredFarmableArea.state,
        this.player,
        this.hoveredFarmableArea,
      )
    ) {
      return [this.hoveredFarmableArea];
    }

    return [];
  }

  private drawHeroRangeOverlay() {
    if (!this.ctx || !this.player.center) return;

    this.ctx.fillStyle = 'rgba(140, 215, 255, 0.08)';
    this.ctx.strokeStyle = 'rgba(220, 245, 255, 0.18)';
    this.ctx.lineWidth = 1;

    // _reachableAreas is built once after map init; no per-frame allocation.
    for (const area of this._reachableAreas) {
      if (!this.isAreaCloseToPlayer(this.player, area)) continue;
      this.ctx.fillRect(
        area.position.x,
        area.position.y,
        area.width,
        area.height,
      );
      this.ctx.strokeRect(
        area.position.x,
        area.position.y,
        area.width,
        area.height,
      );
    }
  }

  private maybeAutoRefillAtWell() {
    const nearWell = this.wellArea.some((area) =>
      this.isAreaCloseToPlayer(this.player, area),
    );

    if (!nearWell || this.gameData.water.current >= this.gameData.water.max) {
      this.autoRefillRequested = false;
      return;
    }

    if (!this.autoRefillRequested) {
      this.autoRefillRequested = true;
      this.refillWaterCan();
    }
  }

  doLeftClickOnMouse(evt) {
    if (this.isStartupCountdownLocked) return;
    const hoveredTargetInRange = this.isTargetCloseToPlayer(
      this.player,
      this.hoveredFarmableArea,
    );
    if (this.gameData.isSleeping) {
      if (performance.now() - this.sleepEnteredAtMs >= 2000) {
        this.activatable();
      }
      return;
    }
    if (this.isShiftDown) {
      this.attackInitiated = true;
      if (this.gameData.energy.current >= 10) {
        this.changeEnergy.emit(-10);
      } else {
        this.setHeadText('Too tired...');
      }
      return;
    }
    if (this.gameData.isCarrying) {
      this.dropCarriedItem();
      this.judgeRhythm('drop', evt?.offsetX, evt?.offsetY);
    } else if (
      this.hoveredFarmableArea?.state === 'house' &&
      hoveredTargetInRange
    ) {
      this.activatedArea = this.hoveredFarmableArea;
      this.queuedActivation = true;
    } else if (this.isWatering) {
      return;
    } else if (
      this.gameData.energy.current < GameComponent.MAX_ACTION_ENERGY_COST
    ) {
      this.setHeadText('Too tired...');
    } else if (
      this.player.center &&
      this.mayFarm &&
      this.ctx &&
      this.gameData.energy.current >= GameComponent.MAX_ACTION_ENERGY_COST &&
      this.gameData.canHarvest &&
      hoveredTargetInRange
    ) {
      this.pendingDigUntilMs = 0;
      // Re-clicking during cultivate should restart the action animation.
      // Reset counters before re-arming the current target set.
      this.actionFrameIndex = this.actionFrameIndex.map(() => 0);
      this.framesDrawn = this.framesDrawn.map(() => 0);
      this.clickedFarmableArea = this.getCurrentCultivateTargets();
      if (!this.clickedFarmableArea.length) return;
      if (this.hoveredFarmableArea.state !== 'well') {
        this.clickedFarmableArea.forEach((area) => {
          area.queuedCultivate = true;
        });
      }
      const action = this.actionForHoveredArea();
      this.judgeRhythm(action, evt?.offsetX, evt?.offsetY);
    } else if (
      !this.mayFarm &&
      this.gameData.canHarvest &&
      this.gameData.energy.current >= GameComponent.MAX_ACTION_ENERGY_COST &&
      hoveredTargetInRange
    ) {
      // mayFarm can be momentarily false between frames; buffer for 250 ms.
      this.pendingDigUntilMs = performance.now() + 250;
    }
  }

  getPlayerAndMultiplayerPositions() {
    const player = this.lobbyPlayers.filter(
      (player) => player.name === this.gameData.me,
    )[0];
    // Only emit when the player has actually moved to avoid per-frame socket spam.
    if (
      player.position.x === this._lastFromMiddleX &&
      player.position.y === this._lastFromMiddleY
    ) {
      return;
    }
    this._lastFromMiddleX = player.position.x;
    this._lastFromMiddleY = player.position.y;
    const playerFromMiddle = {
      name: player.name,
      position: player.position,
      distanceFromMiddle: {
        x: player.position.x - this.traders[0].position.x,
        y: player.position.y - this.traders[0].position.y,
      },
    };
    this.playerFromMiddle.emit(playerFromMiddle);
  }

  doRightClickOnMouse(evt) {
    evt.preventDefault();
    if (this.isStartupCountdownLocked) return;
    if (this.gameData.isSleeping || this.isWatering || this.gameData.isCarrying)
      return;

    const waterTargets = this.getReachableWaterTargets();

    if (
      this.hoveredFarmableArea.state === 'merchant' &&
      this.isTargetCloseToPlayer(this.player, this.hoveredFarmableArea) &&
      this.gameData.canOpenShop &&
      !this.gameData.openShop &&
      !this.gameData.isCarrying
    ) {
      this.openShop.emit(true);
      this.judgeRhythm('open-shop', evt?.offsetX, evt?.offsetY);
      return;
    }

    if (this.gameData.water.current <= 7) {
      this.setHeadText('Need Water!');
      return;
    }
    if (this.gameData.energy.current < GameComponent.MAX_ACTION_ENERGY_COST) {
      this.setHeadText('Too tired...');
      return;
    }
    if (!waterTargets.length) {
      return;
    }

    this.clickedFarmableArea = [];
    waterTargets.forEach((area) => {
      this.waterArea(area);
    });
    this.judgeRhythm('water', evt?.offsetX, evt?.offsetY);
  }

  /** Map the currently hovered farmable area state to a rhythm-judged action label. */
  private actionForHoveredArea(): FarmActionType {
    const state = this.hoveredFarmableArea?.state;
    if (state === 'fishable') return 'fish';
    if (state === 'minable') return 'mine';
    if (state === 'house') return 'sleep';
    if (state === 'merchant') return 'open-shop';
    if (state === 'well') return 'fill-water';
    if (this.gameData.canHarvest && (this.hoveredFarmableArea as any)?.ready) {
      return 'harvest';
    }
    return 'dig';
  }

  private getCurrentCultivateTargets() {
    const targets = this.otherFarmableArea.length
      ? [...this.otherFarmableArea]
      : this.hoveredFarmableArea?.id
        ? [this.hoveredFarmableArea]
        : [];
    const inRangeTargets = targets.filter((area) =>
      this.isTargetCloseToPlayer(this.player, area),
    );

    if (this.isAPlantSeed(this.gameData.equippedTool)) {
      return inRangeTargets.filter((area) => this.canPlantInArea(area));
    }

    return inRangeTargets;
  }

  setHeadText(string: string) {
    this.headText = string;
    setTimeout(() => {
      this.headText = '';
    }, 1500);
  }

  private getCurrentBeatIndex(): number {
    const now = performance.now();
    const beatMs = 60000 / Math.max(1, this.currentBpm);
    if (this.sleepBeatAnchorMs === null) {
      const nextBeat = this.phaserService.nextBeatWallMs();
      this.sleepBeatAnchorMs = nextBeat !== null ? nextBeat - beatMs : now;
    }

    const base = this.sleepBeatAnchorMs ?? now;
    return Math.floor((now - base) / beatMs);
  }

  private applySleepBeatEnergyGain() {
    if (this.gameData.energy.current >= this.gameData.energy.max) return;

    const currentBeat = this.getCurrentBeatIndex();
    if (this.sleepEnergyBeatIndex < 0) {
      this.sleepEnergyBeatIndex = currentBeat;
      return;
    }
    if (currentBeat <= this.sleepEnergyBeatIndex) return;

    const beatsElapsed = currentBeat - this.sleepEnergyBeatIndex;
    this.sleepEnergyBeatIndex = currentBeat;

    const maxGain = this.gameData.energy.max - this.gameData.energy.current;
    const restPerBeat = 5 + 5 * Number(this.upg?.resting ?? 0);
    const gain = Math.min(maxGain, beatsElapsed * restPerBeat);
    if (gain > 0) {
      this.changeEnergy.emit(gain);
    }
  }

  refillWaterCan() {
    this.changeWaterMeter.emit('max');
  }

  waterArea(clickedArea) {
    if (this.gameData.isCarrying) return;
    if (!this.clickedFarmableArea.includes(clickedArea)) {
      this.clickedFarmableArea.push(clickedArea);
      this.changeWaterMeter.emit(-8);
      this.isWatering = true;
    }
  }
  waterAnimation(area, i) {
    const spriteSheet = {
      right: this.spriteSheetWaterRight,
      left: this.spriteSheetWaterLeft,
      rightKey: 'spriteSheetWaterRight',
      leftKey: 'spriteSheetWaterLeft',
    };

    if (spriteSheet)
      this.drawCultivateAnimation(
        this.useRightAnims() ? spriteSheet.right : spriteSheet.left,
        this.useRightAnims()
          ? this.gameData.spriteAnimations[spriteSheet.rightKey].frames
          : this.gameData.spriteAnimations[spriteSheet.leftKey].frames,
        area,
        i,
      );
  }

  waterOtherAnimation(play, i) {
    const player = this.lobbyPlayers.filter((p) => p.name === play.name)[0];
    const spriteSheet = {
      right: this.spriteSheetWaterRight,
      left: this.spriteSheetWaterLeft,
      rightKey: 'spriteSheetWaterRight',
      leftKey: 'spriteSheetWaterLeft',
    };

    if (spriteSheet) {
      this.drawOtherCultivateAnimation(
        player.useRightAnims ? spriteSheet.right : spriteSheet.left,
        player.useRightAnims
          ? this.gameData.spriteAnimations[spriteSheet.rightKey].frames
          : this.gameData.spriteAnimations[spriteSheet.leftKey].frames,
        player,
        i,
      );
    }
  }

  tickMoney(number) {
    let i = 0;
    const step = Math.max(1, Math.ceil(number / 60));
    const tickInterval = setInterval(() => {
      if (i < number) {
        const amount = Math.min(step, number - i);
        this.changeMoney.emit(amount);
        i += amount;
      } else {
        clearInterval(tickInterval);
      }
    }, 20);
  }

  dropCarriedItem() {
    if (
      this.hoveredFarmableArea.state === 'merchant' &&
      this.gameData.isCarrying
    ) {
      const count = this.carryCount || 1;
      this.carryCount = 0;
      this.carryCoolDown(this.gameData.me);
      this.changeTool.emit('shovel');
      const getPrice = (base: number): number =>
        Math.round(base * this.gameData.bargainValue * count);
      const getPlantPrice = (base: number): number =>
        Math.round(
          base * PLANT_MULTIPLIER * this.gameData.bargainValue * count,
        );
      switch (this.gameData.equippedTool) {
        case 'potato':
          this.tickMoney(getPlantPrice(PLANT_COSTS.POTATO));
          break;
        case 'carrot':
          this.tickMoney(getPlantPrice(PLANT_COSTS.CARROT));
          break;
        case 'wheat':
          this.tickMoney(getPlantPrice(PLANT_COSTS.WHEAT));
          break;
        case 'cabbage':
          this.tickMoney(getPlantPrice(PLANT_COSTS.CABBAGE));
          break;
        case 'cauliflower':
          this.tickMoney(getPlantPrice(PLANT_COSTS.CAULIFLOWER));
          break;
        case 'beets':
          this.tickMoney(getPlantPrice(PLANT_COSTS.BEETS));
          break;
        case 'kale':
          this.tickMoney(getPlantPrice(PLANT_COSTS.KALE));
          break;
        case 'sunflower':
          this.tickMoney(getPlantPrice(PLANT_COSTS.SUNFLOWER));
          break;
        case 'smallfish':
          this.tickMoney(getPrice(PLANT_COSTS.SMALLFISH));
          break;
        case 'mediumfish':
          this.tickMoney(getPrice(PLANT_COSTS.MEDIUMFISH));
          break;
        case 'hugefish':
          this.tickMoney(getPrice(PLANT_COSTS.HUGEFISH));
          break;
        case 'nugget':
          this.tickMoney(getPrice(PLANT_COSTS.NUGGET));
          break;
        default:
          break;
      }
      return;
    }
    if (this.player.center) {
      const positionX = this.useRightAnims()
        ? this.player.center.x
        : this.player.center.x - this.squareSize;
      const positionY = this.player.center.y - 12;
      const carriedItem = {
        position: {
          x: positionX,
          y: positionY,
        },
        width: this.squareSize,
        height: this.squareSize,
        plant: this.gameData.equippedTool,
      };
      if (
        this.gameData.equippedTool === 'potato' ||
        this.gameData.equippedTool === 'beets' ||
        this.gameData.equippedTool === 'carrots' ||
        this.gameData.equippedTool === 'cauliflower' ||
        this.gameData.equippedTool === 'radish' ||
        this.gameData.equippedTool === 'kale' ||
        this.gameData.equippedTool === 'wheat' ||
        this.gameData.equippedTool === 'cabbage' ||
        this.gameData.equippedTool === 'sunflower' ||
        this.gameData.equippedTool === 'smallfish' ||
        this.gameData.equippedTool === 'mediumfish' ||
        this.gameData.equippedTool === 'hugefish' ||
        this.gameData.equippedTool === 'nugget'
      ) {
        // Drop one pickupable per stacked item.
        const dropCount = this.carryCount || 1;
        for (let d = 0; d < dropCount; d++) {
          this.dropPickupable.emit({
            plant: carriedItem.plant,
            positionId: this.hoveredFarmableArea.id,
            id: Date.now() + d,
            playerName: this.gameData.me,
          });
        }
        this.carryCount = 0;
        this.carryCoolDown(this.gameData.me);
        this.changeTool.emit('shovel');
      }
    }
  }

  updateLobbyPlayers() {
    this.lobbyPlayers.forEach((player) => {
      this.changePlayerState.emit({ ...player });
    });
  }

  changePlayerUpdate(updatedPlayer) {
    this.lobbyPlayers.forEach((player) => {
      if (updatedPlayer.name === player.name) {
        player.canMoveHorizontal = updatedPlayer.canMoveHorizontal;
        player.canMoveVertical = updatedPlayer.canMoveVertical;
        player.equippedTool = updatedPlayer.equippedTool;
        player.useRightAnims = updatedPlayer.useRightAnims;
        player.moving = updatedPlayer.moving;
        player.isCarrying = updatedPlayer.isCarrying;
        player.isCultivating = false;
        player.isWatering = updatedPlayer.isWatering;
      }
    });
  }
}
