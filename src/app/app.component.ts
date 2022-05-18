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
} from './_store/actions';
import { Component, OnInit } from '@angular/core';
import { AppFacade } from './app.facade';
import io, { Socket } from 'socket.io-client';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'FarmForYourLife';
  socket: Socket = io('http://localhost:3000');
  constructor(public facade: AppFacade) {}

  ngOnInit() {
    this.facade.dispatch(getGameData());
  }

  ngAfterViewInit(): void {
    this.socket.on('lobbyPlayers', (lobbyPlayers) => {
      console.log(lobbyPlayers);
      this.facade.dispatch(AddPlayerToLobby({ payload: lobbyPlayers }));
    });
  }

  keyChange(event) {
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
    this.facade.dispatch(ChangeScene({ payload: event }));
  }
  addPlayer(event) {
    this.facade.dispatch(Me({ payload: event }));
    this.socket.emit('AddPlayerToLobby', event);
  }
}
