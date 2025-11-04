
// Create a single AudioContext to be reused.
let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
    if (typeof window !== 'undefined' && !audioContext) {
        try {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser.", e);
            return null;
        }
    }
    return audioContext;
};

// Generic function to play a sound with specific parameters
const playSound = (type: 'sine' | 'square' | 'sawtooth' | 'triangle', frequency: number, duration: number, volume: number = 0.5) => {
    const ctx = getAudioContext();
    if (!ctx) return;

    // A small check to ensure audio context is resumed, as some browsers require user interaction.
    if (ctx.state === 'suspended') {
        ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
};

export const playAttackSound = (isPlayer: boolean) => {
    const frequency = isPlayer ? 880 : 660; // Player gets a higher-pitched sound
    playSound('triangle', frequency, 0.1, 0.2);
};

export const playHitSound = (isPlayer: boolean) => {
    const frequency = isPlayer ? 110 : 160; // Player getting hit is a lower thud
    playSound('square', frequency, 0.15, 0.4);
};

const playArpeggio = (notes: number[], noteDuration: number, volume: number) => {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
        ctx.resume();
    }
    
    notes.forEach((note, index) => {
        const startTime = ctx.currentTime + index * noteDuration;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(note, startTime);
        
        gainNode.gain.setValueAtTime(volume, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + noteDuration * 0.9);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start(startTime);
        oscillator.stop(startTime + noteDuration);
    });
};

export const playVictorySound = () => {
    // A simple rising C major arpeggio
    const notes = [261.63, 329.63, 392.00, 523.25]; 
    playArpeggio(notes, 0.15, 0.3);
};

export const playDefeatSound = () => {
    // A simple falling diminished chord
    const notes = [311.13, 261.63, 207.65, 155.56]; 
    playArpeggio(notes, 0.2, 0.3);
};
