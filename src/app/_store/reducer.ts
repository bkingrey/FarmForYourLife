import * as GameActions from './actions';
import { createReducer, on } from '@ngrx/store';
import { GameState, KeyWASD } from './models';

export const intializeState = (): GameState => {
  return {
    loaded: false,
    loading: false,
    collisions: [],
    collisionMap: [],
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
    for (let i = 0; i < payload.collisions.length; i += 36) {
      newCollisionMap.push(payload.collisions.slice(i, 36 + i));
    }

    return {
      ...state,
      loading: false,
      loaded: true,
      collisions: payload.collisions,
      keys: payload.keys,
      mapImage: payload.mapImage,
      spriteAnimations: payload.spriteAnimations,
      velocity: payload.velocity,
      collisionMap: newCollisionMap,
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
  })
);
