// Radio stations via radio-browser.info (community API, no key needed)
import { useState, useRef, useCallback } from 'react';

export type Station = {
  stationuuid: string;
  name: string;
  url_resolved: string;
  country: string;
  tags: string;
  votes: number;
};

const SERVERS = [
  'https://de1.api.radio-browser.info',
  'https://nl1.api.radio-browser.info',
  'https://at1.api.radio-browser.info',
];

async function apiFetch(path: string) {
  for (const server of SERVERS) {
    try {
      const res = await fetch(`${server}${path}`, {
        headers: { 'User-Agent': 'FlipBoard/1.0', 'Accept': 'application/json' },
      });
      if (res.ok) return res.json();
    } catch { /* try next */ }
  }
  throw new Error('All radio servers failed');
}

export function useRadio() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const search = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const results: Station[] = await apiFetch(
        `/json/stations/search?name=${encodeURIComponent(query)}&limit=20&hidebroken=true&order=votes&reverse=true`
      );
      setStations(results);
    } catch {
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const searchByTag = useCallback(async (tag: string) => {
    setLoading(true);
    setError(null);
    try {
      const results: Station[] = await apiFetch(
        `/json/stations/search?tag=${encodeURIComponent(tag)}&limit=20&hidebroken=true&order=votes&reverse=true`
      );
      setStations(results);
    } catch {
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const play = useCallback((station: Station) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const audio = new Audio(station.url_resolved);
    audio.play().catch(() => setError('Stream failed'));
    audioRef.current = audio;
    setPlayingId(station.stationuuid);
    // Register click with radio-browser for stats
    apiFetch(`/json/url/${station.stationuuid}`).catch(() => {});
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingId(null);
  }, []);

  return { stations, loading, search, searchByTag, play, stop, playingId, error };
}
