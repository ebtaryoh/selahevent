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
  Sparkles,
  BookOpen,
  X,
  Radio,
  Sliders,
  Minimize2,
} from "lucide-react";
import { cn } from "@/lib/format";

export type TrackType = "hymn" | "ambient";

export interface Track {
  id: string;
  type: TrackType;
  title: string;
  subtitle: string;
  lyricSnippet: string;
  // For recorded hymns
  src?: string;
  fallbackSrc?: string;
  // For ambient harmonic drone synthesis
  baseFreqs?: number[];
  filterFreq?: number;
}

export const TRACK_CATALOG: Track[] = [
  // --------------------------------------------------------------------------
  // AUTHENTIC SACRED HYMNS (High-Fidelity Instrumental & Orchestral Recordings)
  // --------------------------------------------------------------------------
  {
    id: "amazing-grace",
    type: "hymn",
    title: "Amazing Grace",
    subtitle: "USAF Strolling Strings (Orchestral Master)",
    lyricSnippet: "Amazing grace! How sweet the sound that saved a wretch like me.",
    src: "https://upload.wikimedia.org/wikipedia/commons/transcoded/5/54/Amazing_Grace_%28USAFB_strings%29.ogg/Amazing_Grace_%28USAFB_strings%29.ogg.mp3",
  },
  {
    id: "holy-holy-holy",
    type: "hymn",
    title: "Holy, Holy, Holy! Lord God Almighty",
    subtitle: "Processional Hymn (Nicaea 1861, Sacred Organ & Brass)",
    lyricSnippet:
      "Holy, holy, holy! Lord God Almighty! Early in the morning our song shall rise to Thee.",
    src: "https://upload.wikimedia.org/wikipedia/commons/transcoded/6/61/HWW_Holy_holy_holy_is_the_Lord-Processional.ogg/HWW_Holy_holy_holy_is_the_Lord-Processional.ogg.mp3",
  },
  {
    id: "what-a-friend",
    type: "hymn",
    title: "What A Friend We Have In Jesus",
    subtitle: "Sacred Chamber Orchestra & Strings",
    lyricSnippet:
      "What a friend we have in Jesus, all our sins and griefs to bear! What a privilege to carry everything to God in prayer.",
    src: "https://upload.wikimedia.org/wikipedia/commons/transcoded/b/b8/HWW_What_A_Friend_We_Have_In_Jesus.ogg/HWW_What_A_Friend_We_Have_In_Jesus.ogg.mp3",
  },
  {
    id: "be-thou-my-vision",
    type: "hymn",
    title: "Be Thou My Vision",
    subtitle: "Traditional Irish Hymn (Slane, Acoustic Devotional)",
    lyricSnippet:
      "Be Thou my vision, O Lord of my heart; naught be all else to me, save that Thou art.",
    src: "https://upload.wikimedia.org/wikipedia/commons/transcoded/e/eb/Be_thou_my_vision_acoustic_by_walmartshopper.ogg/Be_thou_my_vision_acoustic_by_walmartshopper.ogg.mp3",
  },
  {
    id: "to-god-be-the-glory",
    type: "hymn",
    title: "To God Be The Glory",
    subtitle: "Fanny Crosby & W. Howard Doane (Sacred Orchestra)",
    lyricSnippet:
      "To God be the glory, great things He hath done! So loved He the world that He gave us His Son.",
    src: "https://upload.wikimedia.org/wikipedia/commons/transcoded/b/b1/HWW_To_God_Be_The_Glory.ogg/HWW_To_God_Be_The_Glory.ogg.mp3",
  },
  {
    id: "the-lords-my-shepherd",
    type: "hymn",
    title: "The Lord's My Shepherd",
    subtitle: "Crimond Psalm 23 (Sacred Worship Setting)",
    lyricSnippet:
      "The Lord's my shepherd, I'll not want; He makes me down to lie in pastures green; He leadeth me the quiet waters by.",
    src: "https://upload.wikimedia.org/wikipedia/commons/transcoded/1/1c/HWW_The_Lords_My_Shepherd_Crimond.ogg/HWW_The_Lords_My_Shepherd_Crimond.ogg.mp3",
  },
  {
    id: "all-creatures",
    type: "hymn",
    title: "All Creatures of Our God and King",
    subtitle: "St. Francis of Assisi / Lasst uns erfreuen (Brass & Ensemble)",
    lyricSnippet:
      "All creatures of our God and King, lift up your voice and with us sing: Alleluia! Alleluia!",
    src: "https://upload.wikimedia.org/wikipedia/commons/transcoded/2/2f/All_Creatures_of_Our_God_and_King.ogg/All_Creatures_of_Our_God_and_King.ogg.mp3",
  },
  {
    id: "crown-him",
    type: "hymn",
    title: "Crown Him With Many Crowns",
    subtitle: "Diademata (George Elvey & Godfrey Thring)",
    lyricSnippet:
      "Crown Him with many crowns, the Lamb upon His throne. Hark! How the heavenly anthem drowns all music but its own.",
    src: "https://upload.wikimedia.org/wikipedia/commons/transcoded/8/80/Crown_Him_with_many_Crowns.ogg/Crown_Him_with_many_Crowns.ogg.mp3",
  },

  // --------------------------------------------------------------------------
  // AMBIENT SOAKING PADS (Warm 432Hz Analog Drones for Deep Contemplation)
  // --------------------------------------------------------------------------
  {
    id: "secret-place",
    type: "ambient",
    title: "Secret Place (432Hz Soaking Pad)",
    subtitle: "Deep Contemplation & Stillness",
    lyricSnippet:
      "He who dwells in the secret place of the Most High shall abide in the shadow of the Almighty. — Psalm 91:1",
    baseFreqs: [108, 162, 216, 270, 324],
    filterFreq: 420,
  },
  {
    id: "peace-river",
    type: "ambient",
    title: "Peace Like a River",
    subtitle: "Worship Harmonics & Inner Rest",
    lyricSnippet:
      "The peace of God, which transcends all understanding, will guard your hearts and minds in Christ Jesus. — Philippians 4:7",
    baseFreqs: [130.81, 196.0, 261.63, 329.63, 392.0],
    filterFreq: 620,
  },
  {
    id: "night-vigil",
    type: "ambient",
    title: "Night Vigil & Sanctuary",
    subtitle: "Soft E-Minor Low Resonance",
    lyricSnippet: "In peace I will lie down and sleep, for You alone, Lord, make me dwell in safety. — Psalm 4:8",
    baseFreqs: [82.41, 123.47, 164.81, 220.0],
    filterFreq: 300,
  },
  {
    id: "prophetic-altar",
    type: "ambient",
    title: "Prophetic Altar",
    subtitle: "D-Major Atmospheric Intercession",
    lyricSnippet:
      "Let my prayer be set before You as incense, the lifting up of my hands as the evening sacrifice. — Psalm 141:2",
    baseFreqs: [146.83, 220.0, 293.66, 369.99],
    filterFreq: 520,
  },
];

