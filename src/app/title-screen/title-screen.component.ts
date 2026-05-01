import { Component, EventEmitter, Output } from '@angular/core';
import { AppFacade } from '../app.facade';
import { ChangeDisplayScale } from '../_store/actions';

interface ScaleOption {
  label: string;
  value: number;
}

@Component({
  selector: 'app-title-screen',
  templateUrl: './title-screen.component.html',
  styleUrls: ['./title-screen.component.scss'],
})
export class TitleScreenComponent {
  @Output() changeScene = new EventEmitter();

  readonly options: ScaleOption[] = [
    { label: '1024 × 576', value: 1 },
    { label: '1280 × 720', value: 1.25 },
    { label: '1536 × 864', value: 1.5 },
    { label: '1920 × 1080', value: 1.875 },
  ];
  selected = 1;

  constructor(private facade: AppFacade) {}

  pick(value: number) {
    this.selected = value;
    this.facade.dispatch(ChangeDisplayScale({ payload: value }));
  }
}
