/**
 * Sound utility module for poker game audio
 * Note: Actual sound files should be placed in /public/sounds/
 */

type SoundType = 'card' | 'chip' | 'win' | 'fold' | 'check' | 'notification';

interface SoundConfig {
    src: string;
    volume: number;
}

const SOUNDS: Record<SoundType, SoundConfig> = {
    card: { src: '/sounds/card-deal.mp3', volume: 0.5 },
    chip: { src: '/sounds/chip.mp3', volume: 0.4 },
    win: { src: '/sounds/win.mp3', volume: 0.6 },
    fold: { src: '/sounds/fold.mp3', volume: 0.3 },
    check: { src: '/sounds/check.mp3', volume: 0.3 },
    notification: { src: '/sounds/notification.mp3', volume: 0.5 },
};

class SoundManager {
    private audioCache: Map<SoundType, HTMLAudioElement> = new Map();
    private isMuted: boolean = false;
    private masterVolume: number = 1.0;

    constructor() {
        // Preload sounds on instantiation (only in browser)
        if (typeof window !== 'undefined') {
            this.preloadSounds();
        }
    }

    private preloadSounds(): void {
        Object.entries(SOUNDS).forEach(([type, config]) => {
            try {
                const audio = new Audio(config.src);
                audio.volume = config.volume * this.masterVolume;
                audio.preload = 'auto';
                this.audioCache.set(type as SoundType, audio);
            } catch (error) {
                console.warn(`Failed to preload sound: ${type}`, error);
            }
        });
    }

    play(type: SoundType): void {
        if (this.isMuted || typeof window === 'undefined') return;

        try {
            const cachedAudio = this.audioCache.get(type);
            if (cachedAudio) {
                // Clone the audio element for overlapping sounds
                const audio = cachedAudio.cloneNode() as HTMLAudioElement;
                audio.volume = (SOUNDS[type]?.volume || 0.5) * this.masterVolume;
                audio.play().catch(() => {
                    // Silently fail - user interaction may not have occurred yet
                });
            }
        } catch (error) {
            console.warn(`Failed to play sound: ${type}`, error);
        }
    }

    setMuted(muted: boolean): void {
        this.isMuted = muted;
    }

    getMuted(): boolean {
        return this.isMuted;
    }

    setVolume(volume: number): void {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        // Update cached audio volumes
        this.audioCache.forEach((audio, type) => {
            const config = SOUNDS[type];
            if (config) {
                audio.volume = config.volume * this.masterVolume;
            }
        });
    }

    toggleMute(): boolean {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }
}

// Singleton instance
let soundManager: SoundManager | null = null;

export function getSoundManager(): SoundManager {
    if (!soundManager) {
        soundManager = new SoundManager();
    }
    return soundManager;
}

// Convenience functions
export function playSound(type: SoundType): void {
    getSoundManager().play(type);
}

export function toggleMute(): boolean {
    return getSoundManager().toggleMute();
}

export function setMuted(muted: boolean): void {
    getSoundManager().setMuted(muted);
}

export function isMuted(): boolean {
    return getSoundManager().getMuted();
}
