import type * as PhaserType from 'phaser';
import { FarmActionType, RhythmJudgementLabel } from '../../_store/models';
import {
  RHYTHM_COLORS,
  buildJudgement,
  judgeAt,
  parseBpmFromTrack,
} from './beat.system';

export const RHYTHM_EVENT_KEY = 'rhythm-judgement';
export const BEAT_OVERLAY_SCENE_KEY = 'BeatOverlay';

/** Public shape we expose to callers without leaking the full Phaser type. */
export interface BeatOverlayScene extends PhaserType.Scene {
  configure(track: string, bpm: number, beatOffsetMs: number): void;
  judgeClick(action: FarmActionType, screenX?: number, screenY?: number): void;
}

/**
 * Builds the BeatOverlayScene class against a runtime-loaded Phaser module.
 *
 * Phaser is dynamically imported in `phaser-game.service.ts#mount()` so the
 * ~600 KB engine is split out of the initial bundle. Because the scene
 * `extends Phaser.Scene`, the class definition itself has to live behind the
 * dynamic boundary — hence this factory.
 */
export function createBeatOverlaySceneClass(
  Phaser: typeof PhaserType,
): new () => BeatOverlayScene {
  return class BeatOverlaySceneImpl extends Phaser.Scene {
    static readonly KEY = BEAT_OVERLAY_SCENE_KEY;

    private trackKey = 'gameplay-music';
    private trackSrc = 'assets/music/Quacks-120.ogg';
    private bpm = 120;
    private beatOffsetMs = 0;
    private music?: PhaserType.Sound.BaseSound;
    private musicStartedAt = 0;
    private pulse?: PhaserType.GameObjects.Arc;

    constructor() {
      super({ key: BEAT_OVERLAY_SCENE_KEY });
    }

    configure(track: string, bpm: number, beatOffsetMs: number) {
      this.trackSrc = track;
      this.bpm = bpm;
      this.beatOffsetMs = beatOffsetMs;
      const parsed = parseBpmFromTrack(track);
      if (parsed) this.bpm = parsed;
    }

    preload() {
      if (!this.cache.audio.exists(this.trackKey)) {
        this.load.audio(this.trackKey, this.trackSrc);
      }
    }

    create() {
      // Pulse indicator (top-left)
      this.pulse = this.add
        .circle(32, 32, 14, 0xffd34d, 0.85)
        .setStrokeStyle(2, 0xffffff, 0.9)
        .setScrollFactor(0)
        .setDepth(1000);

      this.startMusic();
      this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => this.stopMusic());
      this.events.on(Phaser.Scenes.Events.DESTROY, () => this.stopMusic());
    }

    private startMusic() {
      try {
        if (this.music) {
          this.music.stop();
        }
        this.music = this.sound.add(this.trackKey, {
          loop: true,
          volume: 0.6,
        });
        this.music.play();
        this.musicStartedAt = performance.now();
      } catch (err) {
        console.warn('[BeatOverlay] failed to start music', err);
      }
    }

    private stopMusic() {
      try {
        this.music?.stop();
        this.music = undefined;
      } catch {
        /* ignore */
      }
    }

    /** Music time in ms (since first play); falls back to wall clock. */
    musicTimeMs(): number {
      const m: any = this.music;
      if (m && typeof m.seek === 'number') return m.seek * 1000;
      return performance.now() - this.musicStartedAt;
    }

    /** BPM-derived ms per beat (configured value). */
    getBeatMs(): number {
      return 60000 / Math.max(1, this.bpm);
    }

    /** Player-configured beat offset (ms). */
    getBeatOffsetMs(): number {
      return this.beatOffsetMs;
    }

    override update() {
      if (this.pulse) {
        const beatMs = 60000 / Math.max(1, this.bpm);
        const t = this.musicTimeMs() - this.beatOffsetMs;
        const phase = ((t % beatMs) + beatMs) % beatMs;
        const k = 1 - phase / beatMs;
        const scale = 1 + k * 0.6;
        this.pulse.setScale(scale);
        this.pulse.setAlpha(0.4 + 0.5 * k);
      }
    }

    judgeClick(action: FarmActionType, screenX?: number, screenY?: number) {
      const now = this.musicTimeMs();
      const result = judgeAt(now, this.bpm, this.beatOffsetMs);
      const judgement = buildJudgement(action, result);
      this.spawnFloatingText(
        judgement.label,
        screenX ?? this.scale.width / 2,
        screenY ?? this.scale.height / 2,
      );
      this.game.events.emit(RHYTHM_EVENT_KEY, judgement);
    }

    private spawnFloatingText(
      label: RhythmJudgementLabel,
      x: number,
      y: number,
    ) {
      const color = RHYTHM_COLORS[label];
      const isStrong = label === 'Great' || label === 'Perfect';
      const text = this.add
        .text(x, y, label, {
          fontFamily: '"Press Start 2P", monospace, sans-serif',
          fontSize: isStrong ? '28px' : '20px',
          color,
          stroke: '#000',
          strokeThickness: 4,
        })
        .setOrigin(0.5, 1)
        .setDepth(1100)
        .setScrollFactor(0);

      this.tweens.add({
        targets: text,
        y: y - 60,
        alpha: 0,
        scale: isStrong ? 1.4 : 1.05,
        duration: isStrong ? 1000 : 750,
        ease: 'Cubic.easeOut',
        onComplete: () => text.destroy(),
      });
    }
  };
}
