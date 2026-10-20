"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Music,
  ChevronUp,
  ChevronDown,
  SkipForward,
  SkipBack,
  HeartHandshake,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/format";

type TrackType = "hymn" | "ambient";

interface HymnNote {
  freq: number;
  duration: number; // in beats
}

interface HymnMeasure {
  bassFreq: number;
  harmonyFreqs: number[];
  melodyNotes: HymnNote[];
}

interface Track {
  id: string;
  type: TrackType;
  title: string;
  subtitle: string;
  lyricSnippet: string;
  bpm: number;
  measures?: HymnMeasure[];
  baseFreqs?: number[];
  filterFreq: number;
}

// Standard Note Frequencies (Hz)
const N = {
  G2: 98.0,
  A2: 110.0,
  B2: 123.47,
  C3: 130.81,
  D3: 146.83,
  Eb3: 155.56,
  E3: 164.81,
  F3: 174.61,
  Fis3: 185.0,
  G3: 196.0,
  Ab3: 207.65,
  A3: 220.0,
  Bb3: 233.08,
  B3: 246.94,
  C4: 261.63,
  Cis4: 277.18,
  D4: 293.66,
  Eb4: 311.13,
  E4: 329.63,
  F4: 349.23,
  Fis4: 369.99,
  G4: 392.0,
  Ab4: 415.3,
  A4: 440.0,
  Bb4: 466.16,
  B4: 493.88,
  C5: 523.25,
  Cis5: 554.37,
  D5: 587.33,
  Eb5: 622.25,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
  A5: 880.0,
};

