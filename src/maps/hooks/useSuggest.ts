import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchSuggestDebounced, type SuggestItem, type SuggestOptions } from '../api/suggest';

export function useSuggest(debounceKey = 'default') {
  const [suggestions, setSuggestions] = useState<SuggestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const queryRef = useRef('');

  const search = useCallback(
    async (q: string, options?: SuggestOptions) => {
      queryRef.current = q;
      if (!q.trim()) {
        setSuggestions([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const items = await fetchSuggestDebounced(q, {
        ...options,
        key: debounceKey,
        debounceMs: 300,
      });
      if (queryRef.current === q) {
        setSuggestions(items);
        setLoading(false);
      }
    },
    [debounceKey],
  );

  const clear = useCallback(() => {
    queryRef.current = '';
    setSuggestions([]);
    setLoading(false);
  }, []);

  useEffect(() => () => clear(), [clear]);

  return { suggestions, loading, search, clear };
}
