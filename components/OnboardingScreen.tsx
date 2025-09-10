// FIX: Replace styled HOC with a reference to nativewind types for NativeWind v4 compatibility.
/// <reference types="nativewind/types" />
import React, { useState } from 'react';
import { View as RNView, Text as RNText, TouchableOpacity as RNTouchableOpacity, ScrollView as RNScrollView } from 'react-native';
import { translations, languages, goals, goalTranslations } from '../constants';

// FIX: Replace styled HOC with direct component reference for NativeWind v4 compatibility.
const View = RNView;
const Text = RNText;
const TouchableOpacity = RNTouchableOpacity;
const ScrollView = RNScrollView;

interface OnboardingScreenProps {
  currentLanguage: string;
  onLanguageSelect: () => void;
  onStart: (goal: string) => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ currentLanguage, onLanguageSelect, onStart }) => {
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const T = (key: string) => translations[currentLanguage]?.[key] || translations.en[key];

  return (
    <View className="absolute inset-0 bg-black/80 justify-center items-center p-4 z-[100]">
      <View className="w-full max-w-md bg-zinc-900/70 border border-white/10 rounded-3xl p-6 h-[90vh]">
        <View className="flex-row justify-between items-center mb-4 flex-shrink-0">
          <Text className="text-2xl font-bold text-white">{T('goal_title')}</Text>
          <TouchableOpacity 
            onPress={onLanguageSelect} 
            className="h-10 w-10 bg-white/10 rounded-full justify-center items-center flex-shrink-0"
            accessibilityLabel={T('language_title')}
          >
            <Text className="text-xl">{languages.find(l => l.code === currentLanguage)?.flag || '🇺🇸'}</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-gray-300 mb-6 flex-shrink-0">{T('goal_subtitle')}</Text>
        <ScrollView className="flex-1">
            <View className="flex-row flex-wrap justify-between">
            {Object.entries(goalTranslations[currentLanguage]).map(([key, name]) => (
                <View key={key} className="w-[48%] mb-4">
                    <TouchableOpacity
                        onPress={() => setSelectedGoal(key)}
                        aria-selected={selectedGoal === key}
                        className={`p-4 rounded-xl transition-all duration-200 items-center justify-center min-h-[90px] ${selectedGoal === key ? 'bg-violet-500/30 border-violet-400' : 'bg-white/10 border-transparent'} border`}
                        >
                        <Text className="text-3xl">{goals[key].icon}</Text>
                        <Text className="block text-sm mt-2 font-semibold text-white text-center">{name as React.ReactNode}</Text>
                    </TouchableOpacity>
                </View>
            ))}
            </View>
        </ScrollView>
        <TouchableOpacity
          onPress={() => selectedGoal && onStart(selectedGoal)}
          disabled={!selectedGoal}
          className={`w-full py-3 rounded-lg mt-6 flex-shrink-0 ${!selectedGoal ? 'bg-violet-500/50' : 'bg-violet-500'}`}
        >
          <Text className="text-white font-semibold text-center">{T('start_btn')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default OnboardingScreen;