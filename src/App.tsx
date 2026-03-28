import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Play, Pause, Music, CloudRain, Plus, Box, Sun, Moon, Search, 
  Radio, Palette, X, Maximize2, Trash, Tv, Info
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
  const [weatherCity, setWeatherCity] = useState(() => localStorage.getItem('fb_weather_city') || 'Warsaw');
  const [weatherProvider, setWeatherProvider] = useState<'openweather' | 'openmeteo'>(
    () => (localStorage.getItem('fb_weather_provider') as any) || 'openweather'
  );
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
  const [showApiModal, setShowApiModal] = useState<'spotify' | 'lastfm' | 'api' | null>(null);

  const activeTemplate = playlist[currentIdx]?.template ?? 'custom';

  // --- Effects ---
  useEffect(() => { localStorage.setItem('fb_spotify_token', spotifyToken); }, [spotifyToken]);
  useEffect(() => { localStorage.setItem('fb_lastfm_user', lastfmUser); }, [lastfmUser]);
  useEffect(() => { localStorage.setItem('fb_lastfm_key', lastfmApiKey); }, [lastfmApiKey]);
  useEffect(() => { localStorage.setItem('fb_weather_key', weatherApiKey); }, [weatherApiKey]);
  useEffect(() => { localStorage.setItem('fb_api_url', customApiUrl); }, [customApiUrl]);
  useEffect(() => { localStorage.setItem('fb_weather_city', weatherCity); }, [weatherCity]);
  useEffect(() => { localStorage.setItem('fb_weather_provider', weatherProvider); }, [weatherProvider]);

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

  // Smart text color sync
  useEffect(() => {
    if (theme === 'light' && textColor === '#ffffff') setTextColor('#000000');
    if (theme === 'dark' && textColor === '#000000') setTextColor('#ffffff');
  }, [theme, textColor]);

  const playlistRef = useRef(playlist);
  useEffect(() => { playlistRef.current = playlist; }, [playlist]);

  const updateCurrentScreen = useCallback((newData: string[], targetIdx?: number) => {
    setPlaylist(prev => {
      const idx = targetIdx !== undefined ? targetIdx : currentIdx;
      if (idx < 0 || idx >= prev.length) return prev;
      const next = [...prev];
      // Auto-pad data to cols to prevent shifting
      const padded = newData.map(l => l.padEnd(cols, " ").substring(0, cols).toUpperCase());
      const final = [...padded, ...Array(Math.max(0, rows - padded.length)).fill(" ".repeat(cols))].slice(0, rows);
      next[idx] = { ...next[idx], data: final };
      return next;
    });
  }, [currentIdx, cols, rows]);

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

  const refreshWeather = async (targetIdx?: number) => {
    const key = weatherApiKey;
    const city = weatherCity;
    if (!city) return;
    setWeatherLoading(true); setWeatherError('');
    try {
      const cityEncoded = encodeURIComponent(city);
      let temp, humidity, condition, pressure, wind, cityName = city.toUpperCase();

      if (weatherProvider === 'openweather') {
        if (!key) { setWeatherError("API Key required"); setWeatherLoading(false); return; }
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${cityEncoded}&appid=${key}&units=metric`);
        const data = await res.json();
        if (data.cod === 200 && data.main) {
          temp = Math.round(data.main.temp);
          humidity = data.main.humidity;
          condition = data.weather[0].description.toUpperCase();
          pressure = data.main.pressure;
          wind = data.wind.speed.toFixed(1);
          cityName = data.name.toUpperCase();
        } else throw new Error(data.message || "City not found");
      } else {
        // Open-Meteo Geocoding
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${cityEncoded}&count=1`);
        const geoData = await geoRes.json();
        if (!geoData.results || geoData.results.length === 0) throw new Error("City not found");
        const { latitude, longitude, name } = geoData.results[0];
        cityName = name.toUpperCase();

        // Forecast
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relative_humidity_2m,surface_pressure&timezone=auto`);
        const weatherData = await weatherRes.json();
        const cw = weatherData.current_weather;
        temp = Math.round(cw.temperature);
        wind = (cw.windspeed / 3.6).toFixed(1); // km/h to m/s
        humidity = weatherData.hourly.relative_humidity_2m[0];
        pressure = Math.round(weatherData.hourly.surface_pressure[0]);
        condition = "METEO SYNC"; 
      }

      const lines = [
        `LOC: ${cityName}`,
        `TMP: ${temp} C`,
        `HUM: ${humidity} %`,
        `CON: ${condition}`,
        `WND: ${wind} M/S`,
        `PRS: ${pressure} HPA`
      ];
      updateCurrentScreen(lines, targetIdx);
    } catch (e: any) { setWeatherError(e.message || "Request failed"); }
    setWeatherLoading(false);
  };
  const pollServices = useCallback(async () => {
    const list = playlistRef.current;
    for (let i = 0; i < list.length; i++) {
        const item = list[i];
        if (item.template === 'weather') await refreshWeather(i);
        if (item.template === 'spotify' && spotifyToken) {
           try {
             const res = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
                headers: { "Authorization": `Bearer ${spotifyToken}` }
             });
             if (res.status === 200) {
               const data = await res.json();
               if (data && data.item) {
                  const newText = [`SPOTIFY LIVE`, `SONG: ${data.item.name.toUpperCase()}`, `ARTIST: ${data.item.artists[0].name.toUpperCase()}`];
                  updateCurrentScreen(newText, i);
               }
             }
           } catch (e) {}
        }
        if (item.template === 'lastfm' && lastfmUser && lastfmApiKey) {
           try {
             const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${lastfmUser}&api_key=${lastfmApiKey}&format=json&limit=1`;
             const res = await fetch(url);
             const data = await res.json();
             const track = data.recenttracks?.track?.[0];
             if (track) {
                const newText = [`NOW PLAYING`, `SONG: ${track.name.toUpperCase()}`, `ARTIST: ${track.artist['#text'].toUpperCase()}`];
                updateCurrentScreen(newText, i);
             }
           } catch (e) {}
        }
        if (item.template === 'api' && customApiUrl) {
           try {
              const res = await fetch(customApiUrl);
              const data = await res.json();
              const text = Array.isArray(data) ? data : [data.text || JSON.stringify(data).substring(0, 24)];
              updateCurrentScreen(text, i);
           } catch (e) {}
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotifyToken, lastfmUser, lastfmApiKey, customApiUrl]);

  useEffect(() => {
    pollServices(); // immediate fire
    const interval = setInterval(pollServices, 10000);
    return () => clearInterval(interval);
  }, [pollServices]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Stabilized Playback Loop - decoupled from re-renders via ref
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (isPlaying && !isFlipping && playlist.length > 1) {
       timerRef.current = setTimeout(() => {
          setCurrentIdx(prev => (prev + 1) % playlist.length);
          setIsFlipping(true);
       }, delayMs);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPlaying, isFlipping, playlist.length, delayMs]);

  // --- Handlers ---
  const handleVolChange = (v: number) => {
    setVolume(v);
    setMasterVolume(v);
    if ((window as any)._audio) (window as any)._audio.volume = v;
  };
  
  const handleCast = () => {
    if ((window as any).chrome?.cast?.requestSession) {
      (window as any).chrome.cast.requestSession(() => console.log("Cast Success"), (err: any) => console.log("Cast Error", err));
    } else {
      alert("Chromecast not supported in this browser. Please use Google Chrome.");
    }
  };

  const handleBoardDone = () => { 
     console.log("Board Done Event at", Date.now());
     setIsFlipping(false); 
  };
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
  const panelBg = theme === 'dark' ? 'bg-black/40 border-white/5 backdrop-blur-xl shadow-2xl' : 'bg-white/95 border-black/10 backdrop-blur-md shadow-xl';
  const currentText = playlist[currentIdx]?.data || Array(rows).fill(" ".repeat(cols));

  return (
    <div className={`w-screen h-screen overflow-hidden relative transition-colors duration-1000 ${containerBg}`}>
      <div className="absolute inset-0 z-0">
        <SplitFlapBoard key={`board-${theme}-${viewMode}`} transitionId={currentIdx} text={currentText.join('')} rows={rows} cols={cols} onAllDone={handleBoardDone} theme={theme} viewMode={viewMode} flipSpeed={flipSpeed} stagger={stagger} textColor={textColor} freeLook={freeLook} resetTrigger={resetCameraCounter} />
      </div>

      <div className={`absolute inset-0 z-10 flex flex-col pointer-events-none p-4 transition-all duration-700 ${isUIVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.98] pointer-events-none translate-y-4'}`}>
        <div className="flex-1 flex gap-4 min-h-0 items-center justify-between">
           <div className="w-16"></div>
           <div className="flex-1"></div>
           <div className={`w-72 pointer-events-auto flex flex-col gap-3 ${isCompact ? 'p-2' : 'p-4'} rounded-3xl border ${panelBg} figma-scroll overflow-y-auto max-h-[85vh]`}>
              <div className="flex items-center justify-between">
                <h2 className="text-[10px] font-bold tracking-widest font-mono text-emerald-500 uppercase">Config</h2>
                <button onClick={() => setIsCompact(!isCompact)} className={`text-[8px] transition ${theme === "dark" ? "text-emerald-500/50" : "text-emerald-600/60"} hover:text-emerald-500`}>{isCompact ? 'EXPAND' : 'COMPACT'}</button>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className={`text-[9px] font-bold uppercase ${theme === "dark" ? "text-white/40" : "text-neutral-500"}`}>Templates</span>
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
                      className={`flex-1 min-w-[65px] py-1 rounded-lg border text-[8px] font-bold transition ${activeTemplate === t ? 'bg-emerald-500 text-black border-emerald-500' : (theme === 'dark' ? 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10' : 'bg-black/5 border-black/10 text-black/90 hover:bg-black/10')}`}>{t.toUpperCase()}</button>
                  ))}
                </div>
              </div>

              {activeTemplate === 'spotify' && (
                <div className="p-3 rounded-xl bg-[#1DB954]/5 border border-[#1DB954]/20 flex flex-col gap-2">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2"><Music size={10} className="text-[#1DB954]" /><span className="text-[9px] font-bold text-[#1DB954]">SPOTIFY API</span></div>
                     <button onClick={() => setShowApiModal('spotify')} className="flex items-center gap-1 text-[7px] text-[#1DB954]/60 hover:text-[#1DB954] transition"><Info size={9}/> Read more</button>
                   </div>
                   <input type="password" value={spotifyToken} onChange={e => setSpotifyToken(e.target.value)} placeholder="OAuth Token..." className={`w-full px-2 py-1 rounded ${theme === "dark" ? "bg-black/40 border-white/10 text-white" : "bg-white border-black/10 text-black"} text-[9px] outline-none`} />
                </div>
              )}
              {activeTemplate === 'lastfm' && (
                <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/20 flex flex-col gap-2">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2"><Radio size={10} className="text-orange-500" /><span className="text-[9px] font-bold text-orange-500">LAST.FM SYNC</span></div>
                     <button onClick={() => setShowApiModal('lastfm')} className="flex items-center gap-1 text-[7px] text-orange-500/60 hover:text-orange-500 transition"><Info size={9}/> Read more</button>
                   </div>
                   <input type="text" value={lastfmUser} onChange={e => setLastfmUser(e.target.value)} placeholder="User..." className={`w-full px-2 py-1 rounded ${theme === "dark" ? "bg-black/40 border-white/10 text-white" : "bg-white border-black/10 text-black"} text-[9px] outline-none`} />
                   <input type="password" value={lastfmApiKey} onChange={e => setLastfmApiKey(e.target.value)} placeholder="API Key..." className={`w-full px-2 py-1 rounded ${theme === "dark" ? "bg-black/40 border-white/10 text-white" : "bg-white border-black/10 text-black"} text-[9px] outline-none`} />
                </div>
              )}
              {activeTemplate === 'weather' && (
                <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 flex flex-col gap-2">
                   <div className="flex items-center gap-2"><CloudRain size={10} className="text-blue-500" /><span className="text-[9px] font-bold text-blue-500">WEATHER CONFIG</span></div>
                   <div className={`flex gap-0.5 p-0.5 rounded-lg mb-1 ${theme === 'dark' ? 'bg-black/40' : 'bg-black/5'}`}>
                      {(['openweather', 'openmeteo'] as const).map(p => (
                        <button key={p} onClick={() => setWeatherProvider(p)} 
                          className={`flex-1 py-1 text-[7px] font-bold rounded transition ${weatherProvider === p ? 'bg-blue-600 text-white shadow-sm' : (theme === 'dark' ? 'text-white/30 hover:text-white/50' : 'text-black/40 hover:text-black/60')}`}>
                          {p === 'openmeteo' ? 'METEO (FREE)' : 'OPENWEATHER'}
                        </button>
                      ))}
                   </div>
                   {weatherProvider === 'openweather' && (
                     <input type="password" value={weatherApiKey} onChange={e => setWeatherApiKey(e.target.value)} placeholder="OpenWeather API Key..." className={`w-full px-2 py-1.5 rounded ${theme === "dark" ? "bg-black/40 border-white/10 text-white" : "bg-white border-black/10 text-black"} text-[9px] outline-none`} />
                   )}
                   <div className="flex gap-1">
                      <input type="text" value={weatherCity} onChange={e => setWeatherCity(e.target.value)} placeholder="City (Warsaw)..." className={`flex-1 px-2 py-1 rounded ${theme === "dark" ? "bg-black/40 border-white/10 text-white" : "bg-white border-black/10 text-black"} text-[9px] outline-none`} />
                      <button onClick={() => refreshWeather()} className="p-1.5 bg-blue-600 text-white rounded transition hover:bg-blue-500 active:scale-95"><Search size={10} /></button>
                   </div>
                   {weatherLoading && <span className="text-[7px] text-blue-400 animate-pulse">FETCHING...</span>}
                   {weatherError && <span className="text-[7px] text-rose-500">{weatherError}</span>}
                </div>
              )}
              {activeTemplate === 'api' && (
                <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 flex flex-col gap-2">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2"><Maximize2 size={10} className="text-rose-500" /><span className="text-[9px] font-bold text-rose-500">CUSTOM API</span></div>
                     <button onClick={() => setShowApiModal('api')} className="flex items-center gap-1 text-[7px] text-rose-500/60 hover:text-rose-500 transition"><Info size={9}/> Read more</button>
                   </div>
                   <input type="text" value={customApiUrl} onChange={e => setCustomApiUrl(e.target.value)} placeholder="https://api.example.com/data..." className={`w-full px-2 py-1.5 rounded ${theme === "dark" ? "bg-black/40 border-white/10 text-white" : "bg-white border-black/10 text-black"} text-[9px] outline-none`} />
                   <span className="text-[7px] text-rose-300 italic">JSON expected. Updates every 10s.</span>
                </div>
              )}

              {activeTemplate === 'custom' && (
                 <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                       <span className={`text-[9px] font-bold text-emerald-500 uppercase flex items-center gap-2`}>Edit Screen <button onClick={handleClearBoard} title="Clear Board" className="p-1 rounded hover:bg-white/5 text-white/30 hover:text-rose-500 transition"><Trash size={10} /></button></span>
                       <span className={`text-[8px] font-mono ${theme === "dark" ? "text-white/40" : "text-neutral-500"}`}>{rows}x{cols}</span>
                    </div>
                     <div className={`overflow-auto max-h-[300px] border rounded-lg p-2 figma-scroll ${theme === "dark" ? "bg-black/20 border-white/5" : "bg-slate-50 border-black/5"}`}>
                       <div className="grid gap-[1px]" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                        {currentText.map((rowText, r) => rowText.split('').map((char, c) => {
                              const index = r * cols + c;
                              return (
                                 <input key={index} id={`flap-input-${index}`} value={char.trim() ? char : ""} onMouseDown={(e) => handlePointerDown(e, r, c)} onMouseEnter={(e) => handlePointerEnter(e, r, c)} onMouseUp={handlePointerUp} onChange={(e) => handleInput(r, c, e.target.value)} onKeyDown={(e) => handleKeyDown(e, r, c)}
                                   className={`w-2.5 h-4 text-center font-mono text-[7px] outline-none transition-all rounded-[1px] cursor-pointer ${isWithinSelection(r,c) ? "bg-emerald-500 text-black" : (theme === "dark" ? "bg-white/5 text-emerald-500/60 hover:bg-white/10" : "bg-black/5 text-emerald-800 hover:bg-black/10")}`}
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

<div className={`p-3 rounded-2xl border flex flex-col gap-3 ${theme === "dark" ? "bg-black/20 border-white/5" : "bg-black/5 border-black/5"}`}>
                 <div className="flex items-center justify-between"><span className={`text-[9px] font-bold uppercase ${theme === "dark" ? "text-white/40" : "text-neutral-500"}`}>Main Options</span></div>
                 <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                       <span className={`text-[8px] uppercase leading-none ${theme === "dark" ? "text-white/40" : "text-neutral-500"}`}>Radio Mode</span>
                       <div className={`flex gap-0.5 p-0.5 rounded-lg ${theme === "dark" ? "bg-black/20" : "bg-black/5 border border-black/5"}`}>
                          {(['OFF', 'RADIO', 'SPOTIFY'] as const).map(m => (
                            <button key={m} onClick={() => { setRadioMode(m); if (m === 'OFF') stopStation(); if (m === 'RADIO' && stations.length === 0) searchByTag('lofi'); }} className={`flex-1 py-1 text-[7px] font-bold rounded transition ${radioMode === m ? "bg-emerald-500 text-black" : (theme === "dark" ? "text-white/30" : "text-neutral-400")}`}>{m}</button>
                          ))}
                       </div>
                    </div>
                    <div className="flex flex-col gap-1">
                       <span className={`text-[8px] uppercase leading-none ${theme === "dark" ? "text-white/40" : "text-neutral-500"}`}>3D Camera</span>
                       <div className="flex gap-1">
                          <button onClick={() => setFreeLook(!freeLook)} className={`flex-1 py-1 text-[7px] font-bold rounded border transition ${freeLook ? 'bg-emerald-500 text-black border-emerald-500' : 'text-emerald-500 border-emerald-500/30'}`}>{freeLook ? 'FREE' : 'LOCK'}</button>
                          <button onClick={handleResetCamera} className={`p-1 rounded border transition ${theme === "dark" ? "bg-white/5 border-white/10 text-white/50" : "bg-black/5 border-black/10 text-black/50 hover:bg-black/10"}`}><Box size={10}/></button>
                       </div>
                    </div>
                 </div>
                 {radioMode === 'RADIO' && (
                    <div className="flex flex-col gap-2 border-t border-white/5 pt-3 mt-1">
                       <div className="flex gap-1">
                          <input value={radioQuery} onChange={e => setRadioQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchRadio(radioQuery)} placeholder="Tag..." className={`flex-1 px-2 py-1.5 rounded text-[9px] outline-none border transition ${theme === "dark" ? "bg-black/40 text-white border-white/10" : "bg-white text-black border-black/10 focus:border-emerald-500"}`} />
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
                    <div className="flex justify-between items-center"><span className={`text-[8px] uppercase font-bold ${theme === "dark" ? "text-white/40" : "text-black/60"}`}>Playback Timing</span><span className="text-[7px] text-emerald-500 font-mono">{(delayMs/1000).toFixed(1)}s Wait</span></div>
                    <input type="range" min="1000" max="15000" step="1000" value={delayMs} onChange={e => setDelayMs(parseFloat(e.target.value))} className="accent-emerald-500 w-full h-1" />
                    <span className={`text-[6px] italic ${theme === "dark" ? "text-white/20" : "text-black/40"}`}>After animation flip completes.</span>
                  </div>
                 <div className="flex flex-col gap-2 border-t border-white/5 pt-3 mt-1">
                   <span className={`text-[8px] uppercase font-bold ${theme === "dark" ? "text-white/40" : "text-neutral-500"}`}>Physics (Psychic)</span>
                   <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                         <div className="flex justify-between items-center"><span className={`text-[7px] ${theme === "dark" ? "text-white/40" : "text-neutral-500"} uppercase`}>Flip</span><span className="text-[7px] text-emerald-500 font-mono">{flipSpeed.toFixed(1)}x</span></div>
                         <input type="range" min="0.1" max="3" step="0.1" value={flipSpeed} onChange={e => setFlipSpeed(parseFloat(e.target.value))} className="accent-emerald-500 w-full h-1" />
                      </div>
                      <div className="flex flex-col gap-1">
                         <div className="flex justify-between items-center"><span className={`text-[7px] ${theme === "dark" ? "text-white/40" : "text-neutral-500"} uppercase`}>Stag.</span><span className="text-[7px] text-emerald-500 font-mono">{stagger.toFixed(2)}s</span></div>
                         <input type="range" min="0" max="0.5" step="0.01" value={stagger} onChange={e => setStagger(parseFloat(e.target.value))} className="accent-emerald-500 w-full h-1" />
                      </div>
                   </div>
                 </div>
              </div>

              <div className="flex flex-col gap-3 mt-auto pt-3 border-t border-white/5">
                 <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-bold uppercase flex items-center gap-1.5 ${theme === "dark" ? "text-white/40" : "text-neutral-500"}`}><Palette size={10}/> Style</span>
                    <div className="flex gap-1.5">
                        <div className={`flex gap-0.5 p-0.5 rounded-lg border mr-1 ${theme === "dark" ? "bg-black/20 border-white/5" : "bg-black/5 border-black/5"}`}>
                          {(['3d', 'flat'] as const).map(m => (
                            <button key={m} onClick={() => setViewMode(m)} className={`px-2 py-0.5 text-[7px] font-bold rounded transition ${viewMode === m ? 'bg-emerald-500 text-black' : (theme === 'dark' ? 'text-white/30 hover:text-white/50' : 'text-black/30 hover:text-black/60')}`}>{m.toUpperCase()}</button>
                          ))}
                        </div>
                        {['#ffffff', '#000000', '#fbbf24', '#ef4444', '#3b82f6', '#10b981'].map(c => (
                            <button key={c} onClick={() => setTextColor(c)} className={`w-2.5 h-2.5 rounded-full mt-1.5 border shadow-sm transition-all ${textColor === c ? 'border-emerald-500 scale-125' : (theme === 'dark' ? 'border-white/20' : 'border-black/20')}`} style={{ backgroundColor: c }} />
                        ))}
                        <div className="relative w-2.5 h-2.5 mt-1.5 flex items-center justify-center">
                            <button className="w-full h-full rounded-full border border-white/20 shadow-sm transition hover:scale-110 active:scale-90" style={{ background: 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8f00ff)' }} onClick={() => document.getElementById('custom-color-picker')?.click()} />
                            <input type="color" id="custom-color-picker" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" value={textColor} onChange={(e) => setTextColor(e.target.value)} />
                        </div>
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
                    <span className={`text-[6px] font-bold uppercase leading-none ${theme === "dark" ? "text-white/40" : "text-neutral-500"}`}>Vol</span>
                 </div>
                 <input type="range" min="0" max="1" step="0.05" value={volume} onChange={e => handleVolChange(parseFloat(e.target.value))} className="accent-emerald-500 w-12 h-1" />
                 <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10">
                    <button onClick={handleCast} title="Cast to TV" className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition relative">
                       <Tv size={16} />
                       <google-cast-launcher style={{ 
                          position: 'absolute',
                          top: 0, left: 0, width: '100%', height: '100%',
                          opacity: 0, 
                          cursor: 'pointer' 
                       }} />
                    </button>
                    <button onClick={handleFullscreen} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition"><Maximize2 size={16}/></button>
                 </div>
               </div>
            </div>
        </div>
      </div>
      {/* API Info Modal */}
      {showApiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowApiModal(null)}>
          <div className={`relative w-[420px] max-w-[95vw] rounded-3xl border p-6 shadow-2xl ${theme === 'dark' ? 'bg-[#111] border-white/10 text-white' : 'bg-white border-black/10 text-black'}`} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowApiModal(null)} className="absolute top-4 right-4 opacity-40 hover:opacity-100 transition"><X size={14}/></button>
            {showApiModal === 'spotify' && (
              <>
                <div className="flex items-center gap-2 mb-4"><Music size={16} className="text-[#1DB954]"/><h2 className="text-sm font-bold text-[#1DB954]">Spotify Live Integration</h2></div>
                <ol className="flex flex-col gap-2 text-[11px] opacity-70 list-decimal pl-4">
                  <li>Go to <a href="https://developer.spotify.com/dashboard" target="_blank" className="underline text-[#1DB954]">developer.spotify.com</a> and create an app.</li>
                  <li>In app settings add <code className="bg-black/20 px-1 rounded">http://localhost:5173/callback</code> as a Redirect URI.</li>
                  <li>Generate an OAuth token with scope <code className="bg-black/20 px-1 rounded">user-read-currently-playing</code>.</li>
                  <li>Paste the token above. The board updates every 10 seconds.</li>
                </ol>
                <p className="mt-3 text-[10px] opacity-40">Token expires after 1h — use PKCE flow or a backend to auto-refresh.</p>
              </>
            )}
            {showApiModal === 'lastfm' && (
              <>
                <div className="flex items-center gap-2 mb-4"><Radio size={16} className="text-orange-500"/><h2 className="text-sm font-bold text-orange-500">Last.fm Sync</h2></div>
                <ol className="flex flex-col gap-2 text-[11px] opacity-70 list-decimal pl-4">
                  <li>Visit <a href="https://www.last.fm/api/account/create" target="_blank" className="underline text-orange-400">last.fm/api/account/create</a> and create an API account.</li>
                  <li>Copy your <strong>API Key</strong> and paste it in the field above.</li>
                  <li>Enter your Last.fm username.</li>
                  <li>The board will automatically show your currently scrobbling track every 10 seconds.</li>
                </ol>
                <p className="mt-3 text-[10px] opacity-40">Scrobbling must be enabled in your music player.</p>
              </>
            )}
            {showApiModal === 'api' && (
              <>
                <div className="flex items-center gap-2 mb-4"><Maximize2 size={16} className="text-rose-500"/><h2 className="text-sm font-bold text-rose-500">Custom API</h2></div>
                <p className="text-[11px] opacity-70 mb-3">Provide a URL to any public JSON endpoint. The board fetches data every 10 seconds.</p>
                <p className="text-[10px] font-bold opacity-50 mb-1">Expected response format:</p>
                <pre className={`text-[10px] rounded-xl p-3 overflow-auto ${theme === 'dark' ? 'bg-white/5' : 'bg-black/5'}`}>{`// Option 1 – array of strings:
["LINE 1", "LINE 2", "LINE 3"]

// Option 2 – object with text key:
{"text": "SINGLE LINE"}`}</pre>
                <p className="mt-3 text-[10px] opacity-40">Each line is trimmed to {cols} chars. Max {rows} lines.</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
