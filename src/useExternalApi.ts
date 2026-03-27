import { useState } from 'react';

export default function useExternalApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (url: string, headers: Record<string, string> = {}) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(url, { headers });
      if (!resp.ok) throw new Error(`HTTP Error: ${resp.status}`);
      const data = await resp.json();
      
      // Expected: { text: ["line1", "line2", ...] } or just an array of strings
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.text)) return data.text;
      
      throw new Error("Invalid format. Expected string array or { text: string[] }");
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { fetchData, loading, error };
}
