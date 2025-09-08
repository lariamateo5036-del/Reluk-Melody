

import { solfeggioFrequencies, binauralBeats, naturalSounds } from '../constants';
import type { PlaybackMode, NaturalSound, SolfeggioFrequency, BinauralBeat } from '../types';

declare const Tone: any;

const PHI = (1 + Math.sqrt(5)) / 2;

class AudioService {
    private nodes: any = {};
    private scheduler: any = {
        loop: null,
        phiScale: [],
        fibSequence: [],
        stepIndex: 0,
        tempo: 68
    };
    private activeMixers: { [key: string]: { player: any, volumeNode: any } } = {};
    private isInitialized = false;
    private audioElement: HTMLAudioElement | null = null;
    private isPlaying = false;
    private mixerBufferCache: Map<string, AudioBuffer> = new Map();

    public async init(audioElement: HTMLAudioElement) {
        if (this.isInitialized || !audioElement) return;
        this.audioElement = audioElement;

        if (typeof Tone === 'undefined' || (typeof Tone.start !== 'function' && Tone.context.state !== 'running')) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        await Tone.start();
        
        const mediaStreamDestination = Tone.context.createMediaStreamDestination();
        this.audioElement.srcObject = mediaStreamDestination.stream;
        this.audioElement.muted = false;
        (this.audioElement as any).playsInline = true;

        const masterGain = new Tone.Volume(-9).connect(mediaStreamDestination);
        const mainReverb = new Tone.Reverb({ decay: 10, wet: 0.5 }).connect(masterGain);
        const mainFilter = new Tone.Filter(9000, "lowpass").connect(mainReverb);
        const mainPanner = new Tone.AutoPanner("2n").connect(mainFilter).start();
        const mainSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'sine' },
            envelope: { attack: 0.02, decay: 0.8, sustain: 0.2, release: 1.5 },
        }).connect(mainPanner);

        const mixerMasterVolume = new Tone.Volume(-12).connect(masterGain);

        this.nodes = { masterGain, mainReverb, mainFilter, mainPanner, mainSynth, mixerMasterVolume };
        this.isInitialized = true;
    }

    private buildPhiScale(base: number, steps = 14) {
        const arr = [];
        const half = Math.floor(steps / 2);
        for (let n = -half; n <= half; n++) arr.push(base * Math.pow(PHI, n));
        return arr;
    }

    private fibonacci(n = 8) {
        const a = [1, 1];
        while (a.length < n) a.push(a[a.length - 1] + a[a.length - 2]);
        return a.slice(0, n);
    }

    private nextFreq() {
        const idx = this.scheduler.stepIndex;
        const fibStep = this.scheduler.fibSequence[idx % this.scheduler.fibSequence.length];
        const dir = (Math.floor(idx / this.scheduler.fibSequence.length) % 2 === 0) ? 1 : -1;
        const center = Math.floor(this.scheduler.phiScale.length / 2);
        const pos = Math.max(0, Math.min(this.scheduler.phiScale.length - 1, center + dir * fibStep));
        this.scheduler.stepIndex++;
        return this.scheduler.phiScale[pos];
    }

    public startPlayback(mode: PlaybackMode, index: number) {
        if (!this.isInitialized) return;
        this.stopPlayback(false); 
        this.isPlaying = true;

        const baseFreqData = mode === 'solfeggio' ? solfeggioFrequencies[index] : binauralBeats[index];
        const f0 = 'freq' in baseFreqData ? baseFreqData.freq : baseFreqData.baseFreq;
        
        this.scheduler.phiScale = this.buildPhiScale(f0, 14);
        this.scheduler.fibSequence = this.fibonacci(8);
        this.scheduler.stepIndex = 0;

        if (mode === 'binaural') {
            const { left_freq_hz, right_freq_hz } = (baseFreqData as BinauralBeat).synth_hint;
            const pannerL = new Tone.Panner(-1).connect(this.nodes.masterGain);
            const pannerR = new Tone.Panner(1).connect(this.nodes.masterGain);
            const oscEnvelope = { attack: 3, decay: 1, sustain: 1, release: 3 };
            this.nodes.binauralOscL = new Tone.Synth({ oscillator: { type: 'sine' }, envelope: oscEnvelope }).connect(pannerL);
            this.nodes.binauralOscR = new Tone.Synth({ oscillator: { type: 'sine' }, envelope: oscEnvelope }).connect(pannerR);
            this.nodes.binauralOscL.triggerAttack(left_freq_hz);
            this.nodes.binauralOscR.triggerAttack(right_freq_hz);
            this.nodes.mainSynth.volume.value = -18;
        } else {
            this.nodes.mainSynth.volume.value = -9;
        }

        this.scheduler.loop = new Tone.Loop(time => {
            const spb = 60 / this.scheduler.tempo;
            const phiLens = [1, PHI / 2, 1 / PHI];
            const beats = phiLens[this.scheduler.stepIndex % phiLens.length];
            const duration = beats * spb;

            const freq = this.nextFreq();
            const preset = mode === 'solfeggio' ? solfeggioFrequencies[index] : binauralBeats[index];
            
            this.scheduleNote(time, freq, duration, preset);
            
            if (this.scheduler.loop) {
                this.scheduler.loop.interval = duration;
            }
        }, 1).start(0.1);

        if (Tone.Transport.state !== 'started') {
            Tone.Transport.start();
        }
    }
    
    private scheduleNote(time: number, freq: number, dur: number, preset: SolfeggioFrequency | BinauralBeat) {
        if (!this.nodes.mainSynth) return;
        const lowpass_hz = (preset as SolfeggioFrequency).synth_hint?.lowpass_hz;
        this.nodes.mainFilter.frequency.rampTo(lowpass_hz || 9000, 0.1, time);
        this.nodes.mainSynth.triggerAttackRelease(freq, dur * 0.95, time);
    }

    public stopPlayback(stopAll = true) {
        this.isPlaying = false;
        
        if (this.scheduler.loop) {
            this.scheduler.loop.dispose();
            this.scheduler.loop = null;
        }

        if (this.nodes.mainSynth) {
            this.nodes.mainSynth.releaseAll();
        }
        ['binauralOscL', 'binauralOscR'].forEach(key => {
            if (this.nodes[key]) {
                this.nodes[key].dispose();
                delete this.nodes[key];
            }
        });
        if (stopAll) {
            this.turnOffAllMixers();
        }
    }

    private async _renderSoundToBuffer(sound: NaturalSound): Promise<AudioBuffer> {
        const DURATION = 15;
        const buffer = await Tone.Offline(async () => {
            switch (sound.id) {
                case 'white_noise': case 'pink_noise': case 'brown_noise': { new Tone.Noise(sound.noise_type).toDestination().start(0).volume.value = -18; break; }
                case 'rain': { const r=new Tone.Noise("pink").toDestination(); r.volume.value=-20; const f=new Tone.Filter(1500,"lowpass").connect(r.destination); r.connect(f); r.start(0); const d=new Tone.MembraneSynth({pitchDecay:0.01,octaves:6,envelope:{attack:0.001,decay:0.15,sustain:0,release:0.2}}).toDestination(); d.volume.value=-18; new Tone.Pattern((t,n)=>{d.triggerAttackRelease(n,'32n',t,Math.random()*.4+.6);},["C5","C6","C5","C6","C6"],"random").start(0).playbackRate=1.5; Tone.Transport.start(); break; }
                case 'ocean_waves': { const n=new Tone.Noise("pink").toDestination(); new Tone.Filter(800,'lowpass').connect(n.destination); new Tone.LFO("0.2Hz",-28,-15).start().connect(n.volume); n.start(0); break; }
                case 'wind': { const n=new Tone.Noise("brown").toDestination(); n.volume.value=-22; const f=new Tone.AutoFilter({frequency:"4n",baseFrequency:300,octaves:5}).toDestination().start(); n.connect(f); n.start(0); Tone.Transport.start(); break; }
                case 'fire': { const r=new Tone.Noise("brown").toDestination(); r.volume.value=-26; new Tone.Filter(400,"lowpass").connect(r.destination); r.start(0); const c=new Tone.Noise("white"); c.volume.value=-12; const e=new Tone.AmplitudeEnvelope({attack:0.005,decay:0.08,sustain:0,release:0.1}).toDestination(); c.connect(e); new Tone.Loop(t=>{e.triggerAttackRelease('32n',t,Math.random());},"16n").start(0).humanize=true; c.start(0); Tone.Transport.start(); break; }
                case 'stream': { const n=new Tone.Noise('white').toDestination(); n.volume.value=-20; const f=new Tone.AutoFilter({frequency:"2n",type:"sine",depth:0.8,baseFrequency:1500,octaves:2.5,filter:{type:"bandpass",Q:3}}).toDestination().start(); n.connect(f); n.start(0); Tone.Transport.start(); break; }
                case 'tuning_forks_spatial': { const f=new Tone.Filter(10000,"lowpass").toDestination(); const s={oscillator:{type:'sine',partials:[1,0,0.1,0,0.05]},envelope:{attack:0.1,decay:6,sustain:0.1,release:8}}; const p1=new Tone.Panner(-0.8).connect(f); const p2=new Tone.Panner(0.8).connect(f); const s1=new Tone.Synth(s).connect(p1); const s2=new Tone.Synth(s).connect(p2); new Tone.Loop(t=>{s1.triggerAttack(440,t);s2.triggerAttack(441.5,t);},"25s").start(0).humanize=true; Tone.Transport.start(); break; }
                case 'forest': { const w=new Tone.Noise("brown").toDestination(); w.volume.value=-30; const wf=new Tone.AutoFilter("8n",200,4).toDestination().start(); w.connect(wf); w.start(0); const c=new Tone.Noise("white"); c.volume.value=-25; const e=new Tone.AmplitudeEnvelope({attack:0.001,decay:0.04,sustain:0,release:0.05}).toDestination(); c.connect(e); new Tone.Loop(t=>{e.triggerAttackRelease('64n',t,Math.random()*.5+.5);},"8n").start(0).humanize="32n"; c.start(0); Tone.Transport.start(); break; }
                case 'gentle_stream': { const n=new Tone.Noise('pink').toDestination(); n.volume.value=-22; const f=new Tone.Filter(1600, "lowpass").toDestination(); n.connect(f); n.start(0); break; }
            }
        }, DURATION);
        if (Tone.Transport.state === 'started') { Tone.Transport.stop(); Tone.Transport.cancel(); }
        return buffer;
    }

    private async _getOrRenderSound(sound: NaturalSound): Promise<AudioBuffer> {
        if (this.mixerBufferCache.has(sound.id)) {
            return this.mixerBufferCache.get(sound.id)!;
        }
        const buffer = await this._renderSoundToBuffer(sound);
        this.mixerBufferCache.set(sound.id, buffer);
        return buffer;
    }

    public async toggleMixer(soundId: string): Promise<boolean> {
        if (!this.isInitialized) await this.init(this.audioElement!);

        const sound = naturalSounds.find(s => s.id === soundId);
        if (!sound) return false;

        if (this.activeMixers[soundId]) {
            this.activeMixers[soundId].player.dispose();
            this.activeMixers[soundId].volumeNode.dispose();
            delete this.activeMixers[soundId];
            return false;
        } else {
            const buffer = await this._getOrRenderSound(sound);
            if (!buffer) return false;

            const volumeNode = new Tone.Volume(0).connect(this.nodes.mixerMasterVolume);
            const player = new Tone.Player(buffer).connect(volumeNode);
            player.loop = true;
            player.start();
            
            this.activeMixers[soundId] = { player, volumeNode };
            return true;
        }
    }

    public turnOffAllMixers() {
        Object.values(this.activeMixers).forEach(({ player, volumeNode }) => {
            player.dispose();
            volumeNode.dispose();
        });
        this.activeMixers = {};
        if (typeof Tone !== 'undefined' && Tone.Transport.state === 'started' && !this.isPlaying) {
             Tone.Transport.stop();
        }
    }

    public setMixerMasterVolume(value: number) {
        if (this.nodes.mixerMasterVolume) {
            const db = (value / 100) * 35 - 35;
            this.nodes.mixerMasterVolume.volume.value = db;
        }
    }

    public setMainVolume(value: number) {
        if (this.nodes.masterGain) {
            const db = (value / 100) * 40 - 40;
            this.nodes.masterGain.volume.value = db;
        }
    }
}

export default new AudioService();