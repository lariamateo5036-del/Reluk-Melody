// FIX: Replace styled HOC with a reference to nativewind types for NativeWind v4 compatibility.
/// <reference types="nativewind/types" />
import React, { useState, useEffect, useMemo } from 'react';
import { Text as RNText } from 'react-native';

// FIX: Replace styled HOC with direct component reference for NativeWind v4 compatibility.
const Text = RNText;

interface TypingBenefitProps {
  texts: string[];
}

const TypingBenefit: React.FC<TypingBenefitProps> = ({ texts }) => {
  const [textIndex, setTextIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const memoizedTexts = useMemo(() => texts, [texts]);

  useEffect(() => {
    setTextIndex(0);
    setSubIndex(0);
    setIsDeleting(false);
  }, [memoizedTexts]);

  useEffect(() => {
    if (!memoizedTexts || memoizedTexts.length === 0) return;

    const currentText = memoizedTexts[textIndex];

    if (subIndex === currentText.length && !isDeleting) {
      const timer = setTimeout(() => setIsDeleting(true), 2500);
      return () => clearTimeout(timer);
    }

    if (subIndex === 0 && isDeleting) {
      setIsDeleting(false);
      setTextIndex((prev) => (prev + 1) % memoizedTexts.length);
      return;
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (isDeleting ? -1 : 1));
    }, isDeleting ? 35 : 70);

    return () => clearTimeout(timeout);
  }, [subIndex, isDeleting, textIndex, memoizedTexts]);

  const displayedText = memoizedTexts[textIndex]?.substring(0, subIndex) || '';

  return (
    <Text className="text-sm text-gray-300 h-10">
      {displayedText}
      <Text className="opacity-75">|</Text>
    </Text>
  );
};

export default TypingBenefit;