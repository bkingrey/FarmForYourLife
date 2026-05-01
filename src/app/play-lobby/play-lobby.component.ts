import { intializeState } from './../_store/reducer';
import { GameState } from './../_store/models';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';

@Component({
  selector: 'app-play-lobby',
  templateUrl: './play-lobby.component.html',
  styleUrls: ['./play-lobby.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayLobbyComponent implements OnInit {
  @Output() changeScene = new EventEmitter();
  @Input() gameData: GameState = intializeState();

  constructor() {}

  ngOnInit(): void {}
}
