export interface MultilingualName {
  [key: string]: string;
}

export interface MultilingualTextArray {
  [key: string]: string[];
}

export interface SolfeggioFrequency {
  freq: number;
  name: MultilingualName;
  short_benefit: MultilingualName;
  long_benefits: MultilingualTextArray;
  synth_hint: {
    envelope: { attack: number; decay: number; sustain: number; release: number };
    lowpass_hz?: number;
  };
}

export interface BinauralBeat {
  delta: number;
  baseFreq: number;
  name: MultilingualName;
  short_benefit: MultilingualName;
  long_benefits: MultilingualTextArray;
  synth_hint: {
    left_freq_hz: number;
    right_freq_hz: number;
    safe_lowpass_hz: number;
  };
}

export interface NaturalSound {
  id: string;
  type: string;
  noise_type?: string;
  filter_freq?: number;
  lfo_freq?: string;
  icon: string;
  name: MultilingualName;
}

export interface Language {
  code: string;
  name: string;
  flag: string;
}

export interface Goal {
  icon: string;
  recommendation: {
    type: 'solfeggio' | 'binaural' | 'mixer';
    index?: number;
    id?: string;
  };
}

// FIX: Removed 'translations' from GoalsData to resolve index signature conflict.
// Goal translations are now handled in a separate constant in constants.ts.
export interface GoalsData {
  [key: string]: Goal;
}

export type PlaybackMode = 'solfeggio' | 'binaural';

export interface ShareTemplate {
  title: string;
  text: string;
}

export interface ShareTemplates {
  [key: string]: { // goalKey or 'generic'
    [key: string]: ShareTemplate; // language code
  };
}