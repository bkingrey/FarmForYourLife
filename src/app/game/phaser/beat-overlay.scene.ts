import Phaser from 'phaser';
import { FarmActionType, RhythmJudgementLabel } from '../../_store/models';
import {
  RHYTHM_COLORS,
  buildJudgement,
  judgeAt,
  parseBpmFromTrack,
} from './beat.system';

export const RHYTHM_EVENT_KEY = 'rhythm-judgement';

/**
 * Transparent Phaser scene that:
 *  - Plays the gameplay music track via Phaser sound.
 *  - Provides BPM/beat-time judgement of click actions.
 *  - Renders floating "Perfect/Great/Good/..." text feedback at click positions.
 *  - Draws a small beat pulse indicator in the corner.
 */
export class BeatOverlayScene extends Phaser.Scene {
  static readonly KEY = 'BeatOverlay';

  private trackKey = 'gameplay-music';
  private trackSrc = 'assets/music/Quacks-120.wav';
  private bpm = 120;
  private beatOffsetMs = 0;
  private music?: Phaser.Sound.BaseSound;
  private musicStartedAt = 0;
  private pulse?: Phaser.GameObjects.Arc;

  constructor() {
    super({ key: BeatOverlayScene.KEY });
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
      this.music = this.sound.add(this.trackKey, { loop: true, volume: 0.6 });
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
  private musicTimeMs(): number {
    const m: any = this.music;
    if (m && typeof m.seek === 'number') return m.seek * 1000;
    return performance.now() - this.musicStartedAt;
  }

  override update() {
    if (this.pulse) {
      const beatMs = 60000 / Math.max(1, this.bpm);
      const t = this.musicTimeMs() - this.beatOffsetMs;
      const phase = ((t % beatMs) + beatMs) % beatMs;
      const k = 1 - phase / beatMs; // 1 on beat, decays to 0
      const scale = 1 + k * 0.6;
      this.pulse.setScale(scale);
      this.pulse.setAlpha(0.4 + 0.5 * k);
    }
  }

  /** Judge a click and emit a typed event. Spawns floating text in scene. */
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

  private spawnFloatingText(label: RhythmJudgementLabel, x: number, y: number) {
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
}
