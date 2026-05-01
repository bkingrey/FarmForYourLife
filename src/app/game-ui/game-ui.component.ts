import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { GameState, LobbyPlayer } from '../_store/models';
import { intializeState } from '../_store/reducer';

@Component({
  selector: 'app-game-ui',
  templateUrl: './game-ui.component.html',
  styleUrls: ['./game-ui.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameUiComponent implements AfterViewInit {
  @Input() gameData: GameState = intializeState();
  @Output() changeTool = new EventEmitter();
  @Output() openBasket = new EventEmitter();
  @ViewChild('gameUI') gameUI: ElementRef | null = null;
  showSeeds = false;
  constructor() {}

  trackByPlayerName(_index: number, player: LobbyPlayer): string {
    return player.name;
  }

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
  changeTools(tool) {
    this.changeTool.emit(tool);
    setTimeout(() => {
      document.getElementById('game-canvas')?.focus();
    });
  }
}
