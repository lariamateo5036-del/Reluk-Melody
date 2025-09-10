
import { Audio } from 'expo-av';
import { solfeggioFrequencies, binauralBeats, naturalSounds } from '../constants';
import type { PlaybackMode, NaturalSound } from '../types';

// --- IMPORTANT NOTE ---
// This native version uses pre-rendered audio files instead of real-time synthesis.
// You must create these audio files and place them in the /assets/sounds/ directory.
// - For naturalSounds: e.g., 'white_noise.mp3', 'rain.mp3' (loopable, ~15s)
// - For solfeggio: e.g., 'solfeggio_174.mp3', 'solfeggio_285.mp3' (loopable melody)
// - For binaural base tones: e.g., 'binaural_base_111.mp3', etc.

const soundAssets = {
    // Solfeggio Melodies
    solfeggio_174: require('../assets/sounds/solfeggio_174.mp3'),
    solfeggio_285: require('../assets/sounds/solfeggio_285.mp3'),
    solfeggio_396: require('../assets/sounds/solfeggio_396.mp3'),
    solfeggio_417: require('../assets/sounds/solfeggio_417.mp3'),
    solfeggio_432: require('../assets/sounds/solfeggio_432.mp3'),
    solfeggio_528: require('../assets/sounds/solfeggio_528.mp3'),
    solfeggio_639: require('../assets/sounds/solfeggio_639.mp3'),
    solfeggio_741: require('../assets/sounds/solfeggio_741.mp3'),
    solfeggio_852: require('../assets/sounds/solfeggio_852.mp3'),
    solfeggio_963: require('../assets/sounds/solfeggio_963.mp3'),
    // Binaural Base Tones
    binaural_base_111: require('../assets/sounds/binaural_base_111.mp3'),
    binaural_base_120: require('../assets/sounds/binaural_base_120.mp3'),
    binaural_base_180: require('../assets/sounds/binaural_base_180.mp3'),
    binaural_base_220: require('../assets/sounds/binaural_base_220.mp3'),
    binaural_base_300: require('../assets/sounds/binaural_base_300.mp3'),
    // Natural Sounds
    white_noise: require('../assets/sounds/white_noise.mp3'),
    pink_noise: require('../assets/sounds/pink_noise.mp3'),
    brown_noise: require('../assets/sounds/brown_noise.mp3'),
    rain: require('../assets/sounds/rain.mp3'),
    ocean_waves: require('../assets/sounds/ocean_waves.mp3'),
    wind: require('../assets/sounds/wind.mp3'),
    fire: require('../assets/sounds/fire.mp3'),
    stream: require('../assets/sounds/stream.mp3'),
    tuning_forks_spatial: require('../assets/sounds/tuning_forks_spatial.mp3'),
    forest: require('../assets/sounds/forest.mp3'),
    gentle_stream: require('../assets/sounds/gentle_stream.mp3'),
};

type SoundMap = { [key: string]: Audio.Sound };

class AudioService {
    private mainSound: Audio.Sound | null = null;
    private binauralLeft: Audio.Sound | null = null;
    private binauralRight: Audio.Sound | null = null;
    private activeMixers: SoundMap = {};
    private isInitialized = false;
    private masterVolume = 1.0;
    private mixerVolume = 0.75;

    public async init() {
        if (this.isInitialized) return;
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            interruptionModeIOS: 1, // DoNotMix
            shouldDuckAndroid: true,
            interruptionModeAndroid: 1, // DoNotMix
            playThroughEarpieceAndroid: false,
        });
        this.isInitialized = true;
    }

    private async unloadAllSounds() {
        if (this.mainSound) await this.mainSound.unloadAsync();
        if (this.binauralLeft) await this.binauralLeft.unloadAsync();
        if (this.binauralRight) await this.binauralRight.unloadAsync();
        this.mainSound = null;
        this.binauralLeft = null;
        this.binauralRight = null;
    }

    public async startPlayback(mode: PlaybackMode, index: number) {
        if (!this.isInitialized) await this.init();
        await this.stopPlayback(false);

        if (mode === 'solfeggio') {
            const track = solfeggioFrequencies[index];
            const assetKey = `solfeggio_${track.freq}` as keyof typeof soundAssets;
            const { sound } = await Audio.Sound.createAsync(soundAssets[assetKey], { isLooping: true, volume: this.masterVolume });
            this.mainSound = sound;
            await this.mainSound.playAsync();
        } else if (mode === 'binaural') {
            const track = binauralBeats[index];
            const baseAssetKey = `binaural_base_${track.baseFreq}` as keyof typeof soundAssets;
            
            // For binaural, we'll use the same base track and pan it.
            // A more accurate implementation would use separate files for left/right frequencies.
            const { sound: leftSound } = await Audio.Sound.createAsync(soundAssets[baseAssetKey], { isLooping: true, volume: this.masterVolume, pan: -1 });
            const { sound: rightSound } = await Audio.Sound.createAsync(soundAssets[baseAssetKey], { isLooping: true, volume: this.masterVolume, pan: 1 });
            
            this.binauralLeft = leftSound;
            this.binauralRight = rightSound;
            await this.binauralLeft.playAsync();
            await this.binauralRight.playAsync();
        }
    }

    public async stopPlayback(stopAll = true) {
        await this.unloadAllSounds();
        if (stopAll) {
            await this.turnOffAllMixers();
        }
    }

    public async toggleMixer(soundId: string): Promise<boolean> {
        if (!this.isInitialized) await this.init();

        const sound = naturalSounds.find(s => s.id === soundId);
        if (!sound) return false;

        if (this.activeMixers[soundId]) {
            await this.activeMixers[soundId].unloadAsync();
            delete this.activeMixers[soundId];
            return false;
        } else {
            const assetKey = soundId as keyof typeof soundAssets;
            const { sound: mixerSound } = await Audio.Sound.createAsync(soundAssets[assetKey], { isLooping: true, volume: this.mixerVolume });
            this.activeMixers[soundId] = mixerSound;
            await mixerSound.playAsync();
            return true;
        }
    }

    public async turnOffAllMixers() {
        for (const soundId in this.activeMixers) {
            await this.activeMixers[soundId].unloadAsync();
        }
        this.activeMixers = {};
    }

    public async setMixerMasterVolume(value: number) {
        this.mixerVolume = value / 100;
        for (const soundId in this.activeMixers) {
            await this.activeMixers[soundId].setVolumeAsync(this.mixerVolume);
        }
    }

    public async setMainVolume(value: number) {
        this.masterVolume = value / 100;
        if (this.mainSound) await this.mainSound.setVolumeAsync(this.masterVolume);
        if (this.binauralLeft) await this.binauralLeft.setVolumeAsync(this.masterVolume);
        if (this.binauralRight) await this.binauralRight.setVolumeAsync(this.masterVolume);
    }
}

export default new AudioService();
