import { useState, useRef, type ReactNode } from 'react';
import { MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSuggest } from '../hooks/useSuggest';
import type { SuggestItem } from '../api/suggest';

const BLUR_DELAY_MS = 200;

export interface AddressSuggestInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (item: SuggestItem) => void;
  placeholder?: string;
  icon?: ReactNode;
  suggestKey?: string;
  disabled?: boolean;
}

export default function AddressSuggestInput({
  label,
  value,
  onChange,
  onSelect,
  placeholder = 'Адрес...',
  icon,
  suggestKey = 'address',
  disabled = false,
}: AddressSuggestInputProps) {
  const { suggestions, search, clear } = useSuggest(suggestKey);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const pickingRef = useRef(false);

  const handleChange = (val: string) => {
    onChange(val);
    if (val.trim()) {
      void search(val);
      setShowSuggestions(true);
    } else {
      clear();
      setShowSuggestions(false);
    }
  };

  const handlePick = (item: SuggestItem) => {
    pickingRef.current = true;
    onChange(item.value);
    onSelect?.(item);
    setShowSuggestions(false);
    clear();
    requestAnimationFrame(() => {
      pickingRef.current = false;
    });
  };

  return (
    <div className="relative">
      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">
        {label}
      </label>
      <div className="relative group">
        {icon && (
          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors pointer-events-none">
            {icon}
          </span>
        )}
        <input
          type="text"
          value={value}
          disabled={disabled}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => value.trim() && suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => {
            setTimeout(() => {
              if (!pickingRef.current) setShowSuggestions(false);
            }, BLUR_DELAY_MS);
          }}
          className={`w-full ${icon ? 'pl-16' : 'pl-6'} pr-6 py-5 bg-gray-50 border-transparent rounded-[2rem] focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none transition-all font-bold text-gray-900 border`}
          placeholder={placeholder}
        />
      </div>
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto"
          >
            {suggestions.map((item, idx) => (
              <div
                key={`${item.value}-${idx}`}
                role="option"
                tabIndex={0}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handlePick(item)}
                className="flex items-center gap-3 p-4 hover:bg-blue-50/50 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
              >
                <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-sm text-gray-700 font-medium block truncate">
                    {item.title || item.value}
                  </span>
                  {item.subtitle && (
                    <span className="text-xs text-gray-400 block truncate">{item.subtitle}</span>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
