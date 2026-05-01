import {
  FarmActionType,
  RhythmJudgement,
  RhythmJudgementLabel,
} from '../../_store/models';

const RHYTHM_WINDOWS: Array<{
  label: RhythmJudgementLabel;
  maxErrorMs: number;
  score: number;
}> = [
  { label: 'Perfect', maxErrorMs: 45, score: 100 },
  { label: 'Great', maxErrorMs: 90, score: 50 },
  { label: 'Good', maxErrorMs: 140, score: 25 },
  { label: 'Okay', maxErrorMs: 200, score: 10 },
  { label: 'Poor', maxErrorMs: Number.POSITIVE_INFINITY, score: 0 },
];

export const RHYTHM_COLORS: Record<RhythmJudgementLabel, string> = {
  Poor: '#9aa3ad',
  Okay: '#ffffff',
  Good: '#5dd66a',
  Great: '#5dafff',
  Perfect: '#ffd34d',
};

/** Pure judgement helper used by both Phaser scene and unit tests. */
export function judgeAt(
  nowMs: number,
  bpm: number,
  beatOffsetMs: number,
): { label: RhythmJudgementLabel; score: number; timingErrorMs: number } {
  const beatMs = 60000 / Math.max(1, bpm);
  const adjustedMs = nowMs - beatOffsetMs;
  const nearestBeat = Math.round(adjustedMs / beatMs) * beatMs;
  const errorMs = Math.abs(adjustedMs - nearestBeat);
  const window =
    RHYTHM_WINDOWS.find((w) => errorMs <= w.maxErrorMs) ??
    RHYTHM_WINDOWS[RHYTHM_WINDOWS.length - 1];
  return { label: window.label, score: window.score, timingErrorMs: errorMs };
}

/** Parse "Quacks-120.wav" -> 120, "Track-130.mp3" -> 130, otherwise null. */
export function parseBpmFromTrack(filename: string): number | null {
  const match = filename.match(/-(\d{2,3})\.(wav|mp3|ogg|m4a)$/i);
  return match ? Number(match[1]) : null;
}

export function buildJudgement(
  action: FarmActionType,
  result: { label: RhythmJudgementLabel; score: number; timingErrorMs: number },
): RhythmJudgement {
  return {
    action,
    label: result.label,
    score: result.score,
    timingErrorMs: result.timingErrorMs,
    createdAt: Date.now(),
  };
}
