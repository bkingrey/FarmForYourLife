import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { GameState } from './_store/models';
import {
  selectGameData,
  selectItemCosts,
  selectRhythm,
  selectUpgradeChoices,
} from './_store/selectors';

@Injectable()
export class AppFacade {
  constructor(private store: Store<GameState>) {}

  gameData$ = this.store.select(selectGameData);
  upgradeChoices$ = this.store.select(selectUpgradeChoices);
  merchantItems$ = this.store.select(selectItemCosts);
  rhythm$ = this.store.select(selectRhythm);

  dispatch(action: any) {
    this.store.dispatch(action);
  }
}
