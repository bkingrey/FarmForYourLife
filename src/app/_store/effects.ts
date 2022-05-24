import { selectGameData } from './selectors';
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';

import { Store, Action, select } from '@ngrx/store';
import {
  of,
  Observable,
  withLatestFrom,
  mergeMap,
  map,
  catchError,
} from 'rxjs';
import {
  AddPlayerToLobby,
  ChangeBargainValue,
  ChangeEnergyMax,
  ChangeFisherValue,
  ChangeMinerValue,
  ChangePlayerState,
  ChangeVelocity,
  ChangeWaterMax,
  ErrorGameDataAction,
  getGameData,
  GetUpgrade,
  SuccessGetGameDataAction,
  UpdatePlayer,
} from './actions';
import { jsonData } from 'src/assets/json/jsonData';
import { GameState } from './models';

@Injectable()
export class GameEffects {
  constructor(private action$: Actions, public store: Store<GameState>) {}

  private jsonData = of(jsonData);

  GetGameData$: Observable<Action> = createEffect(() =>
    this.action$.pipe(
      ofType(getGameData),
      mergeMap((action) =>
        this.jsonData.pipe(
          map((data: GameState) => {
            return SuccessGetGameDataAction({ payload: data });
          }),
          catchError((error: Error) => {
            return of(ErrorGameDataAction(error));
          })
        )
      )
    )
  );

  UpdateLobbyPlayers$: Observable<Action> = createEffect(() =>
    this.action$.pipe(
      ofType(UpdatePlayer),
      withLatestFrom(this.store.pipe(select(selectGameData))),
      map(([action, gameData]) => {
        let newLobby;
        if (gameData.loadedPlayers.length && gameData.lobbyPlayers.length) {
          newLobby = gameData.lobbyPlayers.map((lobbyPlayer) => {
            const loadedPlayers = gameData.loadedPlayers.find(
              (loadedPlayer) => loadedPlayer.name === lobbyPlayer.name
            );
            return loadedPlayers
              ? { ...lobbyPlayer, loadedIn: true }
              : lobbyPlayer;
          });
        }
        return AddPlayerToLobby({ payload: newLobby });
      })
    )
  );

  UpgradeChanges$: Observable<Action> = createEffect(() =>
    this.action$.pipe(
      ofType(GetUpgrade),
      withLatestFrom(this.store.pipe(select(selectGameData))),
      map(([action, gameData]) => {
        const newEnergyMaxValue = Number(gameData.learnedUpgrades.filter(upg => upg.target === 'energy')[0].value)
        const newMoveValue = Number(gameData.learnedUpgrades.filter(upg => upg.target === 'move')[0].value)
        const newWaterMaxValue = Number(gameData.learnedUpgrades.filter(upg => upg.target === 'water')[0].value)
        const newBargainValue = Number(gameData.learnedUpgrades.filter(upg => upg.target === 'bargain')[0].value)
        const newMinerValue = Number(gameData.learnedUpgrades.filter(upg => upg.target === 'miner')[0].value)
        const newFisherValue = Number(gameData.learnedUpgrades.filter(upg => upg.target === 'fisher')[0].value)
        this.store.dispatch(ChangeBargainValue({payload: 1*newBargainValue}))
        this.store.dispatch(ChangeMinerValue({payload: 0.01*newMinerValue}))
        this.store.dispatch(ChangeFisherValue({payload: 5*newFisherValue}))
        this.store.dispatch(ChangeEnergyMax({payload: 1*newEnergyMaxValue}))
        setTimeout(() => {
          document.getElementById('game-canvas')?.focus();
        });
        return ChangeWaterMax({ payload: newWaterMaxValue });
      })
    )
  );
}
