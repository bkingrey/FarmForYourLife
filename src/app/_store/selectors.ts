import { createFeatureSelector, createSelector } from '@ngrx/store';
import { GameState } from './models';
import { intializeState } from './reducer';

// GAME STATES

export const getGameData = createFeatureSelector<any>('gameData');
export const selectGameData = createSelector(
  getGameData,
  (gameData: GameState): GameState => {
    return gameData ? gameData : intializeState();
  }
);
