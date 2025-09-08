import React, { useState } from 'react';
import { translations, languages, goals, goalTranslations } from '../constants';
import InstallPWAButton from './InstallPWAButton';

interface OnboardingScreenProps {
  currentLanguage: string;
  onLanguageSelect: () => void;
  onStart: (goal: string) => void;
  installPrompt: any;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ currentLanguage, onLanguageSelect, onStart, installPrompt }) => {
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const T = (key: string) => translations[currentLanguage]?.[key] || translations.en[key];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[100] flex items-center justify-center p-4 transition-opacity duration-300">
      <div className="w-full max-w-md bg-zinc-900/70 border border-white/10 rounded-3xl p-6 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-2xl font-bold">{T('goal_title')}</h2>
          <div className="flex items-center space-x-2">
            <InstallPWAButton installPrompt={installPrompt} currentLanguage={currentLanguage} />
            <button 
              onClick={onLanguageSelect} 
              className="h-10 w-10 bg-white/10 rounded-full text-xl grid place-items-center flex-shrink-0"
              aria-label={T('language_title')}
            >
              {languages.find(l => l.code === currentLanguage)?.flag || '🇺🇸'}
            </button>
          </div>
        </div>
        <p className="text-gray-300 mb-6 flex-shrink-0">{T('goal_subtitle')}</p>
        <div className="selection-grid grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-y-auto pr-2">
          {Object.entries(goalTranslations[currentLanguage]).map(([key, name]) => (
            <button
              key={key}
              onClick={() => setSelectedGoal(key)}
              aria-pressed={selectedGoal === key}
              className={`p-4 rounded-xl transition-all duration-200 text-center flex flex-col items-center justify-center min-h-[90px] ${selectedGoal === key ? 'bg-violet-500/30 border-violet-400' : 'bg-white/10 border-transparent'} border`}
            >
              <span className="text-3xl">{goals[key].icon}</span>
              <span className="block text-sm mt-2 font-semibold">{name as React.ReactNode}</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => selectedGoal && onStart(selectedGoal)}
          disabled={!selectedGoal}
          className="w-full bg-violet-500 text-white py-3 rounded-lg mt-6 font-semibold flex-shrink-0 disabled:bg-violet-500/50 disabled:cursor-not-allowed"
        >
          {T('start_btn')}
        </button>
      </div>
    </div>
  );
};

export default OnboardingScreen;