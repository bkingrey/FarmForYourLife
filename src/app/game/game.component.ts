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
  spriteSheet = new Image();
  movables: Array<any> = [];
  animate: any;

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
        this.drawSpriteAnimation(
          this.spriteSheet,
          this.gameData.spriteAnimations['playerIdleRight'].frames
        );
        this.ctx.drawImage(
          this.foregroundMap,
          this.mapImage.position.x,
          this.mapImage.position.y
        );
        // MOVEMENT
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
      }
    };
  }

  ngOnInit() {
    console.log(this.gameData);
  }
  ngOnChanges(): void {}
  ngAfterViewInit(): void {
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
    this.spriteSheet.src =
      this.gameData.spriteAnimations['playerIdleRight'].src;
    this.spriteSheet.onload = () => {
      this.animate();
    };
  }

  drawSpriteAnimation(spriteSheet: HTMLImageElement, columns: number) {
    if (this.canvas) {
      this.player.width = spriteSheet.width / columns;
      this.player.height = spriteSheet.height;
      this.player.position = {
        x: this.canvas.width / 2 - this.player.width,
        y: this.canvas.height / 2 - this.player.height,
      };
      this.ctx?.drawImage(
        spriteSheet,
        0,
        0,
        this.player.width,
        spriteSheet.height,
        this.player.position.x,
        this.player.position.y,
        (spriteSheet.width * 4) / columns,
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
}
