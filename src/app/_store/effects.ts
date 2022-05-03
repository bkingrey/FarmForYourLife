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
  ErrorGameDataAction,
  getGameData,
  SuccessGetGameDataAction,
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
}
