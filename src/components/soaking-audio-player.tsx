"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume2, VolumeX, Sparkles, Music, ChevronUp, ChevronDown, Radio } from "lucide-react";
import { cn } from "@/lib/format";

type Soundscape = {
  id: string;
  name: string;
  description: string;
  baseFreqs: number[]; // chord frequencies in Hz
  filterFreq: number;
};

const SOUNDSCAPES: Soundscape[] = [
  {
    id: "secret-place",
    name: "🕊️ Secret Place (432Hz Soaking Pad)",
    description: "Deep, warm analog ambient drone for prayer and quiet contemplation.",
    baseFreqs: [108, 162, 216, 270, 324], // peaceful harmonics
    filterFreq: 420,
  },
  {
    id: "peace-river",
    name: "🎹 Peace Like a River (Worship Chimes)",
    description: "Gentle shimmering acoustic pads that inspire peace and rest.",
    baseFreqs: [130.81, 196.0, 261.63, 329.63, 392.0], // C major 7th chord
    filterFreq: 650,
  },
  {
    id: "night-vigil",
    name: "🌧️ Night Vigil & Rest (Sleep & Meditation)",
    description: "Soft, tranquil low-frequency tones designed for night prayers and sleep.",
    baseFreqs: [82.41, 123.47, 164.81, 220.0], // E minor deep resonance
    filterFreq: 280,
  },
  {
    id: "prophetic-altar",
    name: "🔥 Prophetic Altar (Spiritual Warfare & Intercession)",
    description: "Focused, resonant atmospheric tones for deep prayer and study.",
    baseFreqs: [146.83, 220.0, 293.66, 369.99], // D major uplifting
    filterFreq: 520,
  },
];

export function SoakingAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedSoundscape, setSelectedSoundscape] = useState<Soundscape>(SOUNDSCAPES[0]);
  const [volume, setVolume] = useState(0.65);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);

  // Stop current audio synthesis
  const stopAudio = () => {
    oscillatorsRef.current.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {}
    });
    oscillatorsRef.current = [];
  };

  // Start sound synthesis using Web Audio API
  const startAudio = (soundscape: Soundscape) => {
    stopAudio();

    try {
      // @ts-expect-error webkitAudioContext fallback
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      // Master Gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(isMuted ? 0 : volume * 0.4, ctx.currentTime);
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      // Filter Node (Warm Low-Pass)
      const biquadFilter = ctx.createBiquadFilter();
      biquadFilter.type = "lowpass";
      biquadFilter.frequency.setValueAtTime(soundscape.filterFreq, ctx.currentTime);
      biquadFilter.Q.setValueAtTime(1.5, ctx.currentTime);
      biquadFilter.connect(masterGain);

      // Create rich layered multi-oscillator chord
      const newOscs: OscillatorNode[] = [];
      soundscape.baseFreqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();

        osc.type = idx % 2 === 0 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        // Subtly detune for natural chorus warmth
        osc.detune.setValueAtTime((idx - 2) * 5, ctx.currentTime);

        // Soft individual gain
        oscGain.gain.setValueAtTime(0.2 / soundscape.baseFreqs.length, ctx.currentTime);

        osc.connect(oscGain);
        oscGain.connect(biquadFilter);
        osc.start();
        newOscs.push(osc);
      });

      oscillatorsRef.current = newOscs;
      setIsPlaying(true);
    } catch (e) {
      console.warn("[selah-audio] Web Audio error:", e);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopAudio();
      setIsPlaying(false);
    } else {
      startAudio(selectedSoundscape);
    }
  };

  const switchSoundscape = (soundscape: Soundscape) => {
    setSelectedSoundscape(soundscape);
    if (isPlaying) {
      startAudio(soundscape);
    }
  };

  // Adjust volume
  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      const target = isMuted ? 0 : volume * 0.4;
      masterGainRef.current.gain.setTargetAtTime(target, audioCtxRef.current.currentTime, 0.05);
    }
  }, [volume, isMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="fixed bottom-4 left-4 z-40 max-w-sm sm:bottom-6 sm:left-6">
      <div className="overflow-hidden rounded-2xl border border-[rgba(192,138,46,0.35)] bg-[#101317]/95 p-3.5 shadow-2xl backdrop-blur-xl">
        {/* Compact Player Bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={togglePlay}
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all cursor-pointer shadow-md",
                isPlaying
                  ? "border-brass bg-brass text-black shadow-brass/30 animate-pulse"
                  : "border-white/10 bg-white/5 text-brass hover:border-brass/40"
              )}
              title={isPlaying ? "Pause Soaking Music" : "Play Instrumental Soaking"}
            >
              {isPlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[0.65rem] font-bold uppercase tracking-wider text-brass flex items-center gap-1">
                  <Music size={11} /> Selah Soaking
                </span>
                {isPlaying && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                )}
              </div>
              <div className="truncate text-xs font-semibold text-ink">
                {selectedSoundscape.name.split(" ")[1] || "Instrumental"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="text-warm-500 hover:text-ink p-1.5 cursor-pointer transition-colors"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-warm-500 hover:text-ink p-1.5 cursor-pointer transition-colors"
              title={isExpanded ? "Collapse Player" : "Change Soundscape"}
            >
              {isExpanded ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
            </button>
          </div>
        </div>

        {/* Expanded Drawer for Soundscape Selection & Volume */}
        {isExpanded && (
          <div className="mt-3.5 pt-3 border-t border-white/10 space-y-3">
            <div className="space-y-1.5">
              <label className="text-[0.68rem] font-bold uppercase tracking-wider text-warm-400 block">
                Select Prayer Atmosphere:
              </label>
              <div className="space-y-1">
                {SOUNDSCAPES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => switchSoundscape(s)}
                    className={cn(
                      "w-full text-left p-2 rounded-lg text-xs transition-colors cursor-pointer block",
                      selectedSoundscape.id === s.id
                        ? "bg-brass/20 text-brass border border-brass/40 font-semibold"
                        : "hover:bg-white/5 text-warm-400"
                    )}
                  >
                    <div>{s.name}</div>
                    <div className="text-[0.68rem] text-warm-500 line-clamp-1 mt-0.5">
                      {s.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Volume Slider */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[0.68rem] text-warm-500">Volume</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="h-1 flex-1 cursor-pointer accent-brass"
              />
              <span className="text-[0.68rem] text-warm-400 tnum w-6 text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
