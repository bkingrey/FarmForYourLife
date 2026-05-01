import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { GameState } from '../_store/models';
import { intializeState } from '../_store/reducer';

@Component({
  selector: 'app-shade',
  templateUrl: './shade.component.html',
  styleUrls: ['./shade.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShadeComponent implements OnInit {
  @Input() gameData: GameState = intializeState();

  constructor() {}

  ngOnInit(): void {}
}
