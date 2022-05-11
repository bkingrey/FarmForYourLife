import * as GameActions from './actions';
import { createReducer, on } from '@ngrx/store';
import { GameState, KeyWASD, SeedKey } from './models';
import { state } from '@angular/animations';

export const intializeState = (): GameState => {
  return {
    loaded: false,
    loading: false,
    resolution: {
      x: 1024,
      y: 576,
    },
    seedsOwned: {
      beets: {
        name: 'beets-seeds',
        count: 0,
      },
      cabbage: {
        name: 'cabbage-seeds',
        count: 0,
      },
      carrot: {
        name: 'carrot-seeds',
        count: 0,
      },
      cauliflower: {
        name: 'cauliflower-seeds',
        count: 0,
      },
      kale: {
        name: 'kale-seeds',
        count: 0,
      },
      potato: {
        name: 'potato-seeds',
        count: 4,
      },
      radish: {
        name: 'radish-seeds',
        count: 0,
      },
      sunflower: {
        name: 'sunflower-seeds',
        count: 0,
      },
      wheat: {
        name: 'wheat-seeds',
        count: 0,
      },
    },
    collisions: [],
    farmableAreas: [],
    fishableAreas: [],
    minableAreas: [],
    houseAreas: [],
    wellAreas: [],
    untargetableAreas: [],
    collisionMap: [],
    farmableAreaMap: [],
    fishableAreaMap: [],
    minableAreaMap: [],
    houseAreaMap: [],
    wellAreaMap: [],
    untargetableAreaMap: [],
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
    energy: {
      current: 100,
      max: 100,
    },
    water: {
      current: 100,
      max: 100,
    },
    player: {
      width: 0,
      height: 0,
      position: {
        x: 0,
        y: 0,
      },
    },
    isHoveringMerchant: false,
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
    const newFishableArea: Array<any> = [];
    const newMinableArea: Array<any> = [];
    const newHouseArea: Array<any> = [];
    const newWellArea: Array<any> = [];
    const newUntargetableArea: Array<any> = [];

    for (let i = 0; i < payload.collisions.length; i += 36) {
      newCollisionMap.push(payload.collisions.slice(i, 36 + i));
    }
    for (let i = 0; i < payload.farmableAreas.length; i += 36) {
      newFarmableArea.push(payload.farmableAreas.slice(i, 36 + i));
    }
    for (let i = 0; i < payload.fishableAreas.length; i += 36) {
      newFishableArea.push(payload.fishableAreas.slice(i, 36 + i));
    }
    for (let i = 0; i < payload.minableAreas.length; i += 36) {
      newMinableArea.push(payload.minableAreas.slice(i, 36 + i));
    }
    for (let i = 0; i < payload.houseAreas.length; i += 36) {
      newHouseArea.push(payload.houseAreas.slice(i, 36 + i));
    }
    for (let i = 0; i < payload.wellAreas.length; i += 36) {
      newWellArea.push(payload.wellAreas.slice(i, 36 + i));
    }
    for (let i = 0; i < payload.untargetableAreas.length; i += 36) {
      newUntargetableArea.push(payload.untargetableAreas.slice(i, 36 + i));
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
      fishableAreaMap: newFishableArea,
      minableAreaMap: newMinableArea,
      houseAreaMap: newHouseArea,
      wellAreaMap: newWellArea,
      untargetableAreaMap: newUntargetableArea,
      player: payload.player,
    };
  }),
  on(GameActions.ChangeKeyEvent, (state, { payload }) => {
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
      payload === 'wheat' ||
      payload === 'nugget' ||
      payload === 'smallfish' ||
      payload === 'mediumfish' ||
      payload === 'hugefish'
    ) {
      carrying = true;
    }
    return {
      ...state,
      equippedTool: payload,
      isCarrying: carrying,
    };
  }),
  on(GameActions.ReduceSeedCount, (state, { payload }) => {
    if (payload.keyname) {
      return {
        ...state,
        seedsOwned: {
          ...state.seedsOwned,
          potato: {
            ...state.seedsOwned[payload.keyname],
            count: state.seedsOwned[payload.keyname].count - 1,
          },
        },
      };
    } else {
      return {
        ...state,
      };
    }
  }),
  on(GameActions.ChangeEnergy, (state, { payload }) => {
    let total = state.energy.current + payload;
    if (state.energy.current > state.energy.max) {
      total = state.energy.max;
    } else if (state.energy.current < 0) {
      total = 0;
    }
    return {
      ...state,
      energy: {
        ...state.energy,
        current: total,
      },
    };
  }),
  on(GameActions.ChangeVelocity, (state, { payload }) => {
    return {
      ...state,
      velocity: payload,
    };
  }),
  on(GameActions.ChangeIsHoveringMerchant, (state, { payload }) => {
    return {
      ...state,
      isHoveringMerchant: payload,
    };
  }),
  on(GameActions.ChangeWaterMeter, (state, { payload }) => {
    return {
      ...state,
      water: {
        ...state.water,
        current:
          payload === 'max'
            ? state.water.max
            : state.water.current + Number(payload),
      },
    };
  })
);
