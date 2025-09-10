import { useState, useRef, useCallback, useEffect } from 'react';
import { AppState } from 'react-native';

export const useUITimer = (isPlayerVisible: boolean) => {
  const [showUI, setShowUI] = useState(true);
  // FIX: Replace NodeJS.Timeout with ReturnType<typeof setTimeout> for compatibility with React Native environments.
  const hideUITimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetHideUITimer = useCallback(() => {
    if (hideUITimerRef.current) clearTimeout(hideUITimerRef.current);
    setShowUI(true);
    hideUITimerRef.current = setTimeout(() => {
      setShowUI(false);
    }, 4000);
  }, []);

  useEffect(() => {
    if (isPlayerVisible) {
        resetHideUITimer();
    }
    
    // Hide UI when app goes to background
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState.match(/inactive|background/)) {
        if (hideUITimerRef.current) clearTimeout(hideUITimerRef.current);
        setShowUI(false);
      } else {
         resetHideUITimer();
      }
    });

    return () => {
      if (hideUITimerRef.current) clearTimeout(hideUITimerRef.current);
      subscription.remove();
    };
  }, [isPlayerVisible, resetHideUITimer]);
  
  return { showUI, resetHideUITimer };
};
