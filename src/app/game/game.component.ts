import { GameUtils } from './game.util';
import {
  GameState,
  SpriteMetrics,
  KeyWASD,
  Pickupable,
  PLANT_COSTS,
  PLANT_MULTIPLIER,
} from './../_store/models';
import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { intializeState } from '../_store/reducer';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
})
export class GameComponent extends GameUtils implements AfterViewInit {
  @Input() gameData: GameState = intializeState();
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
  @Output() openShop = new EventEmitter();
  @Output() changePlayerState = new EventEmitter();
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
  fishableArea: any = [];
  minableArea: any = [];
  houseArea: any = [];
  wellArea: any = [];
  untargetableArea: any = [];
  traders: any = [];
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
  framesDrawn = 0;
  otherPlayersFrameIndex = [0, 0, 0];
  otherPlayersFramesDrawn = [0, 0, 0];
  actionFrameIndex = 0;
  pickupableFrameIndex: Array<number> = [];

  pickupableFramesDrawn: Array<number> = [];
  mousePos = {
    x: 0,
    y: 0,
  };
  queuedCultivate = false;
  queuedActivation = false;
  mayFarm = false;
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
  };
  clickedFarmableArea = {
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
  };
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
  };
  canClick = true;
  pickupables: Array<Pickupable> = [];
  bubblesFramesDrawn: number = 0;
  bubblesFrameIndex: number = 0;
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
  lobbyPlayers: any = [];

  mainFrameIndex = 0;
  mainFrameCount = 0;
  fpsInterval = 0;
  now = 0;
  then = 0;
  startTime = 0;
  elaspsed = 0;

  constructor() {
    super();
    this.animate = () => {
      requestAnimationFrame(this.animate);
      this.now = Date.now();
      this.elaspsed = this.now - this.then;

      if (this.elaspsed > this.fpsInterval) {
        this.then = this.now - (this.elaspsed % this.fpsInterval);
        this.drawingCode();
      }
    };
  }

  drawingCode() {
    if (this.ctx && this.canvas) {
      this.ctx.save();
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.scale(this.scale, this.scale);
      this.ctx.drawImage(
        this.map,
        this.mapImage.position.x,
        this.mapImage.position.y
      );
      this.boundaries.forEach((boundary) => {
        if (this.ctx) {
          this.drawBoundary(boundary);
        }
      });
      this.untargetableArea.forEach((untargetableArea) => {
        if (this.ctx) {
          this.drawFarmable(untargetableArea);
        }
      });
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
      this.traders.forEach((trader) => {
        this.drawMerchant(trader);
      });

      this.lobbyPlayers.forEach((player, i) => {
        if (player && player.name !== this.gameData.me) {
          if (this.ctx && this.player.width && this.player.height) {
            this.ctx.strokeStyle = 'red';
            this.ctx.beginPath();
            this.ctx.rect(
              player.position.x,
              player.position.y,
              this.player.width * 4,
              this.player.height * 4
            );
            this.ctx.stroke();
            this.getOtherPlayerSpriteSheet(player, i);
          }
        }
      });

      // SLEEP
      if (this.queuedActivation) {
        this.activatable();
      }
      // MOVEMENT
      if (this.cultivatable() && !this.isWatering && this.queuedCultivate) {
        this.cultivate();
      } else if (this.isWatering) {
        this.waterAnimation();
      } else {
        this.movement();
      }

      if (this.pickupables.length) {
        let removableItem;
        this.pickupables.forEach((item: Pickupable, i) => {
          if (item) {
            item.width = this.squareSize;
            item.height = this.squareSize;
            if (this.playerIsPickingUpItem(item)) {
              removableItem = item;
            }
            if (this.ctx) {
              this.drawPickupableAnimation(item, 16, i);
            }
          }
        });
        this.pickupables = this.pickupables.filter(
          (pickupable) => pickupable !== removableItem
        );
      }
      this.ctx.drawImage(
        this.foregroundMap,
        this.mapImage.position.x,
        this.mapImage.position.y
      );
      this.ctx.restore();
      if (!this.isMouseCloseToPlayer(this.player, this.mousePos)) {
        if (this.gameData.canHarvest === true) {
          this.canHarvest.emit(false);
        }
        this.hoveredFarmableArea = this.defaultFarmState;
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
    this.then = Date.now();
    this.startTime = this.then;
    this.animate();
  }

  playerIsPickingUpItem(item: Pickupable) {
    if (this.gameData.isCarrying) {
      return false;
    }
    if (
      this.player.center &&
      item.width &&
      item.height &&
      !this.gameData.isCarrying
    ) {
      if (
        this.player.center.x > item.position.x &&
        this.player.center.x < item.position.x + item.width &&
        this.player.center.y > item.position.y &&
        this.player.center.y < item.position.y + item.height
      ) {
        this.changeTool.emit(item.plant);
        return true;
      }
    }
    return false;
  }

  cultivatable() {
    if (this.queuedCultivate) {
      if (
        this.clickedFarmableArea.state === 'minable' &&
        this.gameData.equippedTool === 'pickaxe'
      ) {
        return true;
      }
      if (
        this.clickedFarmableArea.state === 'fishable' &&
        this.gameData.equippedTool === 'rod'
      ) {
        return true;
      }
      if (
        this.clickedFarmableArea.state !== 'minable' &&
        this.clickedFarmableArea.state !== 'fishable' &&
        this.clickedFarmableArea.state !== 'untargetable' &&
        this.clickedFarmableArea.state !== 'merchant' &&
        this.clickedFarmableArea.state !== 'merchant-left' &&
        this.clickedFarmableArea.state !== 'merchant-right' &&
        (this.gameData.equippedTool === 'shovel' ||
          this.gameData.equippedTool === 'beets-seeds' ||
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
      this.queuedCultivate = false;
      this.canClick = true;
      this.actionFrameIndex = 0;
      return false;
    }
    this.queuedCultivate = false;
    this.canClick = true;
    return false;
  }

  activatable() {
    if (this.activatedArea.state === 'house' && !this.gameData.isSleeping) {
      this.isSleeping.emit(true);
      this.changeVelocity.emit(0);
      this.goIntoHouse();
    } else {
      this.isSleeping.emit(false);
      this.changeVelocity.emit(4);
      this.canClick = true;
    }

    this.queuedActivation = false;
    this.activatedArea = this.defaultFarmState;
  }

  goIntoHouse() {
    const map = this.mapImage.position;
    const house = {
      x: 735,
      y: 287,
    };
    const difference = {
      x: house.x - map.x,
      y: house.y - map.y,
    };

    this.moveAllMovables(difference);
  }
  moveOthers(player, i) {
    //  // if (this.mousePos.x > this.player.position.x) {
    //  //   useRightAnims = true;
    //  // } else {
    //  //   useRightAnims = false;
    //  // }
    if (player.moveup) {
      if (player.moving) {
        console.log('MOVING!');
        player.position.y -= this.gameData.velocity;
      }
    }
    if (player.movedown) {
      if (player.moving) {
        player.position.y += this.gameData.velocity;
      }
    }
    if (player.moveright) {
      if (player.moving) {
        player.position.x += this.gameData.velocity;
      }
    }
    if (player.moveleft) {
      if (player.moving) {
        player.position.x -= this.gameData.velocity;
      }
    }
    // if (player.isSleeping) {
    //   canMoveHorizontal = false;
    //   moving = false;
    //   this.drawSleepAnimation();
    // }

    if (
      !player.moveup &&
      !player.moveleft &&
      !player.movedown &&
      !player.moveright &&
      !player.isSleeping
    ) {
      if (player.equippedTool === 'beets') {
        this.drawOtherSpriteAnimation(
          player.useRightAnims
            ? this.spriteCarryBeetsRight
            : this.spriteCarryBeetsLeft,
          player.useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryBeetsRight'].frames
            : this.gameData.spriteAnimations['spriteCarryBeetsLeft'].frames,
          player,
          i
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
          i
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
          i
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
          i
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
          i
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
          i
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
          i
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
          i
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
          i
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
          i
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
          i
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
          i
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
          i
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
          i
        );
      }
    } else {
      if (player.equippedTool === 'beets') {
        this.drawOtherSpriteAnimation(
          player.useRightAnims
            ? this.spriteCarryBeetsRight
            : this.spriteCarryBeetsLeft,
          player.useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryBeetsRight'].frames
            : this.gameData.spriteAnimations['spriteCarryBeetsLeft'].frames,
          player,
          i
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
          i
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
          i
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
          i
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
          i
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
          i
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
          i
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
          i
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
          i
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
          i
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
          i
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
          i
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
          i
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
          i
        );
      }
    }
  }
  moveOtherPlayer(event) {
    const player = this.lobbyPlayers.filter(
      (player) => player.name === event.player.name
    )[0];
    if (player && event.roomId === player.roomId) {
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
        player.position = player.position;
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
        x: this.lobbyPlayers[0].position.x - 278 - map.x,
        y: this.lobbyPlayers[0].position.y - 630 - map.y,
      };
    } else if (this.gameData.me === this.lobbyPlayers[1].name) {
      difference = {
        x: -this.lobbyPlayers[1].position.x / 2 + 13,
        y: -this.lobbyPlayers[1].position.y / 20 + 8,
      };
    } else if (
      this.lobbyPlayers[2] &&
      this.gameData.me === this.lobbyPlayers[2].name
    ) {
      difference = {
        x: this.lobbyPlayers[2].position.x - 278 - map.x,
        y: this.lobbyPlayers[2].position.y - 630 - map.y,
      };
    } else if (
      this.lobbyPlayers[3] &&
      this.gameData.me === this.lobbyPlayers[3].name
    ) {
      difference = {
        x: this.lobbyPlayers[3].position.x - 278 - map.x,
        y: this.lobbyPlayers[3].position.y - 630 - map.y,
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
  }

  loadLobby() {
    const tickInterval = setInterval(() => {
      this.lobbyPlayers = this.gameData.lobbyPlayers;
      if (
        !this.gameData.lobbyPlayers[0] ||
        !this.gameData.lobbyPlayers[0].loadedIn ||
        !this.gameData.lobbyPlayers[1] ||
        !this.gameData.lobbyPlayers[1].loadedIn
      ) {
        console.log('waiting for players');
      } else {
        clearInterval(tickInterval);
        this.createCollisionsAndMovables();
        this.createUntargetableArea(this.gameData.untargetableAreaMap);
        this.createFarmableArea(this.gameData.farmableAreaMap);
        this.createFishableArea(this.gameData.fishableAreaMap);
        this.createMinableArea(this.gameData.minableAreaMap);
        this.createHouseArea(this.gameData.houseAreaMap);
        this.createWellArea(this.gameData.wellAreaMap);
        this.createTraders();
        this.createOtherPlayers();
        this.createMovables();
        this.loadCanvas();
      }
    }, 3000);
  }

  createOtherPlayers() {
    this.lobbyPlayers = this.gameData.lobbyPlayers.map((lp) => {
      // add to remove multiplayer same character
      if (lp.name !== this.gameData.me)
        return {
          ...lp,
          position: {
            ...lp.position,
            writable: true,
          },
          canMoveVertical: true,
          canMoveHorizontal: true,
          moving: true,
          useRightAnims: true,
        };
      else {
        return {
          ...lp,
          position: {
            ...lp.position,
            writable: true,
          },
          canMoveVertical: true,
          canMoveHorizontal: true,
          moving: true,
          useRightAnims: true,
        };
      }
    });
  }

  loadCanvas() {
    if (document.getElementById(this.canvasId)) {
      this.canvas = document.getElementById(this.canvasId) as HTMLCanvasElement;
      this.canvas.width = this.gameData.resolution.x;
      this.canvas.height = this.gameData.resolution.y;
      this.canvas;
      this.loadMap();
    }
  }

  loadMap() {
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
            this.mapImage.position.y
          );
          this.loadPlayer();
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

    this.spriteSheetSoil.onload = () => {
      this.startAnimating(60);
    };
  }

  drawPickupableAnimation(item, frames: number, index: number) {
    if (this.pickupableFramesDrawn[index] > 8) {
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
        this.spriteReadyPotato,
        item.width * this.pickupableFrameIndex[index],
        0,
        item.width,
        item.height,
        item.position.x + 7,
        item.position.y + 7,
        50,
        50
      );
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
    const spriteSheet =
      trader.state === 'merchant-left'
        ? this.goblinMerchantLeft
        : this.goblinMerchantRight;
    if (this.goblinFramesDrawn > 8) {
      if (this.goblinFrameIndex < 7) {
        this.goblinFrameIndex++;
      } else {
        this.goblinFrameIndex = 0;
      }
      this.goblinFramesDrawn = 0;
    } else {
      this.goblinFramesDrawn++;
    }
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
        225
      );
      // this.ctx.beginPath();
      // this.ctx.rect(
      //   traderHitbox.position.x,
      //   traderHitbox.position.y,
      //   traderHitbox.width,
      //   traderHitbox.height
      // );
      // this.ctx.stroke();
      this.targetNearestSquare(traderHitbox);
    }
  }

  drawSleepAnimation() {
    if (this.bubblesFramesDrawn > 5) {
      if (this.bubblesFrameIndex < 15) {
        if (this.gameData.energy.current < this.gameData.energy.max) {
          this.changeEnergy.emit(1);
        }
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
        128
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
    this.moveOthers(player, i);
  }

  drawOtherSpriteAnimation(
    spriteSheet: HTMLImageElement,
    frames: number,
    otherplayer,
    i
  ) {
    if (this.gameData.isSleeping && this.ctx) {
      this.ctx.globalAlpha = 0;
    } else {
      if (this.ctx) this.ctx.globalAlpha = 1;
    }
    if (this.otherPlayersFramesDrawn[i] > 8) {
      if (this.otherPlayersFrameIndex[i] < frames - 1) {
        this.otherPlayersFrameIndex[i]++;
      } else {
        this.otherPlayersFrameIndex[i] = 0;
      }
      this.otherPlayersFramesDrawn[i] = 0;
    } else {
      this.otherPlayersFramesDrawn[i]++;
    }
    if (this.canvas && this.ctx && this.player.width && this.player.height) {
      const spriteWidth = this.gameData.isCarrying ? 128 : this.player.width;
      const spriteHeight = this.gameData.isCarrying
        ? this.squareSize
        : this.player.height;
      const positionX = this.gameData.isCarrying
        ? otherplayer.position.x - 228
        : otherplayer.position.x;
      const positionY = this.gameData.isCarrying
        ? otherplayer.position.y - 84
        : otherplayer.position.y;
      const dx = this.gameData.isCarrying ? 128 * 4 : 52;
      const dy = spriteSheet.height * 4;
      otherplayer.center = {
        x: otherplayer.position.x + this.player.width * 2,
        y: otherplayer.position.y + this.player.height * 2,
      };
      this.ctx.drawImage(
        spriteSheet,
        spriteWidth * this.otherPlayersFrameIndex[0] + 0.1,
        0,
        spriteWidth,
        spriteHeight,
        positionX,
        positionY,
        dx,
        dy
      );
    }
  }

  drawSpriteAnimation(spriteSheet: HTMLImageElement, frames: number) {
    if (this.gameData.isSleeping && this.ctx) {
      this.ctx.globalAlpha = 0;
    } else {
      if (this.ctx) this.ctx.globalAlpha = 1;
    }
    if (this.framesDrawn > 8) {
      if (this.frameIndex < frames - 1) {
        this.frameIndex++;
      } else {
        this.frameIndex = 0;
      }
      this.framesDrawn = 0;
    } else {
      this.framesDrawn++;
    }
    if (this.canvas && this.ctx) {
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
      this.ctx.drawImage(
        spriteSheet,
        spriteWidth * this.frameIndex,
        0,
        spriteWidth,
        spriteHeight,
        positionX,
        positionY,
        dx,
        dy
      );
    }

    // ***** SHOWING HIT BOX *****
    // this.ctx.beginPath();
    // this.ctx.rect(this.player.center.x, this.player.center.y, 4, 4);
    // this.ctx.stroke();
    // this.ctx.beginPath();
    // this.ctx.rect(
    //   this.player.position.x,
    //   this.player.position.y,
    //   this.player.width * 4,
    //   this.player.height * 4
    // );
    // this.ctx.stroke();
    // ***** SHOWING HIT BOX *****
  }

  drawCultivateAnimation(spriteSheet: HTMLImageElement, frames: number) {
    let width = 128;
    let height = 65;
    if (this.framesDrawn > 3) {
      if (this.actionFrameIndex < frames - 1) {
        if (
          this.actionFrameIndex === 3 &&
          this.gameData.equippedTool !== 'rod' &&
          this.gameData.equippedTool !== 'pickaxe'
        ) {
          this.changeStateOfHoveredFarmable();
        } else if (
          this.actionFrameIndex > 7 &&
          this.gameData.equippedTool === 'pickaxe'
        ) {
          this.changeStateOfHoveredFarmable();
        } else if (
          this.actionFrameIndex > 39 &&
          this.gameData.equippedTool === 'rod'
        ) {
          this.changeStateOfHoveredFarmable();
        }
        this.actionFrameIndex++;
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
            height * 4
          );
        }
        this.actionFrameIndex = 0;
        this.queuedCultivate = false;
        this.canClick = true;
      }
      this.framesDrawn = 0;
    } else {
      this.framesDrawn++;
    }

    if (this.ctx) {
      this.ctx.drawImage(
        spriteSheet,
        width * this.actionFrameIndex,
        0,
        width,
        spriteSheet.height,
        this.player.position.x - 224,
        this.player.position.y - 84,
        width * 4,
        height * 4
      );
    }
  }

  changeStateOfHoveredFarmable() {
    if (this.isWatering) {
      if (
        this.farmableArea.filter((area) => area === this.clickedFarmableArea)[0]
      ) {
        if (
          !this.farmableArea.filter(
            (area) => area === this.clickedFarmableArea
          )[0].watered
        ) {
          this.farmableArea.filter(
            (area) => area === this.clickedFarmableArea
          )[0].watered = true;
          this.changeWaterMeter.emit(-8);
          this.startWaterTimer(
            this.farmableArea.filter(
              (area) => area === this.clickedFarmableArea
            )[0]
          );
        }

        this.farmableArea.filter(
          (area) => area === this.clickedFarmableArea
        )[0];
      }
      this.isWatering = false;
      this.queuedCultivate = false;
      this.canClick = true;
      this.actionFrameIndex = 0;
      this.framesDrawn = 0;
      this.changeTool.emit('shovel');
      return;
    }
    if (this.clickedFarmableArea.state === 'fishable') {
      const getRandom = Math.random() * 100;
      if (getRandom < 75) {
        this.changeTool.emit('smallfish');
      } else if (getRandom < 95) {
        this.changeTool.emit('mediumfish');
      } else {
        this.changeTool.emit('hugefish');
      }
    } else if (this.clickedFarmableArea.state === 'minable') {
      const getRandom = Math.random() * 100;
      if (getRandom > 99) this.changeTool.emit('nugget');
    }
    if (this.gameData.equippedTool === 'shovel') {
      this.farmAction('soil-0', 'soil-1', 'soil-2', 'soil-3');
    }
    if (this.isAPlantSeed()) {
      this.plantSeed();
    }
    this.changeEnergy.emit(-3);
  }

  startWaterTimer(area) {
    setTimeout(() => {
      area.watered = false;
      if (area.state === 'potato-0') {
        area.state = 'potato-1';
      } else if (area.state === 'potato-1') {
        area.state = 'potato-2';
      } else if (area.state === 'potato-2') {
        area.state = 'potato-3';
      } else if (area.state === 'potato-3') {
        area.state = 'potato-4';
      } else if (area.state === 'potato-4') {
        area.state = 'soil-1';
        this.createPickupablePlantAtArea('potato', area.position, false);
      }
    }, 1000);
  }

  createPickupablePlantAtArea(plant, position, droppedFromPlayer) {
    this.pickupables.push({
      plant: plant,
      position: position,
      dropped: droppedFromPlayer,
    });
    this.pickupableFramesDrawn[this.pickupables.length - 1] = 0;
    this.pickupableFrameIndex[this.pickupables.length - 1] = 0;
  }
  isAPlantSeed() {
    return (
      this.gameData.equippedTool === 'potato-seeds' ||
      this.gameData.equippedTool === 'carrot-seeds' ||
      this.gameData.equippedTool === 'wheat-seeds' ||
      this.gameData.equippedTool === 'cabbage-seeds' ||
      this.gameData.equippedTool === 'cauliflower-seeds' ||
      this.gameData.equippedTool === 'beet-seeds' ||
      this.gameData.equippedTool === 'radish-seeds' ||
      this.gameData.equippedTool === 'kale-seeds' ||
      this.gameData.equippedTool === 'sunflower-seeds'
    );
  }

  plantSeed() {
    const clickedFarm = this.farmableArea.filter(
      (area) => area === this.clickedFarmableArea
    )[0];
    if (
      clickedFarm.state === 'soil-3' &&
      this.gameData.equippedTool === 'potato-seeds'
    ) {
      this.farmableArea.filter(
        (area) => area === this.clickedFarmableArea
      )[0].state = 'potato-0';
      const payload = {
        name: this.gameData.seedsOwned['potato'].name,
        count: this.gameData.seedsOwned['potato'].count,
        keyname: 'potato',
      };
      this.reduceSeedCount.emit(payload);
    }
    if (
      clickedFarm.state === 'soil-3' &&
      this.gameData.equippedTool === 'carrot-seeds'
    ) {
      this.farmableArea.filter(
        (area) => area === this.clickedFarmableArea
      )[0].state = 'carrot-0';
      const payload = {
        name: this.gameData.seedsOwned['carrot'].name,
        count: this.gameData.seedsOwned['carrot'].count,
        keyname: 'carrot',
      };
      this.reduceSeedCount.emit(payload);
    }
    if (
      clickedFarm.state === 'soil-3' &&
      this.gameData.equippedTool === 'wheat-seeds'
    ) {
      this.farmableArea.filter(
        (area) => area === this.clickedFarmableArea
      )[0].state = 'wheat-0';
      const payload = {
        name: this.gameData.seedsOwned['wheat'].name,
        count: this.gameData.seedsOwned['wheat'].count,
        keyname: 'wheat',
      };
      this.reduceSeedCount.emit(payload);
    }
    if (
      clickedFarm.state === 'soil-3' &&
      this.gameData.equippedTool === 'cabbage-seeds'
    ) {
      this.farmableArea.filter(
        (area) => area === this.clickedFarmableArea
      )[0].state = 'cabbage-0';
      const payload = {
        name: this.gameData.seedsOwned['cabbage'].name,
        count: this.gameData.seedsOwned['cabbage'].count,
        keyname: 'wheat',
      };
      this.reduceSeedCount.emit(payload);
    }
    if (
      clickedFarm.state === 'soil-3' &&
      this.gameData.equippedTool === 'cauliflower-seeds'
    ) {
      this.farmableArea.filter(
        (area) => area === this.clickedFarmableArea
      )[0].state = 'cauliflower-0';
      const payload = {
        name: this.gameData.seedsOwned['cauliflower'].name,
        count: this.gameData.seedsOwned['cauliflower'].count,
        keyname: 'wheat',
      };
      this.reduceSeedCount.emit(payload);
    }
    if (
      clickedFarm.state === 'soil-3' &&
      this.gameData.equippedTool === 'beet-seeds'
    ) {
      this.farmableArea.filter(
        (area) => area === this.clickedFarmableArea
      )[0].state = 'beets-0';
      const payload = {
        name: this.gameData.seedsOwned['beets'].name,
        count: this.gameData.seedsOwned['beets'].count,
        keyname: 'beets',
      };
      this.reduceSeedCount.emit(payload);
    }
    if (
      clickedFarm.state === 'soil-3' &&
      this.gameData.equippedTool === 'radish-seeds'
    ) {
      this.farmableArea.filter(
        (area) => area === this.clickedFarmableArea
      )[0].state = 'radish-0';
      const payload = {
        name: this.gameData.seedsOwned['radish'].name,
        count: this.gameData.seedsOwned['radish'].count,
        keyname: 'radish',
      };
      this.reduceSeedCount.emit(payload);
    }
    if (
      clickedFarm.state === 'soil-3' &&
      this.gameData.equippedTool === 'kale-seeds'
    ) {
      this.farmableArea.filter(
        (area) => area === this.clickedFarmableArea
      )[0].state = 'kale-0';
      const payload = {
        name: this.gameData.seedsOwned['kale'].name,
        count: this.gameData.seedsOwned['kale'].count,
        keyname: 'kale',
      };
      this.reduceSeedCount.emit(payload);
    }
    if (
      clickedFarm.state === 'soil-3' &&
      this.gameData.equippedTool === 'sunflower-seeds'
    ) {
      this.farmableArea.filter(
        (area) => area === this.clickedFarmableArea
      )[0].state = 'sunflower-0';
      const payload = {
        name: this.gameData.seedsOwned['sunflower'].name,
        count: this.gameData.seedsOwned['sunflower'].count,
        keyname: 'sunflower',
      };
      this.reduceSeedCount.emit(payload);
    }
  }

  farmAction(state0, state1, state2, state3) {
    const clickedFarm = this.farmableArea.filter(
      (area) => area === this.clickedFarmableArea
    )[0];
    if (clickedFarm) {
      if (clickedFarm.state === 'none') {
        this.farmableArea.filter(
          (area) => area === this.clickedFarmableArea
        )[0].state = state0;
      } else if (clickedFarm.state === state0) {
        this.farmableArea.filter(
          (area) => area === this.clickedFarmableArea
        )[0].state = state1;
      } else if (clickedFarm.state === state1) {
        this.farmableArea.filter(
          (area) => area === this.clickedFarmableArea
        )[0].state = state2;
      } else if (clickedFarm.state === state2) {
        this.farmableArea.filter(
          (area) => area === this.clickedFarmableArea
        )[0].state = state3;
      } else {
        this.farmableArea.filter(
          (area) => area === this.clickedFarmableArea
        )[0].state = state3;
      }
    }
  }

  drawBoundary(boundary) {
    if (this.ctx) {
      this.ctx.fillStyle = 'transparent';
      this.ctx.fillRect(
        boundary.position.x,
        boundary.position.y,
        boundary.width,
        boundary.height
      );
    }
  }

  drawFarmable(area) {
    let cropFrameSize = {
      width: this.squareSize,
      height: this.squareSize,
    };
    if (this.ctx) {
      if (area.state === 'soil-0') {
        this.ctx.drawImage(
          this.spriteSheetSoil,
          cropFrameSize.width * 0,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'soil-1') {
        this.ctx.drawImage(
          this.spriteSheetSoil,
          cropFrameSize.width * 1,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'soil-2') {
        this.ctx.drawImage(
          this.spriteSheetSoil,
          cropFrameSize.width * 2,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'soil-3') {
        this.ctx.drawImage(
          this.spriteSheetSoil,
          cropFrameSize.width * 3,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'beets-0') {
        this.ctx.drawImage(
          this.spriteSheetBeets,
          cropFrameSize.width * 0,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'beets-1') {
        this.ctx.drawImage(
          this.spriteSheetPotato,
          cropFrameSize.width * 1,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'beets-2') {
        this.ctx.drawImage(
          this.spriteSheetPotato,
          cropFrameSize.width * 2,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'beets-3') {
        this.ctx.drawImage(
          this.spriteSheetPotato,
          cropFrameSize.width * 3,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'beets-4') {
        this.ctx.drawImage(
          this.spriteSheetPotato,
          cropFrameSize.width * 4,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'cabbage-0') {
        this.ctx.drawImage(
          this.spriteSheetCabbage,
          cropFrameSize.width * 0,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'cabbage-1') {
        this.ctx.drawImage(
          this.spriteSheetPotato,
          cropFrameSize.width * 1,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'cabbage-2') {
        this.ctx.drawImage(
          this.spriteSheetPotato,
          cropFrameSize.width * 2,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'cabbage-3') {
        this.ctx.drawImage(
          this.spriteSheetPotato,
          cropFrameSize.width * 3,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'cabbage-4') {
        this.ctx.drawImage(
          this.spriteSheetPotato,
          cropFrameSize.width * 4,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'carrot-0') {
        this.ctx.drawImage(
          this.spriteSheetCarrot,
          cropFrameSize.width * 0,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'carrot-1') {
        this.ctx.drawImage(
          this.spriteSheetPotato,
          cropFrameSize.width * 1,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'carrot-2') {
        this.ctx.drawImage(
          this.spriteSheetPotato,
          cropFrameSize.width * 2,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'carrot-3') {
        this.ctx.drawImage(
          this.spriteSheetPotato,
          cropFrameSize.width * 3,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'carrot-4') {
        this.ctx.drawImage(
          this.spriteSheetPotato,
          cropFrameSize.width * 4,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'cauliflower-0') {
        this.ctx.drawImage(
          this.spriteSheetCauliflower,
          cropFrameSize.width * 0,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'cauliflower-1') {
        this.ctx.drawImage(
          this.spriteSheetPotato,
          cropFrameSize.width * 1,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'cauliflower-2') {
        this.ctx.drawImage(
          this.spriteSheetPotato,
          cropFrameSize.width * 2,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'cauliflower-3') {
        this.ctx.drawImage(
          this.spriteSheetPotato,
          cropFrameSize.width * 3,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'cauliflower-4') {
        this.ctx.drawImage(
          this.spriteSheetPotato,
          cropFrameSize.width * 4,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'kale-0') {
        this.ctx.drawImage(
          this.spriteSheetKale,
          cropFrameSize.width * 0,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'kale-1') {
        this.ctx.drawImage(
          this.spriteSheetPotato,
          cropFrameSize.width * 1,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'kale-2') {
        this.ctx.drawImage(
          this.spriteSheetPotato,
          cropFrameSize.width * 2,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'kale-3') {
        this.ctx.drawImage(
          this.spriteSheetPotato,
          cropFrameSize.width * 3,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'kale-4') {
        this.ctx.drawImage(
          this.spriteSheetPotato,
          cropFrameSize.width * 4,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'potato-0') {
        this.ctx.drawImage(
          this.spriteSheetPotato,
          cropFrameSize.width * 0,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'potato-1') {
        this.ctx.drawImage(
          this.spriteSheetPotato,
          cropFrameSize.width * 1,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'potato-2') {
        this.ctx.drawImage(
          this.spriteSheetPotato,
          cropFrameSize.width * 2,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'potato-3') {
        this.ctx.drawImage(
          this.spriteSheetPotato,
          cropFrameSize.width * 3,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'potato-4') {
        this.ctx.drawImage(
          this.spriteSheetPotato,
          cropFrameSize.width * 4,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'radish-0') {
        this.ctx.drawImage(
          this.spriteSheetRadish,
          cropFrameSize.width * 0,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'radish-1') {
        this.ctx.drawImage(
          this.spriteSheetPotato,
          cropFrameSize.width * 1,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'radish-2') {
        this.ctx.drawImage(
          this.spriteSheetPotato,
          cropFrameSize.width * 2,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'radish-3') {
        this.ctx.drawImage(
          this.spriteSheetPotato,
          cropFrameSize.width * 3,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'radish-4') {
        this.ctx.drawImage(
          this.spriteSheetPotato,
          cropFrameSize.width * 4,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'sunflower-0') {
        this.ctx.drawImage(
          this.spriteSheetSunflower,
          cropFrameSize.width * 0,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'sunflower-1') {
        this.ctx.drawImage(
          this.spriteSheetPotato,
          cropFrameSize.width * 1,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'sunflower-2') {
        this.ctx.drawImage(
          this.spriteSheetPotato,
          cropFrameSize.width * 2,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'sunflower-3') {
        this.ctx.drawImage(
          this.spriteSheetPotato,
          cropFrameSize.width * 3,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'sunflower-4') {
        this.ctx.drawImage(
          this.spriteSheetPotato,
          cropFrameSize.width * 4,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'wheat-0') {
        this.ctx.drawImage(
          this.spriteSheetWheat,
          cropFrameSize.width * 0,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'wheat-1') {
        this.ctx.drawImage(
          this.spriteSheetPotato,
          cropFrameSize.width * 1,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'wheat-2') {
        this.ctx.drawImage(
          this.spriteSheetPotato,
          cropFrameSize.width * 2,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'wheat-3') {
        this.ctx.drawImage(
          this.spriteSheetPotato,
          cropFrameSize.width * 3,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else if (area.state === 'wheat-4') {
        this.ctx.drawImage(
          this.spriteSheetPotato,
          cropFrameSize.width * 4,
          0,
          cropFrameSize.width,
          cropFrameSize.height,
          area.position.x,
          area.position.y,
          this.squareSize,
          this.squareSize
        );
      } else {
        this.ctx.fillStyle = 'transparent';
        this.ctx.fillRect(
          area.position.x,
          area.position.y,
          area.width,
          area.height
        );
      }
      if (area.watered) {
        this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
        this.ctx.fillRect(
          area.position.x,
          area.position.y,
          area.width,
          area.height
        );
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
      rectangle1.position.x - 1 + rectangle1.width * 4 >=
        rectangle2.position.x &&
      rectangle1.position.x + 1 <= rectangle2.position.x + rectangle2.width &&
      rectangle1.position.y + 15 <= rectangle2.position.y + rectangle2.height &&
      rectangle1.position.y + 15 + rectangle1.height >= rectangle2.position.y
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
          };
          this.farmableArea.push(newFarmableArea);
        }
      });
    });
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

  keyDownEvent(e: KeyboardEvent) {
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
    if (this.canClick) {
      switch (e.key.toLowerCase()) {
        case 'b':
          this.changeTool.emit('basket');
          break;
        case '1':
          if (this.gameData.seedsOwned['potato'].count > 0)
            this.changeTool.emit('potato-seeds');
          break;
        case '2':
          if (this.gameData.seedsOwned['carrot'].count > 0)
            this.changeTool.emit('carrot-seeds');
          break;
        case '3':
          if (this.gameData.seedsOwned['wheat'].count > 0)
            this.changeTool.emit('wheat-seeds');
          break;
        case '4':
          if (this.gameData.seedsOwned['cabbage'].count > 0)
            this.changeTool.emit('cabbage-seeds');
          break;
        case '5':
          if (this.gameData.seedsOwned['cauliflower'].count > 0)
            this.changeTool.emit('cauliflower-seeds');
          break;
        case '6':
          if (this.gameData.seedsOwned['beets'].count > 0)
            this.changeTool.emit('beet-seeds');
          break;
        case '7':
          if (this.gameData.seedsOwned['radish'].count > 0)
            this.changeTool.emit('radish-seeds');
          break;
        case '8':
          if (this.gameData.seedsOwned['kale'].count > 0)
            this.changeTool.emit('kale-seeds');
          break;
        case '9':
          if (this.gameData.seedsOwned['sunflower'].count > 0)
            this.changeTool.emit('sunflower-seeds');
          break;
        default:
          break;
      }
    }
  }
  keyUpEvent(e: KeyboardEvent) {
    switch (e.key.toLowerCase()) {
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
      // this.canvas.setAttribute(
      //   'style',
      //   'cursor: ' + "url('../../assets/ui/cursor_big.png')"
      // );
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
        (player) => player.name === this.gameData.me
      )[0].useRightAnims = true;
      return true;
    } else {
      this.lobbyPlayers.filter(
        (player) => player.name === this.gameData.me
      )[0].useRightAnims = false;
      return false;
    }
  }

  cultivate() {
    const spriteSheet = this.getCultivateSpriteSheet();

    if (spriteSheet) {
      this.drawCultivateAnimation(
        this.useRightAnims() ? spriteSheet.right : spriteSheet.left,
        this.useRightAnims()
          ? this.gameData.spriteAnimations[spriteSheet.rightKey].frames
          : this.gameData.spriteAnimations[spriteSheet.leftKey].frames
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

  movement() {
    let player = this.lobbyPlayers.filter(
      (player) => player.name === this.gameData.me
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

    if (this.gameData.keys.w.pressed) {
      for (let i = 0; i < this.boundaries.length; i++) {
        const boundary = this.boundaries[i];
        if (
          this.retangularCollision({
            rectangle1: this.player,
            rectangle2: {
              ...boundary,
              position: {
                x: boundary.position.x,
                y: boundary.position.y + 3,
              },
            },
          })
        ) {
          moving = false;
          canMoveHorizontal = true;
          canMoveVertical = false;
        }
      }
      if (moving || canMoveVertical) {
        this.movables.forEach((element) => {
          element.position.y += this.gameData.velocity;
        });
        this.pickupables.forEach((element) => {
          if (element.dropped) {
            element.position.y += this.gameData.velocity;
          }
        });
      }
    }
    if (this.gameData.keys.s.pressed) {
      for (let i = 0; i < this.boundaries.length; i++) {
        const boundary = this.boundaries[i];
        if (
          this.retangularCollision({
            rectangle1: this.player,
            rectangle2: {
              ...boundary,
              position: {
                x: boundary.position.x,
                y: boundary.position.y - 30,
              },
            },
          })
        ) {
          moving = false;
          canMoveHorizontal = true;
          canMoveVertical = false;
        }
      }
      if (moving || canMoveVertical) {
        this.movables.forEach((element) => {
          element.position.y -= this.gameData.velocity;
        });
        this.pickupables.forEach((element) => {
          if (element.dropped) {
            element.position.y -= this.gameData.velocity;
          }
        });
      }
    }
    if (this.gameData.keys.d.pressed) {
      for (let i = 0; i < this.boundaries.length; i++) {
        const boundary = this.boundaries[i];
        if (
          this.retangularCollision({
            rectangle1: this.player,
            rectangle2: {
              ...boundary,
              position: {
                x: boundary.position.x - 3,
                y: boundary.position.y,
              },
            },
          })
        ) {
          canMoveHorizontal = false;
          moving = false;
        }
      }
      if (moving || canMoveHorizontal) {
        this.movables.forEach((element) => {
          element.position.x -= this.gameData.velocity;
        });
        this.pickupables.forEach((element) => {
          if (element.dropped) {
            element.position.x -= this.gameData.velocity;
          }
        });
      }
    }
    if (this.gameData.keys.a.pressed) {
      for (let i = 0; i < this.boundaries.length; i++) {
        const boundary = this.boundaries[i];
        if (
          this.retangularCollision({
            rectangle1: this.player,
            rectangle2: {
              ...boundary,
              position: {
                x: boundary.position.x + 3,
                y: boundary.position.y,
              },
            },
          })
        ) {
          canMoveHorizontal = false;
          moving = false;
        }
      }
      if (moving || canMoveHorizontal) {
        this.movables.forEach((element) => {
          element.position.x += this.gameData.velocity;
        });
        this.pickupables.forEach((element) => {
          if (element.dropped) {
            element.position.x += this.gameData.velocity;
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
      !this.gameData.keys.w.pressed &&
      !this.gameData.keys.a.pressed &&
      !this.gameData.keys.s.pressed &&
      !this.gameData.keys.d.pressed &&
      !this.gameData.isSleeping
    ) {
      if (this.gameData.equippedTool === 'beets') {
        this.drawSpriteAnimation(
          useRightAnims
            ? this.spriteCarryBeetsRight
            : this.spriteCarryBeetsLeft,
          useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryBeetsRight'].frames
            : this.gameData.spriteAnimations['spriteCarryBeetsLeft'].frames
        );
      } else if (this.gameData.equippedTool === 'cabbage') {
        this.drawSpriteAnimation(
          useRightAnims
            ? this.spriteCarryCabbageRight
            : this.spriteCarryCabbageLeft,
          useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryCabbageRight'].frames
            : this.gameData.spriteAnimations['spriteCarryCabbageLeft'].frames
        );
      } else if (this.gameData.equippedTool === 'carrot') {
        this.drawSpriteAnimation(
          useRightAnims
            ? this.spriteCarryCarrotRight
            : this.spriteCarryCarrotLeft,
          useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryCarrotRight'].frames
            : this.gameData.spriteAnimations['spriteCarryCarrotLeft'].frames
        );
      } else if (this.gameData.equippedTool === 'cauliflower') {
        this.drawSpriteAnimation(
          useRightAnims
            ? this.spriteCarryCauliflowerRight
            : this.spriteCarryCauliflowerLeft,
          useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryCauliflowerRight']
                .frames
            : this.gameData.spriteAnimations['spriteCarryCauliflowerLeft']
                .frames
        );
      } else if (this.gameData.equippedTool === 'kale') {
        this.drawSpriteAnimation(
          useRightAnims ? this.spriteCarryKaleRight : this.spriteCarryKaleLeft,
          useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryKaleRight'].frames
            : this.gameData.spriteAnimations['spriteCarryKaleLeft'].frames
        );
      } else if (this.gameData.equippedTool === 'potato') {
        this.drawSpriteAnimation(
          useRightAnims
            ? this.spriteCarryPotatoRight
            : this.spriteCarryPotatoLeft,
          useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryPotatoRight'].frames
            : this.gameData.spriteAnimations['spriteCarryPotatoLeft'].frames
        );
      } else if (this.gameData.equippedTool === 'radish') {
        this.drawSpriteAnimation(
          useRightAnims
            ? this.spriteCarryRadishRight
            : this.spriteCarryRadishLeft,
          useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryRadishRight'].frames
            : this.gameData.spriteAnimations['spriteCarryRadishLeft'].frames
        );
      } else if (this.gameData.equippedTool === 'sunflower') {
        this.drawSpriteAnimation(
          useRightAnims
            ? this.spriteCarrySunflowerRight
            : this.spriteCarrySunflowerLeft,
          useRightAnims
            ? this.gameData.spriteAnimations['spriteCarrySunflowerRight'].frames
            : this.gameData.spriteAnimations['spriteCarrySunflowerLeft'].frames
        );
      } else if (this.gameData.equippedTool === 'wheat') {
        this.drawSpriteAnimation(
          useRightAnims
            ? this.spriteCarryWheatRight
            : this.spriteCarryWheatLeft,
          useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryWheatRight'].frames
            : this.gameData.spriteAnimations['spriteCarryWheatLeft'].frames
        );
      } else if (this.gameData.equippedTool === 'smallfish') {
        this.drawSpriteAnimation(
          useRightAnims
            ? this.spriteCarrySmallFishRight
            : this.spriteCarrySmallFishLeft,
          useRightAnims
            ? this.gameData.spriteAnimations['spriteCarrySmallFishRight'].frames
            : this.gameData.spriteAnimations['spriteCarrySmallFishLeft'].frames
        );
      } else if (this.gameData.equippedTool === 'mediumfish') {
        this.drawSpriteAnimation(
          useRightAnims
            ? this.spriteCarryMediumFishRight
            : this.spriteCarryMediumFishLeft,
          useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryMediumFishRight']
                .frames
            : this.gameData.spriteAnimations['spriteCarryMediumFishLeft'].frames
        );
      } else if (this.gameData.equippedTool === 'hugefish') {
        this.drawSpriteAnimation(
          useRightAnims
            ? this.spriteCarryHugeFishRight
            : this.spriteCarryHugeFishLeft,
          useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryHugeFishRight'].frames
            : this.gameData.spriteAnimations['spriteCarryHugeFishLeft'].frames
        );
      } else if (this.gameData.equippedTool === 'nugget') {
        this.drawSpriteAnimation(
          useRightAnims
            ? this.spriteCarryNuggetRight
            : this.spriteCarryNuggetLeft,
          useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryNuggetRight'].frames
            : this.gameData.spriteAnimations['spriteCarryNuggetLeft'].frames
        );
      } else {
        this.drawSpriteAnimation(
          useRightAnims ? this.spriteSheetIdleRight : this.spriteSheetIdleLeft,
          useRightAnims
            ? this.gameData.spriteAnimations['playerIdleRight'].frames
            : this.gameData.spriteAnimations['playerIdleLeft'].frames
        );
      }
    } else {
      if (this.gameData.equippedTool === 'beets') {
        this.drawSpriteAnimation(
          useRightAnims
            ? this.spriteCarryBeetsRight
            : this.spriteCarryBeetsLeft,
          useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryBeetsRight'].frames
            : this.gameData.spriteAnimations['spriteCarryBeetsLeft'].frames
        );
      } else if (this.gameData.equippedTool === 'cabbage') {
        this.drawSpriteAnimation(
          useRightAnims
            ? this.spriteCarryCabbageRight
            : this.spriteCarryCabbageLeft,
          useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryCabbageRight'].frames
            : this.gameData.spriteAnimations['spriteCarryCabbageLeft'].frames
        );
      } else if (this.gameData.equippedTool === 'carrot') {
        this.drawSpriteAnimation(
          useRightAnims
            ? this.spriteCarryCarrotRight
            : this.spriteCarryCarrotLeft,
          useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryCarrotRight'].frames
            : this.gameData.spriteAnimations['spriteCarryCarrotLeft'].frames
        );
      } else if (this.gameData.equippedTool === 'cauliflower') {
        this.drawSpriteAnimation(
          useRightAnims
            ? this.spriteCarryCauliflowerRight
            : this.spriteCarryCauliflowerLeft,
          useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryCauliflowerRight']
                .frames
            : this.gameData.spriteAnimations['spriteCarryCauliflowerLeft']
                .frames
        );
      } else if (this.gameData.equippedTool === 'kale') {
        this.drawSpriteAnimation(
          useRightAnims ? this.spriteCarryKaleRight : this.spriteCarryKaleLeft,
          useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryKaleRight'].frames
            : this.gameData.spriteAnimations['spriteCarryKaleLeft'].frames
        );
      } else if (this.gameData.equippedTool === 'potato') {
        this.drawSpriteAnimation(
          useRightAnims
            ? this.spriteCarryPotatoRight
            : this.spriteCarryPotatoLeft,
          useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryPotatoRight'].frames
            : this.gameData.spriteAnimations['spriteCarryPotatoLeft'].frames
        );
      } else if (this.gameData.equippedTool === 'radish') {
        this.drawSpriteAnimation(
          useRightAnims
            ? this.spriteCarryRadishRight
            : this.spriteCarryRadishLeft,
          useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryRadishRight'].frames
            : this.gameData.spriteAnimations['spriteCarryRadishLeft'].frames
        );
      } else if (this.gameData.equippedTool === 'sunflower') {
        this.drawSpriteAnimation(
          useRightAnims
            ? this.spriteCarrySunflowerRight
            : this.spriteCarrySunflowerLeft,
          useRightAnims
            ? this.gameData.spriteAnimations['spriteCarrySunflowerRight'].frames
            : this.gameData.spriteAnimations['spriteCarrySunflowerLeft'].frames
        );
      } else if (this.gameData.equippedTool === 'wheat') {
        this.drawSpriteAnimation(
          useRightAnims
            ? this.spriteCarryWheatRight
            : this.spriteCarryWheatLeft,
          useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryWheatRight'].frames
            : this.gameData.spriteAnimations['spriteCarryWheatLeft'].frames
        );
      } else if (this.gameData.equippedTool === 'smallfish') {
        this.drawSpriteAnimation(
          useRightAnims
            ? this.spriteCarrySmallFishRight
            : this.spriteCarrySmallFishLeft,
          useRightAnims
            ? this.gameData.spriteAnimations['spriteCarrySmallFishRight'].frames
            : this.gameData.spriteAnimations['spriteCarrySmallFishLeft'].frames
        );
      } else if (this.gameData.equippedTool === 'mediumfish') {
        this.drawSpriteAnimation(
          useRightAnims
            ? this.spriteCarryMediumFishRight
            : this.spriteCarryMediumFishLeft,
          useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryMediumFishRight']
                .frames
            : this.gameData.spriteAnimations['spriteCarryMediumFishLeft'].frames
        );
      } else if (this.gameData.equippedTool === 'hugefish') {
        this.drawSpriteAnimation(
          useRightAnims
            ? this.spriteCarryHugeFishRight
            : this.spriteCarryHugeFishLeft,
          useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryHugeFishRight'].frames
            : this.gameData.spriteAnimations['spriteCarryHugeFishLeft'].frames
        );
      } else if (this.gameData.equippedTool === 'nugget') {
        this.drawSpriteAnimation(
          useRightAnims
            ? this.spriteCarryNuggetRight
            : this.spriteCarryNuggetLeft,
          useRightAnims
            ? this.gameData.spriteAnimations['spriteCarryNuggetRight'].frames
            : this.gameData.spriteAnimations['spriteCarryNuggetLeft'].frames
        );
      } else {
        this.drawSpriteAnimation(
          useRightAnims ? this.spriteSheetWalkRight : this.spriteSheetWalkLeft,
          useRightAnims
            ? this.gameData.spriteAnimations['playerWalkRight'].frames
            : this.gameData.spriteAnimations['playerWalkLeft'].frames
        );
      }
    }
    console.log(player.moving);
    player.moving = moving;
    player.canMoveHorizontal = canMoveHorizontal;
    player.canMoveVertical = canMoveVertical;
    player.useRightAnims = useRightAnims;
  }

  targetNearestSquare(area) {
    if (
      this.ctx &&
      this.player.width &&
      this.player.height &&
      this.player.center
    ) {
      if (
        this.mousePos.x >= area.position.x &&
        this.mousePos.y >= area.position.y &&
        this.mousePos.x < area.position.x + area.width &&
        this.mousePos.y < area.position.y + area.height
      ) {
        this.ctx.beginPath();
        this.ctx.lineWidth = 6;

        if (this.isMouseCloseToPlayer(this.player, this.mousePos)) {
          if (
            area !== this.hoveredFarmableArea &&
            !this.gameData.isCarrying &&
            this.canClick
          )
            this.changeEquippedTool(area.state);
          this.hoveredFarmableArea = area;
          this.mayFarm = true;
          this.hoveredFarmableArea.center = {
            x: area.position.x + 32,
            y: area.position.y + 32,
          };

          this.ctx.strokeStyle = 'blue';
          if (
            this.hoveredFarmableArea.state !== 'house' &&
            this.hoveredFarmableArea.state !== 'well' &&
            this.hoveredFarmableArea.state !== 'merchant' &&
            this.hoveredFarmableArea.state !== 'untargetable'
          )
            this.drawBrokenSquare(area);
        } else {
          this.mayFarm = false;
          this.hoveredFarmableArea = this.defaultFarmState;
          this.ctx.strokeStyle = 'transparent';
          this.ctx.rect(
            area.position.x,
            area.position.y,
            area.width,
            area.height
          );
        }

        this.ctx.stroke();
      }
    }
  }

  changeEquippedTool(state) {
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
      this.changeTool.emit('shovel');
    } else if (
      !this.isHoldingSeed(this.gameData.equippedTool) &&
      !this.gameData.openShop
    ) {
      this.changeTool.emit('shovel');
      this.canHarvest.emit(true);
    }
    if (!this.isMouseCloseToPlayer(this.player, this.mousePos)) {
      this.canHarvest.emit(false);
    }
  }

  drawBrokenSquare(area) {
    if (this.ctx) {
      this.ctx.moveTo(area.position.x, area.position.y);
      this.ctx.lineTo(area.position.x + area.width / 4, area.position.y);
      this.ctx.moveTo(area.position.x, area.position.y);
      this.ctx.lineTo(area.position.x, area.position.y + area.height / 4);

      this.ctx.moveTo(area.position.x, area.position.y + area.height);
      this.ctx.lineTo(
        area.position.x,
        area.position.y + area.height - area.height / 4
      );
      this.ctx.moveTo(area.position.x, area.position.y + area.height);
      this.ctx.lineTo(
        area.position.x + area.width / 4,
        area.position.y + area.height
      );

      this.ctx.moveTo(
        area.position.x + area.width,
        area.position.y + area.height
      );
      this.ctx.lineTo(
        area.position.x + area.width - area.width / 4,
        area.position.y + area.height
      );
      this.ctx.moveTo(
        area.position.x + area.width,
        area.position.y + area.height
      );
      this.ctx.lineTo(
        area.position.x + area.width,
        area.position.y + area.height - area.height / 4
      );
      this.ctx.moveTo(area.position.x + area.width, area.position.y);
      this.ctx.lineTo(
        area.position.x + area.width - area.width / 4,
        area.position.y
      );
      this.ctx.moveTo(area.position.x + area.width, area.position.y);
      this.ctx.lineTo(
        area.position.x + area.width,
        area.position.y + area.height / 4
      );
    }
  }

  removeMouseProperties() {
    this.mayFarm = false;
    this.hoveredFarmableArea = this.defaultFarmState;
    this.clickedFarmableArea = this.defaultFarmState;
    this.activatedArea = this.defaultFarmState;
  }

  doLeftClickOnMouse(evt) {
    if (this.gameData.isSleeping) {
      return;
    }
    if (this.gameData.isCarrying) {
      this.dropCarriedItem();
    } else if (
      this.player.center &&
      this.mayFarm &&
      this.ctx &&
      this.canClick &&
      this.gameData.energy.current >= 3 &&
      this.gameData.canHarvest
    ) {
      this.clickedFarmableArea = this.hoveredFarmableArea;
      if (this.clickedFarmableArea.state !== 'well') {
        this.queuedCultivate = true;
      }
      this.canClick = false;
    }
  }

  doRightClickOnMouse(evt) {
    evt.preventDefault();
    if (this.gameData.openShop === true) {
      this.openShop.emit(false);
      return;
    }
    if (
      this.isHoldingSeed(this.gameData.equippedTool) ||
      this.gameData.equippedTool === 'basket'
    ) {
      if (!this.gameData.openShop) this.changeTool.emit('shovel');
      return;
    }
    if (!this.isWatering) {
      if (this.gameData.isSleeping) {
        this.queuedActivation = false;
        this.activatable();
        return;
      }
      this.canClick = true;
      this.queuedActivation = true;
      this.activatedArea = this.hoveredFarmableArea;
      if (
        this.activatedArea.state === 'merchant' &&
        this.gameData.canOpenShop &&
        this.gameData.openShop === false
      ) {
        this.openShop.emit(true);
      }
      if (this.activatedArea.state === 'well') {
        this.refillWaterCan();
      } else if (
        this.isShovelable(this.activatedArea.state, this.player, this.mousePos)
      ) {
        this.canClick = false;
        this.waterArea(this.activatedArea);
      }
    }
  }

  refillWaterCan() {
    this.changeWaterMeter.emit('max');
  }

  waterArea(clickedArea) {
    if (this.gameData.equippedTool === 'shovel') {
      this.clickedFarmableArea = clickedArea;
      this.isWatering = true;
    }
  }
  waterAnimation() {
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
          : this.gameData.spriteAnimations[spriteSheet.leftKey].frames
      );
  }
  doScrollOnMouse(evt) {
    if (this.player.center && this.mayFarm && this.ctx && this.canClick) {
      if (evt.wheelDelta < 0) {
        switch (this.gameData.equippedTool) {
          case 'rod':
            break;
          case 'shovel':
            this.changeTool.emit('water');
            break;
          case 'water':
            this.changeTool.emit('hammer');
            break;
          case 'hammer':
            this.changeTool.emit('pickaxe');
            break;
          case 'pickaxe':
            this.changeTool.emit('rod');
            break;
        }
      } else if (evt.wheelDelta > 0) {
        switch (this.gameData.equippedTool) {
          case 'shovel':
            break;
          case 'water':
            this.changeTool.emit('shovel');
            break;
          case 'hammer':
            this.changeTool.emit('water');
            break;
          case 'pickaxe':
            this.changeTool.emit('hammer');
            break;
          case 'rod':
            this.changeTool.emit('pickaxe');
            break;
        }
      }
    }
  }

  tickMoney(number) {
    let i = 0;
    const tickInterval = setInterval(() => {
      if (i < number) {
        this.changeMoney.emit(1);
        i++;
      } else {
        clearInterval(tickInterval);
      }
    }, 40);
  }

  dropCarriedItem() {
    if (
      this.hoveredFarmableArea.state === 'merchant' &&
      this.gameData.isCarrying
    ) {
      this.changeTool.emit('shovel');
      switch (this.gameData.equippedTool) {
        case 'potato':
          this.tickMoney(PLANT_COSTS.POTATO * PLANT_MULTIPLIER);
          break;
        case 'carrot':
          this.tickMoney(PLANT_COSTS.CARROT * PLANT_MULTIPLIER);
          break;
        case 'wheat':
          this.tickMoney(PLANT_COSTS.WHEAT * PLANT_MULTIPLIER);
          break;
        case 'cabbage':
          this.tickMoney(PLANT_COSTS.CABBAGE * PLANT_MULTIPLIER);
          break;
        case 'cauliflower':
          this.tickMoney(PLANT_COSTS.CAULIFLOWER * PLANT_MULTIPLIER);
          break;
        case 'beets':
          this.tickMoney(PLANT_COSTS.BEETS * PLANT_MULTIPLIER);
          break;
        case 'kale':
          this.tickMoney(PLANT_COSTS.KALE * PLANT_MULTIPLIER);
          break;
        case 'sunflower':
          this.tickMoney(PLANT_COSTS.SUNFLOWER * PLANT_MULTIPLIER);
          break;
        case 'smallfish':
          this.tickMoney(PLANT_COSTS.SMALLFISH);
          break;
        case 'mediumfish':
          this.tickMoney(PLANT_COSTS.MEDIUMFISH);
          break;
        case 'hugefish':
          this.tickMoney(PLANT_COSTS.HUGEFISH);
          break;
        case 'nugget':
          this.tickMoney(PLANT_COSTS.NUGGET);
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
      if (this.gameData.equippedTool === 'potato') {
        this.createPickupablePlantAtArea(
          carriedItem.plant,
          carriedItem.position,
          true
        );
        this.changeTool.emit('shovel');
      }
    }
  }
}
