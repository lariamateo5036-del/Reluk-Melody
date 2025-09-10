// FIX: Replace styled HOC with a reference to nativewind types for NativeWind v4 compatibility.
/// <reference types="nativewind/types" />
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
// FIX: Import View component
import { SafeAreaView, StatusBar, AppState, View as RNView } from 'react-native';
import type { PlaybackMode } from './types';
import { translations, goals, solfeggioFrequencies, binauralBeats, coachingScripts, naturalSounds } from './constants';
import audioService from './services/audioService';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// FIX: Replace styled HOC with direct component reference for NativeWind v4 compatibility.
const View = RNView;

export default function App() {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isPlaying, setIsPlaying] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<'goal' | 'timer' | 'mixer' | 'player'>('goal');

  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [activeMixers, setActiveMixers] = useState(new Set<string>());
  
  const [sleepTimerEndTime, setSleepTimerEndTime] = useState<number | null>(null);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  // FIX: Replace NodeJS.Timeout with ReturnType<typeof setTimeout> for compatibility with React Native environments.
  const sleepTimerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [unifiedIndex, setUnifiedIndex] = useState(4); // Default to 432 Hz

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const loadInitialState = async () => {
      const storedLang = await AsyncStorage.getItem('userLanguage');
      if (storedLang) setCurrentLanguage(storedLang);
      
      const isOnboarded = await AsyncStorage.getItem('isOnboarded') === 'true';
      setOnboardingStep(isOnboarded ? 'player' : 'goal');
      
      const lastTrackIndex = await AsyncStorage.getItem('lastTrackIndex');
      if (lastTrackIndex) setUnifiedIndex(parseInt(lastTrackIndex, 10));
    };
    loadInitialState();
  }, []);

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
  
  const currentTrack = useMemo(() => {
    const track = unifiedTrackList[unifiedIndex];
    if (!track) return null;

    if (!track.goalKey) {
        for (const key in goals) {
            const rec = goals[key].recommendation;
            if (rec.type === track.type && rec.index === track.originalIndex) {
                return { ...track, goalKey: key };
            }
        }
    }
     if (activeMixers.has('white_noise') && 'freq' in track && track.freq === 432) {
        const tinnitusKey = Object.keys(goals).find(k => goals[k].recommendation.id === 'white_noise');
        if(tinnitusKey) return { ...track, goalKey: tinnitusKey };
     }
    return track;
  }, [unifiedTrackList, unifiedIndex, activeMixers]);

  const { showUI, resetHideUITimer } = useUITimer(onboardingStep === 'player');
  
  const handleTogglePlay = useCallback(() => {
      setIsPlaying(prev => {
          announce(prev ? T('feedback_playback_paused') : T('feedback_playback_started'));
          return !prev;
      });
  }, [announce, T]);
  
  const changeTrack = useCallback(async (direction: number) => {
    setUnifiedIndex(prev => {
        const newIndex = (prev + direction + unifiedTrackList.length) % unifiedTrackList.length;
        AsyncStorage.setItem('lastTrackIndex', newIndex.toString());
        const newTrack = unifiedTrackList[newIndex];
        const trackName = newTrack.name[currentLanguage] || newTrack.name.en;
        const announcementText = direction > 0 ? T('feedback_next_track') : T('feedback_prev_track');
        announce(`${announcementText}: ${trackName}`);
        return newIndex;
    });
  }, [unifiedTrackList, announce, currentLanguage, T]);

  useAudioPlayback({ isPlaying, currentTrack });
  useMediaSession({ currentTrack, currentLanguage, onPlayPause: handleTogglePlay, onNext: () => changeTrack(1), onPrev: () => changeTrack(-1) });

  const handleToggleMixer = useCallback(async (id: string) => {
    await audioService.init();

    const isNowActive = await audioService.toggleMixer(id);

    const newActiveMixers = new Set(activeMixers);
    if (isNowActive) {
        newActiveMixers.add(id);
    } else {
        newActiveMixers.delete(id);
    }
    setActiveMixers(newActiveMixers);
    
    const sound = naturalSounds.find(s => s.id === id);
    if (sound) {
        const soundName = sound.name[currentLanguage] || sound.name.en;
        const statusText = isNowActive ? T('feedback_sound_enabled') : T('feedback_sound_disabled');
        announce(`${soundName} ${statusText}`);
    }
  }, [activeMixers, currentLanguage, announce, T]);

  const handleStart = useCallback(async (goalId: string) => {
    await audioService.init();
    const recommendation = goals[goalId].recommendation;
    if (recommendation.type === 'mixer' && recommendation.id) {
        const defaultIndex = unifiedTrackList.findIndex(t => 'freq' in t && t.freq === 432);
        const newIndex = defaultIndex !== -1 ? defaultIndex : 4;
        setUnifiedIndex(newIndex);
        AsyncStorage.setItem('lastTrackIndex', newIndex.toString());
        await handleToggleMixer(recommendation.id);
    } else {
        const { type, index } = recommendation;
        const foundIndex = unifiedTrackList.findIndex(track => track.type === type && track.originalIndex === index);
        if (foundIndex !== -1) {
            setUnifiedIndex(foundIndex);
            AsyncStorage.setItem('lastTrackIndex', foundIndex.toString());
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
    AsyncStorage.setItem('userLanguage', langCode);
  };
  
  const handleMainVolumeChange = (value: number) => { audioService.setMainVolume(value); };
  
  const handleSetSleepTimer = useCallback((minutes: number) => {
    if (sleepTimerTimeoutRef.current) clearTimeout(sleepTimerTimeoutRef.current);
    const endTime = Date.now() + minutes * 60 * 1000;
    setSleepTimerEndTime(endTime);
    announce(`${T('feedback_timer_set')} ${minutes} ${T('feedback_minutes')}.`);

    const timeoutId = setTimeout(() => {
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

  const handleFinishOnboarding = useCallback(async () => {
    await AsyncStorage.setItem('isOnboarded', 'true');
    await AsyncStorage.setItem('userLanguage', currentLanguage);
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
    <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }} onTouchStart={resetHideUITimer}>
      <StatusBar barStyle="light-content" />
      <Visualizer patternIndex={unifiedIndex} />
      <AriaLiveAnnouncer message={announcement} />
      <CoachingOverlay scriptLines={coachingScriptLines} isVisible={onboardingStep === 'player' && !showUI} />
      
      {onboardingStep === 'goal' && ( <OnboardingScreen currentLanguage={currentLanguage} onLanguageSelect={() => setIsLanguageModalOpen(true)} onStart={handleStart} /> )}
      {onboardingStep === 'timer' && ( <SleepTimerSheet currentLanguage={currentLanguage} onTimerSelected={handleTimerSelection} /> )}
      {onboardingStep === 'mixer' && ( <MixerSheet currentLanguage={currentLanguage} activeMixers={activeMixers} onToggleMixer={handleToggleMixer} onContinue={handleFinishOnboarding} onMasterVolumeChange={val => audioService.setMixerMasterVolume(val)} onMainVolumeChange={handleMainVolumeChange} /> )}

      <LanguageModal isOpen={isLanguageModalOpen} onClose={() => setIsLanguageModalOpen(false)} onSelectLanguage={handleLanguageSelect} currentLanguage={currentLanguage} />
      <FeedbackModal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} currentLanguage={currentLanguage} currentTrack={currentTrack} />

      <View className={`absolute bottom-0 left-0 right-0 z-10 p-4 flex justify-center transition-all duration-500 ease-out ${showUI && onboardingStep === 'player' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-40'}`}>
        {currentTrack && onboardingStep === 'player' && <PlayerUI currentTrack={currentTrack} currentLanguage={currentLanguage} isPlaying={isPlaying} onPlayPause={handleTogglePlay} onNext={() => changeTrack(1)} onPrev={() => changeTrack(-1)} onReconfigure={handleReconfigure} sleepTimerRemaining={sleepTimerRemaining} />}
      </View>
    </SafeAreaView>
  );
}