import { state } from '@angular/animations';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { GameState, MerchantItems, RhythmState, Upgrade } from './models';
import { intializeState } from './reducer';

// GAME STATES

export const getGameData = createFeatureSelector<any>('gameData');

export const selectGameData = createSelector(
  getGameData,
  (gameData: GameState): GameState => {
    return gameData ? gameData : intializeState();
  },
);

// --- Atomic slice selectors. Each one only invalidates when its own slice
// changes, which keeps the composite selectors below from recomputing on
// every unrelated state change.
const selectLearnedUpgrades = createSelector(
  selectGameData,
  (g) => g.learnedUpgrades,
);
const selectUpgrades = createSelector(selectGameData, (g) => g.upgrades);
const selectBuyableItems = createSelector(
  selectGameData,
  (g) => g.buyableItems,
);
const selectLobbyPlayers = createSelector(
  selectGameData,
  (g) => g.lobbyPlayers,
);
const selectMe = createSelector(selectGameData, (g) => g.me);
const selectBargainValue = createSelector(
  selectGameData,
  (g) => g.bargainValue,
);

export const selectUpgradeChoices = createSelector(
  selectLearnedUpgrades,
  selectUpgrades,
  (learned: Array<Upgrade>, unlearned: Array<Upgrade>): Array<Upgrade> => {
    const upgradesToShow: Array<Upgrade> = [];
    learned.forEach((upgrade) => {
      unlearned.forEach((newUp) => {
        if (
          newUp.target === upgrade.target &&
          newUp.tier === upgrade.tier + 1
        ) {
          upgradesToShow.push(newUp);
        }
      });
    });
    const shuffledArray = shuffle(upgradesToShow);
    return [shuffledArray[0], shuffledArray[1], shuffledArray[2]];
  },
);

export const selectItemCosts = createSelector(
  selectBuyableItems,
  selectLobbyPlayers,
  selectMe,
  selectBargainValue,
  (buyableItems, lobbyPlayers, me, bargainValue): Array<MerchantItems> => {
    return buyableItems.map((item) => {
      let newCost = item.cost;
      if (item.name === 'Progress Badge') {
        newCost = 1000;
      }
      return {
        ...item,
        cost:
          item.name === 'Progress Badge'
            ? newCost
            : Math.round(newCost / bargainValue),
      };
    });
  },
);

export const selectRhythm = createSelector(
  selectGameData,
  (gameData: GameState): RhythmState => gameData.rhythm,
);

function shuffle(arr) {
  var j, x, index;
  for (index = arr.length - 1; index > 0; index--) {
    j = Math.floor(Math.random() * (index + 1));
    x = arr[index];
    arr[index] = arr[j];
    arr[j] = x;
  }
  return arr;
}
