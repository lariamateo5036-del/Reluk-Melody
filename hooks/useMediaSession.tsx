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
      
      const iconURI = "data:image/svg+xml,%3Csvg width='192' height='192' viewBox='0 0 192 192' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='iconGradient' x1='0' y1='0' x2='192' y2='192' gradientUnits='userSpaceOnUse'%3E%3Cstop stop-color='%23A855F7'/%3E%3Cstop offset='1' stop-color='%234F46E5'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='192' height='192' rx='48' fill='url(%23iconGradient)'/%3E%3Cpath d='M56 117C66.6667 101.8 88 83 96 83C104 83 125.333 101.8 136 117' stroke='white' stroke-width='10' stroke-linecap='round'/%3E%3Cpath d='M40 96C53.3333 77.6 81.2 54 96 54C110.8 54 138.667 77.6 152 96' stroke='white' stroke-width='10' stroke-linecap='round' stroke-opacity='0.7'/%3E%3Cpath d='M72 138C80.6667 125.2 96 111 102 111C108 111 123.333 125.2 132 138' stroke='white' stroke-width='10' stroke-linecap='round' stroke-opacity='0.5'/%3E%3C/svg%3E";

      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.name[currentLanguage] || currentTrack.name.en,
        artist: currentTrack.short_benefit[currentLanguage] || currentTrack.short_benefit.en,
        album: albumName,
        artwork: [{ src: iconURI, sizes: '512x512', type: 'image/svg+xml' }]
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