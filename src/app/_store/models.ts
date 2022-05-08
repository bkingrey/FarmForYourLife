export interface GameState {
  loaded: boolean;
  loading: boolean;
  resolution: {
    x: number;
    y: number;
  };
  collisions: Array<number> | [];
  farmableAreas: Array<number> | [];
  collisionMap: any | [];
  farmableAreaMap: any | [];
  spriteAnimations: SpriteAnimation;
  mapImage: SpriteMetrics;
  player: SpriteMetrics;
  isCarrying: boolean;
  velocity: number;
  keys: KeyWASD;
  equippedTool: string;
}

export interface SpriteAnimation {
  [key: string]: SpriteDetails;
}

export interface SpriteDetails {
  src: string;
  frames: number;
}
export interface SpriteMetrics {
  position: {
    x: number;
    y: number;
  };
  width?: number;
  height?: number;
  center?: {
    x: number;
    y: number;
  };
  holding?: string;
}
export interface Pickupable {
  position: {
    x: number;
    y: number;
  };
  width?: number;
  height?: number;
  center?: number;
  plant: string;
}
export interface KeyWASD {
  w: {
    pressed: boolean;
  };
  a: {
    pressed: boolean;
  };
  s: {
    pressed: boolean;
  };
  d: {
    pressed: boolean;
  };
}
