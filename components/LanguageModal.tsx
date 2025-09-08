import React from 'react';
import { translations, languages } from '../constants';

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLanguage: (langCode: string) => void;
  currentLanguage: string;
}

const LanguageModal: React.FC<LanguageModalProps> = ({ isOpen, onClose, onSelectLanguage, currentLanguage }) => {
  if (!isOpen) return null;
  const T = (key: string) => translations[currentLanguage]?.[key] || translations.en[key];

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[101] flex items-center justify-center p-4">
      <div onClick={e => e.stopPropagation()} className="bg-zinc-800/80 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-xs max-h-[80vh] flex flex-col">
        <h3 className="text-lg font-bold text-center p-4 flex-shrink-0">{T('language_title')}</h3>
        <div className="overflow-y-auto p-2">
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => onSelectLanguage(lang.code)}
              className={`flex items-center w-full p-3 rounded-lg transition-colors text-left ${currentLanguage === lang.code ? 'bg-violet-500/25' : 'hover:bg-white/10'}`}
            >
              <span className="text-xl mr-4">{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LanguageModal;
