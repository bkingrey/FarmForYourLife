import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-game-select',
  templateUrl: './game-select.component.html',
  styleUrls: ['./game-select.component.scss'],
})
export class GameSelectComponent implements OnInit {
  @Output() changeScene = new EventEmitter();
  @Output() setPlayerName = new EventEmitter();
  nameSet = false;
  playerName: string = '';

  constructor() {}

  ngOnInit(): void {}

  setPlayer(name) {
    this.nameSet = true;
    this.setPlayerName.emit(name);
    this.changeScene.emit('play-lobby');
  }
}
