import { useEffect } from 'react';
import { translations } from '../constants';

interface UseMediaSessionProps {
  currentTrack: any;
  currentLanguage: string;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export const useMediaSession = ({ currentTrack, currentLanguage, onPlayPause, onNext, onPrev }: UseMediaSessionProps) => {
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      const T = (key: string) => translations[currentLanguage]?.[key] || translations.en[key];
      const albumName = T(currentTrack.type === 'solfeggio' ? 'album_solfeggio' : 'album_binaural');
      
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.name[currentLanguage] || currentTrack.name.en,
        artist: currentTrack.short_benefit[currentLanguage] || currentTrack.short_benefit.en,
        album: albumName,
        artwork: [{ src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }]
      });

      const actionHandlers: [MediaSessionAction, MediaSessionActionHandler][] = [
        ['play', onPlayPause],
        ['pause', onPlayPause],
        ['previoustrack', onPrev],
        ['nexttrack', onNext]
      ];

      for (const [action, handler] of actionHandlers) {
        try {
          navigator.mediaSession.setActionHandler(action, handler);
        } catch (error) {
          console.error(`The media session action "${action}" is not supported.`);
        }
      }

      return () => {
        for (const [action] of actionHandlers) {
          try {
            navigator.mediaSession.setActionHandler(action, null);
          } catch (error) {
             console.error(`The media session action "${action}" is not supported.`);
          }
        }
      };
    }
  }, [currentTrack, currentLanguage, onPlayPause, onNext, onPrev]);
};