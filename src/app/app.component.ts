import {
  ChangeCanEnterHouse,
  ChangeCanFillWater,
  ChangeCanHarvest,
  ChangeCanOpenShop,
  ChangeEnergy,
  ChangeIsSleeping,
  ChangeKeyEvent,
  ChangeMoney,
  ChangeTool,
  ChangeVelocity,
  ChangeWaterMeter,
  getGameData,
  ReduceSeedCount,
  RemoveKeyDown,
} from './_store/actions';
import { Component, OnInit } from '@angular/core';
import { AppFacade } from './app.facade';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'FarmForYourLife';
  constructor(public facade: AppFacade) {}

  ngOnInit() {
    this.facade.dispatch(getGameData());
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
}
