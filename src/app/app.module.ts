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
import { GameUiComponent } from './game-ui/game-ui.component';
import { MerchantComponent } from './merchant/merchant.component';
import { TitleScreenComponent } from './title-screen/title-screen.component';
import { GameSelectComponent } from './game-select/game-select.component';
import { PlayLobbyComponent } from './play-lobby/play-lobby.component';
import { FormsModule } from '@angular/forms';
import { UpgradeComponent } from './upgrade/upgrade.component';
import { ShadeComponent } from './shade/shade.component';

@NgModule({
  declarations: [
    AppComponent,
    GameComponent,
    GameUiComponent,
    MerchantComponent,
    TitleScreenComponent,
    GameSelectComponent,
    PlayLobbyComponent,
    UpgradeComponent,
    ShadeComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    StoreModule.forRoot({}),
    StoreModule.forFeature('gameData', gameReducer),
    StoreDevtoolsModule.instrument({ maxAge: 25 }),
    EffectsModule.forRoot([GameEffects]),
  ],
  providers: [AppFacade],
  bootstrap: [AppComponent],
})
export class AppModule {}
