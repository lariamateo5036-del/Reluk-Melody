
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { PlaybackMode } from './types';
import { translations, goals, solfeggioFrequencies, binauralBeats, coachingScripts, naturalSounds } from './constants';
import audioService from './services/audioService';

import Visualizer from './components/Visualizer';
import OnboardingScreen from './components/OnboardingScreen';
import LanguageModal from './components/LanguageModal';
import PlayerUI from './components/PlayerUI';
import MixerSheet from './components/MixerSheet';
import SleepTimerSheet from './components/SleepTimerSheet';
import FeedbackModal from './components/FeedbackModal';
import CoachingOverlay from './components/CoachingOverlay';
import AriaLiveAnnouncer from './components/AriaLiveAnnouncer';

import { useUITimer } from './hooks/useUITimer';
import { useMediaSession } from './hooks/useMediaSession';
import { useAudioPlayback } from './hooks/useAudioPlayback';

export default function App() {
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
  const [announcement, setAnnouncement] = useState('');

  const announce = useCallback((message: string) => {
    setAnnouncement(message);
  }, []);
  
  const T = useCallback((key: string) => translations[currentLanguage]?.[key] || translations.en[key], [currentLanguage]);
  
  const unifiedTrackList = useMemo(() => {
    const goalRecommendationMap = new Map<string, string>();
    for (const key in goals) {
        const rec = goals[key].recommendation;
        if (rec.type !== 'mixer') {
            const mapKey = `${rec.type}-${rec.index}`;
            goalRecommendationMap.set(mapKey, key);
        }
    }

    const solfeggioTracks = solfeggioFrequencies.map((track, index) => ({ ...track, type: 'solfeggio' as PlaybackMode, originalIndex: index, goalKey: goalRecommendationMap.get(`solfeggio-${index}`) }));
    const binauralTracks = binauralBeats.map((track, index) => ({ ...track, type: 'binaural' as PlaybackMode, originalIndex: index, goalKey: goalRecommendationMap.get(`binaural-${index}`) }));
    return [...solfeggioTracks, ...binauralTracks];
  }, []);
  
  const currentTrack = useMemo(() => unifiedTrackList[unifiedIndex], [unifiedTrackList, unifiedIndex]);
  const { showUI } = useUITimer(onboardingStep === 'player');
  
  useEffect(() => {
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  useEffect(() => {
    const handleInstallPrompt = (e: Event) => {
        e.preventDefault();
        setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
  }, []);

  const handleTogglePlay = useCallback(() => {
      setIsPlaying(prev => {
          announce(prev ? T('feedback_playback_paused') : T('feedback_playback_started'));
          return !prev;
      });
  }, [announce, T]);
  
  const changeTrack = useCallback((direction: number) => {
    setUnifiedIndex(prev => {
        const newIndex = (prev + direction + unifiedTrackList.length) % unifiedTrackList.length;
        localStorage.setItem('lastTrackIndex', newIndex.toString());
        const newTrack = unifiedTrackList[newIndex];
        const trackName = newTrack.name[currentLanguage] || newTrack.name.en;
        const announcementText = direction > 0 ? T('feedback_next_track') : T('feedback_prev_track');
        announce(`${announcementText}: ${trackName}`);
        return newIndex;
    });
  }, [unifiedTrackList, announce, currentLanguage, T]);

  useAudioPlayback({ isPlaying, currentTrack, audioOutputRef });
  useMediaSession({ currentTrack, currentLanguage, onPlayPause: handleTogglePlay, onNext: () => changeTrack(1), onPrev: () => changeTrack(-1) });

  const handleToggleMixer = useCallback(async (id: string) => {
    const isNowActive = await audioService.toggleMixer(id);
    const sound = naturalSounds.find(s => s.id === id);
    if (sound) {
        const soundName = sound.name[currentLanguage] || sound.name.en;
        const statusText = isNowActive ? T('feedback_sound_enabled') : T('feedback_sound_disabled');
        announce(`${soundName} ${statusText}`);
    }
    setActiveMixers(prev => {
        const newSet = new Set(prev);
        isNowActive ? newSet.add(id) : newSet.delete(id);
        return newSet;
    });
  }, [currentLanguage, announce, T]);

  const handleStart = useCallback((goalId: string) => {
    const recommendation = goals[goalId].recommendation;
    if (recommendation.type === 'mixer' && recommendation.id) {
        const defaultIndex = 4; // 432hz
        setUnifiedIndex(defaultIndex);
        localStorage.setItem('lastTrackIndex', defaultIndex.toString());
        handleToggleMixer(recommendation.id!);
    } else {
        const { type, index } = recommendation;
        const foundIndex = unifiedTrackList.findIndex(track => track.type === type && track.originalIndex === index);
        if (foundIndex !== -1) {
            setUnifiedIndex(foundIndex);
            localStorage.setItem('lastTrackIndex', foundIndex.toString());
        }
    }
    setOnboardingStep('timer');
  }, [unifiedTrackList, handleToggleMixer]);

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
  
  const handleMainVolumeChange = (value: number) => { audioService.setMainVolume(value); };
  
  const handleSetSleepTimer = useCallback((minutes: number) => {
    if (sleepTimerTimeoutRef.current) clearTimeout(sleepTimerTimeoutRef.current);
    const endTime = Date.now() + minutes * 60 * 1000;
    setSleepTimerEndTime(endTime);
    announce(`${T('feedback_timer_set')} ${minutes} ${T('feedback_minutes')}.`);

    const timeoutId = window.setTimeout(() => {
        setIsPlaying(false);
        setSleepTimerEndTime(null);
        setSleepTimerRemaining(null);
        setShowFeedbackModal(true);
        announce(T('feedback_timer_finished'));
    }, minutes * 60 * 1000);
    sleepTimerTimeoutRef.current = timeoutId;
  }, [announce, T]);

  const handleTimerSelection = useCallback((minutes: number | null) => {
    if (minutes && minutes > 0) handleSetSleepTimer(minutes);
    else if (sleepTimerTimeoutRef.current) clearTimeout(sleepTimerTimeoutRef.current);
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
      if (remaining > 0) setSleepTimerRemaining(remaining);
      else { setSleepTimerRemaining(null); setSleepTimerEndTime(null); }
    };
    updateRemaining();
    const intervalId = setInterval(updateRemaining, 1000);
    return () => clearInterval(intervalId);
  }, [sleepTimerEndTime]);

  const currentGoalKey = currentTrack?.goalKey;
  const coachingScriptLines = currentGoalKey ? coachingScripts[currentGoalKey]?.[currentLanguage] || coachingScripts[currentGoalKey]?.en : undefined;

  return (
    <>
      <Visualizer patternIndex={unifiedIndex} />
      <AriaLiveAnnouncer message={announcement} />
      <CoachingOverlay scriptLines={coachingScriptLines} isVisible={onboardingStep === 'player' && !showUI} />
      
      {onboardingStep === 'goal' && ( <OnboardingScreen currentLanguage={currentLanguage} onLanguageSelect={() => setIsLanguageModalOpen(true)} onStart={handleStart} installPrompt={installPrompt} /> )}
      {onboardingStep === 'timer' && ( <SleepTimerSheet currentLanguage={currentLanguage} onTimerSelected={handleTimerSelection} /> )}
      {onboardingStep === 'mixer' && ( <MixerSheet currentLanguage={currentLanguage} activeMixers={activeMixers} onToggleMixer={handleToggleMixer} onContinue={handleFinishOnboarding} onMasterVolumeChange={val => audioService.setMixerMasterVolume(val)} onMainVolumeChange={handleMainVolumeChange} /> )}

      <LanguageModal isOpen={isLanguageModalOpen} onClose={() => setIsLanguageModalOpen(false)} onSelectLanguage={handleLanguageSelect} currentLanguage={currentLanguage} />
      <FeedbackModal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} currentLanguage={currentLanguage} />

      <div className={`fixed bottom-0 left-0 right-0 z-10 p-4 flex justify-center transition-all duration-500 ease-out ${showUI && onboardingStep === 'player' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'}`} style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        {currentTrack && onboardingStep === 'player' && <PlayerUI currentTrack={currentTrack} currentLanguage={currentLanguage} isPlaying={isPlaying} onPlayPause={handleTogglePlay} onNext={() => changeTrack(1)} onPrev={() => changeTrack(-1)} onReconfigure={handleReconfigure} sleepTimerRemaining={sleepTimerRemaining} />}
      </div>

      <audio ref={audioOutputRef} playsInline />
    </>
  );
}