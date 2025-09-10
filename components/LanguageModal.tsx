// FIX: Replace styled HOC with a reference to nativewind types for NativeWind v4 compatibility.
/// <reference types="nativewind/types" />
import React from 'react';
import { Modal, View, Text as RNText, TouchableOpacity as RNTouchableOpacity, FlatList } from 'react-native';
import { translations, languages } from '../constants';

// FIX: Replace styled HOC with direct component reference for NativeWind v4 compatibility.
const Text = RNText;
const TouchableOpacity = RNTouchableOpacity;

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLanguage: (langCode: string) => void;
  currentLanguage: string;
}

const LanguageModal: React.FC<LanguageModalProps> = ({ isOpen, onClose, onSelectLanguage, currentLanguage }) => {
  const T = (key: string) => translations[currentLanguage]?.[key] || translations.en[key];

  return (
    <Modal
      transparent={true}
      visible={isOpen}
      onRequestClose={onClose}
      animationType="fade"
    >
      <TouchableOpacity onPress={onClose} activeOpacity={1} className="flex-1 bg-black/50 justify-center items-center p-4">
        <TouchableOpacity activeOpacity={1} className="bg-zinc-800/80 border border-white/10 rounded-2xl w-full max-w-xs max-h-[80vh]">
          <Text className="text-lg font-bold text-center text-white p-4">{T('language_title')}</Text>
          <FlatList
            data={languages}
            keyExtractor={(item) => item.code}
            renderItem={({ item: lang }) => (
              <TouchableOpacity
                onPress={() => onSelectLanguage(lang.code)}
                aria-selected={currentLanguage === lang.code}
                className={`flex-row items-center w-full p-3 rounded-lg mx-2 my-1 ${currentLanguage === lang.code ? 'bg-violet-500/25' : ''}`}
              >
                <Text className="text-xl mr-4">{lang.flag}</Text>
                <Text className="text-white">{lang.name}</Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: 8 }}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default LanguageModal;