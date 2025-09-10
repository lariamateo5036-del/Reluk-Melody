// FIX: Replace styled HOC with a reference to nativewind types for NativeWind v4 compatibility.
/// <reference types="nativewind/types" />
import React, { useState } from 'react';
import { Modal, View as RNView, Text as RNText, TouchableOpacity as RNTouchableOpacity, Share } from 'react-native';
import { translations, shareTemplates } from '../constants';

// FIX: Replace styled HOC with direct component reference for NativeWind v4 compatibility.
const View = RNView;
const Text = RNText;
const TouchableOpacity = RNTouchableOpacity;

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: string;
  currentTrack: any;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, currentLanguage, currentTrack }) => {
  const [step, setStep] = useState<'initial' | 'share'>('initial');
  const T = (key: string) => translations[currentLanguage]?.[key] || translations.en[key];

  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
    setTimeout(() => setStep('initial'), 300);
  };

  const handleShare = async () => {
    const goalKey = currentTrack?.goalKey;
    const templateGroup = (goalKey && shareTemplates[goalKey]) ? shareTemplates[goalKey] : shareTemplates.generic;
    const template = templateGroup[currentLanguage] || templateGroup.en;
    
    const url = 'https://ai.google.dev/edge/melody';
    const message = template.text.replace('{url}', url);

    try {
      await Share.share({
        message: message,
        title: template.title,
        url: url, // For iOS
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
    handleClose();
  };

  return (
    <Modal
      transparent={true}
      visible={isOpen}
      onRequestClose={handleClose}
      animationType="fade"
    >
      <TouchableOpacity onPress={handleClose} activeOpacity={1} className="flex-1 bg-black/80 justify-center items-center p-4">
        <TouchableOpacity activeOpacity={1} className="w-full max-w-sm bg-zinc-900/70 border border-white/10 rounded-3xl p-8 items-center text-center space-y-6">
          {step === 'initial' && (
            <>
              <Text className="text-2xl font-bold text-white text-center">{T('feedback_title')}</Text>
              <View className="w-full flex-row gap-4">
                <TouchableOpacity onPress={() => setStep('share')} className="flex-1 bg-violet-600 py-3 rounded-xl">
                  <Text className="text-white font-semibold text-center">👍 {T('feedback_yes')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleClose} className="flex-1 bg-zinc-700 py-3 rounded-xl">
                  <Text className="text-white font-semibold text-center">👎 {T('feedback_no')}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 'share' && (
            <>
              <Text className="text-3xl font-bold text-white text-center">🎉 {T('feedback_thanks_title')}</Text>
              <Text className="text-gray-300 text-center">{T('feedback_share_prompt')}</Text>
              <View className="w-full flex-col gap-3">
                <TouchableOpacity onPress={handleShare} className="w-full bg-violet-600 py-3 rounded-xl">
                  <Text className="text-white font-semibold text-center">{T('feedback_share_button')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleClose} className="w-full py-2 rounded-lg">
                  <Text className="text-violet-300 font-semibold text-center">{T('feedback_close_button')}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default FeedbackModal;