import React, { useState } from 'react';
import { translations } from '../constants';

interface SleepTimerSheetProps {
    currentLanguage: string;
    onTimerSelected: (minutes: number | null) => void;
}

const SleepTimerSheet: React.FC<SleepTimerSheetProps> = ({ currentLanguage, onTimerSelected }) => {
    const T = (key: string) => translations[currentLanguage]?.[key] || translations.en[key];
    const [customMinutes, setCustomMinutes] = useState('20');

    const handleSetCustomTimer = () => {
        const minutes = parseInt(customMinutes, 10);
        if (!isNaN(minutes) && minutes > 0) {
            onTimerSelected(minutes);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[100] flex items-center justify-center p-4">
            <div
                onClick={e => e.stopPropagation()}
                className="w-full max-w-sm bg-zinc-900/70 border border-white/10 rounded-3xl p-8 flex flex-col space-y-6"
            >
                <div className="text-center">
                    <h3 className="text-3xl font-bold mb-2">{T('select_sleep_timer_title')}</h3>
                    <p className="text-gray-300">{T('select_sleep_timer_subtitle')}</p>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                    <button onClick={() => onTimerSelected(15)} className="bg-zinc-800 p-4 rounded-xl hover:bg-zinc-700 transition-colors font-semibold">{T('sleep_timer_15m')}</button>
                    <button onClick={() => onTimerSelected(30)} className="bg-zinc-800 p-4 rounded-xl hover:bg-zinc-700 transition-colors font-semibold">{T('sleep_timer_30m')}</button>
                    <button onClick={() => onTimerSelected(60)} className="bg-zinc-800 p-4 rounded-xl hover:bg-zinc-700 transition-colors font-semibold">{T('sleep_timer_60m')}</button>
                </div>

                <div className="pt-2 border-t border-white/10">
                     <h4 className="text-sm font-semibold text-gray-400 text-center mb-4">{T('sleep_timer_custom')}</h4>
                     <div className="flex gap-4 items-stretch">
                        <input
                            type="number"
                            value={customMinutes}
                            onChange={(e) => setCustomMinutes(e.target.value)}
                            className="flex-grow w-full bg-black/30 p-4 rounded-xl text-center text-xl font-mono appearance-none"
                            placeholder="Minutes"
                            aria-label="Custom minutes for sleep timer"
                        />
                        <button 
                            onClick={handleSetCustomTimer} 
                            className="bg-violet-600 hover:bg-violet-700 text-white px-8 rounded-xl font-bold transition-colors flex-shrink-0"
                        >
                            {T('sleep_timer_set')}
                        </button>
                     </div>
                </div>

                <button 
                    onClick={() => onTimerSelected(null)} 
                    className="w-full text-violet-300 hover:text-white py-2 rounded-lg font-semibold transition-colors"
                >
                    {T('continue_without_timer')}
                </button>
            </div>
            <style>{`
                input[type=number]::-webkit-inner-spin-button, 
                input[type=number]::-webkit-outer-spin-button { 
                  -webkit-appearance: none; 
                  margin: 0; 
                }
                input[type=number] {
                  -moz-appearance: textfield;
                }
            `}</style>
        </div>
    );
};

export default SleepTimerSheet;