const TRACK_CATALOG: Track[] = [
  // -------------------------------------------------------------
  // SACRED HYMNS (Piano & Acoustic Harmonies)
  // -------------------------------------------------------------
  {
    id: "it-is-well",
    type: "hymn",
    title: "It Is Well With My Soul",
    subtitle: "Philip P. Bliss & Horatio Spafford (1876)",
    lyricSnippet: "When peace like a river attendeth my way... It is well with my soul.",
    bpm: 64,
    filterFreq: 1100,
    measures: [
      {
        bassFreq: N.C3,
        harmonyFreqs: [N.E3, N.G3],
        melodyNotes: [
          { freq: N.G4, duration: 1.0 },
          { freq: N.G4, duration: 1.0 },
        ],
      },
      {
        bassFreq: N.F3,
        harmonyFreqs: [N.A3, N.C4],
        melodyNotes: [
          { freq: N.A4, duration: 0.5 },
          { freq: N.G4, duration: 0.5 },
          { freq: N.F4, duration: 1.0 },
        ],
      },
      {
        bassFreq: N.C3,
        harmonyFreqs: [N.E3, N.G3],
        melodyNotes: [{ freq: N.E4, duration: 2.0 }],
      },
      {
        bassFreq: N.C3,
        harmonyFreqs: [N.E3, N.G3],
        melodyNotes: [
          { freq: N.G4, duration: 1.0 },
          { freq: N.G4, duration: 1.0 },
        ],
      },
      {
        bassFreq: N.G3,
        harmonyFreqs: [N.B3, N.D4],
        melodyNotes: [
          { freq: N.A4, duration: 0.5 },
          { freq: N.B4, duration: 0.5 },
          { freq: N.C5, duration: 2.0 },
        ],
      },
      {
        bassFreq: N.A2,
        harmonyFreqs: [N.C3, N.E3],
        melodyNotes: [
          { freq: N.C5, duration: 1.0 },
          { freq: N.B4, duration: 0.5 },
          { freq: N.A4, duration: 0.5 },
        ],
      },
      {
        bassFreq: N.G3,
        harmonyFreqs: [N.B3, N.D4],
        melodyNotes: [
          { freq: N.G4, duration: 1.0 },
          { freq: N.E4, duration: 1.0 },
        ],
      },
      {
        bassFreq: N.F3,
        harmonyFreqs: [N.A3, N.C4],
        melodyNotes: [
          { freq: N.F4, duration: 0.5 },
          { freq: N.G4, duration: 0.5 },
          { freq: N.A4, duration: 2.0 },
        ],
      },
      // Chorus
      {
        bassFreq: N.C3,
        harmonyFreqs: [N.E3, N.G3],
        melodyNotes: [{ freq: N.G4, duration: 2.0 }],
      },
      {
        bassFreq: N.G3,
        harmonyFreqs: [N.B3, N.D4],
        melodyNotes: [
          { freq: N.C5, duration: 2.2 },
          { freq: N.B4, duration: 0.8 },
        ],
      },
      {
        bassFreq: N.F3,
        harmonyFreqs: [N.A3, N.C4],
        melodyNotes: [
          { freq: N.A4, duration: 1.0 },
          { freq: N.G4, duration: 2.0 },
        ],
      },
      {
        bassFreq: N.G3,
        harmonyFreqs: [N.B3, N.D4],
        melodyNotes: [
          { freq: N.G4, duration: 1.0 },
          { freq: N.A4, duration: 1.0 },
        ],
      },
      {
        bassFreq: N.C3,
        harmonyFreqs: [N.E3, N.G3],
        melodyNotes: [
          { freq: N.B4, duration: 1.0 },
          { freq: N.C5, duration: 3.0 },
        ],
      },
    ],
  },
  {
    id: "be-thou-my-vision",
    type: "hymn",
    title: "Be Thou My Vision",
    subtitle: "Traditional Irish (Slane, 8th Century)",
    lyricSnippet: "Be Thou my vision, O Lord of my heart; naught be all else to me, save that Thou art.",
    bpm: 66,
    filterFreq: 1150,
    measures: [
      {
        bassFreq: N.C3,
        harmonyFreqs: [N.E3, N.G3],
        melodyNotes: [
          { freq: N.C4, duration: 1.0 },
          { freq: N.C4, duration: 1.0 },
          { freq: N.D4, duration: 0.5 },
          { freq: N.C4, duration: 0.5 },
        ],
      },
      {
        bassFreq: N.A2,
        harmonyFreqs: [N.C3, N.E3],
        melodyNotes: [
          { freq: N.A3, duration: 1.0 },
          { freq: N.G3, duration: 1.5 },
          { freq: N.A3, duration: 0.5 },
        ],
      },
      {
        bassFreq: N.F3,
        harmonyFreqs: [N.A3, N.C4],
        melodyNotes: [
          { freq: N.C4, duration: 1.0 },
          { freq: N.D4, duration: 1.0 },
          { freq: N.E4, duration: 2.5 },
        ],
      },
      {
        bassFreq: N.G3,
        harmonyFreqs: [N.B3, N.D4],
        melodyNotes: [
          { freq: N.D4, duration: 0.5 },
          { freq: N.C4, duration: 1.0 },
          { freq: N.D4, duration: 1.0 },
        ],
      },
      {
        bassFreq: N.C3,
        harmonyFreqs: [N.E3, N.G3],
        melodyNotes: [
          { freq: N.E4, duration: 1.0 },
          { freq: N.F4, duration: 0.5 },
          { freq: N.G4, duration: 1.5 },
          { freq: N.E4, duration: 0.5 },
        ],
      },
      {
        bassFreq: N.A2,
        harmonyFreqs: [N.C3, N.E3],
        melodyNotes: [
          { freq: N.D4, duration: 1.0 },
          { freq: N.C4, duration: 1.0 },
          { freq: N.A3, duration: 1.0 },
          { freq: N.C4, duration: 2.5 },
        ],
      },
    ],
  },
  {
    id: "great-is-thy-faithfulness",
    type: "hymn",
    title: "Great Is Thy Faithfulness",
    subtitle: "William M. Runyan (1923)",
    lyricSnippet: "Great is Thy faithfulness, O God my Father; there is no shadow of turning with Thee.",
    bpm: 62,
    filterFreq: 1100,
    measures: [
      {
        bassFreq: N.D3,
        harmonyFreqs: [N.Fis3, N.A3],
        melodyNotes: [
          { freq: N.A3, duration: 1.0 },
          { freq: N.D4, duration: 1.5 },
          { freq: N.Fis4, duration: 0.5 },
        ],
      },
      {
        bassFreq: N.G3,
        harmonyFreqs: [N.B3, N.D4],
        melodyNotes: [
          { freq: N.E4, duration: 1.5 },
          { freq: N.D4, duration: 0.5 },
          { freq: N.B3, duration: 2.0 },
        ],
      },
      {
        bassFreq: N.E3,
        harmonyFreqs: [N.G3, N.B3],
        melodyNotes: [
          { freq: N.E4, duration: 1.0 },
          { freq: N.G4, duration: 1.5 },
          { freq: N.Fis4, duration: 0.5 },
        ],
      },
      {
        bassFreq: N.A2,
        harmonyFreqs: [N.Cis4, N.E4],
        melodyNotes: [
          { freq: N.E4, duration: 1.5 },
          { freq: N.D4, duration: 0.5 },
          { freq: N.Cis4, duration: 2.0 },
        ],
      },
      {
        bassFreq: N.D3,
        harmonyFreqs: [N.Fis3, N.A3],
        melodyNotes: [
          { freq: N.D4, duration: 1.0 },
          { freq: N.Fis4, duration: 1.5 },
          { freq: N.A4, duration: 0.5 },
        ],
      },
      {
        bassFreq: N.G3,
        harmonyFreqs: [N.B3, N.D4],
        melodyNotes: [
          { freq: N.B4, duration: 1.5 },
          { freq: N.A4, duration: 0.5 },
          { freq: N.G4, duration: 1.0 },
          { freq: N.Fis4, duration: 1.0 },
        ],
      },
      {
        bassFreq: N.A2,
        harmonyFreqs: [N.D4, N.Fis4],
        melodyNotes: [
          { freq: N.E4, duration: 1.0 },
          { freq: N.D4, duration: 3.0 },
        ],
      },
    ],
  },
  {
    id: "holy-holy-holy",
    type: "hymn",
    title: "Holy, Holy, Holy! Lord God Almighty",
    subtitle: "John Bacchus Dykes (Nicaea, 1861)",
    lyricSnippet: "Holy, holy, holy! Lord God Almighty! Early in the morning our song shall rise to Thee.",
    bpm: 64,
    filterFreq: 1200,
    measures: [
      {
        bassFreq: N.D3,
        harmonyFreqs: [N.Fis3, N.A3],
        melodyNotes: [
          { freq: N.D4, duration: 1.0 },
          { freq: N.D4, duration: 1.0 },
          { freq: N.Fis4, duration: 1.0 },
          { freq: N.Fis4, duration: 1.0 },
        ],
      },
      {
        bassFreq: N.D3,
        harmonyFreqs: [N.Fis3, N.A3],
        melodyNotes: [{ freq: N.A4, duration: 2.0 }],
      },
      {
        bassFreq: N.G3,
        harmonyFreqs: [N.B3, N.D4],
        melodyNotes: [
          { freq: N.B4, duration: 1.0 },
          { freq: N.B4, duration: 1.0 },
          { freq: N.B4, duration: 1.0 },
          { freq: N.B4, duration: 1.0 },
        ],
      },
      {
        bassFreq: N.D3,
        harmonyFreqs: [N.Fis3, N.A3],
        melodyNotes: [{ freq: N.A4, duration: 2.0 }],
      },
      {
        bassFreq: N.A2,
        harmonyFreqs: [N.Cis4, N.E4],
        melodyNotes: [
          { freq: N.A4, duration: 1.0 },
          { freq: N.A4, duration: 1.0 },
          { freq: N.D5, duration: 1.0 },
          { freq: N.Cis5, duration: 1.0 },
        ],
      },
      {
        bassFreq: N.B2,
        harmonyFreqs: [N.D3, N.Fis3],
        melodyNotes: [
          { freq: N.B4, duration: 1.0 },
          { freq: N.A4, duration: 1.0 },
          { freq: N.Fis4, duration: 1.0 },
          { freq: N.A4, duration: 1.0 },
        ],
      },
      {
        bassFreq: N.A2,
        harmonyFreqs: [N.Cis4, N.E4],
        melodyNotes: [{ freq: N.E4, duration: 3.0 }],
      },
    ],
  },
  {
    id: "amazing-grace",
    type: "hymn",
    title: "Amazing Grace",
    subtitle: "Traditional Melody (New Britain, 1835)",
    lyricSnippet: "Amazing grace! How sweet the sound that saved a wretch like me.",
    bpm: 60,
    filterFreq: 1100,
    measures: [
      {
        bassFreq: N.G2,
        harmonyFreqs: [N.B3, N.D4],
        melodyNotes: [
          { freq: N.D4, duration: 1.0 },
          { freq: N.G4, duration: 2.0 },
          { freq: N.B4, duration: 0.5 },
          { freq: N.G4, duration: 0.5 },
        ],
      },
      {
        bassFreq: N.G2,
        harmonyFreqs: [N.B3, N.D4],
        melodyNotes: [
          { freq: N.B4, duration: 2.0 },
          { freq: N.A4, duration: 1.0 },
        ],
      },
      {
        bassFreq: N.C3,
        harmonyFreqs: [N.E3, N.G3],
        melodyNotes: [
          { freq: N.G4, duration: 2.0 },
          { freq: N.E4, duration: 1.0 },
          { freq: N.D4, duration: 2.5 },
        ],
      },
      {
        bassFreq: N.G2,
        harmonyFreqs: [N.B3, N.D4],
        melodyNotes: [
          { freq: N.D4, duration: 0.5 },
          { freq: N.G4, duration: 2.0 },
          { freq: N.B4, duration: 0.5 },
          { freq: N.G4, duration: 0.5 },
          { freq: N.B4, duration: 2.0 },
          { freq: N.A4, duration: 1.0 },
        ],
      },
      {
        bassFreq: N.D3,
        harmonyFreqs: [N.Fis3, N.A3],
        melodyNotes: [{ freq: N.D5, duration: 3.0 }],
      },
    ],
  },

  // -------------------------------------------------------------
  // AMBIENT SOAKING PADS (432Hz Analog Drones)
  // -------------------------------------------------------------
  {
    id: "secret-place",
    type: "ambient",
    title: "Secret Place (432Hz Soaking Pad)",
    subtitle: "Deep Contemplation & Stillness",
    lyricSnippet: "He who dwells in the secret place of the Most High shall abide in the shadow of the Almighty.",
    bpm: 50,
    baseFreqs: [108, 162, 216, 270, 324],
    filterFreq: 420,
  },
  {
    id: "peace-river",
    type: "ambient",
    title: "Peace Like a River (Harmonics)",
    subtitle: "Worship Chimes & Inner Rest",
    lyricSnippet: "The peace of God, which transcends all understanding, will guard your hearts and your minds.",
    bpm: 50,
    baseFreqs: [130.81, 196.0, 261.63, 329.63, 392.0],
    filterFreq: 650,
  },
  {
    id: "night-vigil",
    type: "ambient",
    title: "Night Vigil & Rest",
    subtitle: "Soft E-Minor Low Resonance",
    lyricSnippet: "In peace I will lie down and sleep, for You alone, Lord, make me dwell in safety.",
    bpm: 45,
    baseFreqs: [82.41, 123.47, 164.81, 220.0],
    filterFreq: 280,
  },
  {
    id: "prophetic-altar",
    type: "ambient",
    title: "Prophetic Altar",
    subtitle: "D-Major Atmospheric Intercession",
    lyricSnippet: "Let my prayer be set before You as incense, the lifting up of my hands as the evening sacrifice.",
    bpm: 55,
    baseFreqs: [146.83, 220.0, 293.66, 369.99],
    filterFreq: 520,
  },
];

