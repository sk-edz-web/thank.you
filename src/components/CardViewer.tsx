import React, { useState, useEffect, useRef, CSSProperties } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Volume2, VolumeX, Sparkles, Play, Pause, 
  ExternalLink, Music, Heart, PhoneIncoming, MessageSquare 
} from 'lucide-react';
import { Card, CardElement } from '../types';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

interface CardViewerProps {
  card: Card;
  onBack: () => void;
}

export default function CardViewer({ card, onBack }: CardViewerProps) {
  const [liveCard, setLiveCard] = useState<Card>(card);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [activeAudioItems, setActiveAudioItems] = useState<{ [id: string]: boolean }>({});
  const [confetti, setConfetti] = useState<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  
  // Background Audio reference
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  // Separate audio elements references for embedded tapes
  const audioRefs = useRef<{ [id: string]: HTMLAudioElement }>({});

  // Live real-time database sync for this active card
  useEffect(() => {
    const docRef = doc(db, 'cards', card.id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && data.isDeleted) {
          // Card was soft-deleted, take user back
          onBack();
        } else {
          setLiveCard({ id: docSnap.id, ...data } as Card);
        }
      } else {
        // Card was physically deleted, take user back
        onBack();
      }
    }, (err) => {
      console.error("Failed to sync card detail in realtime:", err);
    });
    return () => unsubscribe();
  }, [card.id, onBack]);

  // Clean-up and setup background audio
  useEffect(() => {
    if (liveCard.bgMusicEnabled && liveCard.bgMusicUrl) {
      const audio = new Audio(liveCard.bgMusicUrl);
      audio.loop = true;
      audio.volume = 0.5;
      bgAudioRef.current = audio;
      
      // Auto-play might be blocked by browser until interaction, handle gracefully
      audio.play()
        .then(() => setIsPlayingMusic(true))
        .catch(() => setIsPlayingMusic(false));
    }

    // Trigger sweet custom heart/splendor particles!
    const elementsArray = Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * -30 - 10,
      size: Math.random() * 20 + 8,
      speed: Math.random() * 3 + 1.5,
      delay: Math.random() * 2,
      rotation: Math.random() * 360,
      color: ['#f472b6', '#38bdf8', '#fbbf24', '#c084fc', '#4ade80'][Math.floor(Math.random() * 5)]
    }));
    setConfetti(elementsArray);

    return () => {
      if (bgAudioRef.current) {
        bgAudioRef.current.pause();
        bgAudioRef.current = null;
      }
      
      // Stop all secondary embedded streams
      Object.values(audioRefs.current).forEach((track: any) => {
        track.pause();
      });
    };
  }, [liveCard]);

  // Responsive scaling logic using ResizeObserver
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const parentWidth = entry.contentRect.width;
        const parentHeight = entry.contentRect.height;
        
        // Logical workspace is 450 x 700 px
        const targetWidth = 450;
        const targetHeight = 700;
        
        const scaleX = parentWidth / targetWidth;
        const scaleY = parentHeight / targetHeight;
        
        // Preserve aspect ratio and scale down if it exceeds boundaries
        const scaleFactor = Math.min(scaleX, scaleY, 1);
        setScale(scaleFactor);
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const toggleBackgroundMusic = () => {
    if (!bgAudioRef.current) return;

    if (isPlayingMusic) {
      bgAudioRef.current.pause();
      setIsPlayingMusic(false);
    } else {
      bgAudioRef.current.play().catch(e => console.log(e));
      setIsPlayingMusic(true);
    }
  };

  const handleToggleAudioElement = (elemId: string, src: string) => {
    // If background soundtrack is playing, dim its volume so user can hear the personalized element clip!
    if (bgAudioRef.current && isPlayingMusic) {
      bgAudioRef.current.volume = 0.15;
    }

    if (!audioRefs.current[elemId]) {
      const audioObj = new Audio(src);
      audioObj.onended = () => {
        setActiveAudioItems(prev => ({ ...prev, [elemId]: false }));
        if (bgAudioRef.current && isPlayingMusic) {
          bgAudioRef.current.volume = 0.5; // restore volume
        }
      };
      audioRefs.current[elemId] = audioObj;
    }

    const currentTrack = audioRefs.current[elemId];
    const isCurrentlyPlaying = activeAudioItems[elemId];

    if (isCurrentlyPlaying) {
      currentTrack.pause();
      setActiveAudioItems(prev => ({ ...prev, [elemId]: false }));
      if (bgAudioRef.current && isPlayingMusic) {
        bgAudioRef.current.volume = 0.5;
      }
    } else {
      // Pause all other tape streams first
      Object.keys(audioRefs.current).forEach(id => {
        if (id !== elemId) {
          audioRefs.current[id].pause();
          setActiveAudioItems(prev => ({ ...prev, [id]: false }));
        }
      });

      currentTrack.play()
        .then(() => setActiveAudioItems(prev => ({ ...prev, [elemId]: true })))
        .catch(e => console.log('Asset media blocked:', e));
    }
  };

  return (
    <div id="card-viewer-root" className="relative w-full min-h-screen bg-[#07070a] flex flex-col items-center justify-start text-white overflow-hidden">
      
      {/* Header controls strip */}
      <header className="z-20 w-full max-w-lg mt-4 px-4 flex items-center justify-between border-b border-white/5 pb-3">
        <button
          id="btn-viewer-back"
          onClick={onBack}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-white bg-white/5 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-md active:scale-95 transition-all cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Exit Card</span>
        </button>

        <div className="flex flex-col items-center">
          <p className="text-[10px] font-mono tracking-wider text-purple-400 uppercase">Personalised Card for</p>
          <h3 className="font-serif text-sm font-semibold tracking-wide text-white">{liveCard.name}</h3>
        </div>

        {liveCard.bgMusicEnabled && liveCard.bgMusicUrl ? (
          <button
            id="btn-viewer-bgmusic"
            onClick={toggleBackgroundMusic}
            className={`p-2 rounded-full border transition-all active:scale-90 cursor-pointer ${
              isPlayingMusic 
                ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.25)]' 
                : 'bg-white/5 border-white/10 text-slate-400'
            }`}
            title="Toggle Card Background Track"
          >
            {isPlayingMusic ? <Volume2 size={15} className="animate-bounce" /> : <VolumeX size={15} />}
          </button>
        ) : (
          <div className="w-8 h-8" /> // placeholder spacer
        )}
      </header>

      {/* Main card representation viewport container */}
      <main 
        ref={containerRef}
        className="relative flex-1 w-full max-w-lg flex items-center justify-center py-6 px-4 z-10 min-h-[400px]"
      >
        <div 
          ref={canvasRef}
          className="card-canvas-viewport relative shrink-0 overflow-hidden rounded-[28px] border border-white/20 shadow-[0_30px_70px_-10px_rgba(0,0,0,0.9)]"
          style={{
            width: '450px',
            height: '700px',
            transform: `scale(${scale})`,
            background: liveCard.bgType === 'gradient' ? liveCard.bgColor : liveCard.bgColor,
            backgroundImage: liveCard.bgType === 'image' ? `url(${liveCard.bgColor})` : undefined,
            backgroundColor: liveCard.bgType === 'color' ? liveCard.bgColor : undefined,
          }}
        >
          {/* Internal atmospheric card elements render loop */}
          {liveCard.elements && liveCard.elements.length > 0 ? (
            liveCard.elements.map((elem: CardElement) => {
              const elementStyle: CSSProperties = {
                position: 'absolute',
                left: `${elem.x}px`,
                top: `${elem.y}px`,
                width: `${elem.width}px`,
                height: `${elem.height}px`,
                transform: `rotate(${elem.rotate}deg)`,
                zIndex: 10,
              };

              switch (elem.type) {
                case 'text':
                  const textInnerStyle: CSSProperties = {
                    width: '100%',
                    height: '100%',
                    fontSize: `${elem.fontSize}px`,
                    color: elem.color,
                    fontWeight: elem.fontWeight,
                    textAlign: elem.textAlign,
                    backgroundColor: elem.bgColor || 'transparent',
                    borderRadius: elem.borderRadius ? `${elem.borderRadius}px` : undefined,
                    padding: elem.padding ? `${elem.padding}px` : undefined,
                    lineHeight: '1.4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: elem.textAlign === 'center' ? 'center' : elem.textAlign === 'right' ? 'flex-end' : 'flex-start',
                    wordBreak: 'break-word',
                  };

                  return (
                    <div key={elem.id} style={elementStyle}>
                      {elem.link ? (
                        <a 
                          href={elem.link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="group relative block w-full h-full"
                        >
                          <div style={textInnerStyle} className="hover:scale-[1.02] active:scale-[0.98] transition-transform duration-300">
                            {elem.content}
                            <ExternalLink size={11} className="absolute right-2 bottom-2 text-white/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </a>
                      ) : (
                        <div style={textInnerStyle}>
                          {elem.content}
                        </div>
                      )}
                    </div>
                  );

                case 'image':
                  return (
                    <div key={elem.id} style={elementStyle}>
                      {elem.link ? (
                        <a 
                          href={elem.link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="block w-full h-full shadow-lg group"
                        >
                          <img
                            src={elem.src}
                            alt="Card custom frame"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover select-none transition-transform duration-300 group-hover:scale-105 active:scale-95"
                            style={{ borderRadius: elem.borderRadius ? `${elem.borderRadius}px` : '12px' }}
                          />
                        </a>
                      ) : (
                        <img
                          src={elem.src}
                          alt="Card layout decoration"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover select-none shadow-md"
                          style={{ borderRadius: elem.borderRadius ? `${elem.borderRadius}px` : '12px' }}
                        />
                      )}
                    </div>
                  );

                case 'video':
                  return (
                    <div key={elem.id} style={elementStyle} className="shadow-lg overflow-hidden rounded-xl bg-black">
                      <video
                        src={elem.src}
                        controls
                        muted
                        autoPlay
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                        style={{ borderRadius: elem.borderRadius ? `${elem.borderRadius}px` : '12px' }}
                      />
                    </div>
                  );

                case 'audio':
                  const isPlayingThis = activeAudioItems[elem.id] || false;
                  return (
                    <div 
                      key={elem.id} 
                      style={elementStyle}
                      className="flex items-center justify-center"
                    >
                      {/* Sweet interactive graphical audio cassettes/disks */}
                      <button
                        onClick={() => handleToggleAudioElement(elem.id, elem.src)}
                        className={`relative w-full h-full rounded-2xl flex flex-col items-center justify-center p-3 border cursor-pointer transition-all active:scale-95 group ${
                          isPlayingThis
                            ? 'bg-purple-600/20 border-purple-400 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.3)] animate-pulse'
                            : 'bg-indigo-950/45 border-indigo-900/60 text-indigo-300 hover:bg-slate-900 hover:border-slate-800'
                        }`}
                      >
                        {elem.visualStyle === 'vinyl' ? (
                          <div className="flex flex-col items-center justify-center">
                            <div className={`w-14 h-14 rounded-full bg-slate-900 border-2 border-dashed border-purple-500/50 flex items-center justify-center ${isPlayingThis ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }}>
                              <div className="w-4 h-4 rounded-full bg-slate-950 flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                              </div>
                            </div>
                            <span className="text-[10px] uppercase font-mono tracking-wider mt-2 block">{isPlayingThis ? "Spinning..." : "Play Vinyl Record"}</span>
                          </div>
                        ) : elem.visualStyle === 'cassette' ? (
                          <div className="flex items-center gap-2.5 w-full">
                            <div className="p-2.5 rounded-lg bg-indigo-950 border border-slate-800 text-indigo-400 shrink-0">
                              <Music size={16} className={isPlayingThis ? "animate-pulse" : ""} />
                            </div>
                            <div className="flex-1 text-left">
                              <p className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">Interactive Tape</p>
                              <p className="text-[11px] text-slate-300 font-medium truncate max-w-[120px]">{elem.caption || "Audio Recording"}</p>
                            </div>
                            <div className="p-1 rounded bg-black/30">
                              {isPlayingThis ? <Pause size={12} className="text-purple-400" /> : <Play size={12} className="text-emerald-400" />}
                            </div>
                          </div>
                        ) : (
                          // minimal/speaker
                          <div className="flex flex-col items-center justify-center">
                            <div className={`p-3 rounded-full bg-indigo-950/80 text-white ${isPlayingThis ? "animate-pulse shadow-md" : ""}`}>
                              {isPlayingThis ? <Pause size={18} className="text-purple-400" /> : <Play size={18} className="text-indigo-400 group-hover:scale-110 transition-transform" />}
                            </div>
                            <span className="text-[10px] text-indigo-200 mt-1 font-mono">{isPlayingThis ? "Playing Message" : "Tap for VoiceNote"}</span>
                          </div>
                        )}
                      </button>
                    </div>
                  );

                default:
                  return null;
              }
            })
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 px-6 text-center">
              <Sparkles size={24} className="mb-2 text-indigo-500 opacity-60" />
              <p className="text-xs">This card is empty! Use the admin dashboard workspace to add elements.</p>
            </div>
          )}
        </div>
      </main>

      {/* Auxiliary auxiliary floating footer for support link or quotes */}
      {liveCard.personalNote && (
        <footer className="z-20 w-full max-w-sm mb-6 text-center px-6">
          <p className="font-serif italic text-xs text-slate-400 leading-relaxed">
            "{liveCard.personalNote}"
          </p>
        </footer>
      )}
    </div>
  );
}
