import type { GoalsData } from './types';

export const goals: GoalsData = {
  healing_pain: { icon: '❤️‍🩹', recommendation: { type: 'solfeggio', index: 0 } }, // 174 Hz
  focus: { icon: '🎯', recommendation: { type: 'binaural', index: 3 } }, // Beta
  relax: { icon: '🧘', recommendation: { type: 'solfeggio', index: 4 } }, // 432Hz
  sleep: { icon: '😴', recommendation: { type: 'binaural', index: 0 } }, // Delta
  meditate: { icon: '🕉️', recommendation: { type: 'binaural', index: 1 } }, // Theta
  tinnitus: { icon: '👂', recommendation: { type: 'mixer', id: 'white_noise' } }, // White Noise
};
