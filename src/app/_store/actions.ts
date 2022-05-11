import { createAction, props } from '@ngrx/store';
import { GameState, KeyWASD, SpriteMetrics, SeedsOwned } from './models';

// CONFIG ACTIONS
export const getGameData = createAction('[GameData] Get Game Data');

export const SuccessGetGameDataAction = createAction(
  '[GameData] - Success Get Game Data',
  props<{ payload: GameState }>()
);
export const ErrorGameDataAction = createAction(
  '[GameData] - Error',
  props<Error>()
);
export const GameStart = createAction('[GameData] Start Game');

export const ChangeKeyEvent = createAction(
  '[GameData] Change Key Event',
  props<{ payload: KeyWASD }>()
);

export const RemoveKeyDown = createAction(
  '[GameData] Key Up Event',
  props<{ payload: string }>()
);

export const ChangeTool = createAction(
  '[GameData] Change Tool Event',
  props<{ payload: string }>()
);
export const ReduceSeedCount = createAction(
  '[GameData] Reduce Seed Count',
  props<{ payload: SeedsOwned }>()
);

export const ChangeEnergy = createAction(
  '[GameData] Change Energy',
  props<{ payload: number }>()
);

export const ChangeVelocity = createAction(
  '[GameData] Change Velocity',
  props<{ payload: number }>()
);

export const ChangeWaterMeter = createAction(
  '[GameData] Fill Water Meter',
  props<{ payload: number | string }>()
);

export const ChangeIsHoveringMerchant = createAction(
  '[GameData] Is Hovering Merchant',
  props<{ payload: boolean }>()
);