export function SoakingAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<TrackType>("hymn");
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const currentTrack = TRACK_CATALOG[currentTrackIndex];

  // Web Audio References
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const activeNodesRef = useRef<AudioNode[]>([]);
  const loopTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCancelledRef = useRef(false);

  // Stop all actively synthesizing audio
  const stopAudio = useCallback(() => {
    isCancelledRef.current = true;
    if (loopTimeoutRef.current) {
      clearTimeout(loopTimeoutRef.current);
      loopTimeoutRef.current = null;
    }

    activeNodesRef.current.forEach((node) => {
      try {
        if ("stop" in node && typeof (node as any).stop === "function") {
          (node as any).stop();
        }
        node.disconnect();
      } catch {}
    });
    activeNodesRef.current = [];
  }, []);

  // Soft piano note generator
  const triggerPianoNote = useCallback(
    (
      ctx: AudioContext,
      filter: BiquadFilterNode,
      freq: number,
      startTime: number,
      durationSec: number,
      velocity = 0.35
    ) => {
      if (isCancelledRef.current) return;

      const oscFundamental = ctx.createOscillator();
      const oscHarmonic = ctx.createOscillator();
      const noteGain = ctx.createGain();

      // Warm acoustic harmonics
      oscFundamental.type = "sine";
      oscFundamental.frequency.setValueAtTime(freq, startTime);

      oscHarmonic.type = "triangle";
      oscHarmonic.frequency.setValueAtTime(freq * 2, startTime);

      // Fast acoustic piano strike (12ms attack) + exponential decay
      const attack = 0.015;
      const decay = Math.min(durationSec * 1.3, 2.2);

      noteGain.gain.setValueAtTime(0.0001, startTime);
      noteGain.gain.exponentialRampToValueAtTime(velocity, startTime + attack);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + decay);

      oscFundamental.connect(noteGain);
      oscHarmonic.connect(noteGain);
      noteGain.connect(filter);

      oscFundamental.start(startTime);
      oscHarmonic.start(startTime);

      oscFundamental.stop(startTime + decay);
      oscHarmonic.stop(startTime + decay);

      activeNodesRef.current.push(oscFundamental, oscHarmonic, noteGain);
    },
    []
  );

  // Play hymn with sequenced polyphony
  const playHymnSequence = useCallback(
    (track: Track) => {
      if (!audioCtxRef.current || !filterNodeRef.current || !track.measures) return;
      const ctx = audioCtxRef.current;
      const filter = filterNodeRef.current;

      const secPerBeat = 60 / track.bpm;
      let currentTimeOffset = ctx.currentTime + 0.1;

      track.measures.forEach((measure) => {
        // Measure duration based on sum of melody beats
        const measureDurationBeats = measure.melodyNotes.reduce((sum, n) => sum + n.duration, 0);
        const measureDurationSec = measureDurationBeats * secPerBeat;

        // Bass root note
        triggerPianoNote(ctx, filter, measure.bassFreq, currentTimeOffset, measureDurationSec * 1.2, 0.28);

        // Warm mid-range accompaniment chords
        measure.harmonyFreqs.forEach((hFreq) => {
          triggerPianoNote(ctx, filter, hFreq, currentTimeOffset + 0.05, measureDurationSec, 0.18);
        });

        // Sequential melody notes
        let melodyOffset = currentTimeOffset;
        measure.melodyNotes.forEach((mNote) => {
          const noteSec = mNote.duration * secPerBeat;
          triggerPianoNote(ctx, filter, mNote.freq, melodyOffset, noteSec, 0.42);
          melodyOffset += noteSec;
        });

        currentTimeOffset += measureDurationSec;
      });

      // Schedule next graceful loop
      const totalLoopSec = currentTimeOffset - ctx.currentTime;
      loopTimeoutRef.current = setTimeout(() => {
        if (!isCancelledRef.current && isPlaying) {
          playHymnSequence(track);
        }
      }, Math.max(1000, (totalLoopSec - 0.2) * 1000));
    },
    [isPlaying, triggerPianoNote]
  );

  // Play continuous ambient drone pads
  const playAmbientPad = useCallback((track: Track) => {
    if (!audioCtxRef.current || !filterNodeRef.current || !track.baseFreqs) return;
    const ctx = audioCtxRef.current;
    const filter = filterNodeRef.current;

    track.baseFreqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = idx % 2 === 0 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Subtle detune for lush spatial warmth
      osc.detune.setValueAtTime((idx - 1) * 3, ctx.currentTime);

      const level = 0.25 / (idx + 1);
      oscGain.gain.setValueAtTime(0.001, ctx.currentTime);
      oscGain.gain.exponentialRampToValueAtTime(level, ctx.currentTime + 2.5);

      osc.connect(oscGain);
      oscGain.connect(filter);

      osc.start();
      activeNodesRef.current.push(osc, oscGain);
    });
  }, []);

  // Main start handler
  const startTrack = useCallback(
    async (track: Track) => {
      stopAudio();
      isCancelledRef.current = false;

      try {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioCtxClass();
        }

        const ctx = audioCtxRef.current;
        if (ctx.state === "suspended") {
          await ctx.resume();
        }

        // Master Gain
        const masterGain = ctx.createGain();
        const effectiveVolume = isMuted ? 0 : volume * 0.45;
        masterGain.gain.setValueAtTime(effectiveVolume, ctx.currentTime);
        masterGain.connect(ctx.destination);
        masterGainRef.current = masterGain;

        // Filter Node
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(track.filterFreq, ctx.currentTime);
        filter.Q.setValueAtTime(1.2, ctx.currentTime);
        filter.connect(masterGain);
        filterNodeRef.current = filter;

        if (track.type === "hymn") {
          playHymnSequence(track);
        } else {
          playAmbientPad(track);
        }

        setIsPlaying(true);
      } catch (e) {
        console.warn("[selah-audio] Play error:", e);
      }
    },
    [isMuted, volume, playHymnSequence, playAmbientPad, stopAudio]
  );

  const togglePlay = () => {
    if (isPlaying) {
      stopAudio();
      setIsPlaying(false);
    } else {
      void startTrack(currentTrack);
    }
  };

  const selectTrack = (index: number) => {
    setCurrentTrackIndex(index);
    if (isPlaying) {
      void startTrack(TRACK_CATALOG[index]);
    }
  };

  const handleNext = () => {
    const nextIdx = (currentTrackIndex + 1) % TRACK_CATALOG.length;
    selectTrack(nextIdx);
  };

  const handlePrev = () => {
    const prevIdx = (currentTrackIndex - 1 + TRACK_CATALOG.length) % TRACK_CATALOG.length;
    selectTrack(prevIdx);
  };

  // Adjust volume dynamically
  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      const target = isMuted ? 0 : volume * 0.45;
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
  }, [stopAudio]);

  const hymns = TRACK_CATALOG.filter((t) => t.type === "hymn");
  const ambients = TRACK_CATALOG.filter((t) => t.type === "ambient");

  return (
    <div className="fixed bottom-4 left-4 z-40 max-w-[390px] w-full sm:bottom-6 sm:left-6">
      <div className="overflow-hidden rounded-2xl border border-[rgba(192,138,46,0.4)] bg-[#0d1210]/95 p-4 shadow-2xl backdrop-blur-xl transition-all">
        {/* Compact Player Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={togglePlay}
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all cursor-pointer shadow-lg",
                isPlaying
                  ? "border-brass bg-brass text-black shadow-brass/30 ring-2 ring-brass/20"
                  : "border-white/10 bg-white/5 text-brass hover:border-brass/50 hover:bg-white/10"
              )}
              title={isPlaying ? "Pause Worship Ambiance" : "Play Hymn / Soaking Worship"}
            >
              {isPlaying ? <Pause size={17} /> : <Play size={17} className="ml-0.5" />}
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[0.65rem] font-bold uppercase tracking-wider text-brass flex items-center gap-1">
                  <Music size={11} /> {currentTrack.type === "hymn" ? "Sacred Hymn" : "Soaking Atmosphere"}
                </span>
                {isPlaying && (
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-[0.65rem] text-emerald-400 font-mono">Live</span>
                  </span>
                )}
              </div>
              <div className="truncate text-sm font-semibold text-white">
                {currentTrack.title}
              </div>
              <div className="truncate text-[0.7rem] text-white/50">
                {currentTrack.subtitle}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handlePrev}
              className="text-white/60 hover:text-white p-1.5 cursor-pointer transition-colors"
              title="Previous Track"
            >
              <SkipBack size={15} />
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="text-white/60 hover:text-white p-1.5 cursor-pointer transition-colors"
              title="Next Track"
            >
              <SkipForward size={15} />
            </button>

            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="text-white/60 hover:text-white p-1.5 cursor-pointer transition-colors"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX size={15} className="text-red-400" /> : <Volume2 size={15} />}
            </button>

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-white/60 hover:text-white p-1.5 cursor-pointer transition-colors"
              title={isExpanded ? "Collapse Player" : "Browse All Hymns"}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
          </div>
        </div>

        {/* Active Lyric / Devotional Banner */}
        {isPlaying && currentTrack.lyricSnippet && (
          <div className="mt-2.5 rounded-lg bg-brass/10 border border-brass/20 px-2.5 py-1.5 text-[0.72rem] text-brass-light leading-snug italic line-clamp-2 animate-in fade-in">
            &ldquo;{currentTrack.lyricSnippet}&rdquo;
          </div>
        )}

        {/* Expanded Drawer for Song Selection & Tabs */}
        {isExpanded && (
          <div className="mt-3.5 pt-3.5 border-t border-white/10 space-y-3.5 animate-in fade-in slide-in-from-bottom-2">
            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("hymn")}
                className={cn(
                  "py-1.5 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  activeTab === "hymn"
                    ? "bg-brass text-black font-semibold shadow-sm"
                    : "text-white/60 hover:text-white"
                )}
              >
                <BookOpen size={13} />
                Sacred Hymns ({hymns.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("ambient")}
                className={cn(
                  "py-1.5 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  activeTab === "ambient"
                    ? "bg-brass text-black font-semibold shadow-sm"
                    : "text-white/60 hover:text-white"
                )}
              >
                <Sparkles size={13} />
                Soaking Pads ({ambients.length})
              </button>
            </div>

            {/* Track Listing */}
            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {TRACK_CATALOG.map((track, idx) => {
                if (track.type !== activeTab) return null;
                const isSelected = currentTrackIndex === idx;

                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => selectTrack(idx)}
                    className={cn(
                      "w-full text-left p-2.5 rounded-xl text-xs transition-all cursor-pointer block border",
                      isSelected
                        ? "bg-brass/20 text-brass border-brass/40 shadow-sm"
                        : "bg-white/[0.03] border-white/5 hover:bg-white/10 text-white/70 hover:text-white"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{track.title}</span>
                      {isSelected && isPlaying && (
                        <span className="text-[0.65rem] uppercase font-bold tracking-wider text-brass font-mono">
                          Playing
                        </span>
                      )}
                    </div>
                    <div className="text-[0.68rem] text-white/40 line-clamp-1 mt-0.5">
                      {track.subtitle}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Volume Slider */}
            <div className="flex items-center gap-2 pt-1 border-t border-white/5">
              <span className="text-[0.7rem] text-white/50">Volume</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="h-1 flex-1 cursor-pointer accent-brass"
              />
              <span className="text-[0.7rem] text-white/70 tnum w-8 text-right font-mono">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
