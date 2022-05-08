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
  showSeeds = false;
  constructor() {}

  ngAfterViewInit(): void {
    if (this.gameUI) {
      this.gameUI.nativeElement.clientWidth = this.gameData.resolution.x;
      this.gameUI.nativeElement.clientHeight = this.gameData.resolution.y;
    }
  }

  allSeeds() {
    return (
      this.gameData.equippedTool === 'potato-seeds' ||
      this.gameData.equippedTool === 'carrot-seeds' ||
      this.gameData.equippedTool === 'wheat-seeds' ||
      this.gameData.equippedTool === 'cabbage-seeds' ||
      this.gameData.equippedTool === 'cauliflower-seeds' ||
      this.gameData.equippedTool === 'beet-seeds' ||
      this.gameData.equippedTool === 'radish-seeds' ||
      this.gameData.equippedTool === 'kale-seeds' ||
      this.gameData.equippedTool === 'sunflower-seeds' ||
      this.gameData.equippedTool === 'basket'
    );
  }
}
