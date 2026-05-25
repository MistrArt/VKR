import React, { useState } from 'react';
import { ChevronDown, ChevronRight, HelpCircle } from 'lucide-react';
import type { FaqEntry } from '../data/supportFaq';

interface FaqPanelProps {
  audience: 'tourist' | 'partner';
  entries: FaqEntry[];
}

export default function FaqPanel({ audience, entries }: FaqPanelProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
          <HelpCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-black text-gray-900 tracking-tight">Популярные вопросы</h3>
          <p className="text-sm text-gray-500 font-medium">
            {audience === 'tourist'
              ? 'Ответы для путешественников по Екатеринбургу'
              : 'Ответы для организаторов экскурсий и партнёров'}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {entries.map((entry, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={entry.question} className="bg-gray-50/80 rounded-2xl border border-gray-100 overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-white transition-colors"
              >
                <span className="text-sm font-bold text-gray-900">{entry.question}</span>
                {isOpen ? (
                  <ChevronDown className="w-4 h-4 text-blue-600 shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                )}
              </button>
              {isOpen && (
                <p className="px-5 pb-4 text-sm text-gray-600 font-medium leading-relaxed border-t border-gray-100 pt-3 bg-white">
                  {entry.answer}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
