
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { PlaybackMode } from './types';
import { goals, solfeggioFrequencies, binauralBeats } from './constants';
import audioService from './services/audioService';

import Visualizer from './components/Visualizer';
import OnboardingScreen from './components/OnboardingScreen';
import LanguageModal from './components/LanguageModal';
import PlayerUI from './components/PlayerUI';
import MixerSheet from './components/MixerSheet';
import SleepTimerSheet from './components/SleepTimerSheet';
import FeedbackModal from './components/FeedbackModal';

import { useUITimer } from './hooks/useUITimer';
import { useMediaSession } from './hooks/useMediaSession';
import { useAudioPlayback } from './hooks/useAudioPlayback';

export default function App() {
  // FIX: Initialize state from localStorage to prevent UI flicker on load.
  // This ensures the correct screen (onboarding or player) is shown immediately.
  const [currentLanguage, setCurrentLanguage] = useState(() => localStorage.getItem('userLanguage') || 'en');
  const [isPlaying, setIsPlaying] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<'goal' | 'timer' | 'mixer' | 'player'>(() => {
    const onboarded = localStorage.getItem('isOnboarded') === 'true';
    return onboarded ? 'player' : 'goal';
  });

  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  
  const [activeMixers, setActiveMixers] = useState(new Set<string>());
  
  const [sleepTimerEndTime, setSleepTimerEndTime] = useState<number | null>(null);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const sleepTimerTimeoutRef = useRef<number | null>(null);
  
  const [unifiedIndex, setUnifiedIndex] = useState(() => {
    const lastTrackIndex = localStorage.getItem('lastTrackIndex');
    return lastTrackIndex ? parseInt(lastTrackIndex, 10) : 4; // Default to 432 Hz
  });

  const audioOutputRef = useRef<HTMLAudioElement>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  
  const unifiedTrackList = useMemo(() => {
    const solfeggioTracks = solfeggioFrequencies.map((track, index) => ({
        ...track,
        type: 'solfeggio' as PlaybackMode,
        originalIndex: index,
    }));
    const binauralTracks = binauralBeats.map((track, index) => ({
        ...track,
        type: 'binaural' as PlaybackMode,
        originalIndex: index,
    }));
    return [...solfeggioTracks, ...binauralTracks];
  }, []);
  
  const currentTrack = useMemo(() => unifiedTrackList[unifiedIndex], [unifiedTrackList, unifiedIndex]);
  const { showUI } = useUITimer(onboardingStep === 'player');
  
  // FIX: Refactored useEffect hooks to separate concerns.
  // This hook handles setting the document language attribute.
  useEffect(() => {
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  // This hook handles the PWA installation prompt.
  useEffect(() => {
    const handleInstallPrompt = (e: Event) => {
        e.preventDefault();
        setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
  }, []);

  const handleTogglePlay = useCallback(() => setIsPlaying(prev => !prev), []);
  
  const changeTrack = useCallback((direction: number) => {
    setUnifiedIndex(prev => {
        const newIndex = (prev + direction + unifiedTrackList.length) % unifiedTrackList.length;
        localStorage.setItem('lastTrackIndex', newIndex.toString());
        return newIndex;
    });
  }, [unifiedTrackList.length]);

  useAudioPlayback({ isPlaying, currentTrack, audioOutputRef });
  useMediaSession({ 
      currentTrack, 
      currentLanguage, 
      onPlayPause: handleTogglePlay, 
      onNext: () => changeTrack(1), 
      onPrev: () => changeTrack(-1) 
  });

  const handleStart = useCallback((goalId: string) => {
    const recommendation = goals[goalId].recommendation;
    if (recommendation.type === 'mixer' && recommendation.id) {
        const defaultIndex = 4; // 432hz
        setUnifiedIndex(defaultIndex);
        localStorage.setItem('lastTrackIndex', defaultIndex.toString());
        // Pre-activate the recommended mixer sound
        handleToggleMixer(recommendation.id!);
    } else {
        const { type, index } = recommendation;
        const foundIndex = unifiedTrackList.findIndex(
            track => track.type === type && track.originalIndex === index
        );
        if (foundIndex !== -1) {
            setUnifiedIndex(foundIndex);
            localStorage.setItem('lastTrackIndex', foundIndex.toString());
        }
    }
    setOnboardingStep('timer');
  }, [unifiedTrackList]);

  const handleReconfigure = useCallback(() => {
      if (isPlaying) setIsPlaying(false);
      audioService.stopPlayback(true);
      setActiveMixers(new Set());
      setSleepTimerEndTime(null);
      if (sleepTimerTimeoutRef.current) clearTimeout(sleepTimerTimeoutRef.current);
      setOnboardingStep('goal');
  }, [isPlaying]);
  
  const handleLanguageSelect = (langCode: string) => {
    setCurrentLanguage(langCode);
    setIsLanguageModalOpen(false);
    localStorage.setItem('userLanguage', langCode);
    document.documentElement.lang = langCode;
  };
  
  const handleToggleMixer = async (id: string) => {
    const isNowActive = await audioService.toggleMixer(id);
    setActiveMixers(prev => {
        const newSet = new Set(prev);
        isNowActive ? newSet.add(id) : newSet.delete(id);
        return newSet;
    });
  };
  
  const handleMainVolumeChange = (value: number) => {
    audioService.setMainVolume(value);
  };
  
  const handleSetSleepTimer = useCallback((minutes: number) => {
    if (sleepTimerTimeoutRef.current) {
        clearTimeout(sleepTimerTimeoutRef.current);
    }
    const endTime = Date.now() + minutes * 60 * 1000;
    setSleepTimerEndTime(endTime);

    const timeoutId = window.setTimeout(() => {
        setIsPlaying(false);
        setSleepTimerEndTime(null);
        setSleepTimerRemaining(null);
        setShowFeedbackModal(true);
    }, minutes * 60 * 1000);
    sleepTimerTimeoutRef.current = timeoutId;
  }, []);

  const handleTimerSelection = useCallback((minutes: number | null) => {
    if (minutes && minutes > 0) {
      handleSetSleepTimer(minutes);
    } else {
      setSleepTimerEndTime(null);
      if (sleepTimerTimeoutRef.current) clearTimeout(sleepTimerTimeoutRef.current);
    }
    setOnboardingStep('mixer');
  }, [handleSetSleepTimer]);

  const handleFinishOnboarding = useCallback(() => {
    localStorage.setItem('isOnboarded', 'true');
    localStorage.setItem('userLanguage', currentLanguage);
    setOnboardingStep('player');
    setIsPlaying(true);
  }, [currentLanguage]);

  useEffect(() => {
    if (sleepTimerEndTime === null) {
        setSleepTimerRemaining(null);
        return;
    }

    const updateRemaining = () => {
      const remaining = Math.round((sleepTimerEndTime - Date.now()) / 1000);
      if (remaining > 0) {
          setSleepTimerRemaining(remaining);
      } else {
          setSleepTimerRemaining(null);
          setSleepTimerEndTime(null);
      }
    };
    
    updateRemaining();
    const intervalId = setInterval(updateRemaining, 1000);
    return () => clearInterval(intervalId);
  }, [sleepTimerEndTime]);


  return (
    <>
      <Visualizer patternIndex={unifiedIndex} />
      
      {onboardingStep === 'goal' && (
        <OnboardingScreen
          currentLanguage={currentLanguage}
          onLanguageSelect={() => setIsLanguageModalOpen(true)}
          onStart={handleStart}
          installPrompt={installPrompt}
        />
      )}
      
      {onboardingStep === 'timer' && (
          <SleepTimerSheet
            currentLanguage={currentLanguage}
            onTimerSelected={handleTimerSelection}
          />
      )}

      {onboardingStep === 'mixer' && (
          <MixerSheet 
            currentLanguage={currentLanguage}
            activeMixers={activeMixers}
            onToggleMixer={handleToggleMixer}
            onContinue={handleFinishOnboarding}
            onMasterVolumeChange={val => audioService.setMixerMasterVolume(val)}
            onMainVolumeChange={handleMainVolumeChange}
          />
      )}

      <LanguageModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
        onSelectLanguage={handleLanguageSelect}
        currentLanguage={currentLanguage}
      />
      
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        currentLanguage={currentLanguage}
      />

      <div className={`fixed bottom-0 left-0 right-0 z-10 p-4 flex justify-center transition-all duration-500 ease-out ${showUI && onboardingStep === 'player' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'}`} style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        {currentTrack && onboardingStep === 'player' && <PlayerUI 
            currentTrack={currentTrack}
            currentLanguage={currentLanguage}
            isPlaying={isPlaying}
            onPlayPause={handleTogglePlay}
            onNext={() => changeTrack(1)}
            onPrev={() => changeTrack(-1)}
            onReconfigure={handleReconfigure}
            sleepTimerRemaining={sleepTimerRemaining}
        />}
      </div>

      {/* This audio element is now the main output for all Tone.js audio */}
      <audio ref={audioOutputRef} playsInline />
    </>
  );
}