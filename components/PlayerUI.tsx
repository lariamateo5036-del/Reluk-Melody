// FIX: Replace styled HOC with a reference to nativewind types for NativeWind v4 compatibility.
/// <reference types="nativewind/types" />
import React from 'react';
import { View as RNView, Text as RNText, TouchableOpacity as RNTouchableOpacity } from 'react-native';
import { SvgXml } from 'react-native-svg';
import TypingBenefit from './TypingBenefit';

// FIX: Replace styled HOC with direct component reference for NativeWind v4 compatibility.
const View = RNView;
const Text = RNText;
const TouchableOpacity = RNTouchableOpacity;

interface PlayerUIProps {
  currentTrack: any;
  currentLanguage: string;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onReconfigure: () => void;
  sleepTimerRemaining: number | null;
}

const formatTime = (totalSeconds: number | null) => {
    if (totalSeconds === null) return '';
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const ICONS = {
    timer: `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>`,
    reconfigure: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>`,
    prev: `<svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M8.445 14.832A1 1 0 0010 14.006V5.994a1 1 0 00-1.555-.832L4.22 9.168a1 1 0 000 1.664l4.225 4.001zM10.89 15.34a1 1 0 001.555-.832V5.492a1 1 0 00-1.555-.832l-6.225 4.5a1 1 0 000 1.664l6.225 4.5z"></path></svg>`,
    play: `<svg class="w-12 h-12" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8.006v3.988a1 1 0 001.555.832l3.197-2.006a1 1 0 000-1.664L9.555 7.168z" clip-rule="evenodd"></path></svg>`,
    pause: `<svg class="w-12 h-12" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v4a1 1 0 11-2 0V8z" clip-rule="evenodd"></path></svg>`,
    next: `<svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M11.555 5.168A1 1 0 0010 5.994v8.012a1 1 0 001.555.832l4.225-4.006a1 1 0 000-1.664l-4.225-4.001zM9.11 4.66a1 1 0 00-1.555.832v8.012a1 1 0 001.555.832l6.225-4.5a1 1 0 000-1.664l-6.225-4.5z"></path></svg>`,
    fullscreen: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 8V4h4m12 4V4h-4M4 16v4h4m12-4v4h-4" /></svg>`
};

const PlayerUI: React.FC<PlayerUIProps> = ({ currentTrack, currentLanguage, isPlaying, onPlayPause, onNext, onPrev, onReconfigure, sleepTimerRemaining }) => {

  return (
    <View className="w-full max-w-sm bg-zinc-900/50 rounded-3xl p-4">
      <View className="mb-3 space-y-1">
        <View className="flex-row justify-between items-baseline">
          <Text className="text-lg font-bold text-white pr-4" numberOfLines={1}>{currentTrack?.name[currentLanguage] || currentTrack?.name.en}</Text>
          {sleepTimerRemaining !== null && sleepTimerRemaining > 0 && (
            <View className="flex-row items-center flex-shrink-0">
              <SvgXml xml={ICONS.timer} width="16" height="16" stroke="#d8b4fe" />
              <Text className="text-xs text-violet-300 font-mono ml-1.5">{formatTime(sleepTimerRemaining)}</Text>
            </View>
          )}
        </View>
        <TypingBenefit 
            texts={currentTrack?.long_benefits?.[currentLanguage] || currentTrack?.long_benefits?.en || []} 
        />
      </View>

      <View className="flex-row justify-between items-center">
        <TouchableOpacity onPress={onReconfigure} accessibilityLabel="Reconfigure session" className="w-10 h-10 items-center justify-center opacity-80">
          <SvgXml xml={ICONS.reconfigure} width="24" height="24" stroke="white" />
        </TouchableOpacity>
        
        <View className="flex-row items-center space-x-2">
          <TouchableOpacity onPress={onPrev} accessibilityLabel="Previous track" className="opacity-80">
            <SvgXml xml={ICONS.prev} width="32" height="32" fill="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onPlayPause} accessibilityLabel={isPlaying ? "Pause" : "Play"} className="opacity-80">
            <SvgXml xml={isPlaying ? ICONS.pause : ICONS.play} width="48" height="48" fill="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onNext} accessibilityLabel="Next track" className="opacity-80">
            <SvgXml xml={ICONS.next} width="32" height="32" fill="white" />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity accessibilityLabel="Toggle fullscreen" className="w-10 h-10 items-center justify-center opacity-80">
          <SvgXml xml={ICONS.fullscreen} width="20" height="20" stroke="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PlayerUI;