import {
  AddPlayerToLobby,
  ChangeCanEnterHouse,
  ChangeCanFillWater,
  ChangeCanHarvest,
  ChangeCanOpenShop,
  ChangeEnergy,
  ChangeIsSleeping,
  ChangeKeyEvent,
  ChangeMoney,
  ChangeScene,
  ChangeTool,
  ChangeVelocity,
  ChangeWaterMeter,
  getGameData,
  Me,
  OpenShop,
  PurchaseItem,
  ReduceSeedCount,
  UpdatePlayer,
} from './_store/actions';
import { Component, OnInit, ViewChild } from '@angular/core';
import { AppFacade } from './app.facade';
import io, { Socket } from 'socket.io-client';
import { KeyWASD } from './_store/models';
import { GameComponent } from './game/game.component';
import { take } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'FarmForYourLife';
  socket: Socket = io('http://localhost:3000');
  @ViewChild('gameComp') gameComponent: GameComponent | null = null;
  constructor(public facade: AppFacade) {}

  ngOnInit() {
    this.facade.dispatch(getGameData());
  }

  ngAfterViewInit(): void {
    this.socket.on('lobbyPlayers', (lobbyPlayers) => {
      this.facade.dispatch(AddPlayerToLobby({ payload: lobbyPlayers }));
    });
    this.socket.on('move', (moveObj) => {
      if (this.gameComponent) {
        this.gameComponent.moveOtherPlayer(moveObj);
      }
    });
    this.socket.on('updatePlayer', (updatedPlayer) => {
      this.facade.dispatch(UpdatePlayer({ payload: updatedPlayer }));
    });
  }

  keyChange(event: KeyWASD, me, lobbyPlayers) {
    const moveChangeObject = {
      player: lobbyPlayers.filter((player) => player.name === me)[0],
      moveup: event.w && event.w.pressed,
      movedown: event.s && event.s.pressed,
      moveleft: event.a && event.a.pressed,
      moveright: event.d && event.d.pressed,
    };
    this.socket.emit('keychange', moveChangeObject);
    this.facade.dispatch(ChangeKeyEvent({ payload: event }));
  }

  changeTool(event) {
    this.facade.dispatch(ChangeTool({ payload: event }));
  }

  reduceSeedCount(event) {
    this.facade.dispatch(ReduceSeedCount({ payload: event }));
  }

  changeEnergy(event) {
    this.facade.dispatch(ChangeEnergy({ payload: event }));
  }

  changeVelocity(event) {
    this.facade.dispatch(ChangeVelocity({ payload: event }));
  }

  changeWaterMeter(event) {
    this.facade.dispatch(ChangeWaterMeter({ payload: event }));
  }

  changeCanHarvest(event) {
    this.facade.dispatch(ChangeCanHarvest({ payload: event }));
  }
  changeCanFillWater(event) {
    this.facade.dispatch(ChangeCanFillWater({ payload: event }));
  }
  changeMoney(event) {
    this.facade.dispatch(ChangeMoney({ payload: event }));
  }
  changeCanOpenShop(event) {
    this.facade.dispatch(ChangeCanOpenShop({ payload: event }));
  }
  changeCanEnterHouse(event) {
    this.facade.dispatch(ChangeCanEnterHouse({ payload: event }));
  }
  changeIsSleeping(event) {
    this.facade.dispatch(ChangeIsSleeping({ payload: event }));
  }
  openShop(event) {
    this.facade.dispatch(OpenShop({ payload: event }));
  }
  purchaseItem(event) {
    this.facade.dispatch(PurchaseItem({ payload: event }));
  }
  changeScene(event) {
    if (event === 'game') {
      this.facade.gameData$.pipe(take(1)).subscribe((data) => {
        let player = data.lobbyPlayers.filter(
          (player) => player.name === data.me
        )[0];
        this.socket.emit('StartGame', player);
      });
    }
    this.facade.dispatch(ChangeScene({ payload: event }));
  }
  addPlayer(event) {
    this.facade.dispatch(Me({ payload: event }));
    this.socket.emit('AddPlayerToLobby', event);
  }
}
