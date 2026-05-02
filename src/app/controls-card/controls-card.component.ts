import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
} from '@angular/core';

const STORAGE_KEY = 'ffyl_controls_seen';

@Component({
  selector: 'app-controls-card',
  templateUrl: './controls-card.component.html',
  styleUrls: ['./controls-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlsCardComponent {
  @Output() dismissed = new EventEmitter<void>();

  dismiss() {
    localStorage.setItem(STORAGE_KEY, '1');
    this.dismissed.emit();
  }

  static shouldShow(): boolean {
    return !localStorage.getItem(STORAGE_KEY);
  }
}
