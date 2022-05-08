import * as GameActions from './actions';
import { createReducer, on } from '@ngrx/store';
import { GameState, KeyWASD } from './models';

export const intializeState = (): GameState => {
  return {
    loaded: false,
    loading: false,
    resolution: {
      x: 1024,
      y: 576,
    },
    collisions: [],
    farmableAreas: [],
    collisionMap: [],
    farmableAreaMap: [],
    isCarrying: false,
    equippedTool: 'shovel',
    spriteAnimations: {
      playerIdleLeftSrc: {
        src: 'assets/characters/sprite-idle-left.png',
        frames: 5,
      },
    },
    mapImage: {
      position: {
        x: 237,
        y: -40,
      },
    },
    velocity: 0,
    keys: {
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
    },
    player: {
      width: 0,
      height: 0,
      position: {
        x: 0,
        y: 0,
      },
    },
  };
};
export const gameReducer = createReducer(
  intializeState(),
  on(GameActions.getGameData, (state) => {
    return { ...state, loading: true };
  }),
  on(GameActions.SuccessGetGameDataAction, (state: GameState, { payload }) => {
    const newCollisionMap: Array<any> = [];
    const newFarmableArea: Array<any> = [];
    for (let i = 0; i < payload.collisions.length; i += 36) {
      newCollisionMap.push(payload.collisions.slice(i, 36 + i));
    }

    for (let i = 0; i < payload.farmableAreas.length; i += 36) {
      newFarmableArea.push(payload.farmableAreas.slice(i, 36 + i));
    }
    return {
      ...state,
      loading: false,
      loaded: true,
      resolution: payload.resolution,
      collisions: payload.collisions,
      farmableAreas: payload.farmableAreas,
      keys: payload.keys,
      mapImage: payload.mapImage,
      spriteAnimations: payload.spriteAnimations,
      velocity: payload.velocity,
      collisionMap: newCollisionMap,
      farmableAreaMap: newFarmableArea,
      player: payload.player,
    };
  }),
  on(GameActions.ChangeKeyEvent, (state, { payload }) => {
    payload;
    return {
      ...state,
      keys: {
        ...state.keys,
        w: payload.w ? payload.w : state.keys.w,
        a: payload.a ? payload.a : state.keys.a,
        s: payload.s ? payload.s : state.keys.s,
        d: payload.d ? payload.d : state.keys.d,
      },
    };
  }),
  on(GameActions.ChangeTool, (state, { payload }) => {
    let carrying = false;
    if (
      payload === 'beets' ||
      payload === 'cabbage' ||
      payload === 'carrot' ||
      payload === 'cauliflower' ||
      payload === 'kale' ||
      payload === 'potato' ||
      payload === 'radish' ||
      payload === 'sunflower' ||
      payload === 'wheat'
    ) {
      carrying = true;
    }

    return {
      ...state,
      equippedTool: payload,
      isCarrying: carrying,
    };
  })
);
