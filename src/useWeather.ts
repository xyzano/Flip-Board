// Live weather from Open-Meteo (no API key needed)
import { useState, useCallback } from 'react';

export type WeatherData = {
  city: string;
  temp: string;
  condition: string;
  wind: string;
  humidity: string;
};

const WMO_COND: Record<number, string> = {
  0: 'CLEAR SKY',
  1: 'MAINLY CLEAR', 2: 'PARTLY CLOUDY', 3: 'OVERCAST',
  45: 'FOGGY', 48: 'FOGGY',
  51: 'LIGHT DRIZZLE', 53: 'DRIZZLE', 55: 'HEAVY DRIZZLE',
  61: 'LIGHT RAIN', 63: 'RAIN', 65: 'HEAVY RAIN',
  71: 'LIGHT SNOW', 73: 'SNOW', 75: 'HEAVY SNOW',
  80: 'RAIN SHOWERS', 81: 'RAIN SHOWERS', 82: 'HEAVY SHOWERS',
  95: 'THUNDERSTORM', 96: 'THUNDERSTORM', 99: 'THUNDERSTORM',
};

export function useWeather() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async (city: string): Promise<WeatherData | null> => {
    setLoading(true);
    setError(null);
    try {
      // Geocode
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
      const geoData = await geoRes.json();
      if (!geoData.results?.length) { setError('CITY NOT FOUND'); setLoading(false); return null; }
      
      const { latitude, longitude, name, country_code } = geoData.results[0];
      
      // Weather
      const wxRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&wind_speed_unit=kmh`);
      const wxData = await wxRes.json();
      const cur = wxData.current;

      setLoading(false);
      return {
        city: `${name}, ${country_code}`.toUpperCase().substring(0, 16),
        temp: `${Math.round(cur.temperature_2m)}C`,
        condition: (WMO_COND[cur.weather_code] || 'UNKNOWN').substring(0, 16),
        wind: `${Math.round(cur.wind_speed_10m)} KM/H`,
        humidity: `${cur.relative_humidity_2m}%`,
      };
    } catch {
      setError('FETCH ERROR');
      setLoading(false);
      return null;
    }
  }, []);

  return { fetchWeather, loading, error };
}
