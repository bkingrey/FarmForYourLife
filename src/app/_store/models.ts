export interface GameState {
  loaded: boolean;
  loading: boolean;
  resolution: {
    x: number;
    y: number;
  };
  lobbyPlayers: Array<LobbyPlayer>;
  loadedPlayers: Array<LobbyPlayer>;
  me: string | null;
  scene: string;
  collisions: Array<number> | [];
  farmableAreas: Array<number> | [];
  fishableAreas: Array<number> | [];
  minableAreas: Array<number> | [];
  houseAreas: Array<number> | [];
  wellAreas: Array<number> | [];
  untargetableAreas: Array<number> | [];
  isSleeping: boolean;
  canEnterHouse: boolean;
  canOpenShop: boolean;
  openShop: boolean;
  canHarvest: boolean;
  canFillWater: boolean;
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
  money: number;
  buyableItems: Array<MerchantItems>;
}

export interface LobbyPlayer {
  loadedIn: boolean;
  name: string;
  id: string;
  state: string;
  width: number;
  height: number;
  roomId: number;
  moveup: boolean;
  movedown: boolean;
  moveleft: boolean;
  moveright: boolean;
  useRightAnims: boolean;
  canMoveHorizontal: boolean;
  canMoveVertical: boolean;
  moving: boolean;
  equippedTool: string;
  isCarrying: boolean;
  isCultivating: boolean;
  position: {
    x: number;
    y: number;
  };
}

export interface MerchantItems {
  name: string;
  cost: number;
  img: string;
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

export const PLANT_MULTIPLIER = 4;
export const PLANT_COSTS = {
  POTATO: 10,
  CARROT: 10,
  WHEAT: 10,
  CABBAGE: 10,
  CAULIFLOWER: 20,
  BEETS: 30,
  RADISH: 40,
  KALE: 50,
  SUNFLOWER: 60,
  SMALLFISH: 5,
  MEDIUMFISH: 10,
  HUGEFISH: 20,
  NUGGET: 100,
};
