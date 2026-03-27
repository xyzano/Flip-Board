import { useState, useEffect } from 'react';
import { SplitFlapBoard } from './SplitFlapBoard';
import { createAudioContext } from './audio';
import {
  Play, Pause, Maximize2, Minimize2, Plus, X,
  Search, Plane, CloudRain, Music, Database, Box, Code2,
  ChevronDown, ChevronUp, Sun, Moon, Palette, RotateCw, Volume1, Volume2, Tv
} from 'lucide-react';
import { Reorder } from 'framer-motion';
import { TEMPLATE_FLIGHTS, TEMPLATE_SPOTIFY } from './templates';
import { useWeather } from './useWeather';
import { useRadio } from './useRadio';
import useExternalApi from './useExternalApi';

const ROWS = 8;
const COLS = 24;

type TemplateType = 'custom' | 'weather' | 'flights' | 'spotify' | 'api';
type ScreenObj = { id: string, data: string[], template?: TemplateType };

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
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [viewMode, setViewMode] = useState<'3d' | 'flat'>('3d');

  const [flipSpeed, setFlipSpeed] = useState(1.0);
  const [stagger, setStagger] = useState(0.15);
  const [textColor, setTextColor] = useState('#ffffff');
  const [autoRotateSpeed, setAutoRotateSpeed] = useState(0);
  const [radioVolume, setRadioVolume] = useState(0.5);
  const [sheetWidth, setSheetWidth] = useState(92); // in vw
  const [sheetHeight, setSheetHeight] = useState(540); // in px
  const [isResizing, setIsResizing] = useState<'h' | 'w' | 'both' | null>(null);

  const [radioMode, setRadioMode] = useState<'OFF'|'RADIO'|'SPOTIFY'>('OFF');

  // Weather
  const { fetchWeather, loading: weatherLoading, error: weatherError } = useWeather();
  const [weatherCity, setWeatherCity] = useState('Warsaw');

  useEffect(() => {
    import('./audio').then(m => m.setMasterVolume(volume));
  }, [volume]);

  useEffect(() => {
     setVolumeRadio(radioVolume);
  }, [radioVolume]);

  // Radio
  const { stations, loading: radioLoading, search: searchRadio, searchByTag, play: playStation, stop: stopStation, playingId, error: radioError, setVolume: setVolumeRadio } = useRadio();
  const [radioQuery, setRadioQuery] = useState('');

  // External API (Pull model)
  const { fetchData: fetchApi, loading: apiLoading, error: apiError } = useExternalApi();
  const [apiUrl, setApiUrl] = useState('https://pastebin.com/raw/your-id');

  // Derived: template type of the currently selected screen
  const activeTemplate = playlist[currentIdx]?.template ?? 'custom';

  const loadTemplate = (template: string[], name: TemplateType = 'custom') => {
    const paddedTemplate = template.map(row => row.padEnd(COLS, " ").substring(0, COLS));
    // Update ONLY the current screen — never wipe the playlist
    setPlaylist(prev => prev.map((s, i) =>
      i === currentIdx ? { ...s, data: paddedTemplate, template: name } : s
    ));
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

  const refreshApi = async () => {
    const data = await fetchApi(apiUrl);
    if (!data) return;
    loadTemplate(data, 'api');
  };

  useEffect(() => {
    // Basic polling example removed for build stability, can be re-added if managed correctly
  }, [activeTemplate, apiUrl]);

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
    // Freeze auto-advance when editor panel is open or only one screen
    if (isPlaying && !isFlipping && !isSheetOpen && playlist.length > 0) {
      if (playlist.length === 1 && currentIdx === 0) return;
      const timer = setTimeout(() => {
         setCurrentIdx((idx) => (idx + 1) % playlist.length);
         setIsFlipping(true);
      }, delayMs);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, isFlipping, isSheetOpen, delayMs, playlist.length, currentIdx]);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false));
      }
    }
  };

  const handleCast = () => {
     alert("Google Cast: Open Chrome Menu > Cast to display this board on your TV.");
  };

  // Resizing logic
  useEffect(() => {
     if (!isResizing) return;
     const onMove = (e: MouseEvent) => {
        if (isResizing === 'h') {
           const newH = window.innerHeight - e.clientY;
           setSheetHeight(Math.max(200, Math.min(newH, window.innerHeight * 0.9)));
        } else if (isResizing === 'w') {
           const newW = (e.clientX < window.innerWidth / 2) ? (window.innerWidth / 2 - e.clientX) * 2 : (e.clientX - window.innerWidth / 2) * 2;
           setSheetWidth(Math.max(40, Math.min((newW / window.innerWidth) * 100, 98)));
        }
     };
     const onUp = () => setIsResizing(null);
     window.addEventListener('mousemove', onMove);
     window.addEventListener('mouseup', onUp);
     return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [isResizing]);

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
    if (playlist.length <= 1) return;
    const next = playlist.filter((_, i) => i !== index);
    setPlaylist(next);
    if (currentIdx >= next.length) {
      setCurrentIdx(Math.max(0, next.length - 1));
    }
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
           textColor={textColor}
           autoRotateSpeed={autoRotateSpeed}
        />
      </div>

      {isFullscreen && (
         <button onClick={handleFullscreen} className={`absolute top-4 right-4 z-50 p-3 rounded-full transition opacity-20 hover:opacity-100 ${theme === 'dark' ? 'bg-black/20 hover:bg-black/80' : 'bg-white/20 hover:bg-white/80'}`}>
           <Minimize2 size={24} className={theme === 'dark' ? 'text-white' : 'text-black'} />
         </button>
      )}

      <div 
        className={`absolute bottom-0 left-1/2 -translate-x-1/2 z-10 transition-all duration-700 ease-in-out ${isSheetOpen ? 'translate-y-0' : 'translate-y-[calc(100%-48px)]'}`}
        style={{ width: `${sheetWidth}vw` }}
      >
        
        {/* Resize Handles - Top */}
        <div 
          onMouseDown={() => { setIsSheetOpen(true); setIsResizing('h'); }}
          className="absolute -top-2 left-0 right-0 h-4 cursor-ns-resize z-50 group"
        >
           <div className="mx-auto w-12 h-1 bg-emerald-500/0 group-hover:bg-emerald-500/40 rounded-full transition-all mt-1.5" />
        </div>
        {/* Resize Handle - Left/Right */}
        <div 
          onMouseDown={() => setIsResizing('w')}
          className="absolute top-0 bottom-0 -left-2 w-4 cursor-ew-resize z-50 group"
        />
        <div 
          onMouseDown={() => setIsResizing('w')}
          className="absolute top-0 bottom-0 -right-2 w-4 cursor-ew-resize z-50 group"
        />

        {/* Toggle Hook */}
        <div className="flex justify-center mb-2">
           <button 
             onClick={() => setIsSheetOpen(!isSheetOpen)} 
             className={`px-4 py-1 rounded-full shadow-lg backdrop-blur-md transition-all flex items-center gap-2 border ${theme === 'dark' ? 'bg-black/50 border-white/10 text-white/50 hover:text-white hover:bg-white/10' : 'bg-white/50 border-black/10 text-black/50 hover:text-black hover:bg-black/10'}`}
           >
             <span className="text-[10px] font-mono font-bold tracking-widest">{isSheetOpen ? "CLOSE EDITOR" : "OPEN EDITOR"}</span>
             {isSheetOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
           </button>
        </div>

        <div 
           className={`pointer-events-auto backdrop-blur-3xl border p-4 rounded-3xl shadow-2xl flex flex-col gap-4 overflow-hidden ${textClass} ${panelBg}`}
           style={{ height: `${sheetHeight}px` }}
        >
          
          <div className="flex gap-4">
            {/* LEFT: Visual Board Editor */}
            <div className="flex-[3] flex flex-col gap-2 min-w-0">
              <div className="flex justify-between items-center px-1">
                <h2 className={`text-[10px] font-bold tracking-wide font-mono ${theme === 'dark' ? 'text-emerald-500/80' : 'text-emerald-600'}`}>
                   VISUAL BOARD EDITOR
                </h2>
                
                <div className="flex items-center gap-2">
                  <span className="text-[8px] opacity-40 uppercase tracking-tighter">Real-time Preview</span>
                </div>
              </div>

              <div className={`grid gap-[1px] p-[1px] rounded-md transition-colors ${theme === 'dark' ? 'border border-white/10 bg-black/50' : 'border border-black/10 bg-white/50'}`} style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
                 {Array.from({ length: ROWS }).map((_, r) => (
                   Array.from({ length: COLS }).map((_, c) => {
                      const index = r * COLS + c;
                      const char = (playlist[currentIdx]?.data[r] || "").padEnd(COLS, " ")[c];
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
                           className={`w-full aspect-[0.55] text-center font-mono font-bold text-[9px] outline-none transition-all rounded-[1px] cursor-pointer ${
                             isSel 
                               ? 'bg-emerald-500 text-white' 
                               : (theme === 'dark' 
                                   ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' 
                                   : 'bg-white text-black border border-neutral-200 hover:bg-neutral-50'
                                 )
                           }`}
                           placeholder=""
                           maxLength={1}
                         />
                      );
                   })
                 ))}
              </div>
            </div>

            {/* RIGHT: Screen Settings Panel */}
            <div className={`flex-1 w-72 flex flex-col gap-3 pl-4 border-l ${theme === 'dark' ? 'border-white/10' : 'border-black/10'} overflow-y-auto figma-scroll`}>
              <div className="flex items-center justify-between">
                <h2 className="text-[10px] font-bold tracking-widest font-mono text-emerald-500">SCREEN SETTINGS</h2>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] opacity-40 uppercase tracking-tighter">SCREEN {currentIdx + 1}/{playlist.length}</span>
                </div>
              </div>

              {/* Templates */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] opacity-40 font-bold uppercase">Templates</span>
                <div className="flex flex-wrap gap-1">
                  {(['flights', 'spotify', 'weather', 'api'] as const).map(t => (
                    <button 
                      key={t}
                      onClick={() => {
                        if (t === 'flights') loadTemplate(TEMPLATE_FLIGHTS, 'flights');
                        if (t === 'spotify') loadTemplate(TEMPLATE_SPOTIFY, 'spotify');
                        if (t === 'weather') refreshWeather();
                        if (t === 'api') loadTemplate(["FETCHING..."], 'api');
                      }} 
                      className={`flex-1 min-w-[80px] py-1.5 px-2 rounded-lg border text-[9px] font-bold transition flex items-center justify-center gap-1.5 ${activeTemplate === t ? 'bg-emerald-500 text-white border-emerald-500' : (theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-black/5 border-black/10 hover:bg-black/10')}`}
                    >
                      {t === 'flights' && <Plane size={10} />}
                      {t === 'spotify' && <Music size={10} />}
                      {t === 'weather' && <CloudRain size={10} />}
                      {t === 'api' && <Database size={10} />}
                      {t.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {activeTemplate === 'weather' && (
                <div className={`flex flex-col gap-1.5 p-2 rounded-lg border ${theme === 'dark' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-emerald-500/20 bg-emerald-50'}`}>
                  <div className="flex gap-1">
                    <input value={weatherCity} onChange={e => setWeatherCity(e.target.value)} onKeyDown={e => e.key === 'Enter' && refreshWeather()} placeholder="CITY..." className={`flex-1 px-2 py-1 rounded border text-[10px] outline-none font-mono ${theme === 'dark' ? 'bg-black/40 border-white/10' : 'bg-white border-black/10'}`} />
                    <button onClick={refreshWeather} className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold"><Search size={10} /></button>
                  </div>
                  {weatherLoading && <span className="text-[8px] opacity-40 animate-pulse">FETCHING...</span>}
                  {weatherError && <span className="text-[8px] text-rose-500">{weatherError}</span>}
                </div>
              )}

              {activeTemplate === 'api' && (
                <div className={`flex flex-col gap-1.5 p-2 rounded-lg border ${theme === 'dark' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-emerald-500/20 bg-emerald-50'}`}>
                  <input value={apiUrl} onChange={e => setApiUrl(e.target.value)} placeholder="JSON URL..." className={`px-2 py-1 rounded border text-[10px] outline-none font-mono ${theme === 'dark' ? 'bg-black/40 border-white/10' : 'bg-white border-black/10'}`} />
                  <button onClick={refreshApi} className="w-full py-1 bg-emerald-600 text-white rounded text-[10px] font-bold mt-1">REFRESH</button>
                  {apiLoading && <span className="text-[8px] opacity-40 animate-pulse">FETCHING...</span>}
                  {apiError && <span className="text-[8px] text-rose-500">{apiError}</span>}
                </div>
              )}

              {/* Radio */}
              <div className="flex flex-col gap-1.5 border-t border-white/5 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] opacity-40 font-bold uppercase">Radio Mode</span>
                  {playingId && <button onClick={stopStation} className="text-[9px] text-rose-500 hover:underline">STOP</button>}
                </div>
                <div className="flex gap-1">
                  {(['OFF', 'RADIO', 'SPOTIFY'] as const).map(m => (
                    <button key={m} onClick={() => { setRadioMode(m); if (m === 'OFF') stopStation(); if (m === 'RADIO' && stations.length === 0) searchByTag('lofi'); }}
                      className={`flex-1 py-1.5 rounded-lg border text-[9px] transition ${radioMode === m ? 'bg-white text-black font-bold' : (theme === 'dark' ? 'border-white/10' : 'border-black/10')}`}
                    >{m}</button>
                  ))}
                </div>
                {radioMode === 'RADIO' && (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-1">
                      <input value={radioQuery} onChange={e => setRadioQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchRadio(radioQuery)} placeholder="SEARCH..." className={`flex-1 px-2 py-1 rounded border text-[10px] outline-none font-mono ${theme === 'dark' ? 'bg-black/40 border-white/10 text-white' : 'bg-white border-black/10 text-black'}`} />
                      <button onClick={() => searchRadio(radioQuery)} className="p-1.5 bg-emerald-600 text-white rounded"><Search size={10} /></button>
                    </div>
                  <div className="flex flex-col gap-1 max-h-32 overflow-y-auto figma-scroll pr-1">
                    {stations.map(st => (
                      <button key={st.stationuuid} onClick={() => playStation(st)} className={`px-2 py-1 rounded text-left text-[9px] ${playingId === st.stationuuid ? 'bg-emerald-500/20 text-emerald-400' : (theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5')}`}>{st.name}</button>
                    ))}
                    {radioLoading && <span className="text-[8px] opacity-40 animate-pulse">SEARCHING...</span>}
                    {radioError && <span className="text-[8px] text-rose-500">{radioError}</span>}
                  </div>
                  </div>
                )}
              </div>

              {/* Local Audio / Visual controls moved to side too for density */}
              <div className="flex flex-col gap-2 border-t border-white/5 pt-3">
                <span className="text-[9px] opacity-40 font-bold uppercase flex items-center gap-1.5"><RotateCw size={10}/> Physics & Rotation</span>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                   <div className="flex flex-col gap-1">
                     <span className="text-[8px] opacity-40 uppercase">Flip Speed</span>
                     <input type="range" min="0.5" max="2.0" step="0.1" value={flipSpeed} onChange={e => setFlipSpeed(parseFloat(e.target.value))} className="accent-emerald-500 h-2" />
                   </div>
                   <div className="flex flex-col gap-1">
                     <span className="text-[8px] opacity-40 uppercase">Board Rotation</span>
                     <input type="range" min="0" max="5" step="0.5" value={autoRotateSpeed} onChange={e => setAutoRotateSpeed(parseFloat(e.target.value))} className="accent-emerald-500 h-2" />
                   </div>
                   <div className="flex flex-col gap-1">
                     <span className="text-[8px] opacity-40 uppercase">Stagger</span>
                     <input type="range" min="0" max="0.5" step="0.01" value={stagger} onChange={e => setStagger(parseFloat(e.target.value))} className="accent-emerald-500 h-2" />
                   </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t border-white/5 pt-3">
                 <span className="text-[9px] opacity-40 font-bold uppercase flex items-center gap-1.5"><Palette size={10}/> Style & Theme</span>
                 <div className="flex flex-col gap-1.5">
                    <span className="text-[8px] opacity-40 uppercase">Text Color</span>
                    <div className="flex items-center gap-2">
                       <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-6 h-6 rounded border border-white/10 bg-transparent cursor-pointer" />
                       <span className="font-mono text-[9px] opacity-60">{textColor.toUpperCase()}</span>
                       <div className="flex gap-1 ml-auto">
                          {['#ffffff', '#fbbf24', '#ef4444', '#10b981'].map(c => (
                             <button key={c} onClick={() => setTextColor(c)} className="w-3 h-3 rounded-full border border-white/10" style={{ backgroundColor: c }} />
                          ))}
                       </div>
                    </div>
                 </div>
              </div>

              {radioMode === 'RADIO' && (
                <div className="flex flex-col gap-2 border-t border-white/5 pt-3">
                   <span className="text-[9px] opacity-40 font-bold uppercase flex items-center gap-1.5"><Volume1 size={10}/> Radio Volume</span>
                   <div className="flex items-center gap-2">
                      <Volume1 size={10} className="opacity-40" />
                      <input type="range" min="0" max="1" step="0.05" value={radioVolume} onChange={e => setRadioVolume(parseFloat(e.target.value))} className="flex-1 accent-emerald-500 h-2" />
                      <Volume2 size={10} className="opacity-40" />
                   </div>
                </div>
              )}

              <div className="mt-auto border-t border-white/5 pt-3">
                 <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                    <Code2 size={12} className="text-emerald-500" />
                    <span className="text-[8px] text-emerald-500 uppercase tracking-widest font-bold">API ACTIVE</span>
                 </div>
              </div>
            </div>
          </div>

          {/* BOTTOM: Horizontal Filmstrip + Global Controls */}
          <div className="flex items-center gap-4 border-t border-white/10 pt-4 mt-auto">
            
            {/* Play/Pause */}
            <button
               onClick={() => setIsPlaying(!isPlaying)}
               className={`w-10 h-10 flex items-center justify-center rounded-xl shrink-0 transition ${
                 isPlaying ? 'bg-rose-500 text-white active:scale-90 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-emerald-500 text-white active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
               }`}
             >
               {isPlaying ? <Pause size={20} /> : <Play size={20} />}
             </button>

            {/* Filmstrip Wrapper */}
            <div className="flex-1 min-w-0 overflow-hidden relative">
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/20 to-transparent z-10 pointer-events-none"></div>
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/20 to-transparent z-10 pointer-events-none"></div>
              
              <Reorder.Group 
                axis="x" 
                values={playlist} 
                onReorder={setPlaylist} 
                className="flex gap-2 overflow-x-auto figma-scroll pb-2 px-1 items-center"
              >
                {playlist.map((screenObj, index) => {
                  const nonEmpty = screenObj.data.filter((r: string) => r.trim());
                  const title = nonEmpty[0] ? nonEmpty[0].trim() : "SCREEN";
                  
                  return (
                    <Reorder.Item 
                      key={screenObj.id} 
                      value={screenObj}
                      onClick={() => { setCurrentIdx(index); setIsFlipping(true); }}
                      className={`flex-shrink-0 flex items-center gap-2 p-1.5 pr-3 rounded-xl border text-xs transition-all cursor-grab active:cursor-grabbing ${
                        index === currentIdx 
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                          : 'bg-white/5 border-white/5 hover:bg-white/10 text-white/50'
                      }`}
                    >
                      <div className="w-10 aspect-[1.5] bg-black rounded shadow-inner overflow-hidden flex items-center justify-center">
                         <pre className="font-mono text-[2px] leading-[2px] text-emerald-500 opacity-60 m-0">
                           {screenObj.data.join('\n')}
                         </pre>
                      </div>
                      <span className="font-mono font-bold text-[10px] uppercase truncate max-w-[80px]">{title}</span>
                      
                      {playlist.length > 1 && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleRemove(index); }}
                          className="hover:text-rose-500 transition ml-1"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </Reorder.Item>
                  );
                })}

                <button 
                  onClick={handleAddNewScreen}
                  className="flex-shrink-0 w-10 h-10 rounded-xl border border-dashed border-white/20 hover:border-emerald-500 hover:text-emerald-500 transition flex items-center justify-center text-white/30"
                >
                  <Plus size={18} />
                </button>
              </Reorder.Group>
            </div>

            {/* Global Sliders (Wait/Vol) on the right */}
            <div className={`flex items-center gap-4 px-4 py-2 rounded-2xl ${theme === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-black/5 border border-black/10'}`}>
               <div className="flex flex-col gap-1 w-24">
                 <span className="text-[8px] opacity-40 font-bold uppercase whitespace-nowrap">Wait: {(delayMs/1000).toFixed(1)}s</span>
                 <input type="range" min="1000" max="15000" step="1000" value={delayMs} onChange={e => setDelayMs(parseFloat(e.target.value))} className="accent-emerald-500 h-2" />
               </div>
               <div className="flex flex-col gap-1 w-24">
                 <span className="text-[8px] opacity-40 font-bold uppercase whitespace-nowrap">Vol: {Math.round(volume * 100)}%</span>
                 <input type="range" min="0" max="1" step="0.05" value={volume} onChange={e => handleVolChange(parseFloat(e.target.value))} className="accent-emerald-500 h-2" />
               </div>
               <div className="h-8 w-px bg-white/10 mx-1"></div>
               <div className="flex gap-2">
                  <button onClick={() => setViewMode(viewMode === '3d' ? 'flat' : '3d')} className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition" title="Toggle 3D/Flat view"><Box size={16} /></button>
                  <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition" title="Toggle Theme">
                    {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                  </button>
                  <button onClick={handleCast} className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition" title="Send to Chromecast (TV)"><Tv size={16} /></button>
                  <button onClick={handleFullscreen} className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition" title="Toggle Fullscreen"><Maximize2 size={16} /></button>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
