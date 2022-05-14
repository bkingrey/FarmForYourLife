import { GameState } from './../_store/models';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { intializeState } from '../_store/reducer';

@Component({
  selector: 'app-merchant',
  templateUrl: './merchant.component.html',
  styleUrls: ['./merchant.component.scss'],
})
export class MerchantComponent implements OnInit {
  @Input() gameData: GameState = intializeState();
  @Output() purchase = new EventEmitter();
  @Output() openShop = new EventEmitter();
  @Output() changeTool = new EventEmitter();
  showError = false;

  constructor() {}

  ngOnInit(): void {
    this.changeTool.emit('basket');
  }

  buyItem(name: string, cost: number) {
    const payload = {
      name,
      cost,
    };
    if (this.gameData.money >= cost) {
      this.purchase.emit(payload);
    } else {
      this.showNotEnoughCoinsError();
    }
  }

  showNotEnoughCoinsError() {
    this.showError = true;
    setTimeout(() => {
      this.showError = false;
    }, 3000);
  }

  doRightClickOnMouse(evt) {
    evt.preventDefault();
    this.openShop.emit(false);
    this.changeTool.emit('shovel');
    setTimeout(() => {
      document.getElementById('game-canvas')?.focus();
    });
  }
}
