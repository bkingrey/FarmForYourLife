import { intializeState } from './../_store/reducer';
import { GameState } from './../_store/models';
import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';

@Component({
  selector: 'app-play-lobby',
  templateUrl: './play-lobby.component.html',
  styleUrls: ['./play-lobby.component.scss'],
})
export class PlayLobbyComponent implements OnInit {
  @Output() changeScene = new EventEmitter();
  @Input() gameData: GameState = intializeState();

  constructor() {}

  ngOnInit(): void {}
}
