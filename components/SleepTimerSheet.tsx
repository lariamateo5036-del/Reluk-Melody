// FIX: Replace styled HOC with a reference to nativewind types for NativeWind v4 compatibility.
/// <reference types="nativewind/types" />
import React, { useState } from 'react';
import { View as RNView, Text as RNText, TouchableOpacity as RNTouchableOpacity, TextInput as RNTextInput } from 'react-native';
import { translations } from '../constants';

// FIX: Replace styled HOC with direct component reference for NativeWind v4 compatibility.
const View = RNView;
const Text = RNText;
const TouchableOpacity = RNTouchableOpacity;
const TextInput = RNTextInput;

interface SleepTimerSheetProps {
    currentLanguage: string;
    onTimerSelected: (minutes: number | null) => void;
}

const SleepTimerSheet: React.FC<SleepTimerSheetProps> = ({ currentLanguage, onTimerSelected }) => {
    const T = (key: string) => translations[currentLanguage]?.[key] || translations.en[key];
    const [customMinutes, setCustomMinutes] = useState('20');

    const handleSetCustomTimer = () => {
        const minutes = parseInt(customMinutes, 10);
        if (!isNaN(minutes) && minutes > 0) {
            onTimerSelected(minutes);
        }
    };

    return (
        <View className="absolute inset-0 bg-black/80 justify-center items-center p-4 z-[100]">
            <View className="w-full max-w-sm bg-zinc-900/70 border border-white/10 rounded-3xl p-8 space-y-6">
                <View className="text-center">
                    <Text className="text-3xl text-white font-bold mb-2 text-center">{T('select_sleep_timer_title')}</Text>
                    <Text className="text-gray-300 text-center">{T('select_sleep_timer_subtitle')}</Text>
                </View>
                
                <View className="flex-row justify-between gap-4">
                    <TouchableOpacity onPress={() => onTimerSelected(15)} className="bg-zinc-800 p-4 rounded-xl flex-1 items-center">
                        <Text className="text-white font-semibold">{T('sleep_timer_15m')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onTimerSelected(30)} className="bg-zinc-800 p-4 rounded-xl flex-1 items-center">
                        <Text className="text-white font-semibold">{T('sleep_timer_30m')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onTimerSelected(60)} className="bg-zinc-800 p-4 rounded-xl flex-1 items-center">
                        <Text className="text-white font-semibold">{T('sleep_timer_60m')}</Text>
                    </TouchableOpacity>
                </View>

                <View className="pt-2 border-t border-white/10">
                     <Text className="text-sm font-semibold text-gray-400 text-center mb-4">{T('sleep_timer_custom')}</Text>
                     <View className="flex-row gap-4 items-stretch">
                        <TextInput
                            keyboardType="number-pad"
                            value={customMinutes}
                            onChangeText={setCustomMinutes}
                            className="flex-grow bg-black/30 p-4 rounded-xl text-center text-xl font-mono text-white"
                            placeholder="Minutes"
                            placeholderTextColor="#9ca3af"
                            aria-label="Custom minutes for sleep timer"
                        />
                        <TouchableOpacity 
                            onPress={handleSetCustomTimer} 
                            className="bg-violet-600 justify-center px-8 rounded-xl flex-shrink-0"
                        >
                            <Text className="text-white font-bold">{T('sleep_timer_set')}</Text>
                        </TouchableOpacity>
                     </View>
                </View>

                <TouchableOpacity 
                    onPress={() => onTimerSelected(null)} 
                    className="w-full py-2 rounded-lg"
                >
                    <Text className="text-violet-300 font-semibold text-center">{T('continue_without_timer')}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default SleepTimerSheet;