import { createFeatureSelector, createSelector } from '@ngrx/store';
import { GameState, Upgrade } from './models';
import { intializeState } from './reducer';

// GAME STATES

export const getGameData = createFeatureSelector<any>('gameData');

export const selectGameData = createSelector(
  getGameData,
  (gameData: GameState): GameState => {
    return gameData ? gameData : intializeState();
  }
);
export const selectUpgradeChoices = createSelector(
  getGameData,
  (gameData: GameState): Array<Upgrade> => {
    const learned = gameData.learnedUpgrades
    const unlearned = gameData.upgrades
    const upgradesToShow: Array<Upgrade> = [];
    learned.forEach(upgrade => {
      unlearned.forEach(newUp => {
        if (newUp.target === upgrade.target && newUp.tier === upgrade.tier + 1) {
          upgradesToShow.push(newUp)
        }
      })
    });
    const shuffledArray = shuffle(upgradesToShow)
    const threeUpgrades = [shuffledArray[0], shuffledArray[1], shuffledArray[2]]
    return threeUpgrades
  }
);

function shuffle(arr) {
  var j, x, index;
  for (index = arr.length -1; index > 0; index--) {
    j= Math.floor(Math.random()*(index+1));
    x= arr[index];
    arr[index] = arr[j];
    arr[j] = x;
  }
  return arr;
}
