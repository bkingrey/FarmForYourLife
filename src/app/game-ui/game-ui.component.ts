import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { GameState } from '../_store/models';
import { intializeState } from '../_store/reducer';

@Component({
  selector: 'app-game-ui',
  templateUrl: './game-ui.component.html',
  styleUrls: ['./game-ui.component.scss'],
})
export class GameUiComponent implements AfterViewInit {
  @Input() gameData: GameState = intializeState();
  @ViewChild('gameUI') gameUI: ElementRef | null = null;
  constructor() {}

  ngAfterViewInit(): void {
    if (this.gameUI) {
      console.log(this.gameUI);
      this.gameUI.nativeElement.clientWidth = this.gameData.resolution.x;
      this.gameUI.nativeElement.clientHeight = this.gameData.resolution.y;
    }
  }
}
