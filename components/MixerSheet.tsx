// FIX: Replace styled HOC with a reference to nativewind types for NativeWind v4 compatibility.
/// <reference types="nativewind/types" />
import React from 'react';
import { View as RNView, Text as RNText, TouchableOpacity as RNTouchableOpacity, ScrollView as RNScrollView } from 'react-native';
import { translations, naturalSounds } from '../constants';
import Slider from '@react-native-community/slider';
import { SvgXml } from 'react-native-svg';

// FIX: Replace styled HOC with direct component reference for NativeWind v4 compatibility.
const View = RNView;
const Text = RNText;
const TouchableOpacity = RNTouchableOpacity;
const ScrollView = RNScrollView;

interface MixerSheetProps {
    currentLanguage: string;
    activeMixers: Set<string>;
    onToggleMixer: (id: string) => void;
    onContinue: () => void;
    onMasterVolumeChange: (value: number) => void;
    onMainVolumeChange: (value: number) => void;
}

const MixerSheet: React.FC<MixerSheetProps> = ({ currentLanguage, activeMixers, onToggleMixer, onContinue, onMasterVolumeChange, onMainVolumeChange }) => {
    const T = (key: string) => translations[currentLanguage]?.[key] || translations.en[key];

    return (
        <View className="absolute inset-0 bg-black/80 justify-center items-center p-4 z-[100]">
            <View className="w-full max-w-md bg-zinc-900/70 border border-white/10 rounded-3xl p-6 h-[90vh]">
                <Text className="text-2xl font-bold text-center text-white mb-2">{T('mixer_onboarding_title')}</Text>
                <Text className="text-gray-300 mb-6 text-center">{T('mixer_onboarding_subtitle')}</Text>
                
                <ScrollView>
                    <View className="flex-row flex-wrap justify-around">
                        {naturalSounds.map(sound => (
                            <View key={sound.id} className="w-1/4 p-1 items-center mb-2">
                                <TouchableOpacity
                                    onPress={() => onToggleMixer(sound.id)}
                                    aria-pressed={activeMixers.has(sound.id)}
                                    accessibilityLabel={sound.name[currentLanguage] || sound.name.en}
                                    className={`w-16 h-16 items-center justify-center p-2 rounded-lg ${activeMixers.has(sound.id) ? 'bg-violet-600/70' : 'bg-gray-900/50'}`}
                                >
                                    <SvgXml xml={sound.icon} width="24" height="24" stroke="white" />
                                </TouchableOpacity>
                                <Text className="text-xs mt-1 text-center text-white">{sound.name[currentLanguage] || sound.name.en}</Text>
                            </View>
                        ))}
                    </View>
                </ScrollView>

                <View className="space-y-3 pt-4 border-t border-gray-700 flex-shrink-0">
                    <View className="items-center gap-2">
                        <Text className="text-sm text-gray-300">{T('main_volume')}</Text>
                        <Slider
                            style={{width: '100%', height: 40}}
                            minimumValue={0}
                            maximumValue={100}
                            value={78}
                            onValueChange={onMainVolumeChange}
                            minimumTrackTintColor="#a78bfa"
                            maximumTrackTintColor="#4b5563"
                            thumbTintColor="#ffffff"
                            accessibilityLabel={T('main_volume')}
                        />
                    </View>
                    <View className="items-center gap-2">
                        <Text className="text-sm text-gray-300">{T('background_volume')}</Text>
                         <Slider
                            style={{width: '100%', height: 40}}
                            minimumValue={0}
                            maximumValue={100}
                            value={75}
                            onValueChange={onMasterVolumeChange}
                            minimumTrackTintColor="#a78bfa"
                            maximumTrackTintColor="#4b5563"
                            thumbTintColor="#ffffff"
                            accessibilityLabel={T('background_volume')}
                        />
                    </View>
                </View>
                <TouchableOpacity onPress={onContinue} className="w-full bg-violet-500 text-white py-3 rounded-lg mt-6 flex-shrink-0">
                    <Text className="text-white text-center font-semibold">{T('start_listening_btn')}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default MixerSheet;