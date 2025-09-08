import React from 'react';
import { translations, naturalSounds } from '../constants';

interface MixerSheetProps {
    currentLanguage: string;
    activeMixers: Set<string>;
    onToggleMixer: (id: string) => void;
    onContinue: () => void;
    onMasterVolumeChange: (value: number) => void;
    onMainVolumeChange: (value: number) => void;
}

const MixerSheet: React.FC<MixerSheetProps> = ({ currentLanguage, activeMixers, onToggleMixer, onContinue, onMasterVolumeChange, onMainVolumeChange }) => {
    const T = (key: string) => translations[currentLanguage]?.[key] || translations.en[key];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[100] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-zinc-900/70 border border-white/10 rounded-3xl p-6 flex flex-col max-h-[90vh]">
                <h3 className="text-2xl font-bold text-center mb-2">{T('mixer_onboarding_title')}</h3>
                <p className="text-gray-300 mb-6 text-center">{T('mixer_onboarding_subtitle')}</p>
                
                <div className="overflow-y-auto pr-2 flex-grow">
                    <div className="grid grid-cols-4 gap-4 mb-4">
                        {naturalSounds.map(sound => (
                            <button
                                key={sound.id}
                                onClick={() => onToggleMixer(sound.id)}
                                aria-pressed={activeMixers.has(sound.id)}
                                aria-label={sound.name[currentLanguage] || sound.name.en}
                                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${activeMixers.has(sound.id) ? 'bg-violet-600/70 text-white' : 'bg-gray-900/50'}`}
                            >
                                <div className="h-6 w-6" dangerouslySetInnerHTML={{ __html: sound.icon }} />
                                <span className="text-xs mt-1 text-center">{sound.name[currentLanguage] || sound.name.en}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-700 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <span className="text-sm w-28 text-gray-300">{T('main_volume')}</span>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            defaultValue="78"
                            onChange={e => onMainVolumeChange(parseInt(e.target.value, 10))}
                            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-thumb"
                            aria-label={T('main_volume')}
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm w-28 text-gray-300">{T('background_volume')}</span>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            defaultValue="75"
                            onChange={e => onMasterVolumeChange(parseInt(e.target.value, 10))}
                            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-thumb"
                            aria-label={T('background_volume')}
                        />
                    </div>
                </div>
                <button onClick={onContinue} className="w-full bg-violet-500 text-white py-3 rounded-lg mt-6 font-semibold flex-shrink-0">{T('start_listening_btn')}</button>
            </div>
            <style>{`
                .range-thumb::-webkit-slider-thumb {
                    -webkit-appearance: none; appearance: none;
                    width: 20px; height: 20px; background: #fff; border-radius: 50%;
                    cursor: pointer; margin-top: -8px;
                }
            `}</style>
        </div>
    );
};

export default MixerSheet;