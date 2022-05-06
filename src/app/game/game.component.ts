import { GameState, SpriteMetrics, KeyWASD } from './../_store/models';
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
  spriteSheetIdleRight = new Image();
  spriteSheetIdleLeft = new Image();
  spriteSheetWalkRight = new Image();
  spriteSheetWalkLeft = new Image();
  spriteSheetDigRight = new Image();
  spriteSheetDigLeft = new Image();
  spriteSheetSoil = new Image();
  movables: Array<any> = [];
  animate: any;
  frameIndex = 0;
  actionFrameIndex = 0;
  framesDrawn = 0;
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
  };
  canClick = true;

  constructor() {
    this.animate = () => {
      if (this.ctx && this.canvas) {
        this.ctx.save();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
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
        // MOVEMENT
        if (this.queuedCultivate) {
          this.cultivate();
        } else {
          this.movement();
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

  ngAfterViewInit(): void {
    this.createCollisionsAndMovables();
    this.createFarmableArea();
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
    this.spriteSheetIdleRight.onload = () => {
      this.loadCrops();
    };
  }

  loadCrops() {
    this.spriteSheetSoil.src =
      this.gameData.spriteAnimations['spriteSheetSoil'].src;
    this.spriteSheetSoil.onload = () => {
      this.animate();
    };
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
      this.player.height = spriteSheet.height;
      this.player.position = {
        x: this.canvas.width / 2 - this.player.width,
        y: this.canvas.height / 2 - this.player.height,
      };
      this.player.center = {
        x: this.player.position.x + this.player.width * 2,
        y: this.player.position.y + this.player.height * 2,
      };
      this.ctx.drawImage(
        spriteSheet,
        this.player.width * this.frameIndex,
        0,
        this.player.width,
        spriteSheet.height,
        this.player.position.x,
        this.player.position.y,
        52,
        spriteSheet.height * 4
      );
      // ***** SHOWING HIT BOX *****
      // this.ctx.beginPath();
      // this.ctx.rect(this.player.center.x, this.player.center.y, 4, 4);
      // this.ctx.stroke();
      // ***** SHOWING HIT BOX *****
    }
  }

  drawCultivateAnimation(spriteSheet: HTMLImageElement, frames: number) {
    let width = 128;
    let height = 65;

    if (this.framesDrawn > 10) {
      if (this.actionFrameIndex < frames - 1) {
        if (this.actionFrameIndex === 5) {
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
    if (
      this.farmableArea.filter((area) => area === this.clickedFarmableArea)[0]
        .state === undefined
    ) {
      this.farmableArea.filter(
        (area) => area === this.clickedFarmableArea
      )[0].state = 'soil-0';
    } else if (
      this.farmableArea.filter((area) => area === this.clickedFarmableArea)[0]
        .state === 'soil-0'
    ) {
      this.farmableArea.filter(
        (area) => area === this.clickedFarmableArea
      )[0].state = 'soil-1';
    } else if (
      this.farmableArea.filter((area) => area === this.clickedFarmableArea)[0]
        .state === 'soil-1'
    ) {
      this.farmableArea.filter(
        (area) => area === this.clickedFarmableArea
      )[0].state = 'soil-2';
    } else if (
      this.farmableArea.filter((area) => area === this.clickedFarmableArea)[0]
        .state === 'soil-2'
    ) {
      this.farmableArea.filter(
        (area) => area === this.clickedFarmableArea
      )[0].state = 'soil-3';
    } else {
      this.farmableArea.filter(
        (area) => area === this.clickedFarmableArea
      )[0].state = 'soil-3';
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
      width: 64,
      height: 64,
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
          64,
          64
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
          64,
          64
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
          64,
          64
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
          64,
          64
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
          };
          this.boundaries.push(newBoundary);
        }
      });
    });
  }

  createFarmableArea() {
    this.gameData.farmableAreaMap.forEach((row, i) => {
      row.forEach((symbol, j) => {
        if (symbol !== 0 && this.mapImage) {
          const newFarmableArea = {
            position: {
              x: j * this.boundary.width + this.mapImage.position.x,
              y: i * this.boundary.height + this.mapImage.position.y,
            },
            width: this.boundary.width,
            height: this.boundary.height,
          };
          this.farmableArea.push(newFarmableArea);
        }
      });
    });
  }

  createMovables() {
    this.movables = [this.mapImage, ...this.boundaries, ...this.farmableArea];
  }

  keyDownEvent(e: KeyboardEvent) {
    switch (e.key.toLowerCase()) {
      case '1':
        this.changeTool.emit('shovel');
        break;
      case '2':
        this.changeTool.emit('water');
        break;
      case '3':
        this.changeTool.emit('hammer');
        break;
      case '4':
        this.changeTool.emit('pickaxe');
        break;
      case '5':
        this.changeTool.emit('rod');
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
      default:
        break;
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
          ((evt.clientX - rect.left) / (rect.right - rect.left)) *
          this.canvas.width,
        y:
          ((evt.clientY - rect.top) / (rect.bottom - rect.top)) *
          this.canvas.height,
      };
    }
    return;
  }

  cultivate() {
    let useRightAnims;
    if (this.mousePos.x > this.player.position.x) {
      useRightAnims = true;
    } else {
      useRightAnims = false;
    }
    this.drawCultivateAnimation(
      useRightAnims ? this.spriteSheetDigRight : this.spriteSheetDigLeft,
      useRightAnims
        ? this.gameData.spriteAnimations['spriteSheetDigRight'].frames
        : this.gameData.spriteAnimations['spriteSheetDigLeft'].frames
    );
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
      }
    }
    if (
      !this.gameData.keys.w.pressed &&
      !this.gameData.keys.a.pressed &&
      !this.gameData.keys.s.pressed &&
      !this.gameData.keys.d.pressed
    ) {
      this.drawSpriteAnimation(
        useRightAnims ? this.spriteSheetIdleRight : this.spriteSheetIdleLeft,
        useRightAnims
          ? this.gameData.spriteAnimations['playerIdleRight'].frames
          : this.gameData.spriteAnimations['playerIdleLeft'].frames
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
          this.ctx.rect(
            area.position.x,
            area.position.y,
            area.width,
            area.height
          );
        } else {
          this.mayFarm = false;
          this.hoveredFarmableArea = this.defaultFarmState;
          this.ctx.strokeStyle = 'red';
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
    if (this.player.center && this.mayFarm && this.ctx && this.canClick) {
      this.canClick = false;
      this.queuedCultivate = true;
      this.clickedFarmableArea = this.hoveredFarmableArea;
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
}
