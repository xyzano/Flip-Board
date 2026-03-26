import { useState, useEffect } from 'react';
import { SplitFlapBoard } from './SplitFlapBoard';
import { createAudioContext } from './audio';
import { Trash2, Maximize2, Minimize2, Play, Pause, Plus, ChevronDown, ChevronUp } from 'lucide-react';

const ROWS = 6;
const COLS = 20;

type ScreenData = string[];

export default function App() {
  const [playlist, setPlaylist] = useState<ScreenData[]>([
    [
      "                    ",
      "      HELLO !       ",
      "                    ",
      "   FLIP THIS BOARD  ",
      "                    ",
      "                    ",
    ]
  ]);
  
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [delayMs, setDelayMs] = useState(3000);
  
  const [isFlipping, setIsFlipping] = useState(false);
  
  // Custom screen editor state
  const [editingScreen, setEditingScreen] = useState<ScreenData>(Array(ROWS).fill(""));
  const [volume, setVolume] = useState(0.8);
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  // --- Grid Selection & Drag State ---
  const [selStart, setSelStart] = useState<number | null>(null);
  const [selEnd, setSelEnd] = useState<number | null>(null);

  const getSelectionRange = () => {
    if (selStart === null || selEnd === null) return null;
    return [Math.min(selStart, selEnd), Math.max(selStart, selEnd)];
  };

  const isCellSelected = (index: number) => {
    const range = getSelectionRange();
    if (!range) return false;
    return index >= range[0] && index <= range[1];
  };

  // --- Auto Advance ---
  useEffect(() => {
    if (isPlaying && !isFlipping && playlist.length > 0) {
      if (playlist.length === 1 && currentIdx === 0) return; 
      const timer = setTimeout(() => {
         setCurrentIdx((idx) => (idx + 1) % playlist.length);
         setIsFlipping(true); 
      }, delayMs);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, isFlipping, delayMs, playlist.length, currentIdx]);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false));
      }
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (document.fullscreenElement) {
         setIsSheetOpen(false);
      } else {
         setIsSheetOpen(true);
      }
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // --- Grid Interaction Handlers ---
  const handlePointerDown = (e: React.MouseEvent, index: number) => {
    if (e.shiftKey) {
      e.preventDefault();
      if (selStart !== null) setSelEnd(index);
    } else {
      // If clicking an unselected cell, reset selection
      if (!isCellSelected(index)) {
        setSelStart(index);
        setSelEnd(index);
      }
    }
  };

  const handlePointerEnter = (e: React.MouseEvent, index: number) => {
    if (e.buttons === 1 && !isCellSelected(index)) {
      setSelEnd(index);
    }
  };

  const handleCellDragStart = (e: React.DragEvent, index: number) => {
    if (!isCellSelected(index)) {
       e.preventDefault(); return;
    }
    e.dataTransfer.setData("text/plain", "CELL_DRAG");
    e.dataTransfer.effectAllowed = "move";
  };

  const handleCellDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (e.dataTransfer.getData("text/plain") !== "CELL_DRAG") return;
    
    const range = getSelectionRange();
    if (!range) return;
    
    const fullText = editingScreen.map(row => row.padEnd(COLS, " ")).join('').split('');
    const [start, end] = range;
    const len = end - start + 1;
    const block = fullText.slice(start, end + 1);
    
    for (let i = start; i <= end; i++) fullText[i] = " ";
    
    for (let i = 0; i < len; i++) {
       if (dropIndex + i < COLS * ROWS) {
         fullText[dropIndex + i] = block[i];
       }
    }
    
    const newScreen = [];
    for (let r = 0; r < ROWS; r++) newScreen.push(fullText.slice(r * COLS, (r + 1) * COLS).join(''));
    setEditingScreen(newScreen);
    
    setSelStart(dropIndex);
    setSelEnd(Math.min(dropIndex + len - 1, ROWS * COLS - 1));
    document.getElementById(`flap-input-${dropIndex}`)?.focus();
  };

  const handleInput = (r: number, c: number, value: string) => {
    const char = value.slice(-1).toUpperCase();
    if (!char) return; // Backspace clearing is handled by onKeyDown

    const newScreen = [...editingScreen];
    let rowChars = (newScreen[r] || "").padEnd(COLS, " ").split('');
    rowChars[c] = char;
    newScreen[r] = rowChars.join('');
    setEditingScreen(newScreen);
    
    const nextIndex = r * COLS + c + 1;
    if (nextIndex < ROWS * COLS) {
      setSelStart(nextIndex); setSelEnd(nextIndex);
      document.getElementById(`flap-input-${nextIndex}`)?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, r: number, c: number) => {
    const index = r * COLS + c;
    const range = getSelectionRange();

    if (e.key === 'Backspace') {
      // Clear block if multiple selected
      if (range && range[1] > range[0]) {
         e.preventDefault();
         const fullText = editingScreen.map(row => row.padEnd(COLS, " ")).join('').split('');
         for (let i = range[0]; i <= range[1]; i++) fullText[i] = " ";
         const newScreen = [];
         for (let row = 0; row < ROWS; row++) newScreen.push(fullText.slice(row * COLS, (row + 1) * COLS).join(''));
         setEditingScreen(newScreen);
         setSelEnd(range[0]);
         document.getElementById(`flap-input-${range[0]}`)?.focus();
         return;
      }
      
      const char = (editingScreen[r] || "").padEnd(COLS, " ")[c];
      
      const newScreen = [...editingScreen];
      let rowChars = (newScreen[r] || "").padEnd(COLS, " ").split('');
      rowChars[c] = " ";
      newScreen[r] = rowChars.join('');
      setEditingScreen(newScreen);
      
      // Jump back
      if (char === " " || char === "") {
        const prevIndex = index - 1;
        if (prevIndex >= 0) {
          setSelStart(prevIndex); setSelEnd(prevIndex);
          document.getElementById(`flap-input-${prevIndex}`)?.focus();
        }
      }
    } else if (e.key === ' ') {
       e.preventDefault();
       const newScreen = [...editingScreen];
       let rowChars = (newScreen[r] || "").padEnd(COLS, " ").split('');
       rowChars[c] = " ";
       newScreen[r] = rowChars.join('');
       setEditingScreen(newScreen);
       
       const nextIndex = r * COLS + c + 1;
       if (nextIndex < ROWS * COLS) {
          setSelStart(nextIndex); setSelEnd(nextIndex);
          document.getElementById(`flap-input-${nextIndex}`)?.focus();
       }
    } else if (e.key === 'Enter') {
       e.preventDefault();
       const nextRowIndex = (r + 1) * COLS;
       if (nextRowIndex < ROWS * COLS) {
          setSelStart(nextRowIndex); setSelEnd(nextRowIndex);
          document.getElementById(`flap-input-${nextRowIndex}`)?.focus();
       }
    } else if (e.key === 'ArrowLeft') {
       const prevIndex = r * COLS + c - 1;
       if (prevIndex >= 0) { setSelStart(prevIndex); setSelEnd(prevIndex); document.getElementById(`flap-input-${prevIndex}`)?.focus(); }
    } else if (e.key === 'ArrowRight') {
       const nextIndex = r * COLS + c + 1;
       if (nextIndex < ROWS * COLS) { setSelStart(nextIndex); setSelEnd(nextIndex); document.getElementById(`flap-input-${nextIndex}`)?.focus(); }
    } else if (e.key === 'ArrowUp') {
       const upIndex = (r - 1) * COLS + c;
       if (upIndex >= 0) { setSelStart(upIndex); setSelEnd(upIndex); document.getElementById(`flap-input-${upIndex}`)?.focus(); }
    } else if (e.key === 'ArrowDown') {
       const dnIndex = (r + 1) * COLS + c;
       if (dnIndex < ROWS * COLS) { setSelStart(dnIndex); setSelEnd(dnIndex); document.getElementById(`flap-input-${dnIndex}`)?.focus(); }
    }
  };

  const handleAddScreen = () => {
    const newScreen = editingScreen.map(row => {
      let r = row.toUpperCase().trimEnd();
      return r.padEnd(COLS, ' ').substring(0, COLS);
    });
    setPlaylist([...playlist, newScreen]);
    setEditingScreen(Array(ROWS).fill(""));
    setSelStart(null); setSelEnd(null);
    createAudioContext();
  };

  const handleRemove = (index: number) => {
    const newPlaylist = playlist.filter((_, i) => i !== index);
    setPlaylist(newPlaylist.length ? newPlaylist : [Array(ROWS).fill("")]);
    if (currentIdx >= newPlaylist.length) {
      setCurrentIdx(0);
      setIsFlipping(true);
    } else if (currentIdx === index) {
      setIsFlipping(true);
    }
  };

  const handlePlaylistDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handlePlaylistDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handlePlaylistDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    
    const newPlaylist = [...playlist];
    const [movedItem] = newPlaylist.splice(draggedIdx, 1);
    newPlaylist.splice(index, 0, movedItem);
    
    setPlaylist(newPlaylist);
    setDraggedIdx(null);
  };

  const handleVolChange = (v: number) => {
    setVolume(v);
    import('./audio').then(m => m.setMasterVolume(v));
  };

  const handleBoardDone = () => {
    setIsFlipping(false);
  };

  const currentText = (playlist[currentIdx] || Array(ROWS).fill("")).join("");

  const containerBg = theme === 'dark' ? "bg-neutral-900 border-neutral-900" : "bg-neutral-200 border-neutral-200";
  const panelBg = theme === 'dark' ? "bg-black/80 border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]" : "bg-white/90 border-black/10 shadow-[0_0_50px_rgba(0,0,0,0.2)]";
  const textClass = theme === 'dark' ? "text-white" : "text-black";

  return (
    <div className={`w-screen h-screen border overflow-hidden relative transition-colors duration-1000 ${containerBg}`} onClick={createAudioContext}>
      
      <div className="absolute inset-0 z-0">
        <SplitFlapBoard 
           text={currentText} 
           rows={ROWS} 
           cols={COLS} 
           onAllDone={handleBoardDone} 
           theme={theme}
        />
      </div>

      {isFullscreen && (
         <button onClick={handleFullscreen} className={`absolute top-4 right-4 z-50 p-3 rounded-full transition opacity-20 hover:opacity-100 ${theme === 'dark' ? 'bg-black/20 hover:bg-black/80' : 'bg-white/20 hover:bg-white/80'}`}>
           <Minimize2 size={24} className={theme === 'dark' ? 'text-white' : 'text-black'} />
         </button>
      )}

      {/* Editor & Controls Panel Container */}
      <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 z-10 w-full max-w-5xl transition-all duration-700 ease-in-out ${isSheetOpen ? 'translate-y-0' : 'translate-y-[calc(100%-48px)]'}`}>
        
        {/* Toggle Hook */}
        <div className="flex justify-center mb-2">
           <button 
             onClick={() => setIsSheetOpen(!isSheetOpen)} 
             className={`p-2 rounded-full shadow-lg backdrop-blur-md transition-colors ${theme === 'dark' ? 'bg-black/50 text-white hover:bg-black/80 text-white' : 'bg-white/50 text-black hover:bg-white/80 text-black'}`}
           >
             {isSheetOpen ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
           </button>
        </div>

        <div className={`pointer-events-auto backdrop-blur-3xl border p-6 rounded-t-3xl shadow-2xl flex flex-col gap-6 ${textClass} ${panelBg}`}>
          
          <div className="flex gap-6">
            {/* Visual Board Editor */}
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <h2 className={`text-sm font-bold tracking-widest font-mono ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                   VISUAL BOARD EDITOR
                </h2>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-2">
                    <input 
                      type="checkbox" 
                      id="themeToggle"
                      checked={theme === 'light'} 
                      onChange={(e) => setTheme(e.target.checked ? 'light' : 'dark')} 
                      className="accent-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="themeToggle" className={`text-xs font-mono cursor-pointer ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>LIGHT BOARD</label>
                  </div>
                </div>
              </div>

              {/* Grid representation */}
              <div className={`grid gap-[3px] p-[3px] rounded-xl transition-colors ${theme === 'dark' ? 'border border-white/10 bg-black/40' : 'border border-black/10 bg-white/50'}`} style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
                 {Array.from({ length: ROWS }).map((_, r) => (
                   Array.from({ length: COLS }).map((_, c) => {
                      const index = r * COLS + c;
                      const char = (editingScreen[r] || "").padEnd(COLS, " ")[c];
                      const isSel = isCellSelected(index);
                      
                      return (
                         <input
                           key={index}
                           id={`flap-input-${index}`}
                           value={char.trim() ? char : ""}
                           draggable={isSel}
                           onDragStart={(e) => handleCellDragStart(e, index)}
                           onDragOver={(e) => e.preventDefault()}
                           onDrop={(e) => handleCellDrop(e, index)}
                           onMouseDown={(e) => handlePointerDown(e, index)}
                           onMouseEnter={(e) => handlePointerEnter(e, index)}
                           onFocus={(e) => { 
                             e.target.select(); 
                             if (!isCellSelected(index)) { setSelStart(index); setSelEnd(index); }
                           }}
                           onChange={(e) => handleInput(r, c, e.target.value)}
                           onKeyDown={(e) => handleKeyDown(e, r, c)}
                           className={`w-full aspect-[0.65] text-center font-mono font-bold text-sm sm:text-base outline-none transition-all rounded-[2px] shadow-inner cursor-pointer ${
                             isSel 
                               ? 'bg-emerald-500 text-white ring-2 ring-emerald-400' 
                               : (theme === 'dark' 
                                   ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 placeholder:text-neutral-700' 
                                   : 'bg-white text-black border border-neutral-300 hover:bg-neutral-100 placeholder:text-neutral-300'
                                 )
                           }`}
                           placeholder=""
                           maxLength={1}
                         />
                      );
                   })
                 ))}
              </div>

              <button 
                onClick={handleAddScreen}
                className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold tracking-wide transition active:scale-95 flex items-center justify-center gap-2 shadow-lg"
              >
                <Plus size={20} />
                ADD TO PLAYLIST
              </button>
            </div>

            {/* Playlist UI */}
            <div className={`w-80 flex flex-col gap-4 pl-6 border-l ${theme === 'dark' ? 'border-white/10' : 'border-black/10'}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-sm font-bold tracking-widest font-mono ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>LOOP</h2>
                <span className={`text-xs font-mono ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>{playlist.length} SCREENS</span>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-2 max-h-48 scrollbar-thin scrollbar-thumb-gray-600">
                {playlist.map((screen, index) => {
                  const nonEmpty = screen.filter(r => r.trim());
                  const title = nonEmpty[0] ? nonEmpty[0].trim() : "(Empty Board)";
                  
                  return (
                    <div 
                      key={index} 
                      draggable
                      onDragStart={(e) => handlePlaylistDragStart(e, index)}
                      onDragOver={handlePlaylistDragOver}
                      onDrop={(e) => handlePlaylistDrop(e, index)}
                      onClick={() => {
                         setCurrentIdx(index);
                         setIsFlipping(true);
                      }}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-sm transition-all cursor-grab active:cursor-grabbing ${
                        index === currentIdx 
                          ? (theme === 'dark' ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400' : 'bg-emerald-100 border-emerald-500 text-emerald-700')
                          : (theme === 'dark' ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-black/5 border-black/5 hover:bg-black/10')
                      }`}
                    >
                      <span className="font-mono opacity-50 text-[10px] w-4 text-center">{index + 1}.</span>
                      
                      {/* Visual Mini Slider Preview */}
                      <div className={`p-1 rounded bg-black flex-shrink-0 shadow-inner overflow-hidden ${theme === 'dark' ? 'border border-neutral-800' : 'border border-gray-400'}`}>
                         <pre className="font-mono text-[4px] leading-[5px] tracking-[0.1em] text-emerald-500 m-0">
                           {screen.join('\n')}
                         </pre>
                      </div>

                      <div className="flex flex-col flex-1 overflow-hidden pl-1">
                        <span className="truncate max-w-[120px] font-mono font-bold text-xs">{title}</span>
                      </div>

                      {playlist.length > 1 && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleRemove(index); }}
                          className="p-1.5 text-rose-400 opacity-50 hover:opacity-100 hover:bg-rose-400/20 rounded-lg transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Status Controls */}
              <div className={`flex items-center justify-between p-3 rounded-xl mt-auto ${theme === 'dark' ? 'bg-black/40' : 'bg-black/5'}`}>
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`p-3 rounded-xl transition ${
                    isPlaying 
                      ? 'bg-rose-500/20 text-rose-500 hover:bg-rose-500/30' 
                      : 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30'
                  }`}
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
                
                <div className="flex gap-4">
                  <div className="flex flex-col w-20">
                    <span className={`text-[10px] font-mono mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>WAIT: {(delayMs/1000).toFixed(1)}S</span>
                    <input 
                      type="range" 
                      min="1000" 
                      max="15000" 
                      step="1000"
                      value={delayMs}
                      onChange={(e) => setDelayMs(parseFloat(e.target.value))}
                      className="accent-emerald-500"
                    />
                  </div>

                  <div className="flex flex-col w-20">
                    <span className={`text-[10px] font-mono mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>VOL: {Math.round(volume * 100)}%</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.05"
                      value={volume}
                      onChange={(e) => handleVolChange(parseFloat(e.target.value))}
                      className="accent-emerald-500"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleFullscreen}
                  className={`p-3 rounded-xl transition ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'}`}
                  title="Fullscreen Kiosk"
                >
                  <Maximize2 size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
