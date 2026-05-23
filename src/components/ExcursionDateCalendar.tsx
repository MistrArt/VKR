import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { formatExcursionDateLong, parseISODate, toISODate } from '../utils/excursionSchedule';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

interface ExcursionDateCalendarProps {
  availableDates: string[];
  selectedDate: string | null;
  onSelectDate: (iso: string) => void;
  startTime?: string;
}

export default function ExcursionDateCalendar({
  availableDates,
  selectedDate,
  onSelectDate,
  startTime,
}: ExcursionDateCalendarProps) {
  const availableSet = useMemo(() => new Set(availableDates), [availableDates]);

  const initialMonth = useMemo(() => {
    const first = availableDates[0];
    if (first) return parseISODate(first);
    return new Date();
  }, [availableDates]);

  const [viewMonth, setViewMonth] = useState(() => new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1));

  const { year, month, cells } = useMemo(() => {
    const y = viewMonth.getFullYear();
    const m = viewMonth.getMonth();
    const firstWeekday = (new Date(y, m, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const grid: (Date | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) grid.push(null);
    for (let d = 1; d <= daysInMonth; d++) grid.push(new Date(y, m, d));
    return { year: y, month: m, cells: grid };
  }, [viewMonth]);

  const monthLabel = viewMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });

  const shiftMonth = (delta: number) => {
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  if (availableDates.length === 0) {
    return (
      <div className="rounded-[2rem] border border-amber-100 bg-amber-50/40 p-6 text-center">
        <p className="text-xs font-bold text-amber-800">Нет доступных дат для записи. Попробуйте позже.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-purple-100 bg-purple-50/20 p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[10px] font-black text-purple-700 uppercase tracking-widest flex items-center gap-2">
          <CalendarIcon className="w-4 h-4" />
          Расписание и дата тура
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="p-2 rounded-xl bg-white border border-purple-100 text-purple-700 hover:bg-purple-50 transition-colors"
            aria-label="Предыдущий месяц"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-black text-gray-800 min-w-[120px] text-center capitalize">{monthLabel}</span>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="p-2 rounded-xl bg-white border border-purple-100 text-purple-700 hover:bg-purple-50 transition-colors"
            aria-label="Следующий месяц"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-[10px] font-semibold text-gray-500">
        Фиолетовым отмечены дни проведения экскурсии. Выберите дату для бронирования.
      </p>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((wd) => (
          <span key={wd} className="text-[9px] font-black text-gray-400 uppercase py-1">
            {wd}
          </span>
        ))}
        {cells.map((cell, idx) => {
          if (!cell) return <div key={`empty-${idx}`} className="aspect-square" />;

          const iso = toISODate(cell);
          const isAvailable = availableSet.has(iso);
          const isSelected = selectedDate === iso;
          const isToday = toISODate(new Date()) === iso;

          return (
            <button
              key={iso}
              type="button"
              disabled={!isAvailable}
              onClick={() => isAvailable && onSelectDate(iso)}
              className={`
                aspect-square rounded-xl text-[11px] font-bold transition-all relative
                ${!isAvailable ? 'text-gray-300 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}
                ${isAvailable && !isSelected ? 'bg-purple-100 text-purple-800 ring-1 ring-purple-200' : ''}
                ${isSelected ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-400 scale-105' : ''}
                ${isToday && !isSelected && isAvailable ? 'ring-2 ring-purple-400' : ''}
              `}
            >
              {cell.getDate()}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 text-[9px] font-bold text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-purple-100 ring-1 ring-purple-200" /> Есть экскурсия
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-purple-600" /> Выбрано
        </span>
      </div>

      {selectedDate && (
        <div className="bg-white border border-purple-100 rounded-2xl p-4">
          <p className="text-[9px] font-black text-purple-600 uppercase tracking-widest mb-1">Выбранная дата</p>
          <p className="text-sm font-bold text-gray-900">{formatExcursionDateLong(selectedDate)}</p>
          {startTime && (
            <p className="text-xs font-semibold text-purple-700 mt-1">Начало в {startTime}</p>
          )}
        </div>
      )}
    </div>
  );
}
