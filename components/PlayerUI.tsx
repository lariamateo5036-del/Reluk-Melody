import React, { useState, useEffect } from 'react';
import TypingBenefit from './TypingBenefit';

interface PlayerUIProps {
  currentTrack: any;
  currentLanguage: string;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onReconfigure: () => void;
  sleepTimerRemaining: number | null;
}

const formatTime = (totalSeconds: number | null) => {
    if (totalSeconds === null) return '';
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const PlayerUI: React.FC<PlayerUIProps> = ({ currentTrack, currentLanguage, isPlaying, onPlayPause, onNext, onPrev, onReconfigure, sleepTimerRemaining }) => {
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  return (
    <div className="w-full max-w-sm bg-zinc-900/50 backdrop-blur-2xl rounded-3xl p-4 text-white">
      {/* Top section: Title, Timer, Subtitle */}
      <div className="mb-3 space-y-1">
        <div className="flex justify-between items-baseline">
          <p className="text-lg font-bold truncate pr-4">{currentTrack?.name[currentLanguage] || currentTrack?.name.en}</p>
          {sleepTimerRemaining !== null && sleepTimerRemaining > 0 && (
            <div className="flex items-center text-xs text-violet-300 font-mono flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              <span>{formatTime(sleepTimerRemaining)}</span>
            </div>
          )}
        </div>
        <TypingBenefit 
            texts={currentTrack?.long_benefits?.[currentLanguage] || currentTrack?.long_benefits?.en || []} 
        />
      </div>

      {/* Controls section */}
      <div className="flex justify-between items-center">
        <button onClick={onReconfigure} aria-label="Reconfigure session" className="control-btn focus:outline-none w-10 h-10 flex items-center justify-center text-white/80 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </button>
        
        <div className="flex items-center space-x-2">
          <button onClick={onPrev} aria-label="Previous track" className="control-btn focus:outline-none text-white/80 hover:text-white">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M8.445 14.832A1 1 0 0010 14.006V5.994a1 1 0 00-1.555-.832L4.22 9.168a1 1 0 000 1.664l4.225 4.001zM10.89 15.34a1 1 0 001.555-.832V5.492a1 1 0 00-1.555-.832l-6.225 4.5a1 1 0 000 1.664l6.225 4.5z"></path></svg>
          </button>
          <button onClick={onPlayPause} aria-label={isPlaying ? "Pause" : "Play"} className="control-btn focus:outline-none text-white/80 hover:text-white">
            {isPlaying ? (
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v4a1 1 0 11-2 0V8z" clipRule="evenodd"></path></svg>
            ) : (
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8.006v3.988a1 1 0 001.555.832l3.197-2.006a1 1 0 000-1.664L9.555 7.168z" clipRule="evenodd"></path></svg>
            )}
          </button>
          <button onClick={onNext} aria-label="Next track" className="control-btn focus:outline-none text-white/80 hover:text-white">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M11.555 5.168A1 1 0 0010 5.994v8.012a1 1 0 001.555.832l4.225-4.006a1 1 0 000-1.664l-4.225-4.001zM9.11 4.66a1 1 0 00-1.555.832v8.012a1 1 0 001.555.832l6.225-4.5a1 1 0 000-1.664l-6.225-4.5z"></path></svg>
          </button>
        </div>
        
        <button onClick={handleToggleFullscreen} aria-label="Toggle fullscreen" className="control-btn focus:outline-none w-10 h-10 flex items-center justify-center text-white/80 hover:text-white">
          {isFullscreen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 3h6v6m-2-2L13 13m-2-2L3 21m0-6v6h6" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4m12 4V4h-4M4 16v4h4m12-4v4h-4" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default PlayerUI;