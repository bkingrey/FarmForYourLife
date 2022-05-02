import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
})
export class GameComponent implements OnInit {
  canvasId: string = 'game-canvas';
  walkingSrc: string = '';
  mapSrc: string = 'assets/maps/SunnyMap.png';
  spriteSheetSrc: string = 'assets/characters/character-sheet1-export.png';
  playerIdleLeftSrc: string = 'assets/characters/sprite-idle-left.png';
  playerIdleRightSrc: string = 'assets/characters/sprite-idle-right.png';
  playerWalkLeftSrc: string = 'assets/characters/sprite-walk-left.png';
  playerWalkRightSrc: string = 'assets/characters/sprite-walk-right.png';

  canvas: HTMLCanvasElement | null = null;
  ctx: CanvasRenderingContext2D | null = null;
  map = new Image();
  mapImage = {
    position: {
      x: 237,
      y: -40,
    },
  };

  velocity = 3;
  player = {
    width: 0,
    height: 0,
    position: {
      x: 0,
      y: 0,
    },
  };
  spriteSheet = new Image();
  frames = 5;
  keys = {
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
  collisions: Array<number> = [
    4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097,
    4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097,
    4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097,
    4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097,
    4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097,
    4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097,
    4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097,
    4097, 4097, 4097, 4097, 4097, 0, 0, 4097, 4097, 4097, 4097, 4097, 4097,
    4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097,
    4097, 4097, 4097, 4097, 4097, 4097, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4097, 0, 0,
    4097, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4097, 4097, 4097, 4097, 4097, 4097, 4097,
    4097, 4097, 4097, 4097, 0, 4097, 4097, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4097, 0,
    0, 4097, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4097, 4097, 0, 4097, 4097, 4097, 4097,
    4097, 4097, 4097, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4097, 0, 0, 4097,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4097, 4097, 4097, 4097, 4097, 4097,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4097, 0, 0, 4097, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 4097, 4097, 4097, 4097, 4097, 4097, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 4097, 0, 0, 4097, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 4097, 4097, 4097, 4097, 4097, 4097, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 4097, 0, 0, 4097, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4097, 4097,
    4097, 4097, 4097, 4097, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4097, 0, 0,
    4097, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4097, 4097, 4097, 4097, 4097,
    4097, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4097, 0, 0, 4097, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 4097, 4097, 4097, 4097, 4097, 4097, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 4097, 0, 0, 4097, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 4097, 4097, 4097, 4097, 4097, 4097, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 4097, 0, 0, 4097, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4097,
    4097, 4097, 4097, 4097, 4097, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4097,
    0, 0, 4097, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4097, 4097, 4097, 4097,
    4097, 4097, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097,
    4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 0, 0, 0, 0, 0,
    0, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097,
    4097, 4097, 4097, 4097, 4097, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4097, 4097, 4097, 4097,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097,
    4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 0, 0, 0, 0, 0, 0, 4097,
    4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097,
    4097, 4097, 4097, 4097, 4097, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4097, 4097, 4097, 4097, 4097,
    4097, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4097, 0, 0, 4097, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 4097, 4097, 4097, 4097, 4097, 4097, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 4097, 0, 0, 4097, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 4097, 4097, 4097, 4097, 4097, 4097, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 4097, 0, 0, 4097, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4097,
    4097, 4097, 4097, 4097, 4097, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4097,
    0, 0, 4097, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4097, 4097, 4097, 4097,
    4097, 4097, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4097, 0, 0, 4097, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4097, 4097, 4097, 4097, 4097, 4097, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4097, 0, 0, 4097, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 4097, 4097, 4097, 4097, 4097, 4097, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 4097, 0, 0, 4097, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    4097, 4097, 4097, 4097, 4097, 4097, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    4097, 0, 0, 4097, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4097, 4097, 4097,
    4097, 4097, 4097, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4097, 0, 0, 4097,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4097, 4097, 4097, 4097, 4097, 4097,
    4097, 0, 4097, 4097, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4097, 0, 0, 4097, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097,
    4097, 4097, 4097, 4097, 4097, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4097, 0, 0, 4097,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097,
    4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097,
    4097, 4097, 4097, 4097, 0, 0, 4097, 4097, 4097, 4097, 4097, 4097, 4097,
    4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097,
    4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097,
    4097, 4097, 4097, 0, 0, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097,
    4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097,
    4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097,
    4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097,
    4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097,
    4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097,
    4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097,
    4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097, 4097,
  ];
  collisonMap: Array<Array<number>> = [];
  boundary = {
    position: { x: this.mapImage.position.x, y: this.mapImage.position.y },
    width: 64,
    height: 64,
  };
  movables: any = [];
  boundaries: any = [];
  animate: any;

  constructor() {
    for (let i = 0; i < this.collisions.length; i += 36) {
      this.collisonMap.push(this.collisions.slice(i, 36 + i));
    }
    this.collisonMap.forEach((row, i) => {
      row.forEach((symbol, j) => {
        if (symbol === 4097) {
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
        this.drawSpriteAnimation(this.spriteSheet, this.frames);
        // MOVEMENT
        let moving = true;
        if (this.keys.w.pressed) {
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
              console.log('is colliding');
              moving = false;
            }
          }
          if (moving) {
            this.movables.forEach((element) => {
              element.position.y += this.velocity;
            });
          }
        }
        if (this.keys.s.pressed) {
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
              console.log('is colliding');
              moving = false;
            }
          }
          if (moving) {
            this.movables.forEach((element) => {
              element.position.y -= this.velocity;
            });
          }
        }
        if (this.keys.d.pressed) {
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
              console.log('is colliding');
              moving = false;
            }
          }
          if (moving) {
            this.movables.forEach((element) => {
              element.position.x -= this.velocity;
            });
          }
        }
        if (this.keys.a.pressed) {
          for (let i = 0; i < this.boundaries.length; i++) {
            const boundary = this.boundaries[i];
            if (
              this.retangularCollision({
                rectangle1: this.player,
                rectangle2: {
                  ...boundary,
                  position: {
                    x: boundary.position.x + 3ds,
                    y: boundary.position.y,
                  },
                },
              })
            ) {
              console.log('is colliding');
              moving = false;
            }
          }
          if (moving) {
            this.movables.forEach((element) => {
              element.position.x += this.velocity;
            });
          }
        }
      }
    };
  }

  ngOnInit() {}
  ngOnChanges(): void {}
  ngAfterViewInit(): void {
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
    this.map.src = this.mapSrc;
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
    this.spriteSheet.src = this.playerIdleRightSrc;
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
    this.keys.w.pressed = bool;
  }
  moveLeft(bool: boolean) {
    this.keys.a.pressed = bool;
  }
  moveRight(bool: boolean) {
    this.keys.d.pressed = bool;
  }
  moveDown(bool: boolean) {
    this.keys.s.pressed = bool;
  }
}
