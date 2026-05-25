import { useCallback, useState } from 'react';
import { geocodeAddress, reverseGeocode, GeocodeError } from '../api/geocode';

export function useGeocode() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const geocode = useCallback(async (query: string): Promise<[number, number] | null> => {
    setLoading(true);
    setError(null);
    try {
      return await geocodeAddress(query);
    } catch (e) {
      const msg = e instanceof GeocodeError ? e.message : 'Ошибка геокодирования';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reverse = useCallback(async (coords: [number, number]): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      return await reverseGeocode(coords);
    } catch (e) {
      const msg = e instanceof GeocodeError ? e.message : 'Ошибка обратного геокодирования';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { geocode, reverse, loading, error, clearError: () => setError(null) };
}
