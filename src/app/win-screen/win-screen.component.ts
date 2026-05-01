import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { GameState } from '../_store/models';
import { intializeState } from '../_store/reducer';

@Component({
  selector: 'app-win-screen',
  templateUrl: './win-screen.component.html',
  styleUrls: ['./win-screen.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WinScreenComponent implements OnInit {
  @Input() gameData: GameState = intializeState();
  constructor() {}

  ngOnInit(): void {}
}
