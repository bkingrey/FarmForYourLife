import { ChangeKeyEvent, ChangeTool, getGameData } from './_store/actions';
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
    console.log('key change');
    this.facade.dispatch(ChangeKeyEvent({ payload: event }));
  }

  changeTool(event) {
    console.log('tool change');
    this.facade.dispatch(ChangeTool({ payload: event }));
  }
}
