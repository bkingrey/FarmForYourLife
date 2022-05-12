export interface GameState {
  loaded: boolean;
  loading: boolean;
  resolution: {
    x: number;
    y: number;
  };
  collisions: Array<number> | [];
  farmableAreas: Array<number> | [];
  fishableAreas: Array<number> | [];
  minableAreas: Array<number> | [];
  houseAreas: Array<number> | [];
  wellAreas: Array<number> | [];
  untargetableAreas: Array<number> | [];
  canHarvest: boolean;
  collisionMap: any | [];
  farmableAreaMap: any | [];
  fishableAreaMap: any | [];
  minableAreaMap: any | [];
  houseAreaMap: any | [];
  wellAreaMap: any | [];
  untargetableAreaMap: any | [];
  spriteAnimations: SpriteAnimation;
  mapImage: SpriteMetrics;
  player: SpriteMetrics;
  energy: {
    current: number;
    max: number;
  };
  water: {
    current: number;
    max: number;
  };
  isCarrying: boolean;
  velocity: number;
  keys: KeyWASD;
  equippedTool: string;
  seedsOwned: SeedKey;
  isHoveringMerchant: boolean;
}
export interface SeedKey {
  [key: string]: SeedsOwned;
}

export interface SeedsOwned {
  name: string;
  count: number;
  keyname?: string;
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
  dropped?: boolean;
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
