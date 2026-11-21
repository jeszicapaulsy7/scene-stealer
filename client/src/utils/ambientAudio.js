// Built-in Web Audio API ambient soundscape engine
// Supports: rain, cafe, ocean, piano, lofi — zero external dependencies, works 100% offline.

function createNoiseBuffer(ctx, durationSeconds = 4, type = "pink") {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * durationSeconds;
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    if (type === "brown") {
        let lastOut = 0.0;
        for (let i = 0; i < length; i++) {
            const white = Math.random() * 2 - 1;
            data[i] = (lastOut + 0.02 * white) / 1.02;
            lastOut = data[i];
            data[i] *= 3.0;
        }
    } else {
        // Pink noise
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < length; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
            b6 = white * 0.115926;
        }
    }
    return buffer;
}

class AmbientSoundEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.tracks = {};
    }

    ensureContext() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.85;
            this.masterGain.connect(this.ctx.destination);
        }
        if (this.ctx.state === "suspended") {
            this.ctx.resume();
        }
    }

    startTrack(id, volume = 0.45) {
        this.ensureContext();
        if (this.tracks[id]) {
            this.setTrackVolume(id, volume);
            return;
        }

        const ctx = this.ctx;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(volume * 0.55, ctx.currentTime + 0.6);
        gain.connect(this.masterGain);

        const nodes = [];
        const timers = [];

        if (id === "rain") {
            const src = ctx.createBufferSource();
            src.buffer = createNoiseBuffer(ctx, 4, "pink");
            src.loop = true;

            const bp = ctx.createBiquadFilter();
            bp.type = "bandpass";
            bp.frequency.value = 1100;
            bp.Q.value = 0.6;

            const lp = ctx.createBiquadFilter();
            lp.type = "lowpass";
            lp.frequency.value = 2800;

            src.connect(bp);
            bp.connect(lp);
            lp.connect(gain);
            src.start();
            nodes.push(src, bp, lp);
        } else if (id === "ocean") {
            const src = ctx.createBufferSource();
            src.buffer = createNoiseBuffer(ctx, 5, "brown");
            src.loop = true;

            const lp = ctx.createBiquadFilter();
            lp.type = "lowpass";
            lp.frequency.value = 480;

            const waveGain = ctx.createGain();
            waveGain.gain.value = 0.55;

            const lfo = ctx.createOscillator();
            lfo.type = "sine";
            lfo.frequency.value = 0.12; // ~8s gentle wave cycle
            const lfoDepth = ctx.createGain();
            lfoDepth.gain.value = 0.35;

            lfo.connect(lfoDepth);
            lfoDepth.connect(waveGain.gain);

            src.connect(lp);
            lp.connect(waveGain);
            waveGain.connect(gain);
            src.start();
            lfo.start();
            nodes.push(src, lp, waveGain, lfo, lfoDepth);
        } else if (id === "cafe") {
            const src = ctx.createBufferSource();
            src.buffer = createNoiseBuffer(ctx, 5, "brown");
            src.loop = true;

            const bp = ctx.createBiquadFilter();
            bp.type = "bandpass";
            bp.frequency.value = 420;
            bp.Q.value = 0.9;

            const warmth = ctx.createBiquadFilter();
            warmth.type = "lowshelf";
            warmth.frequency.value = 220;
            warmth.gain.value = 4;

            src.connect(bp);
            bp.connect(warmth);
            warmth.connect(gain);
            src.start();
            nodes.push(src, bp, warmth);
        } else if (id === "piano") {
            // Soft ambient pentatonic chords played gently every 3.6 seconds
            const chords = [
                [261.63, 329.63, 392.0, 493.88], // Cmaj7
                [220.0, 261.63, 329.63, 392.0],  // Am7
                [174.61, 220.0, 261.63, 329.63], // Fmaj7
                [196.0, 246.94, 293.66, 392.0],  // G6
            ];
            let step = 0;

            const playChord = () => {
                if (!this.ctx || !this.tracks[id]) return;
                const now = ctx.currentTime;
                const chord = chords[step % chords.length];
                step++;

                chord.forEach((freq, idx) => {
                    const osc = ctx.createOscillator();
                    const noteGain = ctx.createGain();
                    const lp = ctx.createBiquadFilter();

                    osc.type = "triangle";
                    osc.frequency.value = freq;
                    lp.type = "lowpass";
                    lp.frequency.value = 900;

                    const start = now + idx * 0.14;
                    noteGain.gain.setValueAtTime(0.0001, start);
                    noteGain.gain.linearRampToValueAtTime(0.09, start + 0.15);
                    noteGain.gain.exponentialRampToValueAtTime(0.0008, start + 3.4);

                    osc.connect(lp);
                    lp.connect(noteGain);
                    noteGain.connect(gain);

                    osc.start(start);
                    osc.stop(start + 3.5);
                });
            };

            playChord();
            const timer = window.setInterval(playChord, 3600);
            timers.push(timer);
        } else if (id === "lofi") {
            // Soft vinyl warmth + warm chill lo-fi chord pulse
            const vinyl = ctx.createBufferSource();
            vinyl.buffer = createNoiseBuffer(ctx, 4, "pink");
            vinyl.loop = true;

            const hp = ctx.createBiquadFilter();
            hp.type = "highpass";
            hp.frequency.value = 1800;

            const vinylGain = ctx.createGain();
            vinylGain.gain.value = 0.08;

            vinyl.connect(hp);
            hp.connect(vinylGain);
            vinylGain.connect(gain);
            vinyl.start();
            nodes.push(vinyl, hp, vinylGain);

            const lofiChords = [
                [196.0, 246.94, 293.66, 369.99], // Gmaj7
                [164.81, 196.0, 246.94, 293.66], // Em7
                [146.83, 185.0, 220.0, 261.63],  // D7
                [130.81, 164.81, 196.0, 246.94], // Cmaj7
            ];
            let idx = 0;

            const playLofiBar = () => {
                if (!this.ctx || !this.tracks[id]) return;
                const now = ctx.currentTime;
                const chord = lofiChords[idx % lofiChords.length];
                idx++;

                chord.forEach((freq) => {
                    const osc = ctx.createOscillator();
                    const lp = ctx.createBiquadFilter();
                    const noteGain = ctx.createGain();

                    osc.type = "sine";
                    osc.frequency.value = freq;
                    lp.type = "lowpass";
                    lp.frequency.value = 650;

                    noteGain.gain.setValueAtTime(0.0001, now);
                    noteGain.gain.linearRampToValueAtTime(0.085, now + 0.35);
                    noteGain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);

                    osc.connect(lp);
                    lp.connect(noteGain);
                    noteGain.connect(gain);

                    osc.start(now);
                    osc.stop(now + 2.9);
                });
            };

            playLofiBar();
            const timer = window.setInterval(playLofiBar, 2800);
            timers.push(timer);
        }

        this.tracks[id] = { gain, nodes, timers };
    }

    setTrackVolume(id, volume) {
        const track = this.tracks[id];
        if (!track || !this.ctx) return;
        track.gain.gain.setTargetAtTime(volume * 0.55, this.ctx.currentTime, 0.1);
    }

    stopTrack(id) {
        const track = this.tracks[id];
        if (!track) return;

        track.timers.forEach((t) => window.clearInterval(t));
        track.nodes.forEach((node) => {
            try {
                if (typeof node.stop === "function") node.stop();
                node.disconnect();
            } catch {
                // Ignore already stopped nodes
            }
        });
        try {
            track.gain.disconnect();
        } catch {
            // Ignore
        }
        delete this.tracks[id];
    }

    stopAll() {
        Object.keys(this.tracks).forEach((id) => this.stopTrack(id));
    }
}

export const ambientEngine = new AmbientSoundEngine();
