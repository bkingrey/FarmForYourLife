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
  ChangePlayerState,
  ErrorGameDataAction,
  getGameData,
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
          console.log(newLobby);
        }
        return AddPlayerToLobby({ payload: newLobby });
      })
    )
  );
}
