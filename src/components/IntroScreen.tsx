import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, Music, Volume2, VolumeX } from 'lucide-react';

interface IntroScreenProps {
  onComplete: () => void;
}

const GREETING_QUOTES = [
  {
    quote: "Every birthday wish made my day a little brighter...",
    author: "Your heart-warming thoughts were the perfect gift."
  },
  {
    quote: "For every laugh, every smile, and all the lovely vibes...",
    author: "You made my birthday truly unforgettable."
  },
  {
    quote: "Thanks for your love and support ❤️",
    author: "I've crafted a personalized memory card just for you."
  }
];

export default function IntroScreen({ onComplete }: IntroScreenProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ambientAudio, setAmbientAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Elegant slide rotation
    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        if (prev === GREETING_QUOTES.length - 1) {
          clearInterval(interval);
          return prev; // Stay on the last slide with the 'Enter Portal' button
        }
        return prev + 1;
      });
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const handleStartMusic = () => {
    if (!ambientAudio) {
      // Atmospheric ambient piano chords
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav'); 
      audio.loop = true;
      audio.volume = 0.4;
      audio.play().catch(e => console.log('Music start skipped:', e));
      setAmbientAudio(audio);
      setIsPlaying(true);
    } else {
      if (isPlaying) {
        ambientAudio.pause();
        setIsPlaying(false);
      } else {
        ambientAudio.play().catch(e => console.log(e));
        setIsPlaying(true);
      }
    }
  };

  return (
    <div 
      id="intro-container" 
      className="relative flex flex-col items-center justify-center min-h-screen w-full bg-[#0A0A0A] overflow-hidden text-white px-6 py-12"
    >
      {/* Carbon Grid Background Overlay */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none carbon-grid" />

      {/* Decorative high contrast visual elements */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 via-amber-400 to-rose-500 opacity-60" />

      {/* Atmospheric overlays */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-rose-500/5 blur-[140px] pointer-events-none" />

      {/* Floating sound toggle */}
      <div className="absolute top-6 right-6 z-20">
        <button
          id="btn-intro-audio"
          onClick={handleStartMusic}
          className="flex items-center gap-2 px-4 py-2 border border-white/20 bg-black text-[10px] font-mono tracking-widest uppercase hover:bg-white hover:text-black transition-all duration-300"
        >
          {isPlaying ? <Volume2 size={13} className="text-rose-500" /> : <VolumeX size={13} />}
          <span>Music {isPlaying ? "On" : "Off"}</span>
        </button>
      </div>

      {/* Animated Greeting Slider */}
      <div className="w-full max-w-3xl text-center z-10 flex flex-col items-center justify-center min-h-[350px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05, y: -10 }}
            transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
            className="flex flex-col items-center justify-center p-4"
          >
            <div className="w-12 h-12 border border-white/10 rounded-full flex items-center justify-center mb-8 rotate-12 bg-white/5 text-rose-500">
              <Sparkles size={18} className="animate-pulse" />
            </div>
            
            <h1 className="font-serif text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-[0.9] text-white max-w-2xl text-center mb-8">
              "{GREETING_QUOTES[currentSlide].quote}"
            </h1>
            
            <p className="font-mono text-xs text-white/50 uppercase tracking-widest max-w-md">
              // {GREETING_QUOTES[currentSlide].author}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Button footer section */}
      <motion.div 
        id="intro-footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: currentSlide === GREETING_QUOTES.length - 1 ? 1 : 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="mt-12 z-10"
      >
        {currentSlide === GREETING_QUOTES.length - 1 && (
          <button
            id="btn-intro-start"
            onClick={() => {
              if (ambientAudio) {
                ambientAudio.pause();
              }
              onComplete();
            }}
            className="group relative flex items-center gap-3 px-8 py-4 bg-white text-black font-serif font-black text-xs uppercase tracking-widest hover:bg-rose-500 hover:text-white hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer shadow-[0_10px_30px_rgba(255,255,255,0.05)]"
          >
            <span className="tracking-widest">Open Thank You Envelope</span>
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1.5" />
          </button>
        )}
      </motion.div>

      {/* Pagination indicators */}
      <div className="absolute bottom-8 flex gap-3">
        {GREETING_QUOTES.map((_, idx) => (
          <div 
            key={idx}
            className={`h-0.5 rounded-none transition-all duration-500 ${
              idx === currentSlide ? 'w-12 bg-rose-500' : 'w-4 bg-white/20'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
