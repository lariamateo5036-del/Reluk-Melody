import React from 'react';
import { translations } from '../constants';

interface InstallPWAButtonProps {
  installPrompt: any;
  currentLanguage: string;
}

const InstallPWAButton: React.FC<InstallPWAButtonProps> = ({ installPrompt, currentLanguage }) => {
  const T = (key: string) => translations[currentLanguage]?.[key] || translations.en[key];

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    // The install prompt can only be used once.
    // The browser will handle hiding the button if the app is installed.
  };

  if (!installPrompt) return null;

  return (
    <button
      onClick={handleInstallClick}
      title={T('install_app')}
      className="h-10 w-10 bg-white/10 rounded-full grid place-items-center flex-shrink-0 hover:bg-white/20 transition-colors"
      aria-label={T('install_app')}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    </button>
  );
};

export default InstallPWAButton;
