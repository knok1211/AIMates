/* ==========================================
   Web Audio API Sound & Synthesizer Engine
   ========================================== */
class AudioEngine {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.bgmOscs = [];
        this.isBgmPlaying = false;
        this.bgmTimer = null;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleSound() {
        this.enabled = !this.enabled;
        if (!this.enabled && this.isBgmPlaying) {
            this.stopBGM();
        }
        return this.enabled;
    }

    // Play procedural tone
    playTone(freq, type = 'sine', duration = 0.2, gainVal = 0.1) {
        if (!this.enabled) return;
        this.init();
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            console.warn(e);
        }
    }

    // Sound FX: Jump
    playJump() {
        if (!this.enabled) return;
        this.init();
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(150, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.15);

            gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.15);
        } catch (e) {}
    }

    // Sound FX: Character Switch
    playSwitch() {
        this.playTone(523.25, 'sine', 0.1, 0.1); // C5
        setTimeout(() => this.playTone(659.25, 'sine', 0.1, 0.1), 50); // E5
    }

    // Sound FX: Gawon Eye Contact (Stun Laser)
    playEyeContact() {
        if (!this.enabled) return;
        this.init();
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(800, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.4);

            gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.4);
        } catch (e) {}
    }

    // Sound FX: Hamdori Taunt
    playTaunt() {
        this.playTone(440, 'square', 0.08, 0.08);
        setTimeout(() => this.playTone(880, 'square', 0.12, 0.1), 80);
    }

    // Sound FX: Lulu Shalala Bloom Chime
    playShalala() {
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                this.playTone(freq, 'sine', 0.25, 0.08);
            }, idx * 60);
        });
    }

    // Sound FX: Pickup Item
    playPickup() {
        this.playTone(587.33, 'triangle', 0.08, 0.15); // D5
        setTimeout(() => this.playTone(880.00, 'triangle', 0.18, 0.15), 60); // A5
    }

    // Sound FX: Stage Victory Fanfare
    playVictory() {
        const arpeggio = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
        arpeggio.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 'triangle', 0.3, 0.12), i * 90);
        });
    }

    // DJ Effect 1: Beat Drop
    playBeatDrop() {
        if (!this.enabled) return;
        this.init();
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(250, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.5);

            gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.5);
        } catch (e) {}
    }

    // DJ Effect 2: Mirrorball Sparkle
    playMirrorball() {
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                const randomFreq = 1200 + Math.random() * 1200;
                this.playTone(randomFreq, 'sine', 0.1, 0.06);
            }, i * 40);
        }
    }

    // DJ Effect 3: Laser Bloom
    playLaserBloom() {
        this.playShalala();
        this.playEyeContact();
    }

    // Start Stage Synth BGM Loop
    startBGM(isDjMode = false) {
        if (!this.enabled) return;
        this.init();
        this.stopBGM();

        this.isBgmPlaying = true;
        let step = 0;
        
        // Procedural loop
        const bassNotes = isDjMode ? [130.81, 130.81, 174.61, 196.00] : [98.00, 110.00, 98.00, 87.31];
        const melodyNotes = isDjMode ? [523.25, 659.25, 783.99, 659.25] : [329.63, 293.66, 329.63, 261.63];

        this.bgmTimer = setInterval(() => {
            if (!this.isBgmPlaying || !this.enabled) return;
            const bFreq = bassNotes[step % bassNotes.length];
            const mFreq = melodyNotes[step % melodyNotes.length];

            this.playTone(bFreq, isDjMode ? 'sawtooth' : 'sine', 0.25, isDjMode ? 0.08 : 0.04);
            if (step % 2 === 0) {
                this.playTone(mFreq, 'triangle', 0.2, isDjMode ? 0.06 : 0.03);
            }
            step++;
        }, isDjMode ? 220 : 450);
    }

    stopBGM() {
        this.isBgmPlaying = false;
        if (this.bgmTimer) {
            clearInterval(this.bgmTimer);
            this.bgmTimer = null;
        }
    }
}

const audio = new AudioEngine();
