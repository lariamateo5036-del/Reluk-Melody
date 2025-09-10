
import React, { useEffect } from 'react';
import { AccessibilityInfo, View } from 'react-native';

interface AriaLiveAnnouncerProps {
  message: string;
}

const AriaLiveAnnouncer: React.FC<AriaLiveAnnouncerProps> = ({ message }) => {
  useEffect(() => {
    if (message) {
      AccessibilityInfo.announceForAccessibility(message);
    }
  }, [message]);

  // This component no longer needs to render anything visible.
  return null;
};

export default AriaLiveAnnouncer;
