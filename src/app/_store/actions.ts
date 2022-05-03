import { createAction, props } from '@ngrx/store';
import { GameState, KeyWASD, SpriteMetrics } from './models';

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
