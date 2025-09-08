import React, { useState, useEffect } from 'react';

interface CoachingOverlayProps {
  scriptLines?: string[];
  isVisible: boolean;
}

const CoachingOverlay: React.FC<CoachingOverlayProps> = ({ scriptLines, isVisible }) => {
  const [lineIndex, setLineIndex] = useState(0);
  const [isTextVisible, setIsTextVisible] = useState(true);

  useEffect(() => {
    // Reset index when the script changes (e.g., user changes track)
    setLineIndex(0);
  }, [scriptLines]);

  useEffect(() => {
    if (isVisible && scriptLines && scriptLines.length > 0) {
      const interval = setInterval(() => {
        setIsTextVisible(false); // Start fade out
        setTimeout(() => {
          setLineIndex(prevIndex => (prevIndex + 1) % scriptLines.length);
          setIsTextVisible(true); // Start fade in with new text
        }, 500); // Wait for fade out to complete
      }, 8000); // Time each line is displayed + fade time

      return () => clearInterval(interval);
    }
  }, [isVisible, scriptLines]);

  if (!scriptLines || scriptLines.length === 0) {
    return null;
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 p-4 flex justify-center transition-opacity duration-500 z-[5] ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{ paddingTop: 'calc(2rem + env(safe-area-inset-top))' }}
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className="max-w-2xl bg-zinc-900/50 backdrop-blur-2xl rounded-2xl px-6 py-3 transition-opacity duration-500 ease-in-out"
        style={{ opacity: isTextVisible ? 1 : 0 }}
      >
        <p className="text-base md:text-lg text-white/90 drop-shadow-lg text-center">
          {scriptLines[lineIndex]}
        </p>
      </div>
    </div>
  );
};

export default CoachingOverlay;
