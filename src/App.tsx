import { useState, useEffect } from 'react';
import { SplitFlapBoard } from './SplitFlapBoard';
import { createAudioContext } from './audio';
import { Trash2, Maximize2, Minimize2, Play, Pause, Plus, ChevronDown, ChevronUp, Sun, Moon, Frame, Box, Copy, Settings, X, Music, CloudRain, Plane, Search, Square } from 'lucide-react';
import { Reorder } from 'framer-motion';
import QRCode from 'react-qr-code';
import { TEMPLATE_FLIGHTS, TEMPLATE_SPOTIFY, TEMPLATE_WEATHER } from './templates';
import { useWeather } from './useWeather';
import { useRadio } from './useRadio';

const ROWS = 8;
const COLS = 24;

type ScreenObj = { id: string, data: string[] };

const generateId = () => Math.random().toString(36).substring(2, 9);

export default function App() {
  const [playlist, setPlaylist] = useState<ScreenObj[]>([
    {
      id: generateId(),
      data: [
        "**                    **",
        "**                    **",
        "                        ",
        "      STAY HUNGRY       ",
        "      STAY FOOLISH      ",
        "                        ",
        "      - STEVE JOBS      ",
        "                        ",
      ]
    }
  ]);
  
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [delayMs, setDelayMs] = useState(3000);
  
  const [isFlipping, setIsFlipping] = useState(false);
  const [volume, setVolume] = useState(0.8);
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [viewMode, setViewMode] = useState<'3d' | 'flat'>('3d');
  
  const [flipSpeed, setFlipSpeed] = useState(1.0);
  const [stagger, setStagger] = useState(0.15);
  const [radioMode, setRadioMode] = useState<'OFF'|'RADIO'|'SPOTIFY'>('OFF');
  const [activeTemplate, setActiveTemplate] = useState<'none'|'weather'|'flights'|'spotify'>('none');

  // Weather
  const { fetchWeather, loading: weatherLoading, error: weatherError } = useWeather();
  const [weatherCity, setWeatherCity] = useState('Warsaw');

  // Radio
  const { stations, loading: radioLoading, search: searchRadio, searchByTag, play: playStation, stop: stopStation, playingId, error: radioError } = useRadio();
  const [radioQuery, setRadioQuery] = useState('');

  const loadTemplate = (template: string[], name: 'none'|'weather'|'flights'|'spotify' = 'none') => {
    const paddedTemplate = template.map(row => row.padEnd(COLS, " ").substring(0, COLS));
    setPlaylist([{ id: generateId(), data: paddedTemplate }]);
    setCurrentIdx(0);
    setActiveTemplate(name);
  };

  const refreshWeather = async () => {
    const data = await fetchWeather(weatherCity);
    if (!data) return;
    loadTemplate([
      '     LOCAL  WEATHER     ',
      '                        ',
      `CITY: ${data.city.padEnd(18)}`,
      `TEMP: ${data.temp.padEnd(18)}`,
      `COND: ${data.condition.padEnd(18)}`,
      `WIND: ${data.wind.padEnd(18)}`,
      `HUMI: ${data.humidity.padEnd(18)}`,
      '                        ',
    ], 'weather');
  };

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

  const handlePointerDown = (e: React.MouseEvent, index: number) => {
    if (e.shiftKey) {
      e.preventDefault();
      if (selStart !== null) setSelEnd(index);
    } else {
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

  const currentScreen = playlist[currentIdx]?.data || Array(ROWS).fill("".padEnd(COLS, " "));

  const updateCurrentScreen = (newScreen: string[]) => {
    const newPlaylist = [...playlist];
    newPlaylist[currentIdx] = { ...newPlaylist[currentIdx], data: newScreen };
    setPlaylist(newPlaylist);
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
    
    const fullText = currentScreen.map(row => row.padEnd(COLS, " ")).join('').split('');
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
    updateCurrentScreen(newScreen);
    
    setSelStart(dropIndex);
    setSelEnd(Math.min(dropIndex + len - 1, ROWS * COLS - 1));
    document.getElementById(`flap-input-${dropIndex}`)?.focus();
  };

  const handleInput = (r: number, c: number, value: string) => {
    const char = value.slice(-1).toUpperCase();
    if (!char) return; 

    const newScreen = [...currentScreen];
    let rowChars = (newScreen[r] || "").padEnd(COLS, " ").split('');
    rowChars[c] = char;
    newScreen[r] = rowChars.join('').substring(0, COLS);
    updateCurrentScreen(newScreen);
    
    createAudioContext();
    setIsFlipping(true);

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
      if (range && range[1] > range[0]) {
         e.preventDefault();
         const fullText = currentScreen.map(row => row.padEnd(COLS, " ")).join('').split('');
         for (let i = range[0]; i <= range[1]; i++) fullText[i] = " ";
         const newScreen = [];
         for (let row = 0; row < ROWS; row++) newScreen.push(fullText.slice(row * COLS, (row + 1) * COLS).join(''));
         updateCurrentScreen(newScreen);
         setSelEnd(range[0]);
         document.getElementById(`flap-input-${range[0]}`)?.focus();
         createAudioContext();
         setIsFlipping(true);
         return;
      }
      
      const char = (currentScreen[r] || "").padEnd(COLS, " ")[c];
      
      const newScreen = [...currentScreen];
      let rowChars = (newScreen[r] || "").padEnd(COLS, " ").split('');
      rowChars[c] = " ";
      newScreen[r] = rowChars.join('').substring(0, COLS);
      updateCurrentScreen(newScreen);
      createAudioContext();
      setIsFlipping(true);
      
      if (char === " " || char === "") {
        const prevIndex = index - 1;
        if (prevIndex >= 0) {
          setSelStart(prevIndex); setSelEnd(prevIndex);
          document.getElementById(`flap-input-${prevIndex}`)?.focus();
        }
      }
    } else if (e.key === ' ') {
       e.preventDefault();
       const newScreen = [...currentScreen];
       let rowChars = (newScreen[r] || "").padEnd(COLS, " ").split('');
       rowChars[c] = " ";
       newScreen[r] = rowChars.join('').substring(0, COLS);
       updateCurrentScreen(newScreen);
       createAudioContext();
       setIsFlipping(true);
       
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

  const handleAddNewScreen = () => {
    const newScreen = Array(ROWS).fill("".padEnd(COLS, " "));
    setPlaylist([...playlist, { id: generateId(), data: newScreen }]);
    setCurrentIdx(playlist.length);
    setSelStart(null); setSelEnd(null);
    createAudioContext();
  };

  const handleRemove = (index: number) => {
    const newPlaylist = playlist.filter((_, i) => i !== index);
    setPlaylist(newPlaylist.length ? newPlaylist : [{ id: generateId(), data: Array(ROWS).fill("") }]);
    if (currentIdx >= newPlaylist.length) {
      setCurrentIdx(0);
      setIsFlipping(true);
    } else if (currentIdx === index) {
      setIsFlipping(true);
    }
  };

  const handleDuplicate = (index: number) => {
    const newPlaylist = [...playlist];
    newPlaylist.splice(index + 1, 0, { id: generateId(), data: [...playlist[index].data] });
    setPlaylist(newPlaylist);
    setCurrentIdx(index + 1);
    setIsFlipping(true);
  };

  const handleVolChange = (v: number) => {
    setVolume(v);
    import('./audio').then(m => m.setMasterVolume(v));
  };

  const handleBoardDone = () => {
    setIsFlipping(false);
  };

  const currentText = (playlist[currentIdx]?.data || Array(ROWS).fill(""))
    .map(row => row.padEnd(COLS, " ").substring(0, COLS))
    .join("");

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
           viewMode={viewMode}
           flipSpeed={flipSpeed}
           stagger={stagger}

        />
      </div>

      {isFullscreen && (
         <button onClick={handleFullscreen} className={`absolute top-4 right-4 z-50 p-3 rounded-full transition opacity-20 hover:opacity-100 ${theme === 'dark' ? 'bg-black/20 hover:bg-black/80' : 'bg-white/20 hover:bg-white/80'}`}>
           <Minimize2 size={24} className={theme === 'dark' ? 'text-white' : 'text-black'} />
         </button>
      )}

      {/* Editor & Controls Panel Container */}
      <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 z-10 w-[96vw] max-w-[1600px] transition-all duration-700 ease-in-out ${isSheetOpen ? 'translate-y-0' : 'translate-y-[calc(100%-48px)]'}`}>
        
        {/* Toggle Hook */}
        <div className="flex justify-center mb-2">
           <button 
             onClick={() => setIsSheetOpen(!isSheetOpen)} 
             className={`p-2 rounded-full shadow-lg backdrop-blur-md transition-colors ${theme === 'dark' ? 'bg-black/50 text-white hover:bg-black/80 text-white' : 'bg-white/50 text-black hover:bg-white/80 text-black'}`}
           >
             {isSheetOpen ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
           </button>
        </div>

        <div className={`pointer-events-auto backdrop-blur-3xl border p-4 rounded-t-3xl shadow-2xl flex flex-col gap-4 ${textClass} ${panelBg}`}>
          
          <div className="flex gap-6">
            {/* Visual Board Editor */}
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <h2 className={`text-sm font-bold tracking-widest font-mono ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                   VISUAL BOARD EDITOR
                </h2>
                
                <div className="flex items-center gap-4">
                  {/* View Mode Toggle Switch */}
                  <div className="flex items-center gap-2 p-1 rounded-full bg-black/20 border border-white/5">
                    <button 
                      onClick={() => setViewMode('flat')}
                      className={`p-1.5 rounded-full flex items-center justify-center transition-colors ${viewMode === 'flat' ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                      title="Flat Isometric View"
                    >
                      <Frame size={14} />
                    </button>
                    <button 
                      onClick={() => setViewMode('3d')}
                      className={`p-1.5 rounded-full flex items-center justify-center transition-colors ${viewMode === '3d' ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                      title="Realistic 3D View"
                    >
                      <Box size={14} />
                    </button>
                  </div>

                  {/* Theme Toggle Switch */}
                  <div className="flex items-center gap-2 p-1 rounded-full bg-black/20 border border-white/5">
                    <button 
                      onClick={() => setTheme('dark')}
                      className={`p-1.5 rounded-full flex items-center justify-center transition-colors ${theme === 'dark' ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                      title="Dark Theme"
                    >
                      <Moon size={14} />
                    </button>
                    <button 
                      onClick={() => setTheme('light')}
                      className={`p-1.5 rounded-full flex items-center justify-center transition-colors ${theme === 'light' ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                      title="Light Theme"
                    >
                      <Sun size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div className={`grid gap-[2px] p-[2px] rounded-lg transition-colors ${theme === 'dark' ? 'border border-white/10 bg-black/40' : 'border border-black/10 bg-white/50'}`} style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
                 {Array.from({ length: ROWS }).map((_, r) => (
                   Array.from({ length: COLS }).map((_, c) => {
                      const index = r * COLS + c;
                      const char = (currentScreen[r] || "").padEnd(COLS, " ")[c];
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
                           className={`w-full aspect-[0.50] text-center font-mono font-bold text-[10px] outline-none transition-all rounded-[2px] cursor-pointer ${
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

              <div className="flex gap-2 mt-2">
                <button 
                  onClick={handleAddNewScreen}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold tracking-wide transition active:scale-95 flex items-center justify-center gap-2 shadow-lg"
                >
                  <Plus size={20} />
                  NEW BLANK SCREEN
                </button>
              </div>
            </div>

            {/* Playlist UI */}
            <div className={`w-80 flex flex-col gap-4 pl-6 border-l ${theme === 'dark' ? 'border-white/10' : 'border-black/10'}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-sm font-bold tracking-widest font-mono ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>LOOP</h2>
                <span className={`text-xs font-mono ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>{playlist.length} SCREENS</span>
              </div>
              
              <Reorder.Group 
                axis="y" 
                values={playlist} 
                onReorder={setPlaylist} 
                className="flex-1 overflow-y-auto pr-2 flex flex-col gap-2 max-h-[400px] figma-scroll"
              >
                {playlist.map((screenObj, index) => {
                  const nonEmpty = screenObj.data.filter((r: string) => r.trim());
                  const title = nonEmpty[0] ? nonEmpty[0].trim() : "(Empty Board)";
                  
                  return (
                    <Reorder.Item 
                      key={screenObj.id} 
                      value={screenObj}
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
                           {screenObj.data.join('\n')}
                         </pre>
                      </div>

                      <div className="flex flex-col flex-1 overflow-hidden pl-1">
                        <span className="truncate max-w-[120px] font-mono font-bold text-xs">{title}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDuplicate(index); }}
                          className="p-1.5 text-emerald-400 opacity-50 hover:opacity-100 hover:bg-emerald-400/20 rounded-lg transition"
                          title="Duplicate Screen"
                        >
                          <Copy size={14} />
                        </button>
                        
                        {playlist.length > 1 && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleRemove(index); }}
                            className="p-1.5 text-rose-400 opacity-50 hover:opacity-100 hover:bg-rose-400/20 rounded-lg transition"
                            title="Delete Screen"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </Reorder.Item>
                  );
                })}
              </Reorder.Group>

              {/* Status Controls — 3-col grid: never misaligns */}
              <div className={`grid grid-cols-[auto_1fr_auto] items-center gap-2 p-2 rounded-2xl mt-auto ${theme === 'dark' ? 'bg-[#0f0f0f] border border-white/5' : 'bg-white border border-black/5'} shadow-xl`}>
                {/* LEFT: play/pause */}
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl shrink-0 transition ${
                    isPlaying
                      ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                  }`}
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </button>

                {/* CENTER: sliders — take all remaining space */}
                <div className="flex gap-4 min-w-0">
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className={`text-[9px] font-mono tracking-widest mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>WAIT: {(delayMs/1000).toFixed(1)}S</span>
                    <input type="range" min="1000" max="15000" step="1000" value={delayMs} onChange={e => setDelayMs(parseFloat(e.target.value))} className="accent-emerald-500 w-full cursor-pointer" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className={`text-[9px] font-mono tracking-widest mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>VOL: {Math.round(volume * 100)}%</span>
                    <input type="range" min="0" max="1" step="0.05" value={volume} onChange={e => handleVolChange(parseFloat(e.target.value))} className="accent-emerald-500 w-full cursor-pointer" />
                  </div>
                </div>

                {/* RIGHT: icon buttons */}
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => setIsSettingsOpen(true)} className={`w-10 h-10 flex items-center justify-center rounded-xl transition ${theme === 'dark' ? 'bg-[#1a1a1a] hover:bg-[#252525] text-white' : 'bg-gray-100 hover:bg-gray-200 text-black'}`} title="Settings"><Settings size={18} /></button>
                  <button onClick={handleFullscreen} className={`w-10 h-10 flex items-center justify-center rounded-xl transition ${theme === 'dark' ? 'bg-[#1a1a1a] hover:bg-[#252525] text-white' : 'bg-gray-100 hover:bg-gray-200 text-black'}`} title="Fullscreen"><Maximize2 size={18} /></button>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Sidebar */}
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)}></div>
            <div className={`relative w-80 h-full p-6 shadow-2xl flex flex-col gap-4 ${theme === 'dark' ? 'bg-neutral-950 text-white' : 'bg-gray-100 text-black border-l border-gray-300'}`}>
              <div className="flex justify-between items-center pb-4 border-b border-white/10">
                <span className="font-mono font-bold tracking-widest text-sm">SETTINGS</span>
                <button onClick={() => setIsSettingsOpen(false)} className="opacity-50 hover:opacity-100 transition"><X size={20} /></button>
              </div>
              <div className="flex flex-col gap-5 font-mono text-xs tracking-widest overflow-y-auto figma-scroll pr-1">

                <div className="flex flex-col gap-2">
                  <span className="text-emerald-500 font-bold">TEMPLATES</span>
                  <button onClick={() => loadTemplate(TEMPLATE_FLIGHTS, 'flights')} className={`flex items-center gap-2 py-2 px-3 rounded border transition ${activeTemplate === 'flights' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : (theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'border-black/20 hover:bg-black/5')}`}>
                    <Plane size={13} /> FLIGHT BOARD
                  </button>
                  <button onClick={() => loadTemplate(TEMPLATE_SPOTIFY, 'spotify')} className={`flex items-center gap-2 py-2 px-3 rounded border transition ${activeTemplate === 'spotify' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : (theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'border-black/20 hover:bg-black/5')}`}>
                    <Music size={13} /> SPOTIFY NOW PLAYING
                  </button>
                  <button onClick={() => loadTemplate(TEMPLATE_WEATHER, 'weather')} className={`flex items-center gap-2 py-2 px-3 rounded border transition ${activeTemplate === 'weather' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : (theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'border-black/20 hover:bg-black/5')}`}>
                    <CloudRain size={13} /> LIVE WEATHER
                  </button>
                </div>

                {activeTemplate === 'weather' && (
                  <div className={`flex flex-col gap-2 p-3 rounded-lg border ${theme === 'dark' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-emerald-600/30 bg-emerald-50'}`}>
                    <span className="text-emerald-400 font-bold">WEATHER LOCATION</span>
                    <div className="flex gap-2">
                      <input value={weatherCity} onChange={e => setWeatherCity(e.target.value)} onKeyDown={e => e.key === 'Enter' && refreshWeather()} placeholder="CITY NAME..." className={`flex-1 px-2 py-1.5 rounded border text-xs outline-none font-mono ${theme === 'dark' ? 'bg-white/10 border-white/20 text-white placeholder:text-white/30' : 'bg-white border-gray-300 text-black placeholder:text-gray-400'}`} />
                      <button onClick={refreshWeather} disabled={weatherLoading} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded transition disabled:opacity-50 flex items-center gap-1">
                        {weatherLoading ? '...' : <Search size={12} />}
                      </button>
                    </div>
                    {weatherError && <span className="text-rose-400 text-[10px]">{weatherError}</span>}
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-500 font-bold">RADIO</span>
                    {playingId && <button onClick={stopStation} className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition text-[10px]"><Square size={9} /> STOP</button>}
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {(['OFF', 'RADIO', 'SPOTIFY'] as const).map(m => (
                      <button key={m} onClick={() => { setRadioMode(m); if (m === 'OFF') stopStation(); if (m === 'RADIO' && stations.length === 0) searchByTag('lofi'); }}
                        className={`py-1.5 rounded border text-[10px] transition ${radioMode === m ? 'bg-white text-black font-bold border-white' : (theme === 'dark' ? 'border-white/20 opacity-50 hover:opacity-80' : 'border-black/20 opacity-50 hover:opacity-80')}`}
                      >{m}</button>
                    ))}
                  </div>
                  {radioMode === 'RADIO' && (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input value={radioQuery} onChange={e => setRadioQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchRadio(radioQuery)} placeholder="SEARCH STATIONS..." className={`flex-1 px-2 py-1.5 rounded border text-xs outline-none font-mono ${theme === 'dark' ? 'bg-white/10 border-white/20 text-white placeholder:text-white/30' : 'bg-white border-gray-300 text-black placeholder:text-gray-400'}`} />
                        <button onClick={() => searchRadio(radioQuery)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded transition"><Search size={12} /></button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {['lofi', 'jazz', 'ambient', 'classical', 'pop', 'rock'].map(tag => (
                          <button key={tag} onClick={() => searchByTag(tag)} className={`px-2 py-0.5 rounded border text-[9px] transition ${theme === 'dark' ? 'border-white/20 hover:bg-white/10' : 'border-black/20 hover:bg-black/5'}`}>{tag.toUpperCase()}</button>
                        ))}
                      </div>
                      {radioLoading && <span className="opacity-50 text-center py-2 text-[10px]">SEARCHING...</span>}
                      {radioError && <span className="text-rose-400 text-[10px]">{radioError}</span>}
                      <div className="flex flex-col gap-1 max-h-52 overflow-y-auto figma-scroll">
                        {stations.map(st => (
                          <button key={st.stationuuid} onClick={() => playStation(st)}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded border text-left transition ${playingId === st.stationuuid ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : (theme === 'dark' ? 'border-white/10 hover:bg-white/10' : 'border-black/10 hover:bg-black/5')}`}>
                            <span className="flex-1 truncate text-[10px]">{st.name}</span>
                            <span className="opacity-40 text-[8px] shrink-0">{st.country}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {radioMode === 'SPOTIFY' && (
                    <div className={`p-3 rounded border text-[10px] opacity-60 ${theme === 'dark' ? 'border-white/10' : 'border-black/10'}`}>
                      SPOTIFY INTEGRATION REQUIRES AN API KEY. COMING SOON.
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-emerald-500 font-bold">PHYSICS</span>
                  <div className="flex justify-between text-[10px]"><span>FLIP SPEED</span><span className="opacity-50">{Math.round((2.0 - flipSpeed) * 100)}MS</span></div>
                  <input type="range" min="0.5" max="2.0" step="0.1" value={flipSpeed} onChange={e => setFlipSpeed(parseFloat(e.target.value))} className="accent-emerald-500 w-full cursor-pointer" />
                  <div className="flex justify-between text-[10px]"><span>STAGGER</span><span className="opacity-50">{Math.round(stagger * 1000)}MS</span></div>
                  <input type="range" min="0" max="0.5" step="0.01" value={stagger} onChange={e => setStagger(parseFloat(e.target.value))} className="accent-emerald-500 w-full cursor-pointer" />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-500 font-bold">CLACK VOLUME</span>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="opacity-50">{Math.round(volume * 100)}%</span>
                      <button onClick={() => handleVolChange(volume > 0 ? 0 : 0.8)} className={`px-2 py-0.5 border rounded ${volume === 0 ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/50' : 'opacity-50 hover:opacity-100 border-current'}`}>MUTE</button>
                    </div>
                  </div>
                  <input type="range" min="0" max="1" step="0.05" value={volume} onChange={e => handleVolChange(parseFloat(e.target.value))} className="accent-emerald-500 w-full cursor-pointer" />
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-emerald-500 font-bold">THEME</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setTheme('dark')} className={`flex items-center justify-center gap-2 py-2 rounded border transition ${theme === 'dark' ? 'bg-white/10 border-white/20' : 'opacity-50 hover:opacity-100'}`}><Moon size={14} /> DARK</button>
                    <button onClick={() => setTheme('light')} className={`flex items-center justify-center gap-2 py-2 rounded border transition ${theme === 'light' ? 'bg-black/10 border-black/20' : 'opacity-50 hover:opacity-100'}`}><Sun size={14} /> LIGHT</button>
                  </div>
                </div>

                <div className="flex flex-col gap-3 items-center pb-6">
                  <span className="text-emerald-500 font-bold self-start">TV MODE</span>
                  <span className="opacity-50">SCAN TO OPEN ON TV</span>
                  <div className="p-3 bg-white rounded-lg"><QRCode value={window.location.href} size={140} /></div>
                  <button onClick={handleFullscreen} className={`w-full py-3 rounded border transition ${theme === 'dark' ? 'bg-white/5 hover:bg-white/10 border-white/10' : 'bg-black/5 hover:bg-black/10 border-black/10'}`}>OPEN TV MODE</button>
                </div>

              </div>
            </div>
          </div>
        )}
    </div>
  );
}
