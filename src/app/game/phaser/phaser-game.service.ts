import { Injectable, NgZone, OnDestroy } from '@angular/core';
import Phaser from 'phaser';
import { FarmActionType, RhythmJudgement } from '../../_store/models';
import { BeatOverlayScene, RHYTHM_EVENT_KEY } from './beat-overlay.scene';
import { Observable, Subject } from 'rxjs';
import { buildJudgement } from './beat.system';

export interface PhaserMountOptions {
  parent: HTMLElement;
  width: number;
  height: number;
  track: string;
  bpm: number;
  beatOffsetMs: number;
}

/**
 * Manages a single transparent Phaser game instance that hosts the
 * BeatOverlayScene used for music, beat clock, and floating feedback text.
 */
@Injectable({ providedIn: 'root' })
export class PhaserGameService implements OnDestroy {
  private game: Phaser.Game | null = null;
  private scene: BeatOverlayScene | null = null;
  private judgement$ = new Subject<RhythmJudgement>();

  constructor(private zone: NgZone) {}

  get judgements(): Observable<RhythmJudgement> {
    return this.judgement$.asObservable();
  }

  mount(options: PhaserMountOptions) {
    if (this.game) {
      this.destroy();
    }
    const scene = new BeatOverlayScene();
    scene.configure(options.track, options.bpm, options.beatOffsetMs);
    this.scene = scene;

    // Run Phaser outside Angular zone for performance.
    this.zone.runOutsideAngular(() => {
      this.game = new Phaser.Game({
        type: Phaser.CANVAS,
        parent: options.parent,
        width: options.width,
        height: options.height,
        transparent: true,
        backgroundColor: 'rgba(0,0,0,0)',
        scale: {
          mode: Phaser.Scale.NONE,
          autoCenter: Phaser.Scale.NO_CENTER,
        },
        audio: { disableWebAudio: false },
        scene,
        input: {
          // Phaser overlay must not steal mouse from the Angular game canvas
          // underneath. We forward clicks via judge() from the host component.
          mouse: { preventDefaultWheel: false, target: null as any },
          touch: { capture: false },
        },
        dom: { createContainer: false },
        banner: false,
      });

      this.game.events.on(RHYTHM_EVENT_KEY, (judgement: RhythmJudgement) => {
        this.zone.run(() => this.judgement$.next(judgement));
      });
    });
  }

  /** Judge a player action against current beat. */
  judge(action: FarmActionType, screenX?: number, screenY?: number) {
    if (this.scene) {
      this.scene.judgeClick(action, screenX, screenY);
    } else {
      // Fallback: emit a "Poor" judgement so UI stays consistent.
      this.judgement$.next(
        buildJudgement(action, { label: 'Poor', score: 0, timingErrorMs: 0 }),
      );
    }
  }

  destroy() {
    if (this.game) {
      try {
        this.game.destroy(true);
      } catch {
        /* ignore */
      }
      this.game = null;
    }
    this.scene = null;
  }

  ngOnDestroy() {
    this.destroy();
    this.judgement$.complete();
  }
}
