import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { gameReducer } from './_store/reducer';
import { AppComponent } from './app.component';
import { GameComponent } from './game/game.component';
import { GameEffects } from './_store/effects';
import { AppFacade } from './app.facade';

@NgModule({
  declarations: [AppComponent, GameComponent],
  imports: [
    BrowserModule,
    StoreModule.forRoot({}),
    StoreModule.forFeature('gameData', gameReducer),
    StoreDevtoolsModule.instrument({ maxAge: 25 }),
    EffectsModule.forRoot([GameEffects]),
  ],
  providers: [AppFacade],
  bootstrap: [AppComponent],
})
export class AppModule {}
