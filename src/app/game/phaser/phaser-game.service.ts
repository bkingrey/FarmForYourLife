import { Injectable, NgZone, OnDestroy } from '@angular/core';
import type * as PhaserType from 'phaser';
import { FarmActionType, RhythmJudgement } from '../../_store/models';
import {
  BeatOverlayScene,
  RHYTHM_EVENT_KEY,
  createBeatOverlaySceneClass,
} from './beat-overlay.scene';
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
 *
 * Phaser is dynamically imported on first `mount()` so the engine bytes are
 * code-split out of the initial bundle.
 */
@Injectable({ providedIn: 'root' })
export class PhaserGameService implements OnDestroy {
  private game: PhaserType.Game | null = null;
  private scene: BeatOverlayScene | null = null;
  private judgement$ = new Subject<RhythmJudgement>();
  /** Cache the dynamic phaser import so we don't pay the network cost twice. */
  private phaserModule: Promise<typeof PhaserType> | null = null;
  /** Resolves once `mount()` finishes building the scene. */
  private mounting: Promise<void> | null = null;

  constructor(private zone: NgZone) {}

  get judgements(): Observable<RhythmJudgement> {
    return this.judgement$.asObservable();
  }

  /** Resolves to the Phaser namespace; cached after first call. */
  private loadPhaser(): Promise<typeof PhaserType> {
    if (!this.phaserModule) {
      // Webpack/esbuild splits this into its own chunk.
      this.phaserModule = import('phaser').then(
        (m) => (m as any).default ?? (m as unknown as typeof PhaserType),
      );
    }
    return this.phaserModule;
  }

  /**
   * Async because Phaser is loaded on demand. Subsequent mount() calls
   * destroy the previous instance, then build a fresh one.
   */
  async mount(options: PhaserMountOptions): Promise<void> {
    if (this.game) {
      this.destroy();
    }
    this.mounting = (async () => {
      const Phaser = await this.loadPhaser();
      const SceneCtor = createBeatOverlaySceneClass(Phaser);
      const scene = new SceneCtor();
      scene.configure(options.track, options.bpm, options.beatOffsetMs);
      this.scene = scene;

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
            // underneath. We forward clicks via judge() from the host.
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
    })();
    return this.mounting;
  }

  /** Judge a player action against current beat. */
  judge(action: FarmActionType, screenX?: number, screenY?: number) {
    if (this.scene) {
      this.scene.judgeClick(action, screenX, screenY);
    } else {
      // Phaser may still be loading; emit a "Poor" so UI stays consistent.
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
    this.mounting = null;
  }

  ngOnDestroy() {
    this.destroy();
    this.judgement$.complete();
  }
}
