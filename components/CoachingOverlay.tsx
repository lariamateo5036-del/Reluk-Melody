// FIX: Replace styled HOC with a reference to nativewind types for NativeWind v4 compatibility.
/// <reference types="nativewind/types" />
import React, { useState, useEffect } from 'react';
import { View as RNView, Text as RNText, Animated } from 'react-native';

// FIX: Replace styled HOC with direct component reference for NativeWind v4 compatibility.
const AnimatedView = Animated.View;
const View = RNView;
const Text = RNText;

interface CoachingOverlayProps {
  scriptLines?: string[];
  isVisible: boolean;
}

const CoachingOverlay: React.FC<CoachingOverlayProps> = ({ scriptLines, isVisible }) => {
  const [lineIndex, setLineIndex] = useState(0);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    setLineIndex(0);
  }, [scriptLines]);

  useEffect(() => {
    if (isVisible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  useEffect(() => {
    if (isVisible && scriptLines && scriptLines.length > 0) {
      const interval = setInterval(() => {
        Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => {
          setLineIndex(prevIndex => (prevIndex + 1) % scriptLines.length);
          Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
        });
      }, 8000);

      return () => clearInterval(interval);
    }
  }, [isVisible, scriptLines]);

  if (!scriptLines || scriptLines.length === 0) {
    return null;
  }

  return (
    <AnimatedView
      className="absolute top-16 left-0 right-0 p-4 items-center z-[5]"
      style={{ opacity: fadeAnim }}
      pointerEvents={isVisible ? 'auto' : 'none'}
    >
      <View className="max-w-md bg-zinc-900/50 rounded-2xl px-6 py-3">
        <Text className="text-base md:text-lg text-white/90 text-center">
          {scriptLines[lineIndex]}
        </Text>
      </View>
    </AnimatedView>
  );
};

export default CoachingOverlay;