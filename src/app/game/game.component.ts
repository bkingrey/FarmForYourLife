import { GameState, SpriteMetrics, KeyWASD } from './../_store/models';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { intializeState } from '../_store/reducer';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
})
export class GameComponent implements OnInit {
  @Input() gameData: GameState = intializeState();
  @Output() keyChange = new EventEmitter();
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
  spriteSheetIdleRight = new Image();
  spriteSheetIdleLeft = new Image();
  spriteSheetWalkRight = new Image();
  spriteSheetWalkLeft = new Image();
  movables: Array<any> = [];
  animate: any;
  frameIndex = 0;
  framesDrawn = 0;
  mousePos = {
    x: 0,
    y: 0,
  };

  constructor() {
    this.animate = () => {
      requestAnimationFrame(this.animate);
      if (this.ctx) {
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
        // MOVEMENT
        this.movement();
        this.ctx.drawImage(
          this.foregroundMap,
          this.mapImage.position.x,
          this.mapImage.position.y
        );
      }
    };
  }

  ngOnInit() {}
  ngOnChanges(): void {}
  ngAfterViewInit(): void {
    this.createCollisionsAndMovables();
    this.loadCanvas();
  }
  loadCanvas() {
    if (document.getElementById(this.canvasId)) {
      this.canvas = document.getElementById(this.canvasId) as HTMLCanvasElement;
      this.canvas.width = 1024;
      this.canvas.height = 576;
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
    this.gameData.spriteAnimations['playerIdleRight'].src;
    this.spriteSheetIdleRight.onload = () => {
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
    if (this.canvas) {
      this.player.width = 13;
      this.player.height = spriteSheet.height;
      this.player.position = {
        x: this.canvas.width / 2 - this.player.width,
        y: this.canvas.height / 2 - this.player.height,
      };
      this.ctx?.drawImage(
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

  retangularCollision({ rectangle1, rectangle2 }) {
    return (
      rectangle1.position.x + rectangle1.width >= rectangle2.position.x &&
      rectangle1.position.x <= rectangle2.position.x + rectangle2.width &&
      rectangle1.position.y <= rectangle2.position.y + rectangle2.height &&
      rectangle1.position.y + rectangle1.height >= rectangle2.position.y
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
    this.movables = [this.mapImage, ...this.boundaries];
  }

  keyDownEvent(e: KeyboardEvent) {
    switch (e.key.toLowerCase()) {
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
}
