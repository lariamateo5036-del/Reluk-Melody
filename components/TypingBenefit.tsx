import React, { useState, useEffect, useMemo } from 'react';

interface TypingBenefitProps {
  texts: string[];
}

const TypingBenefit: React.FC<TypingBenefitProps> = ({ texts }) => {
  const [textIndex, setTextIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Memoize the texts prop to prevent re-renders unless it actually changes
  const memoizedTexts = useMemo(() => texts, [texts]);

  useEffect(() => {
    // Reset animation when texts change (e.g., track changes)
    setTextIndex(0);
    setSubIndex(0);
    setIsDeleting(false);
  }, [memoizedTexts]);

  useEffect(() => {
    if (!memoizedTexts || memoizedTexts.length === 0) return;

    const currentText = memoizedTexts[textIndex];

    // Finished typing a sentence, pause before deleting
    if (subIndex === currentText.length && !isDeleting) {
      const timer = setTimeout(() => setIsDeleting(true), 2500);
      return () => clearTimeout(timer);
    }

    // Finished deleting, move to the next sentence
    if (subIndex === 0 && isDeleting) {
      setIsDeleting(false);
      setTextIndex((prev) => (prev + 1) % memoizedTexts.length);
      return;
    }

    // Typing or deleting logic
    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (isDeleting ? -1 : 1));
    }, isDeleting ? 35 : 70);

    return () => clearTimeout(timeout);
  }, [subIndex, isDeleting, textIndex, memoizedTexts]);

  const displayedText = memoizedTexts[textIndex]?.substring(0, subIndex) || '';

  return (
    <p className="text-sm text-gray-300 h-10">
      {displayedText}
      <span className="animate-pulse opacity-75">|</span>
    </p>
  );
};

export default TypingBenefit;