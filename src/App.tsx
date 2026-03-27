import React, { useState, useEffect, useCallback } from 'react';
import { 
  Play, Pause, Music, CloudRain, Plus, Box, Sun, Moon, Search, 
  Radio, Palette, X, Maximize2, Trash
} from 'lucide-react';
import { Reorder } from 'framer-motion';
import { SplitFlapBoard } from './SplitFlapBoard';
import { createAudioContext, setMasterVolume } from './audio';

// --- Types ---
type TemplateType = 'custom' | 'weather' | 'flights' | 'spotify' | 'api' | 'lastfm';
type ScreenObj = { id: string, data: string[], template?: TemplateType };

const generateId = () => Math.random().toString(36).substring(2, 9);
const TEMPLATE_FLIGHTS = [
  "   FLIGHTS DEPARTURE    ",
  "LH402 NEW YORK  10:20 ON",
  "BA249 LONDON    11:45 ON",
  "AF012 PARIS     12:30 DL",
  "SK501 STOCKHOLM 14:10 ON"
];
const TEMPLATE_SPOTIFY = [
  "     SPOTIFY LIVE       ",
  "SONG: WAITING...        ",
  "ARTIST: CONNECT API     ",
  "                        "
];

export default function App() {
  // --- States ---
  const [playlist, setPlaylist] = useState<ScreenObj[]>([
    { id: generateId(), data: Array(8).fill(" ".repeat(24)) }
  ]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [delayMs, setDelayMs] = useState(5000);
  const [isFlipping, setIsFlipping] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [viewMode, setViewMode] = useState<'3d' | 'flat'>('3d');
  const [flipSpeed, setFlipSpeed] = useState(1.0);
  const [stagger, setStagger] = useState(0.05);
  const [textColor, setTextColor] = useState('#ffffff');
  const [isCompact, setIsCompact] = useState(false);
  const [radioMode, setRadioMode] = useState<'OFF' | 'RADIO' | 'SPOTIFY'>('OFF');
  const rows = 8;
  const cols = 24;
  const [freeLook, setFreeLook] = useState(false);
  const [resetCameraCounter, setResetCameraCounter] = useState(0);

  // API credentials (with localStorage)
  const [spotifyToken, setSpotifyToken] = useState(() => localStorage.getItem('fb_spotify_token') || '');
  const [lastfmUser, setLastfmUser] = useState(() => localStorage.getItem('fb_lastfm_user') || '');
  const [lastfmApiKey, setLastfmApiKey] = useState(() => localStorage.getItem('fb_lastfm_key') || '');
  const [weatherApiKey, setWeatherApiKey] = useState(() => localStorage.getItem('fb_weather_key') || '');
  const [customApiUrl, setCustomApiUrl] = useState(() => localStorage.getItem('fb_api_url') || '');

  // Weather states
  const [weatherCity, setWeatherCity] = useState('');
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');

  // Station States
  const [stations, setStations] = useState<any[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [radioQuery, setRadioQuery] = useState('');
  const [radioLoading, setRadioLoading] = useState(false);
  const radioVolume = 0.5;

  // Selection state
  const [selStart, setSelStart] = useState<number | null>(null);
  const [selEnd, setSelEnd] = useState<number | null>(null);
  const [isDragMoving, setIsDragMoving] = useState(false);
  const [dragAnchor, setDragAnchor] = useState<number | null>(null);
  const [isUIVisible, setIsUIVisible] = useState(true);

  const activeTemplate = playlist[currentIdx]?.template ?? 'custom';

  // --- Effects ---
  useEffect(() => { localStorage.setItem('fb_spotify_token', spotifyToken); }, [spotifyToken]);
  useEffect(() => { localStorage.setItem('fb_lastfm_user', lastfmUser); }, [lastfmUser]);
  useEffect(() => { localStorage.setItem('fb_lastfm_key', lastfmApiKey); }, [lastfmApiKey]);
  useEffect(() => { localStorage.setItem('fb_weather_key', weatherApiKey); }, [weatherApiKey]);
  useEffect(() => { localStorage.setItem('fb_api_url', customApiUrl); }, [customApiUrl]);

  useEffect(() => {
    let timer: any;
    const hideUI = () => { if (isFullscreen) setIsUIVisible(false); };
    const resetTimer = () => {
      setIsUIVisible(true);
      clearTimeout(timer);
      if (isFullscreen) timer = setTimeout(hideUI, 2000);
    };
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('mousedown', resetTimer);
    return () => {
       window.removeEventListener('mousemove', resetTimer);
       window.removeEventListener('keydown', resetTimer);
       window.removeEventListener('mousedown', resetTimer);
       clearTimeout(timer);
    };
  }, [isFullscreen]);

  useEffect(() => {
    const initAudio = () => { createAudioContext(); window.removeEventListener('mousedown', initAudio); };
    window.addEventListener('mousedown', initAudio);
    return () => window.removeEventListener('mousedown', initAudio);
  }, []);

  const updateCurrentScreen = (newData: string[]) => {
    const next = [...playlist];
    next[currentIdx] = { ...next[currentIdx], data: newData };
    setPlaylist(next);
  };

  const loadTemplate = useCallback((lines: string[], templateName: TemplateType) => {
    const padded = lines.map(l => l.padEnd(cols, " ").substring(0, cols).toUpperCase());
    const final = [...padded, ...Array(Math.max(0, rows - padded.length)).fill(" ".repeat(cols))].slice(0, rows);
    const newPlaylist = [...playlist];
    newPlaylist[currentIdx] = { ...newPlaylist[currentIdx], data: final, template: templateName };
    setPlaylist(newPlaylist);
    setIsFlipping(true);
  }, [playlist, currentIdx, cols, rows]);

  const handleClearBoard = () => {
    const emptyRows = Array(rows).fill(" ".repeat(cols));
    updateCurrentScreen(emptyRows);
    setIsFlipping(true);
  };

  const pollServices = useCallback(async () => {
    if (activeTemplate === 'spotify' && spotifyToken) {
      try {
        const res = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
          headers: { Authorization: `Bearer ${spotifyToken}` }
        });
        if (res.status === 200) {
          const data = await res.json();
          if (data && data.item) {
             const newText = [`SPOTIFY LIVE`, `SONG: ${data.item.name.toUpperCase()}`, `ARTIST: ${data.item.artists[0].name.toUpperCase()}`];
             loadTemplate(newText, 'spotify');
          }
        }
      } catch (e) { console.error("Spotify poll failed", e); }
    }

    if (activeTemplate === 'lastfm' && lastfmUser && lastfmApiKey) {
      try {
        const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${lastfmUser}&api_key=${lastfmApiKey}&format=json&limit=1`;
        const res = await fetch(url);
        const data = await res.json();
        const track = data.recenttracks.track[0];
        if (track && track['@attr']?.nowplaying === 'true') {
           const newText = [`NOW PLAYING...`, `SONG: ${track.name.toUpperCase()}`, `ARTIST: ${track.artist['#text'].toUpperCase()}`];
           loadTemplate(newText, 'lastfm'); 
        }
      } catch (e) { console.error("Last.fm poll failed", e); }
    }

    if (activeTemplate === 'api' && customApiUrl) {
       try {
          const res = await fetch(customApiUrl);
          const data = await res.json();
          const text = Array.isArray(data) ? data : [data.text || JSON.stringify(data).substring(0, 24)];
          loadTemplate(text, 'api');
       } catch (e) { console.error("Custom API poll failed", e); }
    }
  }, [activeTemplate, spotifyToken, lastfmUser, lastfmApiKey, customApiUrl, loadTemplate]);

  useEffect(() => {
    const interval = setInterval(pollServices, 10000);
    return () => clearInterval(interval);
  }, [pollServices]);

  useEffect(() => {
    if (isPlaying && !isFlipping) {
       if (playlist.length <= 1) return;
       const timer = setTimeout(() => {
          setCurrentIdx(i => (i + 1) % playlist.length);
          setIsFlipping(true);
       }, delayMs);
       return () => clearTimeout(timer);
    }
  }, [isPlaying, isFlipping, delayMs, playlist.length]);

  // --- Handlers ---
  const handleVolChange = (v: number) => {
    setVolume(v);
    setMasterVolume(v);
    if ((window as any)._audio) (window as any)._audio.volume = v;
  };

  const handleBoardDone = () => { setIsFlipping(false); };
  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
       document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
       document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };
  const handleResetCamera = () => { setResetCameraCounter(c => c + 1); };

  const handleAddNewScreen = () => {
    setPlaylist([...playlist, { id: generateId(), data: Array(rows).fill(" ".repeat(cols)) }]);
    setCurrentIdx(playlist.length);
    setIsFlipping(true);
  };
  
  const handleRemove = (idx: number) => {
    if (playlist.length <= 1) return;
    const nextList = playlist.filter((_, i) => i !== idx);
    setPlaylist(nextList);
    setCurrentIdx(i => i >= nextList.length ? nextList.length - 1 : i);
    setIsFlipping(true);
  };

  const handleInput = (r: number, c: number, val: string) => {
    const char = val.slice(-1).toUpperCase();
    const newData = [...playlist[currentIdx].data];
    const rowArr = newData[r].split('');
    rowArr[c] = char || " ";
    newData[r] = rowArr.join('');
    updateCurrentScreen(newData);
    setIsFlipping(true);
    const nextIdx = r * cols + c + 1;
    if (nextIdx < rows * cols) {
       setSelStart(nextIdx); setSelEnd(nextIdx);
       document.getElementById(`flap-input-${nextIdx}`)?.focus();
    }
  };

  const handleDeleteSelection = useCallback(() => {
    if (selStart === null || selEnd === null) return;
    const s = Math.min(selStart, selEnd);
    const e = Math.max(selStart, selEnd);
    const newData = [...playlist[currentIdx].data];
    for (let i = s; i <= e; i++) {
        const r = Math.floor(i / cols);
        const c = i % cols;
        const rowArr = newData[r].split('');
        rowArr[c] = ' ';
        newData[r] = rowArr.join('');
    }
    updateCurrentScreen(newData);
    setIsFlipping(true);
  }, [selStart, selEnd, playlist, currentIdx]);

  const handleShiftSelection = useCallback((dr: number, dc: number) => {
    if (selStart === null || selEnd === null) return;
    const s = Math.min(selStart, selEnd);
    const e = Math.max(selStart, selEnd);
    const newData = Array(rows).fill("").map((_, r) => playlist[currentIdx].data[r].split(''));
    const content: { r: number, c: number, char: string }[] = [];
    for (let i = s; i <= e; i++) {
       const r = Math.floor(i / cols);
       const c = i % cols;
       content.push({ r, c, char: newData[r][c] });
       newData[r][c] = ' ';
    }
    content.forEach(item => {
       const nr = Math.max(0, Math.min(rows - 1, item.r + dr));
       const nc = Math.max(0, Math.min(cols - 1, item.c + dc));
       newData[nr][nc] = item.char;
    });
    updateCurrentScreen(newData.map(arr => arr.join('')));
    setIsFlipping(true);
    setSelStart(prev => prev !== null ? prev + (dr * cols) + dc : null);
    setSelEnd(prev => prev !== null ? prev + (dr * cols) + dc : null);
  }, [selStart, selEnd, playlist, currentIdx]);

  const handleKeyDown = (e: React.KeyboardEvent, r: number, c: number) => {
    const idx = r * cols + c;
    if (e.key === 'Backspace' || e.key === 'Delete') {
       if (selStart !== null && selEnd !== null && Math.abs(selStart - selEnd) > 0) {
          handleDeleteSelection();
       } else {
          handleInput(r, c, " ");
          const prev = idx - 1;
          if (prev >= 0) { setSelStart(prev); setSelEnd(prev); document.getElementById(`flap-input-${prev}`)?.focus(); }
       }
       return;
    }
    if (e.key === 'Enter') {
       const down = (r + 1) * cols + c;
       if (down < rows * cols) { setSelStart(down); setSelEnd(down); document.getElementById(`flap-input-${down}`)?.focus(); }
       return;
    }
    if (e.key.startsWith('Arrow')) {
       if (e.shiftKey && selStart !== null && selEnd !== null) {
          if (e.key === 'ArrowUp') handleShiftSelection(-1, 0);
          if (e.key === 'ArrowDown') handleShiftSelection(1, 0);
          if (e.key === 'ArrowLeft') handleShiftSelection(0, -1);
          if (e.key === 'ArrowRight') handleShiftSelection(0, 1);
          return;
       }
       let n = idx;
       if (e.key === 'ArrowLeft') n--;
       if (e.key === 'ArrowRight') n++;
       if (e.key === 'ArrowUp') n -= cols;
       if (e.key === 'ArrowDown') n += cols;
       if (n >= 0 && n < rows * cols) { setSelStart(n); setSelEnd(n); document.getElementById(`flap-input-${n}`)?.focus(); }
    }
  };

  // Radio
  const searchRadio = async (tag: string) => {
    if (!tag) return;
    setRadioLoading(true);
    try {
      const res = await fetch(`https://de1.api.radio-browser.info/json/stations/bytag/${tag}?limit=10&order=votes&reverse=true`);
      const data = await res.json();
      setStations(data);
    } catch(e) { console.error(e); }
    setRadioLoading(false);
  };
  const searchByTag = searchRadio;
  const stopStation = () => { setPlayingId(null); (window as any)._audio?.pause(); };
  const playStation = (st: any) => {
    stopStation();
    setPlayingId(st.stationuuid);
    const audio = new Audio(st.url_resolved);
    audio.volume = radioVolume;
    audio.play();
    (window as any)._audio = audio;
    loadTemplate([`RADIO: ${st.name.toUpperCase().substring(0,20)}`], 'custom');
  };

  const refreshWeather = async () => {
    const city = weatherCity || "Warsaw";
    const key = weatherApiKey || "bd5e378503939ddaee76f12ad7a97608";
    setWeatherLoading(true); setWeatherError('');
    try {
      const cityEncoded = encodeURIComponent(city);
      const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${cityEncoded}&appid=${key}&units=metric`);
      const data = await res.json();
      if (data.cod === 200 && data.main) {
        const lines = [`WEATHER: ${city.toUpperCase()}`, `TEMP: ${Math.round(data.main.temp)}C`, `DESC: ${data.weather[0].description.toUpperCase()}`];
        loadTemplate(lines, 'weather');
      } else { setWeatherError(data.message || "Not found"); }
    } catch (e) { setWeatherError("Request failed"); }
    setWeatherLoading(false);
  };

  const isWithinSelection = (r: number, c: number) => {
    const idx = r * cols + c;
    if (selStart === null || selEnd === null) return false;
    const s = Math.min(selStart, selEnd);
    const e = Math.max(selStart, selEnd);
    return idx >= s && idx <= e;
  };

  const handlePointerDown = (e: React.MouseEvent, r: number, c: number) => {
     const idx = r * cols + c;
     if (e.shiftKey && selStart !== null) { setSelEnd(idx); return; }
     if (isWithinSelection(r, c) && e.button === 0) { setIsDragMoving(true); setDragAnchor(idx); } 
     else { setSelStart(idx); setSelEnd(idx); setIsDragMoving(false); }
  };
  const handlePointerEnter = (e: React.MouseEvent, r: number, c: number) => {
     const idx = r * cols + c;
     if (e.buttons === 1) {
        if (isDragMoving && dragAnchor !== null) {
           const dr = Math.floor(idx / cols) - Math.floor(dragAnchor / cols);
           const dc = (idx % cols) - (dragAnchor % cols);
           if (dr !== 0 || dc !== 0) { handleShiftSelection(dr, dc); setDragAnchor(idx); }
        } else if (!isDragMoving) { setSelEnd(idx); }
     }
  };
  const handlePointerUp = () => { setIsDragMoving(false); setDragAnchor(null); };

  const containerBg = theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-[#f5f5f5]';
  const panelBg = theme === 'dark' ? 'bg-black/40 border-white/5 backdrop-blur-xl' : 'bg-white/80 border-black/10 backdrop-blur-md';
  const currentText = playlist[currentIdx]?.data || Array(rows).fill(" ".repeat(cols));

  return (
    <div className={`w-screen h-screen overflow-hidden relative transition-colors duration-1000 ${containerBg}`}>
      <div className="absolute inset-0 z-0">
        <SplitFlapBoard text={currentText.join('')} rows={rows} cols={cols} onAllDone={handleBoardDone} theme={theme} viewMode={viewMode} flipSpeed={flipSpeed} stagger={stagger} textColor={textColor} freeLook={freeLook} resetTrigger={resetCameraCounter} />
      </div>

      <div className={`absolute inset-0 z-10 flex flex-col pointer-events-none p-4 transition-all duration-700 ${isUIVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.98] pointer-events-none translate-y-4'}`}>
        <div className="flex-1 flex gap-4 min-h-0 items-center justify-between">
           <div className="w-16"></div>
           <div className="flex-1"></div>
           <div className={`w-72 pointer-events-auto flex flex-col gap-3 ${isCompact ? 'p-2' : 'p-4'} rounded-3xl border ${panelBg} figma-scroll overflow-y-auto max-h-[85vh]`}>
              <div className="flex items-center justify-between">
                <h2 className="text-[10px] font-bold tracking-widest font-mono text-emerald-500 uppercase">Config</h2>
                <button onClick={() => setIsCompact(!isCompact)} className="text-[8px] text-emerald-500/50 hover:text-emerald-500">{isCompact ? 'EXPAND' : 'COMPACT'}</button>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className={`text-[9px] font-bold uppercase ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>Templates</span>
                <div className="flex flex-wrap gap-1">
                  {(['flights', 'spotify', 'weather', 'api', 'lastfm', 'custom'] as const).map(t => (
                    <button key={t} onClick={() => {
                        if (t === 'custom') loadTemplate(playlist[currentIdx].data, 'custom');
                        else if (t === 'flights') loadTemplate(TEMPLATE_FLIGHTS, 'flights');
                        else if (t === 'spotify') loadTemplate(TEMPLATE_SPOTIFY, 'spotify');
                        else if (t === 'weather') { loadTemplate(playlist[currentIdx].data, 'weather'); refreshWeather(); }
                        else if (t === 'api') loadTemplate(["FETCHING..."], 'api');
                        else if (t === 'lastfm') { loadTemplate(["NOW PLAYING..."], 'lastfm'); pollServices(); }
                      }} 
                      className={`flex-1 min-w-[65px] py-1 rounded-lg border text-[8px] font-bold transition ${activeTemplate === t ? 'bg-emerald-500 text-black border-emerald-500' : (theme === 'dark' ? 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10' : 'bg-black/5 border-black/10 text-black/60 hover:bg-black/10')}`}>{t.toUpperCase()}</button>
                  ))}
                </div>
              </div>

              {activeTemplate === 'spotify' && (
                <div className="p-3 rounded-xl bg-[#1DB954]/5 border border-[#1DB954]/20 flex flex-col gap-2">
                   <div className="flex items-center gap-2"><Music size={10} className="text-[#1DB954]" /><span className="text-[9px] font-bold text-[#1DB954]">SPOTIFY API</span></div>
                   <input type="password" value={spotifyToken} onChange={e => setSpotifyToken(e.target.value)} placeholder="OAuth Token..." className="w-full px-2 py-1 rounded bg-black/40 border border-white/10 text-white text-[9px] outline-none" />
                </div>
              )}
              {activeTemplate === 'lastfm' && (
                <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/20 flex flex-col gap-2">
                   <div className="flex items-center gap-2"><Radio size={10} className="text-orange-500" /><span className="text-[9px] font-bold text-orange-500">LAST.FM SYNC</span></div>
                   <input type="text" value={lastfmUser} onChange={e => setLastfmUser(e.target.value)} placeholder="User..." className="w-full px-2 py-1 rounded bg-black/40 border border-white/10 text-white text-[9px] outline-none" />
                   <input type="password" value={lastfmApiKey} onChange={e => setLastfmApiKey(e.target.value)} placeholder="API Key..." className="w-full px-2 py-1 rounded bg-black/40 border border-white/10 text-white text-[9px] outline-none" />
                </div>
              )}
              {activeTemplate === 'weather' && (
                <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 flex flex-col gap-2">
                   <div className="flex items-center gap-2"><CloudRain size={10} className="text-blue-500" /><span className="text-[9px] font-bold text-blue-500">WEATHER CONFIG</span></div>
                   <input type="password" value={weatherApiKey} onChange={e => setWeatherApiKey(e.target.value)} placeholder="OpenWeather API Key..." className="w-full px-2 py-1.5 rounded bg-black/40 border border-white/10 text-white text-[9px] outline-none" />
                   <div className="flex gap-1">
                      <input type="text" value={weatherCity} onChange={e => setWeatherCity(e.target.value)} placeholder="City (Warsaw)..." className="flex-1 px-2 py-1 rounded bg-black/40 border border-white/10 text-white text-[9px] outline-none" />
                      <button onClick={refreshWeather} className="p-1.5 bg-blue-600 text-white rounded"><Search size={10} /></button>
                   </div>
                   {weatherLoading && <span className="text-[7px] text-blue-400 animate-pulse">FETCHING...</span>}
                   {weatherError && <span className="text-[7px] text-rose-500">{weatherError}</span>}
                </div>
              )}
              {activeTemplate === 'api' && (
                <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 flex flex-col gap-2">
                   <div className="flex items-center gap-2"><Maximize2 size={10} className="text-rose-500" /><span className="text-[9px] font-bold text-rose-500">CUSTOM API</span></div>
                   <input type="text" value={customApiUrl} onChange={e => setCustomApiUrl(e.target.value)} placeholder="https://api.example.com/data..." className="w-full px-2 py-1.5 rounded bg-black/40 border border-white/10 text-white text-[9px] outline-none" />
                   <span className="text-[7px] text-rose-300 italic">JSON expected. Updates every 10s.</span>
                </div>
              )}

              {activeTemplate === 'custom' && (
                 <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                       <span className={`text-[9px] font-bold text-emerald-500 uppercase flex items-center gap-2`}>Edit Screen <button onClick={handleClearBoard} title="Clear Board" className="p-1 rounded hover:bg-white/5 text-white/30 hover:text-rose-500 transition"><Trash size={10} /></button></span>
                       <span className={`text-[8px] font-mono ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>{rows}x{cols}</span>
                    </div>
                    <div className="overflow-auto max-h-[300px] border border-white/5 rounded-lg p-2 bg-black/20 figma-scroll">
                       <div className="grid gap-[1px]" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                        {currentText.map((rowText, r) => rowText.split('').map((char, c) => {
                              const index = r * cols + c;
                              return (
                                 <input key={index} id={`flap-input-${index}`} value={char.trim() ? char : ""} onMouseDown={(e) => handlePointerDown(e, r, c)} onMouseEnter={(e) => handlePointerEnter(e, r, c)} onMouseUp={handlePointerUp} onChange={(e) => handleInput(r, c, e.target.value)} onKeyDown={(e) => handleKeyDown(e, r, c)}
                                   className={`w-2.5 h-4 text-center font-mono text-[7px] outline-none transition-all rounded-[1px] cursor-pointer ${isWithinSelection(r,c) ? 'bg-emerald-500 text-black' : 'bg-white/5 text-emerald-500/60 hover:bg-white/10'}`}
                                   style={{ 
                                     cursor: isWithinSelection(r,c) ? 'move' : 'text',
                                     borderLeftWidth: isWithinSelection(r,c) && c % cols === Math.min(selStart!, selEnd!) % cols ? 1 : 0, borderColor: '#10b981'
                                   }} maxLength={1} />
                              );
                           }))}
                       </div>
                    </div>
                 </div>
              )}

<div className="p-3 rounded-2xl bg-black/20 border border-white/5 flex flex-col gap-3">
                 <div className="flex items-center justify-between"><span className={`text-[9px] font-bold uppercase ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>Main Options</span></div>
                 <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                       <span className={`text-[8px] uppercase leading-none ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>Radio Mode</span>
                       <div className="flex gap-0.5 bg-black/20 p-0.5 rounded-lg">
                          {(['OFF', 'RADIO', 'SPOTIFY'] as const).map(m => (
                            <button key={m} onClick={() => { setRadioMode(m); if (m === 'OFF') stopStation(); if (m === 'RADIO' && stations.length === 0) searchByTag('lofi'); }} className={`flex-1 py-1 text-[7px] font-bold rounded transition ${radioMode === m ? 'bg-emerald-500 text-black' : 'text-white/30'}`}>{m}</button>
                          ))}
                       </div>
                    </div>
                    <div className="flex flex-col gap-1">
                       <span className={`text-[8px] uppercase leading-none ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>3D Camera</span>
                       <div className="flex gap-1">
                          <button onClick={() => setFreeLook(!freeLook)} className={`flex-1 py-1 text-[7px] font-bold rounded border transition ${freeLook ? 'bg-emerald-500 text-black border-emerald-500' : 'text-emerald-500 border-emerald-500/30'}`}>{freeLook ? 'FREE' : 'LOCK'}</button>
                          <button onClick={handleResetCamera} className="p-1 rounded bg-white/5 border border-white/10"><Box size={10}/></button>
                       </div>
                    </div>
                 </div>
                 {radioMode === 'RADIO' && (
                    <div className="flex flex-col gap-2 border-t border-white/5 pt-3 mt-1">
                       <div className="flex gap-1">
                          <input value={radioQuery} onChange={e => setRadioQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchRadio(radioQuery)} placeholder="Tag..." className="flex-1 px-2 py-1.5 rounded bg-black/40 text-[9px] text-white border border-white/10 outline-none" />
                          <button onClick={() => searchRadio(radioQuery)} className="p-1 px-2 bg-emerald-600 rounded text-white"><Search size={10} /></button>
                       </div>
                       <div className="flex flex-col gap-1 max-h-32 overflow-y-auto figma-scroll pr-1 mt-1">
                          {radioLoading ? <span className="text-[7px] text-emerald-500 animate-pulse">SEARCHING...</span> : stations.map(st => (
                               <button key={st.stationuuid} onClick={() => playStation(st)} className={`text-left text-[8px] px-2 py-1 rounded border ${playingId === st.stationuuid ? 'bg-emerald-500 border-emerald-500 text-black' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'}`}>{st.name}</button>
                          ))}
                       </div>
                    </div>
                 )}
                 <div className="flex flex-col gap-2 border-t border-white/5 pt-3 mt-1">
                   <span className={`text-[8px] uppercase font-bold ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>Physics (Psychic)</span>
                   <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                         <div className="flex justify-between items-center"><span className="text-[7px] text-white/40 uppercase">Flip</span><span className="text-[7px] text-emerald-500 font-mono">{flipSpeed.toFixed(1)}x</span></div>
                         <input type="range" min="0.1" max="3" step="0.1" value={flipSpeed} onChange={e => setFlipSpeed(parseFloat(e.target.value))} className="accent-emerald-500 w-full h-1" />
                      </div>
                      <div className="flex flex-col gap-1">
                         <div className="flex justify-between items-center"><span className="text-[7px] text-white/40 uppercase">Stag.</span><span className="text-[7px] text-emerald-500 font-mono">{stagger.toFixed(2)}s</span></div>
                         <input type="range" min="0" max="0.5" step="0.01" value={stagger} onChange={e => setStagger(parseFloat(e.target.value))} className="accent-emerald-500 w-full h-1" />
                      </div>
                   </div>
                 </div>
              </div>

              <div className="flex flex-col gap-3 mt-auto pt-3 border-t border-white/5">
                 <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-bold uppercase flex items-center gap-1.5 ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}><Palette size={10}/> Style</span>
                    <div className="flex gap-1.5">
                        <div className="flex gap-0.5 bg-black/20 p-0.5 rounded-lg border border-white/5 mr-1">
                          {(['3d', 'flat'] as const).map(m => (
                            <button key={m} onClick={() => setViewMode(m)} className={`px-2 py-0.5 text-[7px] font-bold rounded transition ${viewMode === m ? 'bg-emerald-500 text-black' : 'text-white/30 hover:text-white/50'}`}>{m.toUpperCase()}</button>
                          ))}
                        </div>
                        {['#ffffff', '#fbbf24', '#ef4444', '#3b82f6'].map(c => (
                          <button key={c} onClick={() => setTextColor(c)} className="w-2.5 h-2.5 rounded-full mt-1.5" style={{ backgroundColor: c }} />
                        ))}
                    </div>
                 </div>
                 <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={`w-full py-1.5 rounded-xl border text-[9px] font-bold flex items-center justify-center gap-2 ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white/50' : 'bg-black/5 border-black/10 text-black/60'} hover:opacity-80 transition`}>
                    {theme === 'dark' ? <Sun size={12}/> : <Moon size={12}/>} {theme.toUpperCase()} MODE
                 </button>
              </div>
           </div>
        </div>

        <div className="pointer-events-auto flex items-end gap-4 mt-auto">
            <button onClick={() => setIsPlaying(!isPlaying)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg transition active:scale-95 shrink-0">
               {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <div className={`flex-1 p-2 rounded-3xl ${panelBg} flex items-center gap-4 overflow-hidden shadow-2xl border`}>
               <div className="flex flex-col pl-2">
                 <span className={`text-[7px] font-bold uppercase whitespace-nowrap ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>Wait: {(delayMs/1000).toFixed(1)}s</span>
                 <input type="range" min="1000" max="15000" step="1000" value={delayMs} onChange={e => setDelayMs(parseFloat(e.target.value))} className="accent-emerald-500 w-16 h-1" />
               </div>
               <div className="flex-1 overflow-hidden">
                  <Reorder.Group axis="x" values={playlist} onReorder={setPlaylist} className="flex gap-2.5 overflow-x-auto figma-scroll pb-3 px-1 items-center">
                    {playlist.map((screen, idx) => (
                      <Reorder.Item key={screen.id} value={screen} onClick={() => { setCurrentIdx(idx); setIsFlipping(true); }}
                        className={`flex-shrink-0 flex flex-col gap-1.5 p-2 rounded-2xl border transition-all cursor-pointer min-w-[100px] ${idx === currentIdx ? 'bg-emerald-500/20 border-emerald-500' : (theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10')}`}>
                         <div className="flex items-center justify-between w-full">
                            <span className={`text-[8px] font-mono ${theme === 'dark' ? 'opacity-40 text-white' : 'opacity-60 text-black'}`}>#{idx + 1}</span>
                            {playlist.length > 1 && <button onClick={(e) => { e.stopPropagation(); handleRemove(idx); }} className={`${theme === 'dark' ? 'text-white/20' : 'text-black/20'} hover:text-rose-500 transition`}><X size={10}/></button>}
                         </div>
                         <div className="w-full aspect-[2.5] bg-black/40 rounded-lg overflow-hidden flex items-center justify-center p-1">
                            <div className="grid gap-[0.5px] opacity-40" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                               {screen.data.map(row => row.split('').map((char, i) => (
                                  <div key={i} className={`w-[2px] h-[3px] rounded-[0.5px] ${char.trim() ? 'bg-emerald-500' : 'bg-white/5'}`}></div>
                               )))}
                            </div>
                         </div>
                         <span className={`text-[9px] font-bold uppercase truncate max-w-full tracking-wider ${idx === currentIdx ? 'text-emerald-500' : (theme === 'dark' ? 'text-white/70' : 'text-neutral-600')}`}>{screen.data[0]?.trim() || "Empty Screen"}</span>
                      </Reorder.Item>
                    ))}
                    <button onClick={handleAddNewScreen} className="shrink-0 w-12 h-16 rounded-2xl border border-dashed border-white/20 flex flex-col items-center justify-center gap-1 text-white/20 hover:border-emerald-500/50 hover:text-emerald-500 transition group">
                       <Plus size={16} /><span className="text-[7px] font-bold uppercase">New</span>
                    </button>
                  </Reorder.Group>
               </div>
               <div className="flex items-center gap-3 pr-2">
                 <div className="flex flex-col items-end">
                    <span className="text-[9px] font-bold text-emerald-500 font-mono tracking-tighter">{Math.round(volume * 100)}%</span>
                    <span className={`text-[6px] font-bold uppercase leading-none ${theme === 'dark' ? 'text-white/40' : 'text-black/40'}`}>Vol</span>
                 </div>
                 <input type="range" min="0" max="1" step="0.05" value={volume} onChange={e => handleVolChange(parseFloat(e.target.value))} className="accent-emerald-500 w-12 h-1" />
                 <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10">
                    <google-cast-launcher style={{ 
                       display: 'block', 
                       width: '20px', 
                       height: '20px',
                       cursor: 'pointer' 
                    }} />
                    <button onClick={handleFullscreen} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition"><Maximize2 size={16}/></button>
                 </div>
               </div>
            </div>
        </div>
      </div>
    </div>
  );
}
