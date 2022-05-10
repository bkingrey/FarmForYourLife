import {
  GameState,
  SpriteMetrics,
  KeyWASD,
  Pickupable,
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
export class GameComponent implements AfterViewInit {
  @Input() gameData: GameState = intializeState();
  @Output() keyChange = new EventEmitter();
  @Output() changeTool = new EventEmitter();
  @Output() reduceSeedCount = new EventEmitter();
  @Output() changeEnergy = new EventEmitter();
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

  movables: Array<any> = [];
  animate: any;
  frameIndex = 0;
  actionFrameIndex = 0;
  pickupableFrameIndex: Array<number> = [];
  framesDrawn = 0;
  pickupableFramesDrawn: Array<number> = [];
  mousePos = {
    x: 0,
    y: 0,
  };
  queuedCultivate = false;
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
  droppables: Array<Pickupable> = [];
  droppableFramesDrawn: Array<number> = [];
  droppableFrameIndex: Array<number> = [];

  constructor() {
    this.animate = () => {
      if (this.ctx && this.canvas) {
        this.ctx.save();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.scale(this.scale, this.scale);
        requestAnimationFrame(this.animate);

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
        // MOVEMENT
        if (this.cultivatable()) {
          this.cultivate();
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
      }
    };
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
        (this.gameData.equippedTool === 'shovel' ||
          this.gameData.equippedTool === 'water' ||
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
      return false;
    }
    this.queuedCultivate = false;
    this.canClick = true;
    return false;
  }

  ngAfterViewInit(): void {
    this.createCollisionsAndMovables();
    this.createFarmableArea(this.gameData.farmableAreaMap);
    this.createFishableArea(this.gameData.fishableAreaMap);
    this.createMinableArea(this.gameData.minableAreaMap);
    this.createMovables();
    this.loadCanvas();
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
    this.spriteSheetFishRight.onload = () => {
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
      this.animate();
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

  drawSpriteAnimation(spriteSheet: HTMLImageElement, frames: number) {
    if (this.framesDrawn > 15) {
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
  }

  drawCultivateAnimation(spriteSheet: HTMLImageElement, frames: number) {
    let width = 128;
    let height = 65;

    if (this.framesDrawn > 10) {
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
    if (this.hoveredFarmableArea.state === 'fishable') {
      const getRandom = Math.random() * 100;
      if (getRandom < 75) {
        this.changeTool.emit('smallfish');
      } else if (getRandom < 95) {
        this.changeTool.emit('mediumfish');
      } else {
        this.changeTool.emit('hugefish');
      }
    } else if (this.hoveredFarmableArea.state === 'minable') {
      const getRandom = Math.random() * 100;
      if (getRandom > 99) this.changeTool.emit('nugget');
    }
    if (this.gameData.equippedTool === 'shovel') {
      this.farmAction('soil-0', 'soil-1', 'soil-2', 'soil-3');
    }
    if (this.gameData.equippedTool === 'water') {
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
    console.log('plantingSeed');
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

  // drawDroppable(item, index) {
  //   this.drawDroppableAnimation(item, 16, index);
  // }

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

  createMovables() {
    this.movables = [
      this.mapImage,
      ...this.boundaries,
      ...this.farmableArea,
      ...this.minableArea,
      ...this.fishableArea,
    ];
  }

  keyDownEvent(e: KeyboardEvent) {
    if (this.canClick) {
      switch (e.key.toLowerCase()) {
        case 'q':
          this.changeTool.emit('shovel');
          break;
        case 'e':
          this.changeTool.emit('water');
          break;
        case 'r':
          this.changeTool.emit('potato');
          break;
        case 't':
          this.changeTool.emit('pickaxe');
          break;
        case 'f':
          this.changeTool.emit('rod');
          break;
        case 'b':
          this.changeTool.emit('basket');
          break;
        case 'w':
          this.moveUp(true);
          break;
        case 'a':
          this.moveLeft(true);
          break;
        case 's':
          this.moveDown(true);
          break;
        case 'd':
          this.moveRight(true);
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
        this.moveUp(false);
        break;
      case 'a':
        this.moveLeft(false);
        break;
      case 's':
        this.moveDown(false);
        break;
      case 'd':
        this.moveRight(false);
        break;
      default:
        break;
    }
  }

  moveUp(bool: boolean) {
    this.keyChange.emit({
      w: {
        pressed: bool,
      },
    } as KeyWASD);
  }
  moveLeft(bool: boolean) {
    this.keyChange.emit({
      a: {
        pressed: bool,
      },
    } as KeyWASD);
  }
  moveRight(bool: boolean) {
    this.keyChange.emit({
      d: {
        pressed: bool,
      },
    } as KeyWASD);
  }
  moveDown(bool: boolean) {
    this.keyChange.emit({
      s: {
        pressed: bool,
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
      return true;
    } else {
      return false;
    }
  }

  cultivate() {
    const spriteSheet = this.getCultivateSpriteSheet();

    if (spriteSheet)
      this.drawCultivateAnimation(
        this.useRightAnims() ? spriteSheet.right : spriteSheet.left,
        this.useRightAnims()
          ? this.gameData.spriteAnimations[spriteSheet.rightKey].frames
          : this.gameData.spriteAnimations[spriteSheet.leftKey].frames
      );
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
      case 'water':
        return {
          right: this.spriteSheetWaterRight,
          left: this.spriteSheetWaterLeft,
          rightKey: 'spriteSheetWaterRight',
          leftKey: 'spriteSheetWaterLeft',
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
    let useRightAnims;
    if (this.mousePos.x > this.player.position.x) {
      useRightAnims = true;
    } else {
      useRightAnims = false;
    }
    let moving = true;
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
        }
      }
      if (moving) {
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
        }
      }
      if (moving) {
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
          moving = false;
        }
      }
      if (moving) {
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
          moving = false;
        }
      }
      if (moving) {
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

    if (
      !this.gameData.keys.w.pressed &&
      !this.gameData.keys.a.pressed &&
      !this.gameData.keys.s.pressed &&
      !this.gameData.keys.d.pressed
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
        if (this.isMouseCloseToPlayer()) {
          this.mayFarm = true;
          this.hoveredFarmableArea = area;
          this.hoveredFarmableArea.center = {
            x: area.position.x + 32,
            y: area.position.y + 32,
          };

          this.ctx.strokeStyle = 'blue';
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

  isMouseCloseToPlayer() {
    if (this.player.center) {
      return (
        ((this.mousePos.x >= this.player.center.x &&
          this.mousePos.x - this.player.center.x < 100) ||
          (this.player.center.x >= this.mousePos.x &&
            this.player.center.x - this.mousePos.x < 100)) &&
        ((this.mousePos.y >= this.player.center.y &&
          this.mousePos.y - this.player.center.y < 100) ||
          (this.player.center.y >= this.mousePos.y &&
            this.player.center.y - this.mousePos.y < 100))
      );
    }
    return false;
  }

  removeMouseProperties() {
    this.mayFarm = false;
    this.hoveredFarmableArea = this.defaultFarmState;
    this.clickedFarmableArea = this.defaultFarmState;
  }
  doActionOnMouse(evt) {
    if (this.gameData.isCarrying) {
      this.dropCarriedItem();
    } else if (
      this.player.center &&
      this.mayFarm &&
      this.ctx &&
      this.canClick &&
      this.gameData.energy.current >= 3
    ) {
      this.clickedFarmableArea = this.hoveredFarmableArea;
      this.canClick = false;
      this.queuedCultivate = true;
    }
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

  dropCarriedItem() {
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
