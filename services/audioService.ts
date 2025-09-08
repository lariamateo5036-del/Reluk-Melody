import { solfeggioFrequencies, binauralBeats, naturalSounds } from '../constants';
import type { PlaybackMode, NaturalSound, SolfeggioFrequency, BinauralBeat } from '../types';

declare const Tone: any;

const PHI = (1 + Math.sqrt(5)) / 2;

class AudioService {
    private nodes: any = {};
    private scheduler: any = { id: null, nextNoteTime: 0, stepIndex: 0, tempo: 68 };
    private activeMixers: { [key: string]: { components: any[], volumeNode: any } } = {};
    private isInitialized = false;

    private async init() {
        if (this.isInitialized) return;
        if (typeof Tone === 'undefined' || (typeof Tone.start !== 'function' && Tone.context.state !== 'running')) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        await Tone.start();
        const masterGain = new Tone.Volume(-9).toDestination();
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

    public async start(mode: PlaybackMode, index: number) {
        await this.init();
        this.stop(false);

        const baseFreqData = mode === 'solfeggio' ? solfeggioFrequencies[index] : binauralBeats[index];
        const f0 = 'freq' in baseFreqData ? baseFreqData.freq : baseFreqData.baseFreq;
        
        this.scheduler.phiScale = this.buildPhiScale(f0, 14);
        this.scheduler.fibSequence = this.fibonacci(8);
        this.scheduler.stepIndex = 0;
        this.scheduler.nextNoteTime = Tone.now() + 0.1;

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

        if (this.scheduler.id) clearInterval(this.scheduler.id);
        this.scheduler.id = setInterval(() => this.schedulerTick(mode, index), 30);
    }

    private schedulerTick(mode: PlaybackMode, index: number) {
        if (!this.isInitialized) return;
        const spb = 60 / this.scheduler.tempo;
        const ahead = 0.15, phiLens = [1, PHI / 2, 1 / PHI];
        while (this.scheduler.nextNoteTime < Tone.now() + ahead) {
            const beats = phiLens[this.scheduler.stepIndex % phiLens.length];
            const dur = beats * spb;
            const f = this.nextFreq();
            const preset = mode === 'solfeggio' ? solfeggioFrequencies[index] : binauralBeats[index];
            this.scheduleNote(this.scheduler.nextNoteTime, f, dur, preset);
            this.scheduler.nextNoteTime += dur;
        }
    }
    
    private scheduleNote(time: number, freq: number, dur: number, preset: SolfeggioFrequency | BinauralBeat) {
        if (!this.nodes.mainSynth) return;
        const lowpass_hz = (preset as SolfeggioFrequency).synth_hint?.lowpass_hz;
        this.nodes.mainFilter.frequency.rampTo(lowpass_hz || 9000, 0.1, time);
        this.nodes.mainSynth.triggerAttackRelease(freq, dur * 0.95, time);
    }

    public stop(stopAll = true) {
        if (this.scheduler.id) {
            clearInterval(this.scheduler.id);
            this.scheduler.id = null;
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
    
    private createMixerNode(sound: NaturalSound) {
        if (!this.nodes.mixerMasterVolume) return { components: [], volumeNode: null };
        
        let components: any[] = [];
        const volumeNode = new Tone.Volume(0).connect(this.nodes.mixerMasterVolume);
        components.push(volumeNode);

        switch (sound.id) {
             case 'white_noise': case 'pink_noise': case 'brown_noise': { const n=new Tone.Noise(sound.noise_type).start(); n.volume.value=-18; n.connect(volumeNode); components.push(n); break; }
             case 'rain': { const rb=new Tone.Noise("pink").start(); const bf=new Tone.Filter(1500,"lowpass").connect(volumeNode); rb.connect(bf); rb.volume.value=-20; const ds=new Tone.MembraneSynth({pitchDecay:0.01,octaves:6,envelope:{attack:0.001,decay:0.15,sustain:0,release:0.2}}).connect(volumeNode); ds.volume.value=-18; const dp=new Tone.Pattern((t: any)=>{ds.triggerAttackRelease(`C${Math.floor(Math.random()*3)+5}`,'32n',t,Math.random()*0.4+0.6);},["8n","16n","8n","16n","16n"],"random").start(0); if(Tone.Transport.state!=='started')Tone.Transport.start(); components.push(rb,bf,ds,dp); break;}
             case 'ocean_waves': { const n=new Tone.Noise("pink").start(); const f=new Tone.Filter(800,'lowpass'); const l=new Tone.LFO("0.2Hz",-28,-15).start().connect(n.volume); n.connect(f).connect(volumeNode); components.push(n,l,f); break;}
             case 'wind': { const wn=new Tone.Noise("brown").start(); wn.volume.value=-22; const wf=new Tone.AutoFilter({frequency:"4n",baseFrequency:300,octaves:5}).connect(volumeNode).start(); wn.connect(wf); if(Tone.Transport.state!=='started')Tone.Transport.start(); components.push(wn,wf); break;}
             case 'fire': { const r=new Tone.Noise("brown").start(); r.volume.value=-26; const rf=new Tone.Filter(400,"lowpass").connect(volumeNode); r.connect(rf); const c=new Tone.Noise("white").start(); const ce=new Tone.AmplitudeEnvelope({attack:0.005,decay:0.08,sustain:0,release:0.1}).connect(volumeNode); c.connect(ce); c.volume.value=-12; const cl=new Tone.Loop((t: any)=>{ce.triggerAttackRelease('32n',t,Math.random());},"16n").start(0); cl.humanize=true; if(Tone.Transport.state!=='started')Tone.Transport.start(); components.push(r,rf,c,ce,cl); break;}
             case 'stream': { const sn=new Tone.Noise('white').start(); sn.volume.value=-20; const sf=new Tone.AutoFilter({frequency:"2n",type:"sine",depth:0.8,baseFrequency:1500,octaves:2.5,filter:{type:"bandpass",Q:3}}).connect(volumeNode).start(); sn.connect(sf); if(Tone.Transport.state!=='started')Tone.Transport.start(); components.push(sn,sf); break;}
             case 'tuning_forks_spatial': { const mf=new Tone.Filter(10000,"lowpass").connect(volumeNode); volumeNode.volume.value=-9; const s={oscillator:{type:'sine',partials:[1,0,0.1,0,0.05]},envelope:{attack:0.1,decay:6,sustain:0.1,release:8}}; const p1=new Tone.Panner3D().connect(mf); const p2=new Tone.Panner3D().connect(mf); const s1=new Tone.Synth(s).connect(p1); const s2=new Tone.Synth(s).connect(p2); const ml=new Tone.Loop((t: any)=>{p1.positionX.rampTo((Math.random()-0.5)*3,0.5);p2.positionX.rampTo((Math.random()-0.5)*3,0.5);},"0.5s").start(0); const sl=new Tone.Loop((t: any)=>{s1.triggerAttack(440,t); s2.triggerAttack(441.5,t);},"25s").start(0); sl.humanize=true; components.push(mf,p1,p2,s1,s2,ml,sl); if(Tone.Transport.state!=='started')Tone.Transport.start(); break;}
        }
        return { components, volumeNode };
    }

    public async toggleMixer(soundId: string): Promise<boolean> {
        await this.init();
        const sound = naturalSounds.find(s => s.id === soundId);
        if (!sound) return false;

        if (this.activeMixers[soundId]) {
            this.activeMixers[soundId].components.forEach(c => c.dispose());
            delete this.activeMixers[soundId];
            return false;
        } else {
            this.activeMixers[soundId] = this.createMixerNode(sound);
            return true;
        }
    }

    public turnOffAllMixers() {
        Object.values(this.activeMixers).forEach(({ components }) => components.forEach(c => c.dispose()));
        this.activeMixers = {};
        if (typeof Tone !== 'undefined' && Tone.Transport.state === 'started' && !this.scheduler.id) {
             Tone.Transport.stop();
        }
    }

    public setMixerMasterVolume(value: number) {
        if (this.nodes.mixerMasterVolume) {
            // Converts 0-100 slider to a more logarithmic -35dB to 0dB range
            const db = (value / 100) * 35 - 35;
            this.nodes.mixerMasterVolume.volume.value = db;
        }
    }

    public setMainVolume(value: number) {
        if (this.nodes.masterGain) {
            // Converts 0-100 slider to a logarithmic -40dB to 0dB range
            const db = (value / 100) * 40 - 40;
            this.nodes.masterGain.volume.value = db;
        }
    }
    
    public setMixerSoundVolume(soundId: string, value: number) {
        if (this.activeMixers[soundId] && this.activeMixers[soundId].volumeNode) {
            // Converts 0-100 slider to a more logarithmic -30dB to 6dB range
            const db = (value / 100) * 36 - 30;
            this.activeMixers[soundId].volumeNode.volume.value = db;
        }
    }
}

export default new AudioService();