export function SoakingAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<TrackType>("hymn");
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(0.75);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  // Minimized state (starts minimized so it never blocks the app on mobile or desktop)
  const [isMinimized, setIsMinimized] = useState(true);

  // Sync minimize preference with localStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem("selah_audio_minimized");
      if (saved !== null) {
        setIsMinimized(saved === "true");
      }
    } catch {}
  }, []);

  const handleSetMinimized = (val: boolean) => {
    setIsMinimized(val);
    try {
      localStorage.setItem("selah_audio_minimized", String(val));
    } catch {}
  };

  const currentTrack = TRACK_CATALOG[currentTrackIndex];

  // Audio references
  const htmlAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const synthNodesRef = useRef<AudioNode[]>([]);

  // Stop ambient synthesizer
  const stopSynth = useCallback(() => {
    synthNodesRef.current.forEach((node) => {
      try {
        if ("stop" in node && typeof (node as any).stop === "function") {
          (node as any).stop();
        }
        node.disconnect();
      } catch {}
    });
    synthNodesRef.current = [];
  }, []);

  // Stop everything
  const stopAllAudio = useCallback(() => {
    if (htmlAudioRef.current) {
      htmlAudioRef.current.pause();
    }
    stopSynth();
    setIsPlaying(false);
  }, [stopSynth]);

  // Start Ambient Drone Pad Synthesis (Web Audio)
  const startAmbientPad = useCallback(
    (track: Track) => {
      stopSynth();
      if (htmlAudioRef.current) {
        htmlAudioRef.current.pause();
      }

      try {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioCtxClass();
        }

        const ctx = audioCtxRef.current;
        if (ctx.state === "suspended") {
          ctx.resume().catch(() => {});
        }

        // Master Gain
        const masterGain = ctx.createGain();
        const effectiveVol = isMuted ? 0 : volume * 0.35;
        masterGain.gain.setValueAtTime(effectiveVol, ctx.currentTime);
        masterGain.connect(ctx.destination);
        masterGainRef.current = masterGain;

        // Warm Lowpass Filter
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(track.filterFreq || 480, ctx.currentTime);
        filter.Q.setValueAtTime(1.4, ctx.currentTime);
        filter.connect(masterGain);

        // Warm multi-oscillator chords
        const baseFreqs = track.baseFreqs || [108, 162, 216];
        baseFreqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const oscGain = ctx.createGain();

          osc.type = idx % 2 === 0 ? "sine" : "triangle";
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          osc.detune.setValueAtTime((idx - 1) * 4, ctx.currentTime);

          const level = 0.22 / baseFreqs.length;
          oscGain.gain.setValueAtTime(0.001, ctx.currentTime);
          oscGain.gain.exponentialRampToValueAtTime(level, ctx.currentTime + 2.0);

          osc.connect(oscGain);
          oscGain.connect(filter);
          osc.start();

          synthNodesRef.current.push(osc, oscGain);
        });

        setIsPlaying(true);
      } catch (err) {
        console.warn("[selah-audio] Ambient synth error:", err);
      }
    },
    [isMuted, volume, stopSynth]
  );

  // Play a specific track (Hymn recording or Ambient)
  const playTrack = useCallback(
    async (track: Track) => {
      if (track.type === "ambient") {
        startAmbientPad(track);
        return;
      }

      // Recorded Hymn via HTML5 Audio
      stopSynth();

      if (!htmlAudioRef.current) {
        const audio = new Audio();
        audio.preload = "auto";
        htmlAudioRef.current = audio;
      }

      const audio = htmlAudioRef.current;
      audio.volume = isMuted ? 0 : volume;

      const sourceToPlay = track.src || track.fallbackSrc || "";
      if (audio.src !== sourceToPlay && !audio.src.endsWith(sourceToPlay)) {
        setIsLoadingAudio(true);
        audio.src = sourceToPlay;
        audio.load();
      }

      try {
        await audio.play();
        setIsPlaying(true);
        setIsLoadingAudio(false);
      } catch (err) {
        console.warn("[selah-audio] Audio play failed:", err);
        // Fallback to secondary source if primary local failed
        if (track.fallbackSrc && audio.src !== track.fallbackSrc) {
          try {
            audio.src = track.fallbackSrc;
            audio.load();
            await audio.play();
            setIsPlaying(true);
          } catch (e) {
            console.warn("[selah-audio] Fallback play failed:", e);
          }
        }
        setIsLoadingAudio(false);
      }
    },
    [isMuted, volume, startAmbientPad, stopSynth]
  );

  const togglePlay = () => {
    if (isPlaying) {
      stopAllAudio();
    } else {
      void playTrack(currentTrack);
    }
  };

  const selectTrack = (index: number) => {
    setCurrentTrackIndex(index);
    void playTrack(TRACK_CATALOG[index]);
  };

  const handleNext = () => {
    const nextIdx = (currentTrackIndex + 1) % TRACK_CATALOG.length;
    selectTrack(nextIdx);
  };

  const handlePrev = () => {
    const prevIdx = (currentTrackIndex - 1 + TRACK_CATALOG.length) % TRACK_CATALOG.length;
    selectTrack(prevIdx);
  };

  // Synchronize HTML5 Audio Events
  useEffect(() => {
    const audio = htmlAudioRef.current || new Audio();
    htmlAudioRef.current = audio;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      // Loop or advance to next hymn automatically
      const nextIdx = (currentTrackIndex + 1) % TRACK_CATALOG.length;
      setCurrentTrackIndex(nextIdx);
      void playTrack(TRACK_CATALOG[nextIdx]);
    };
    const onError = () => {
      setIsLoadingAudio(false);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [currentTrackIndex, playTrack]);

  // Adjust volume dynamically
  useEffect(() => {
    if (htmlAudioRef.current) {
      htmlAudioRef.current.volume = isMuted ? 0 : volume;
    }
    if (masterGainRef.current && audioCtxRef.current) {
      const target = isMuted ? 0 : volume * 0.35;
      masterGainRef.current.gain.setTargetAtTime(target, audioCtxRef.current.currentTime, 0.05);
    }
  }, [volume, isMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllAudio();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [stopAllAudio]);

  const hymns = TRACK_CATALOG.filter((t) => t.type === "hymn");
  const ambients = TRACK_CATALOG.filter((t) => t.type === "ambient");

  const formatSecs = (sec: number) => {
    if (isNaN(sec) || !isFinite(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <>


      {/* -------------------------------------------------------------------- */}
      {/* FLOATING SANCTUARY AUDIO CONTROLLER                                 */}
      {/* -------------------------------------------------------------------- */}
      {isMinimized ? (
        <aside
          aria-label="Sanctuary Audio Player"
          className="fixed bottom-20 left-4 z-40 sm:bottom-6 sm:left-6 animate-in fade-in duration-200"
        >
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#0d1217]/95 border border-[rgba(192,138,46,0.45)] text-brass shadow-2xl shadow-black/60 backdrop-blur-xl">
            {/* Quick Play/Pause Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              disabled={isLoadingAudio}
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all cursor-pointer shadow-md",
                isPlaying
                  ? "border-brass bg-brass text-black shadow-brass/30 ring-1 ring-brass/20"
                  : "border-white/10 bg-white/5 text-brass hover:border-brass/50 hover:bg-white/10"
              )}
              title={isPlaying ? "Pause Music" : "Play Sacred Hymn / Soaking Pad"}
              aria-label={isPlaying ? "Pause Sacred Hymns" : "Play Sacred Hymns"}
            >
              {isLoadingAudio ? (
                <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
              ) : isPlaying ? (
                <Pause size={14} />
              ) : (
                <Play size={14} className="ml-0.5" />
              )}
            </button>

            {/* Info & Expand Trigger */}
            <button
              type="button"
              onClick={() => handleSetMinimized(false)}
              className="flex items-center gap-2 pl-1 pr-3 py-1 cursor-pointer text-left group"
              title="Open Sanctuary Music Player"
              aria-label="Open Sanctuary Music Player"
            >
              <div className="flex flex-col min-w-0 max-w-[120px] sm:max-w-[160px]">
                <span className="text-[0.68rem] font-semibold text-white group-hover:text-brass transition-colors truncate leading-tight">
                  {isPlaying ? currentTrack.title : "Sacred Hymns"}
                </span>
                <span className="text-[0.58rem] text-brass/80 font-mono truncate leading-tight">
                  {isPlaying
                    ? currentTrack.type === "hymn"
                      ? "Hymn · Tap to expand"
                      : "Pad · Tap to expand"
                    : "Worship Sanctuary"}
                </span>
              </div>
              <ChevronUp
                size={14}
                className="text-white/40 group-hover:text-white shrink-0 transition-transform group-hover:-translate-y-0.5"
              />
            </button>
          </div>
        </aside>
      ) : (
        <aside
          aria-label="Sanctuary Audio Player"
          className="fixed bottom-20 left-4 z-40 w-[calc(100vw-2rem)] max-w-[380px] sm:bottom-6 sm:left-6 animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="overflow-hidden rounded-2xl border border-[rgba(192,138,46,0.4)] bg-[#0d1217]/95 p-3.5 shadow-2xl backdrop-blur-xl transition-all">
          {/* Compact Main Bar */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={togglePlay}
                disabled={isLoadingAudio}
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all cursor-pointer shadow-lg",
                  isPlaying
                    ? "border-brass bg-brass text-black shadow-brass/40 ring-2 ring-brass/20"
                    : "border-white/10 bg-white/5 text-brass hover:border-brass/50 hover:bg-white/10"
                )}
                title={isPlaying ? "Pause Music" : "Play Sacred Hymn / Soaking Pad"}
              >
                {isLoadingAudio ? (
                  <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                ) : isPlaying ? (
                  <Pause size={17} />
                ) : (
                  <Play size={17} className="ml-0.5" />
                )}
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[0.65rem] font-bold uppercase tracking-wider text-brass flex items-center gap-1">
                    <Radio size={11} className={isPlaying ? "animate-pulse" : ""} />{" "}
                    {currentTrack.type === "hymn" ? "Sacred Hymn" : "Soaking Atmosphere"}
                  </span>
                  {isPlaying && (
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-[0.62rem] text-emerald-400 font-mono">Playing</span>
                    </span>
                  )}
                </div>
                <div className="truncate text-xs font-semibold text-white">
                  {currentTrack.title}
                </div>
                <div className="truncate text-[0.68rem] text-white/50">
                  {currentTrack.subtitle}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
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
                title={isExpanded ? "Collapse Song List" : "Show All Hymns & Controls"}
                aria-label={isExpanded ? "Collapse Song List" : "Show All Hymns & Controls"}
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>

              <button
                type="button"
                onClick={() => handleSetMinimized(true)}
                className="text-white/60 hover:text-brass p-1.5 cursor-pointer transition-colors ml-0.5"
                title="Minimize Player"
                aria-label="Minimize Player"
              >
                <Minimize2 size={15} />
              </button>
            </div>
          </div>

          {/* Time Scrubber (for Hymn tracks) */}
          {currentTrack.type === "hymn" && duration > 0 && (
            <div className="mt-2.5 flex items-center gap-2">
              <span className="text-[0.62rem] text-white/40 font-mono tnum">
                {formatSecs(currentTime)}
              </span>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setCurrentTime(val);
                  if (htmlAudioRef.current) {
                    htmlAudioRef.current.currentTime = val;
                  }
                }}
                className="h-1 flex-1 cursor-pointer accent-brass bg-white/10 rounded-full"
              />
              <span className="text-[0.62rem] text-white/40 font-mono tnum">
                {formatSecs(duration)}
              </span>
            </div>
          )}

          {/* Devotional Lyric Snippet */}
          {isPlaying && currentTrack.lyricSnippet && (
            <div className="mt-2 rounded-lg bg-brass/10 border border-brass/20 px-2.5 py-1.5 text-[0.7rem] text-brass-light leading-snug italic line-clamp-2 animate-in fade-in">
              &ldquo;{currentTrack.lyricSnippet}&rdquo;
            </div>
          )}

          {/* Expanded Drawer for Song Selection & Tabs */}
          {isExpanded && (
            <div className="mt-3.5 pt-3.5 border-t border-white/10 space-y-3 animate-in fade-in slide-in-from-bottom-2">
              {/* Category Tabs */}
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
              <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
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
                          <span className="text-[0.62rem] uppercase font-bold tracking-wider text-brass font-mono">
                            Playing
                          </span>
                        )}
                      </div>
                      <div className="text-[0.66rem] text-white/40 line-clamp-1 mt-0.5">
                        {track.subtitle}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <Sliders size={13} className="text-white/50" />
                <span className="text-[0.68rem] text-white/50">Volume</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="h-1 flex-1 cursor-pointer accent-brass bg-white/10 rounded-full"
                />
                <span className="text-[0.68rem] text-white/70 font-mono tnum w-8 text-right">
                  {Math.round(volume * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </aside>
    )}
  </>
  );
}
