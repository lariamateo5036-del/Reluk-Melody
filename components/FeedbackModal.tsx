import React, { useState } from 'react';
import { translations } from '../constants';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: string;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, currentLanguage }) => {
  const [step, setStep] = useState<'initial' | 'share'>('initial');
  const T = (key: string) => translations[currentLanguage]?.[key] || translations.en[key];

  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
    // Reset step for next time it opens, with a delay for the animation
    setTimeout(() => setStep('initial'), 300);
  };

  const handleShare = async () => {
    const shareData: { title: string; text: string; url?: string } = {
      title: T('share_message_title'),
      text: T('share_message_text'),
    };

    if (window.location.origin && window.location.origin.startsWith('http')) {
      shareData.url = window.location.origin;
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          console.log('Share action was canceled by the user.');
        } else {
          console.error('Share failed:', err);
        }
      }
    } else {
      alert('Sharing is not supported on this browser.');
    }
    handleClose();
  };

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[100] flex items-center justify-center p-4 transition-opacity duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-zinc-900/70 border border-white/10 rounded-3xl p-8 flex flex-col items-center text-center space-y-6"
      >
        {step === 'initial' && (
          <>
            <h3 id="feedback-modal-title" className="text-2xl font-bold">{T('feedback_title')}</h3>
            <div className="w-full flex gap-4">
              <button
                onClick={() => setStep('share')}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                <span role="img" aria-label="thumbs up" className="mr-2">👍</span>
                {T('feedback_yes')}
              </button>
              <button
                onClick={handleClose}
                className="w-full bg-zinc-700 hover:bg-zinc-600 text-white py-3 rounded-xl font-semibold transition-colors"
              >
                <span role="img" aria-label="thumbs down" className="mr-2">👎</span>
                {T('feedback_no')}
              </button>
            </div>
          </>
        )}

        {step === 'share' && (
          <>
            <h3 id="feedback-modal-title" className="text-3xl font-bold">
                <span role="img" aria-label="party popper" className="mr-2">🎉</span>
                {T('feedback_thanks_title')}
            </h3>
            <p className="text-gray-300">{T('feedback_share_prompt')}</p>
            <div className="w-full flex flex-col gap-3">
                 <button
                    onClick={handleShare}
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-xl font-semibold transition-colors"
                    >
                    {T('feedback_share_button')}
                </button>
                <button
                    onClick={handleClose}
                    className="w-full text-violet-300 hover:text-white py-2 rounded-lg font-semibold transition-colors"
                    >
                    {T('feedback_close_button')}
                </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;