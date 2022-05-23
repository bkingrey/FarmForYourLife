import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { GameState, Upgrade } from '../_store/models';
import { intializeState } from '../_store/reducer';

@Component({
  selector: 'app-upgrade',
  templateUrl: './upgrade.component.html',
  styleUrls: ['./upgrade.component.scss']
})
export class UpgradeComponent implements OnInit {
  @Input() gameData: GameState = intializeState();
  @Input() upgrades: Array<Upgrade> | null = []
  @Output() openUpgrades = new EventEmitter();
  @Output() upgrade = new EventEmitter();
  showDescription = false;
  hoveredDescription = '';

  constructor() { }

  ngOnInit(): void {
  }
  doRightClickOnMouse(evt) {
    evt.preventDefault();
    this.openUpgrades.emit(false);
    setTimeout(() => {
      document.getElementById('game-canvas')?.focus();
    });
  }

  getUpgrade(name) {
    this.upgrade.emit(name);
  }

  showUpgradeDescription(description) {
    this.hoveredDescription = description
    this.showDescription = true;
  }
}
