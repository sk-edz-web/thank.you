// birthday-thanks-card-creator/src/components/AdminPanel.tsx
import React, { useState, useEffect, useRef, CSSProperties, ChangeEvent, MouseEvent } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, Trash2, Edit3, Save, ArrowLeft, Upload, 
  Music, Image, Video, Sparkles, FolderHeart, 
  Check, X, Link as LinkIcon, RotateCw, AlignLeft, 
  AlignCenter, AlignRight, Bold, HelpCircle, LayoutGrid, Eye, Search, Maximize2
} from 'lucide-react';
import { Card, CardElement, CardElement as AnyElement } from '../types';
import { collection, getDocs, doc, setDoc, deleteDoc, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

interface AdminPanelProps {
  onBack: () => void;
}

const GRADIENT_PRESETS = [
  { name: 'Cosmic Space', css: 'linear-gradient(135deg, #1e1b4b 0%, #311042 50%, #030712 100%)' },
  { name: 'Sweet Twilight', css: 'linear-gradient(135deg, #4c1d95 0%, #db2777 50%, #1e1b4b 100%)' },
  { name: 'Ocean Aura', css: 'linear-gradient(135deg, #0f172a 0%, #0f766e 50%, #064e3b 100%)' },
  { name: 'Warm Sunset', css: 'linear-gradient(135deg, #7c2d12 0%, #b91c1c 50%, #d97706 100%)' },
  { name: 'Pitch Obsidian', css: 'linear-gradient(135deg, #090d16 0%, #111827 50%, #030712 100%)' },
];

export default function AdminPanel({ onBack }: AdminPanelProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [activeView, setActiveView] = useState<'list' | 'builder'>('list');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  
  // Builder form/canvas state
  const [cardName, setCardName] = useState('');
  const [cardCode, setCardCode] = useState('');
  const [bgType, setBgType] = useState<'color' | 'gradient' | 'image'>('gradient');
  const [bgColor, setBgColor] = useState(GRADIENT_PRESETS[0].css);
  const [bgMusicEnabled, setBgMusicEnabled] = useState(false);
  const [bgMusicUrl, setBgMusicUrl] = useState('');
  const [personalNote, setPersonalNote] = useState('');
  const [canvasElements, setCanvasElements] = useState<CardElement[]>([]);
  
  // Editor/UI Helper states
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Dragging and resizing canvas state helpers
  const [draggedElementId, setDraggedElementId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizingElementId, setResizingElementId] = useState<string | null>(null);
  const [initialResizeDimensions, setInitialResizeDimensions] = useState({ w: 0, h: 0 });
  const [initialMousePosition, setInitialMousePosition] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);

  // Fetch and sync all existing cards in realtime on mount
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'cards'), (snapshot) => {
      const fetchedCards: Card[] = [];
      snapshot.forEach((docSnap) => {
        fetchedCards.push({ id: docSnap.id, ...docSnap.data() } as Card);
      });
      setCards(fetchedCards);
    }, (err) => {
      console.error("Failed to sync cards from Firebase in realtime:", err);
    });
    return () => unsubscribe();
  }, []);

  const fetchCards = () => {
    // onSnapshot listener handles live updates automatically now
  };

  const handleCreateNewTrigger = () => {
    // Boilerplate state setup for clean creation
    setCardName('');
    setCardCode('');
    setBgType('gradient');
    setBgColor(GRADIENT_PRESETS[0].css);
    setBgMusicEnabled(false);
    setBgMusicUrl('');
    setPersonalNote('');
    setCanvasElements([]);
    setSelectedElementId(null);
    setSelectedCardId(null);
    setErrorNotice(null);
    setSuccessNotice(null);
    setActiveView('builder');
  };

  const handleEditCardTrigger = (card: Card) => {
    setCardName(card.name);
    setCardCode(card.code);
    setBgType(card.bgType || 'gradient');
    setBgColor(card.bgColor);
    setBgMusicEnabled(card.bgMusicEnabled || false);
    setBgMusicUrl(card.bgMusicUrl || '');
    setPersonalNote(card.personalNote || '');
    setCanvasElements(card.elements || []);
    setSelectedElementId(null);
    setSelectedCardId(card.id);
    setErrorNotice(null);
    setSuccessNotice(null);
    setActiveView('builder');
  };

  const handleDeleteCard = async (targetId: string) => {
    if (!window.confirm("Are you absolutely sure you want to delete this custom thank you card? This cannot be undone.")) return;
    
    try {
      // Primary: Try to physically delete from Firestore
      await deleteDoc(doc(db, 'cards', targetId));
      fetchCards();
    } catch (err: any) {
      console.warn("deleteDoc failed, attempting soft-delete update fallback:", err);
      try {
        // Fallback: If deleteDoc is restricted, update isDeleted flag (which is authorized as update/setDoc)
        await setDoc(doc(db, 'cards', targetId), { isDeleted: true }, { merge: true });
        fetchCards();
      } catch (softErr: any) {
        console.error("Soft-delete fallback failed too:", softErr);
        alert("Failed to delete card: " + softErr.message);
      }
    }
  };

  /* Add Elements on Canvas */
  const addTextElement = () => {
    const newTxt: CardElement = {
      id: 'elem-txt-' + Math.random().toString(36).substring(2, 6),
      type: 'text',
      x: 50,
      y: 120,
      width: 350,
      height: 80,
      rotate: 0,
      content: 'Tap to type custom message here...',
      fontSize: 18,
      color: '#ffffff',
      fontWeight: 'bold',
      textAlign: 'center',
      bgColor: 'transparent',
      borderRadius: 8,
      padding: 4
    };
    setCanvasElements(prev => [...prev, newTxt]);
    setSelectedElementId(newTxt.id);
  };

  const addImageElement = () => {
    const newImg: CardElement = {
      id: 'elem-img-' + Math.random().toString(36).substring(2, 6),
      type: 'image',
      x: 75,
      y: 220,
      width: 300,
      height: 200,
      rotate: 0,
      src: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&auto=format&fit=crop&q=60', // beautiful default sparkles
      borderRadius: 16
    };
    setCanvasElements(prev => [...prev, newImg]);
    setSelectedElementId(newImg.id);
  };

  const addVideoElement = () => {
    const newVid: CardElement = {
      id: 'elem-vid-' + Math.random().toString(36).substring(2, 6),
      type: 'video',
      x: 75,
      y: 220,
      width: 300,
      height: 200,
      rotate: 0,
      src: 'https://assets.mixkit.co/videos/preview/mixkit-celebrating-with-sparklers-34208-large.mp4', // beautiful gold sparkles loop
      borderRadius: 16
    };
    setCanvasElements(prev => [...prev, newVid]);
    setSelectedElementId(newVid.id);
  };

  const addAudioElement = () => {
    const newAudio: CardElement = {
      id: 'elem-audio-' + Math.random().toString(36).substring(2, 6),
      type: 'audio',
      x: 100,
      y: 450,
      width: 250,
      height: 70,
      rotate: 0,
      src: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav', // sweet retro note chime
      visualStyle: 'cassette',
      caption: 'Click to Listen 🎧'
    };
    setCanvasElements(prev => [...prev, newAudio]);
    setSelectedElementId(newAudio.id);
  };

  /* File upload proxy through Cloudinary */
  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>, targetField: 'selected-elem' | 'bg-music' | 'bg-image') => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'invoice'); // Changed from 'all' to 'invoice' as requested

    setIsUploading(true);
    setErrorNotice(null);

    try {
      const response = await fetch('https://api.cloudinary.com/v1_1/dnrgcl6ah/auto/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload assets to Cloudinary.");
      }

      const result = await response.json();
      const uploadedUrl = result.secure_url; // Cloudinary secure target URL

      if (targetField === 'bg-music') {
        setBgMusicUrl(uploadedUrl);
        setBgMusicEnabled(true);
      } else if (targetField === 'bg-image') {
        setBgType('image');
        setBgColor(uploadedUrl);
      } else if (targetField === 'selected-elem' && selectedElementId) {
        setCanvasElements(prev => prev.map(elem => {
          if (elem.id === selectedElementId) {
            if (elem.type === 'image' || elem.type === 'video') {
              return { ...elem, src: uploadedUrl };
            } else if (elem.type === 'audio') {
              return { ...elem, src: uploadedUrl };
            }
          }
          return elem;
        }));
      }

      setSuccessNotice("Asset successfully uploaded to Cloudinary & active!");
      setTimeout(() => setSuccessNotice(null), 3000);
    } catch (err: any) {
      setErrorNotice(err.message || "An error occurred uploading the file to Cloudinary.");
    } finally {
      setIsUploading(false);
    }
  };

  /* Delete element from canvas */
  const removeElement = (id: string) => {
    setCanvasElements(prev => prev.filter(e => e.id !== id));
    if (selectedElementId === id) setSelectedElementId(null);
  };

  /* Change properties of selected element */
  const updateSelectedElement = (updates: Partial<AnyElement>) => {
    if (!selectedElementId) return;
    setCanvasElements(prev => prev.map(elem => {
      if (elem.id === selectedElementId) {
        return { ...elem, ...updates } as CardElement;
      }
      return elem;
    }));
  };

  /* Drag handlers inside virtual coordinate space 450x700 */
  const handleElementMouseDown = (e: MouseEvent, elem: CardElement) => {
    // If clicking a resize handle, handle sizing instead
    if ((e.target as HTMLElement).classList.contains('canvas-resize-handle')) {
      return;
    }
    
    e.preventDefault();
    setSelectedElementId(elem.id);
    setDraggedElementId(elem.id);

    // Calculate mouse position relative to element top-left
    if (canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      // Mouse X relative to canvas
      const mouseCanvasX = e.clientX - canvasRect.left;
      const mouseCanvasY = e.clientY - canvasRect.top;
      
      setDragOffset({
        x: mouseCanvasX - elem.x,
        y: mouseCanvasY - elem.y
      });
    }
  };

  const handleResizeMouseDown = (e: MouseEvent, elem: CardElement) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingElementId(elem.id);
    setInitialResizeDimensions({ w: elem.width, h: elem.height });
    setInitialMousePosition({ x: e.clientX, y: e.clientY });
  };

  const handleCanvasMouseMove = (e: MouseEvent) => {
    if (!canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();

    if (draggedElementId) {
      const mouseCanvasX = e.clientX - canvasRect.left;
      const mouseCanvasY = e.clientY - canvasRect.top;
      
      let newX = Math.round(mouseCanvasX - dragOffset.x);
      let newY = Math.round(mouseCanvasY - dragOffset.y);
      
      // Select element to obtain dimensions
      const elem = canvasElements.find(el => el.id === draggedElementId);
      if (elem) {
        // Clamp bounds to canvas
        newX = Math.max(0, Math.min(450 - elem.width, newX));
        newY = Math.max(0, Math.min(700 - elem.height, newY));
        
        setCanvasElements(prev => prev.map(el => {
          if (el.id === draggedElementId) {
            return { ...el, x: newX, y: newY };
          }
          return el;
        }));
      }
    } else if (resizingElementId) {
      const deltaX = e.clientX - initialMousePosition.x;
      const deltaY = e.clientY - initialMousePosition.y;
      
      const elem = canvasElements.find(el => el.id === resizingElementId);
      if (elem) {
        // Enforce min sizes
        const newWidth = Math.max(30, Math.min(450 - elem.x, Math.round(initialResizeDimensions.w + deltaX)));
        const newHeight = Math.max(20, Math.min(700 - elem.y, Math.round(initialResizeDimensions.h + deltaY)));
        
        setCanvasElements(prev => prev.map(el => {
          if (el.id === resizingElementId) {
            return { ...el, width: newWidth, height: newHeight };
          }
          return el;
        }));
      }
    }
  };

  const handleCanvasMouseUp = () => {
    setDraggedElementId(null);
    setResizingElementId(null);
  };

  /* Save canvas state to Firestore database */
  const handleSaveCard = async () => {
    setErrorNotice(null);
    setSuccessNotice(null);

    if (!cardName.trim() || !cardCode.trim()) {
      setErrorNotice("Please fill in both the well-wisher's Name and their unique Entrance Code!");
      return;
    }

    const formattedCode = cardCode.trim().toUpperCase();

    try {
      const cardsRef = collection(db, 'cards');
      
      // Check if access code is already assigned to a different card
      const codeQuery = query(cardsRef, where('code', '==', formattedCode));
      const codeQuerySnapshot = await getDocs(codeQuery);
      
      let isCodeDuplicate = false;
      codeQuerySnapshot.forEach((docSnap) => {
        if (selectedCardId) {
          if (docSnap.id !== selectedCardId) {
            isCodeDuplicate = true;
          }
        } else {
          isCodeDuplicate = true;
        }
      });

      if (isCodeDuplicate) {
        throw new Error("Access Code is already assigned to a other card!");
      }

      const cardId = selectedCardId || 'card-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
      const payload = {
        id: cardId,
        name: cardName.trim(),
        code: formattedCode,
        bgType,
        bgColor,
        bgMusicEnabled,
        bgMusicUrl,
        personalNote,
        elements: canvasElements,
        createdAt: Date.now()
      };

      // Set document in Firestore
      await setDoc(doc(db, 'cards', cardId), payload);

      setSuccessNotice(`Card for '${cardName}' successfully published with code '${formattedCode}'!`);
      fetchCards();

      // Switch back to checklist of elements
      setTimeout(() => {
        setSuccessNotice(null);
        setActiveView('list');
      }, 1500);

    } catch (err: any) {
      setErrorNotice(err.message || "Failed to successfully write template.");
    }
  };

  const activeElement = canvasElements.find(e => e.id === selectedElementId);

  // Filter list of cards and exclude soft-deleted ones
  const filteredCards = cards.filter(c => 
    !c.isDeleted && (
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div id="admin-panel-stage" className="min-h-screen bg-[#0A0A0A] font-sans text-white flex flex-col w-full">
      {/* Top action header */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-[#111111] shrink-0">
        <div className="flex items-center gap-4">
          <button
            id="btn-admin-exit"
            onClick={onBack}
            className="flex items-center justify-center w-9 h-9 border border-white/15 bg-[#0F0F0F] hover:bg-white hover:text-black transition-all cursor-pointer text-slate-300"
          >
            <ArrowLeft size={14} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-gradient-to-tr from-rose-500 to-amber-400 rounded-sm"></div>
            <h1 className="text-sm font-black tracking-tight uppercase italic text-white flex items-center">
              Gratitude Studio <span className="text-white/40 font-normal ml-2 font-mono text-[10px] not-italic">// Birthday Card Builder</span>
            </h1>
          </div>
        </div>

        {activeView === 'builder' ? (
          <div className="flex items-center gap-3">
            <button
              id="btn-builder-cancel"
              onClick={() => setActiveView('list')}
              className="px-4 py-2 text-[10px] border border-white/10 bg-[#0F0F0F] text-slate-300 font-mono uppercase tracking-wider hover:bg-white/10 transition-all cursor-pointer"
            >
              Cancel Edit
            </button>
            <button
              id="btn-builder-publish"
              onClick={handleSaveCard}
              className="flex items-center gap-2 px-5 py-2 text-[10px] bg-white text-black font-serif font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
            >
              <Save size={12} />
              <span>Publish Card</span>
            </button>
          </div>
        ) : (
          <button
            id="btn-admin-new-card"
            onClick={handleCreateNewTrigger}
            className="flex items-center gap-2 px-5 py-2 text-[10px] bg-white text-black font-serif font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white hover:scale-105 transition-all cursor-pointer"
          >
            <Plus size={12} />
            <span>Create Custom Card</span>
          </button>
        )}
      </header>

      {/* Main dashboard view */}
      {activeView === 'list' ? (
        <div className="flex-1 overflow-auto max-w-7xl w-full mx-auto p-6 flex flex-col">
          
          {/* Welcome Info Board */}
          <div className="mb-8 p-6 bg-[#111111] border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="max-w-xl">
              <h2 className="text-sm font-black uppercase tracking-widest text-rose-500 mb-2 flex items-center gap-2">
                <FolderHeart size={16} className="text-rose-500 animate-pulse" />
                Customize personalized thank-you cards!
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed font-mono">
                For every person who wished you a happy birthday, create a dedicated record with their name and custom elements. Associate it with a passcode. They can explore images, videos, audio soundtracks, and links on a drag-and-drop workspace!
              </p>
            </div>
            
            <div className="flex items-center gap-6 p-4 border border-white/10 bg-[#0A0A0A] self-stretch justify-around md:self-auto shrink-0 min-w-[200px]">
              <div className="text-center">
                <span className="text-[10px] font-mono text-slate-500 uppercase block tracking-wider">Total Cards</span>
                <span className="text-2xl font-black text-white">{cards.length}</span>
              </div>
              <div className="h-8 w-[1px] bg-white/10" />
              <div className="text-center">
                <span className="text-[10px] font-mono text-slate-500 uppercase block tracking-wider">Default Code</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20">WELCOME</span>
              </div>
            </div>
          </div>

          {/* Table / Grid list panel */}
          <div className="flex justify-between items-center gap-4 mb-4 select-text">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search by recipient's name or access code..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111111] border border-white/10 py-3 pl-10 pr-4 text-xs text-white placeholder-white/30 font-mono uppercase tracking-wider outline-none focus:border-rose-500 focus:ring-0"
              />
            </div>
          </div>

          <div className="flex-1 bg-[#111111]/30 border border-white/10 overflow-hidden select-text">
            {filteredCards.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300 border-collapse">
                  <thead>
                    <tr className="bg-[#111111] text-white/50 uppercase font-mono tracking-widest border-b border-white/10 text-[10px]/normal text-left">
                      <th className="px-6 py-4">Recipient Name</th>
                      <th className="px-6 py-4">Passcode Door</th>
                      <th className="px-6 py-4">Canvas Layout</th>
                      <th className="px-6 py-4">Music Sync</th>
                      <th className="px-6 py-4">Date Crafted</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-sans">
                    {filteredCards.map((card) => (
                      <tr key={card.id} className="hover:bg-white/[0.02] transition-colors border-b border-white/5">
                        <td className="px-6 py-4">
                          <div className="font-extrabold text-white text-sm uppercase tracking-tight">{card.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono bg-rose-500/10 text-rose-400 px-3 py-1 font-bold tracking-widest border border-rose-500/20 text-xs">
                            {card.code}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 font-mono text-[11px]">
                          {card.elements?.length || 0} ELEMENTS PLACED
                        </td>
                        <td className="px-6 py-4">
                          {card.bgMusicEnabled ? (
                            <span className="text-amber-400 flex items-center gap-1 font-mono text-[10px] uppercase tracking-wide">
                              <Music size={12} className="animate-pulse" /> Yes
                            </span>
                          ) : (
                            <span className="text-slate-500 font-mono text-[10px]">NONE</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-mono">
                          {new Date(card.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              title="Edit Card Elements"
                              onClick={() => handleEditCardTrigger(card)}
                              className="p-2 border border-white/15 bg-black hover:bg-white hover:text-black transition-all cursor-pointer text-slate-300"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              title="Delete Card"
                              onClick={() => handleDeleteCard(card.id)}
                              className="p-2 border border-rose-500/30 bg-black text-rose-400 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-center text-slate-500 px-6">
                <LayoutGrid size={32} className="text-purple-500/40 mb-3 animate-pulse" />
                <h3 className="font-serif text-base text-white font-medium">No Custom Cards Placed</h3>
                <p className="text-xs text-slate-400 max-w-xs mt-1">
                  Start by creating a personalized thank you zone card using our drag-and-drop designer.
                </p>
                <button
                  onClick={handleCreateNewTrigger}
                  className="mt-5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-all cursor-pointer"
                >
                  Configure My First Card
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Designer/Canvas Builder Suite view */
        <div className="flex-1 flex overflow-hidden w-full select-none">
          
          {/* Elements side toolbar */}
          <aside className="w-64 border-r border-white/10 bg-[#0F0F0F] shrink-0 flex flex-col p-4 overflow-y-auto">
            <h3 className="text-[10px] font-mono tracking-widest text-rose-500 font-extrabold uppercase mb-4">// Add Elements</h3>
            
            <div className="flex flex-col gap-2">
              <button
                onClick={addTextElement}
                className="flex items-center gap-3 w-full p-2.5 text-left bg-black border border-white/10 text-xs hover:border-rose-500 cursor-pointer transition-all hover:bg-[#111111]"
              >
                <div className="w-8 h-8 border border-white/10 flex items-center justify-center font-serif text-white shrink-0 font-black italic">T</div>
                <div>
                  <h4 className="font-extrabold text-white uppercase tracking-tight text-[11px]">Text Block</h4>
                  <p className="text-[9px] text-white/40 uppercase tracking-tighter mt-0.5">Custom Quotes & Messages</p>
                </div>
              </button>

              <button
                onClick={addImageElement}
                className="flex items-center gap-3 w-full p-2.5 text-left bg-black border border-white/10 text-xs hover:border-rose-500 cursor-pointer transition-all hover:bg-[#111111]"
              >
                <div className="w-8 h-8 border border-white/10 flex items-center justify-center text-white shrink-0"><Image size={13} /></div>
                <div>
                  <h4 className="font-extrabold text-white uppercase tracking-tight text-[11px]">Photograph</h4>
                  <p className="text-[9px] text-white/40 uppercase tracking-tighter mt-0.5">Memories & Frames</p>
                </div>
              </button>

              <button
                onClick={addVideoElement}
                className="flex items-center gap-3 w-full p-2.5 text-left bg-black border border-white/10 text-xs hover:border-rose-500 cursor-pointer transition-all hover:bg-[#111111]"
              >
                <div className="w-8 h-8 border border-white/10 flex items-center justify-center text-white shrink-0"><Video size={13} /></div>
                <div>
                  <h4 className="font-extrabold text-white uppercase tracking-tight text-[11px]">Video Loop</h4>
                  <p className="text-[9px] text-white/40 uppercase tracking-tighter mt-0.5">Animated Snippets</p>
                </div>
              </button>

              <button
                onClick={addAudioElement}
                className="flex items-center gap-3 w-full p-2.5 text-left bg-black border border-white/10 text-xs hover:border-rose-500 cursor-pointer transition-all hover:bg-[#111111]"
              >
                <div className="w-8 h-8 border border-white/10 flex items-center justify-center text-white shrink-0"><Music size={13} /></div>
                <div>
                  <h4 className="font-extrabold text-white uppercase tracking-tight text-[11px]">Tape Audio</h4>
                  <p className="text-[9px] text-white/40 uppercase tracking-tighter mt-0.5">Voice Notes & Tapes</p>
                </div>
              </button>
            </div>

            <div className="mt-8 border-t border-white/10 pt-5">
              <h3 className="text-[10px] font-mono tracking-widest text-white/40 uppercase mb-3">// Customise Background</h3>
              
              <div className="flex flex-col gap-2">
                <div className="flex gap-1 p-1 bg-black border border-white/10">
                  {(['gradient', 'color', 'image'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setBgType(t);
                        if (t === 'gradient') setBgColor(GRADIENT_PRESETS[0].css);
                        else if (t === 'color') setBgColor('#0f172a');
                        else setBgColor('');
                      }}
                      className={`flex-1 py-1 font-mono text-[9px] uppercase tracking-wider transition-all ${
                        bgType === t ? 'bg-white text-black font-black' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {bgType === 'gradient' && (
                  <div className="grid grid-cols-5 gap-1 mt-2">
                    {GRADIENT_PRESETS.map((gp, i) => (
                      <button
                        key={i}
                        onClick={() => setBgColor(gp.css)}
                        title={gp.name}
                        className={`h-7 w-full border text-center relative ${bgColor === gp.css ? 'border-white' : 'border-white/10'}`}
                        style={{ background: gp.css }}
                      >
                        {bgColor === gp.css && <Check size={10} className="absolute inset-0 m-auto text-white drop-shadow" />}
                      </button>
                    ))}
                  </div>
                )}

                {bgType === 'color' && (
                  <div className="flex items-center gap-2 mt-1">
                    <input 
                      type="color" 
                      value={bgColor.startsWith('#') ? bgColor : '#0f172a'}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-10 h-8 border border-white/10 bg-transparent cursor-pointer"
                    />
                    <input 
                      type="text" 
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-full bg-black border border-white/10 px-2 py-1.5 text-[10px] font-mono text-white"
                    />
                  </div>
                )}

                {bgType === 'image' && (
                  <div className="mt-1 flex flex-col gap-2">
                    <input 
                      type="text" 
                      placeholder="Or enter custom image URL"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-full bg-black border border-white/10 px-2.5 py-2 text-[10px] placeholder-white/30 text-white outline-none"
                    />
                    <label className="flex items-center justify-center gap-2 py-2.5 px-3 bg-black hover:bg-white hover:text-black border border-white/10 cursor-pointer text-[10px] text-slate-300 font-mono uppercase tracking-widest transition-all">
                      <Upload size={11} />
                      <span>Upload Wallpaper</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'bg-image')}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-white/10 select-text">
              {errorNotice && (
                <div className="bg-rose-500/10 border border-rose-500/25 p-3 text-[10px] text-slate-300 flex items-start gap-1.5 mb-2">
                  <span className="text-rose-400 shrink-0 font-bold font-mono">⚠️ ERROR:</span>
                  <span className="font-mono">{errorNotice}</span>
                </div>
              )}
              {successNotice && (
                <div className="bg-emerald-500/10 border border-emerald-500/25 p-3 text-[10px] text-slate-300 flex items-start gap-1.5 mb-2 animate-bounce">
                  <span className="text-emerald-400 shrink-0 font-bold font-mono">✨ SUCCESS:</span>
                  <span className="font-mono">{successNotice}</span>
                </div>
              )}
              {isUploading && (
                <div className="bg-black border border-white/10 p-2.5 text-center text-[10px] text-rose-500 flex items-center justify-center gap-2 font-mono uppercase">
                  <span className="h-3 w-3 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
                  <span>Syncing Assets...</span>
                </div>
              )}
            </div>
          </aside>

          {/* Canvas Workspace Center Stage */}
          <main className="flex-1 bg-[#1A1A1A] flex items-center justify-center overflow-auto p-8 select-none relative">
            
            {/* Grid Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none carbon-grid" />
            
            {/* Visual Workspace Container wrapper */}
            <div 
              id="draft-workspace"
              ref={canvasRef}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              className="relative rounded-none overflow-hidden bg-[#0A0A0A] border border-white/10 shadow-2xl shrink-0"
              style={{
                width: '450px',
                height: '700px',
                background: bgType === 'gradient' ? bgColor : bgColor,
                backgroundImage: bgType === 'image' ? `url(${bgColor})` : undefined,
                backgroundColor: bgType === 'color' ? bgColor : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {canvasElements.map((elem: CardElement) => {
                const isActive = elem.id === selectedElementId;
                
                // Absolute positions in virtual workspace coordinate system 450x700
                const positioningStyle: CSSProperties = {
                  position: 'absolute',
                  left: `${elem.x}px`,
                  top: `${elem.y}px`,
                  width: `${elem.width}px`,
                  height: `${elem.height}px`,
                  transform: `rotate(${elem.rotate}deg)`,
                  zIndex: isActive ? 50 : 10,
                };

                return (
                  <div 
                    key={elem.id} 
                    style={positioningStyle}
                    onMouseDown={(e) => handleElementMouseDown(e, elem)}
                    className={`group ${isActive ? 'active-drag-element' : 'hover:outline hover:outline-dashed hover:outline-rose-500/40 hover:outline-offset-2'}`}
                  >
                    
                    {/* Element Render Switch */}
                    {elem.type === 'text' && (
                      <div 
                        style={{
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
                        }}
                      >
                        {elem.content}
                      </div>
                    )}

                    {elem.type === 'image' && (
                      <img
                        src={elem.src}
                        alt="Workspace element"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover rounded-none select-none pointer-events-none border border-white/5"
                        style={{ borderRadius: elem.borderRadius ? `${elem.borderRadius}px` : '0px' }}
                      />
                    )}

                    {elem.type === 'video' && (
                      <div className="w-full h-full object-cover bg-black relative border border-white/5" style={{ borderRadius: '0px' }}>
                        <video 
                          src={elem.src} 
                          muted 
                          autoPlay 
                          loop 
                          className="w-full h-full object-cover pointer-events-none" 
                          style={{ borderRadius: '0px' }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white/50 text-[10px] uppercase font-mono tracking-wider pointer-events-none">
                          Video Loop
                        </div>
                      </div>
                    )}

                    {elem.type === 'audio' && (
                      <div className="w-full h-full rounded-none flex items-center justify-center p-3 border bg-[#0F0F0F] border-white/10 text-white">
                        <div className="flex items-center gap-2 w-full truncate pointer-events-none">
                          <div className="p-1.5 border border-white/10 bg-black text-rose-500 shrink-0">
                            <Music size={12} />
                          </div>
                          <div className="truncate">
                            <p className="text-[9px] font-mono tracking-widest text-[#ef4444] uppercase leading-none font-bold">Interactive Tape</p>
                            <p className="text-[10px] text-white font-semibold truncate mt-1">{elem.caption || "Audio Recording"}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Draggable Visual Resizer controls (Bottom Right) */}
                    {isActive && (
                      <div 
                        onMouseDown={(e) => handleResizeMouseDown(e, elem)}
                        className="canvas-resize-handle absolute bottom-0 right-0 w-3 h-3 bg-rose-500 border border-white rounded-none translate-x-1 translate-y-1 cursor-se-resize flex items-center justify-center z-50 hover:scale-125 transition-transform"
                        title="Drag to resize element box size"
                      >
                        <span className="block w-1 h-1 bg-white rounded-none pointer-events-none" />
                      </div>
                    )}

                    {/* Small tag floating overlay */}
                    {isActive && (
                      <div className="absolute -top-6 left-0 bg-rose-500 text-[9px] font-mono tracking-widest uppercase px-1.5 py-0.5 rounded-none text-white shadow-md z-50">
                        {elem.type}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Guide Overlay Grid (Shown contextually) */}
              {canvasElements.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-white/10 m-4 pointer-events-none text-left">
                  <LayoutGrid size={24} className="mb-2 text-rose-500 animate-pulse" />
                  <p className="text-xs font-black uppercase tracking-widest text-white font-mono">Blank Workspace Card Canvas</p>
                  <p className="text-[10px] font-mono uppercase text-white/30 max-w-[240px] mt-2 leading-relaxed tracking-wider">// Select template sidebar tools to write custom greeting layouts.</p>
                </div>
              )}
            </div>

            {/* Micro visual tip badge */}
            <div className="absolute bottom-4 left-4 bg-black border border-white/10 py-1.5 px-3 rounded-none text-[10px]/normal text-[#ef4444] font-mono uppercase tracking-wider flex items-center gap-2 pointer-events-none">
              <span className="h-1.5 w-1.5 bg-rose-500 animate-ping" />
              <span>// Click items overlay to rotate, size, edit content in sidebar settings</span>
            </div>
          </main>

          {/* Properties / Card Global Settings Sidebar Panel Right */}
          <aside className="w-80 border-l border-white/10 bg-[#0F0F0F] shrink-0 flex flex-col overflow-y-auto p-4 select-text">
            
            {/* Properties element editor switch */}
            {activeElement ? (
              <div className="flex flex-col gap-4 select-text">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <h3 className="text-xs font-mono font-extrabold uppercase tracking-widest text-rose-500">// Config: {activeElement.type}</h3>
                  <button
                    onClick={() => removeElement(activeElement.id)}
                    className="flex items-center gap-1.5 text-[9px] text-rose-400 bg-black hover:bg-rose-500 hover:text-white px-2.5 py-1.5 border border-rose-500/30 cursor-pointer transition-all font-mono font-bold uppercase tracking-wider"
                  >
                    <Trash2 size={10} />
                    <span>Prune</span>
                  </button>
                </div>

                {/* Common geometric properties */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <label className="text-[9px] font-mono tracking-widest text-[#ef4444] font-bold block mb-1 uppercase">Width (px)</label>
                    <input 
                      type="number"
                      value={activeElement.width}
                      onChange={(e) => updateSelectedElement({ width: parseInt(e.target.value) || 20 })}
                      className="w-full bg-black border border-white/10 p-2 font-mono text-center text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono tracking-widest text-[#ef4444] font-bold block mb-1 uppercase">Height (px)</label>
                    <input 
                      type="number"
                      value={activeElement.height}
                      onChange={(e) => updateSelectedElement({ height: parseInt(e.target.value) || 20 })}
                      className="w-full bg-black border border-white/10 p-2 font-mono text-center text-white"
                    />
                  </div>
                </div>

                {/* Unified Rotation Angle Slider (Dial simulation) */}
                <div className="text-xs font-mono">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[9px] font-mono tracking-widest text-[#ef4444] font-bold uppercase">Rotation Angle</label>
                    <span className="font-mono text-[10px] text-amber-500 font-bold">{activeElement.rotate}°</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <input 
                      type="range"
                      min="-180"
                      max="180"
                      value={activeElement.rotate}
                      onChange={(e) => updateSelectedElement({ rotate: parseInt(e.target.value) || 0 })}
                      className="w-full h-1 bg-white/10 appearance-none cursor-pointer accent-rose-500"
                    />
                    <button
                      onClick={() => updateSelectedElement({ rotate: 0 })}
                      title="Reset angle to upright"
                      className="p-1.5 bg-black border border-white/10 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <RotateCw size={11} />
                    </button>
                  </div>
                </div>

                {/* Custom media/content fields based on exact element category */}
                {activeElement.type === 'text' && (
                  <div className="flex flex-col gap-3 font-mono">
                    <div>
                      <label className="text-[9px] font-mono tracking-widest text-[#ef4444] font-bold block mb-1 uppercase">Message Content</label>
                      <textarea
                        value={activeElement.content}
                        onChange={(e) => updateSelectedElement({ content: e.target.value })}
                        rows={4}
                        className="w-full bg-black border border-white/10 p-2 text-xs text-white outline-none focus:border-rose-500 font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[9px] font-mono tracking-widest text-[#ef4444] font-bold block mb-1 uppercase">Size (pt)</label>
                        <input 
                          type="number"
                          value={activeElement.fontSize}
                          onChange={(e) => updateSelectedElement({ fontSize: parseInt(e.target.value) || 12 })}
                          className="w-full bg-black border border-white/10 p-2 font-mono text-center text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-mono tracking-widest text-[#ef4444] font-bold block mb-1 uppercase">Weight</label>
                        <select
                          value={activeElement.fontWeight}
                          onChange={(e) => updateSelectedElement({ fontWeight: e.target.value as any })}
                          className="w-full bg-black border border-white/10 p-2 text-xs text-white font-mono outline-none"
                        >
                          <option value="normal">Normal</option>
                          <option value="bold">Bold</option>
                          <option value="300">Light</option>
                          <option value="500">Medium</option>
                          <option value="700">ExtraBold</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[9px] font-mono tracking-widest text-[#ef4444] font-bold block mb-1 uppercase">Text Color</label>
                        <div className="flex items-center gap-1">
                          <input 
                            type="color"
                            value={activeElement.color}
                            onChange={(e) => updateSelectedElement({ color: e.target.value })}
                            className="w-8 h-8 border border-white/10 bg-transparent cursor-pointer"
                          />
                          <input 
                            type="text" 
                            value={activeElement.color}
                            onChange={(e) => updateSelectedElement({ color: e.target.value })}
                            className="w-full bg-black border border-white/10 text-[10px] px-1.5 py-1.5 font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] font-mono tracking-widest text-[#ef4444] font-bold block mb-1 uppercase">Padding Box</label>
                        <input 
                          type="number"
                          value={activeElement.padding || 0}
                          onChange={(e) => updateSelectedElement({ padding: parseInt(e.target.value) || 0 })}
                          className="w-full bg-black border border-white/10 p-2 font-mono text-center text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[9px] font-mono tracking-widest text-[#ef4444] font-bold block mb-1 uppercase">BG Box</label>
                        <div className="flex items-center gap-1">
                          <input 
                            type="color"
                            value={activeElement.bgColor?.startsWith('#') ? activeElement.bgColor : '#1e1b4b'}
                            onChange={(e) => updateSelectedElement({ bgColor: e.target.value })}
                            className="w-8 h-8 border border-white/10 bg-transparent cursor-pointer"
                          />
                          <button
                            onClick={() => updateSelectedElement({ bgColor: 'transparent' })}
                            className="px-2 py-1.5 bg-black border border-white/10 text-[9px] font-mono text-slate-400 hover:text-white cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] font-mono tracking-widest text-[#ef4444] font-bold block mb-1 uppercase">Corners (px)</label>
                        <input 
                          type="number"
                          value={activeElement.borderRadius || 0}
                          onChange={(e) => updateSelectedElement({ borderRadius: parseInt(e.target.value) || 0 })}
                          className="w-full bg-black border border-white/10 p-2 font-mono text-center text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-mono tracking-widest text-[#ef4444] font-bold block mb-1 uppercase flex items-center gap-1">
                        <AlignLeft size={10} /> Align Text
                      </label>
                      <div className="flex gap-1 p-1 bg-black border border-white/10">
                        {(['left', 'center', 'right'] as const).map((align) => (
                          <button
                            key={align}
                            onClick={() => updateSelectedElement({ textAlign: align })}
                            className={`flex-1 py-1 flex justify-center items-center transition-all cursor-pointer ${
                              activeElement.textAlign === align ? 'bg-white text-black' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {align === 'left' ? <AlignLeft size={11} /> : align === 'center' ? <AlignCenter size={11} /> : <AlignRight size={11} />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-mono tracking-widest text-[#ef4444] font-bold block mb-1 uppercase flex items-center gap-1">
                        <LinkIcon size={10} /> Redirect Click Link
                      </label>
                      <input 
                        type="text" 
                        placeholder="E.g., https://wa.me/..."
                        value={activeElement.link || ''}
                        onChange={(e) => updateSelectedElement({ link: e.target.value })}
                        className="w-full bg-black border border-white/10 px-2.5 py-2 text-xs outline-none font-mono placeholder-white/20 text-white"
                      />
                    </div>
                  </div>
                )}

                {activeElement.type === 'image' && (
                  <div className="flex flex-col gap-3 font-mono">
                    <div>
                      <label className="text-[9px] font-mono tracking-widest text-[#ef4444] font-bold block mb-1 uppercase">Image URL Pathway</label>
                      <input 
                        type="text" 
                        value={activeElement.src}
                        onChange={(e) => updateSelectedElement({ src: e.target.value })}
                        className="w-full bg-black border border-white/10 px-2.5 py-2 text-[10px] font-mono outline-none"
                      />
                    </div>

                    <label className="flex items-center justify-center gap-2 py-2.5 px-4 bg-black hover:bg-white hover:text-black border border-white/10 cursor-pointer text-[10px] font-mono uppercase tracking-widest transition-all">
                      <Upload size={12} />
                      <span>Upload Photo</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'selected-elem')}
                        className="hidden"
                      />
                    </label>

                    <div>
                      <label className="text-[9px] font-mono tracking-widest text-[#ef4444] font-bold block mb-1 uppercase">Corners Rounded (px)</label>
                      <input 
                        type="number"
                        min="0"
                        value={activeElement.borderRadius || 0}
                        onChange={(e) => updateSelectedElement({ borderRadius: parseInt(e.target.value) || 0 })}
                        className="w-full bg-black border border-white/10 p-2 font-mono text-center text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-mono tracking-widest text-[#ef4444] font-bold block mb-1 uppercase flex items-center gap-1">
                        <LinkIcon size={10} /> Link target (Optional)
                      </label>
                      <input 
                        type="text" 
                        placeholder="Click redirects to"
                        value={activeElement.link || ''}
                        onChange={(e) => updateSelectedElement({ link: e.target.value })}
                        className="w-full bg-black border border-white/10 px-2.5 py-2 text-xs outline-none font-mono"
                      />
                    </div>
                  </div>
                )}

                {activeElement.type === 'video' && (
                  <div className="flex flex-col gap-3 font-mono">
                    <div>
                      <label className="text-[9px] font-mono tracking-widest text-[#ef4444] font-bold block mb-1 uppercase">Video URL Pathway</label>
                      <input 
                        type="text" 
                        value={activeElement.src}
                        onChange={(e) => updateSelectedElement({ src: e.target.value })}
                        className="w-full bg-black border border-white/10 px-2.5 py-2 text-[10px] font-mono outline-none"
                      />
                    </div>

                    <label className="flex items-center justify-center gap-2 py-2.5 px-4 bg-black hover:bg-white hover:text-black border border-white/10 cursor-pointer text-[10px] font-mono uppercase tracking-widest transition-all">
                      <Upload size={12} />
                      <span>Upload Video Clip</span>
                      <input 
                        type="file" 
                        accept="video/*"
                        onChange={(e) => handleFileUpload(e, 'selected-elem')}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {activeElement.type === 'audio' && (
                  <div className="flex flex-col gap-3 font-mono">
                    <div>
                      <label className="text-[9px] font-mono tracking-widest text-[#ef4444] font-bold block mb-1 uppercase">Audio Source URL</label>
                      <input 
                        type="text" 
                        value={activeElement.src}
                        onChange={(e) => updateSelectedElement({ src: e.target.value })}
                        className="w-full bg-black border border-white/10 px-2.5 py-2 text-[10px] font-mono outline-none"
                      />
                    </div>

                    <label className="flex items-center justify-center gap-2 py-2.5 px-4 bg-black hover:bg-white hover:text-black border border-white/10 cursor-pointer text-[10px] font-mono uppercase tracking-widest transition-all">
                      <Upload size={12} />
                      <span>Upload Sound Clip</span>
                      <input 
                        type="file" 
                        accept="audio/*"
                        onChange={(e) => handleFileUpload(e, 'selected-elem')}
                        className="hidden"
                      />
                    </label>

                    <div>
                      <label className="text-[9px] font-mono tracking-widest text-[#ef4444] font-bold block mb-1 uppercase">Visual Widget Skin</label>
                      <select
                        value={activeElement.visualStyle || 'cassette'}
                        onChange={(e) => updateSelectedElement({ visualStyle: e.target.value as any })}
                        className="w-full bg-black border border-white/10 p-2 text-xs text-white outline-none font-mono"
                      >
                        <option value="cassette">📟 Interactive Cassette Tape</option>
                        <option value="vinyl">💿 Retro Vinyl LP Spin</option>
                        <option value="minimal">🎵 Clean Minimal Player</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] font-mono tracking-widest text-[#ef4444] font-bold block mb-1">Widget Caption Text</label>
                      <input 
                        type="text" 
                        value={activeElement.caption || ''}
                        onChange={(e) => updateSelectedElement({ caption: e.target.value })}
                        className="w-full bg-black border border-white/10 px-2.5 py-1.5 text-xs font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Global Card configurations view */
              <div className="flex flex-col gap-4 font-mono select-text">
                <div className="border-b border-white/10 pb-2">
                  <h3 className="text-xs font-mono font-extrabold uppercase tracking-widest text-rose-500">// Card Settings</h3>
                  <p className="text-[10px] text-white/40 uppercase mt-0.5 font-mono tracking-wider">Define core info & accounts</p>
                </div>

                <div className="flex flex-col gap-3 font-mono text-xs">
                  <div>
                    <label className="text-[9px] font-mono tracking-widest text-[#ef4444] font-bold block mb-1 uppercase">Recipient Name</label>
                    <input 
                      id="card-friend-name"
                      type="text" 
                      placeholder="E.g., Sis Meera"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="w-full bg-black border border-white/10 py-2.5 px-3 text-white uppercase tracking-tight placeholder-white/20 outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-mono tracking-widest text-[#ef4444] font-bold block mb-1 uppercase flex items-center justify-between">
                      <span>Secret Access Code</span>
                      <span className="text-[8px] text-white/40 uppercase tracking-widest">Unique Key</span>
                    </label>
                    <input 
                      id="card-access-code"
                      type="text" 
                      placeholder="E.g., MEERA"
                      value={cardCode}
                      onChange={(e) => setCardCode(e.target.value.toUpperCase())}
                      className="w-full bg-black border border-white/10 py-2.5 px-3 text-white font-mono uppercase tracking-wider text-sm outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-mono tracking-widest text-[#ef4444] font-bold block mb-1 uppercase">Personal Footer Quote</label>
                    <textarea 
                      placeholder="E.g., I'm so lucky to have you. Thanks for always sticking around ! ❤️"
                      value={personalNote}
                      onChange={(e) => setPersonalNote(e.target.value)}
                      rows={4}
                      className="w-full bg-black border border-white/10 py-2 px-3 text-white outline-none focus:border-rose-
