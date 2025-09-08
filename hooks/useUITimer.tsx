import { useState, useRef, useCallback, useEffect } from 'react';

export const useUITimer = (isPlayerVisible: boolean) => {
  const [showUI, setShowUI] = useState(true);
  const hideUITimerRef = useRef<number | null>(null);

  const resetHideUITimer = useCallback(() => {
    if (hideUITimerRef.current) clearTimeout(hideUITimerRef.current);
    setShowUI(true);
    hideUITimerRef.current = window.setTimeout(() => {
      setShowUI(false);
    }, 4000);
  }, []);

  useEffect(() => {
    if (isPlayerVisible) {
        document.addEventListener('click', resetHideUITimer);
        document.addEventListener('mousemove', resetHideUITimer);
        document.addEventListener('touchstart', resetHideUITimer);
        resetHideUITimer();
    }
    
    return () => {
      document.removeEventListener('click', resetHideUITimer);
      document.removeEventListener('mousemove', resetHideUITimer);
      document.removeEventListener('touchstart', resetHideUITimer);
      if (hideUITimerRef.current) clearTimeout(hideUITimerRef.current);
    };
  }, [isPlayerVisible, resetHideUITimer]);
  
  return { showUI };
};
