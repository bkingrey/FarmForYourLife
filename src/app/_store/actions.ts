import { createAction, props } from '@ngrx/store';
import {
  GameState,
  KeyWASD,
  SpriteMetrics,
  SeedsOwned,
  LobbyPlayer,
} from './models';

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

export const ChangeCanHarvest = createAction(
  '[GameData] Change Can Harvest',
  props<{ payload: boolean }>()
);

export const ChangeCanFillWater = createAction(
  '[GameData] Change Can Fill Water',
  props<{ payload: boolean }>()
);

export const ChangeMoney = createAction(
  '[GameData] Change Money',
  props<{ payload: number }>()
);
export const ChangeCanOpenShop = createAction(
  '[GameData] Change Can Open Shop',
  props<{ payload: boolean }>()
);
export const ChangeCanEnterHouse = createAction(
  '[GameData] Change Can Enter House',
  props<{ payload: boolean }>()
);
export const ChangeIsSleeping = createAction(
  '[GameData] Change Is Sleeping',
  props<{ payload: boolean }>()
);
export const OpenShop = createAction(
  '[GameData] Open/Close Shop',
  props<{ payload: boolean }>()
);
export const PurchaseItem = createAction(
  '[GameData] Purchase Item',
  props<{ payload: { name; cost } }>()
);
export const ChangeScene = createAction(
  '[GameData] Change Scene',
  props<{ payload: string }>()
);
export const AddPlayerToLobby = createAction(
  '[GameData] Add Player to Lobby',
  props<{ payload: Array<LobbyPlayer> }>()
);

export const Me = createAction('[GameData] Me', props<{ payload: string }>());
