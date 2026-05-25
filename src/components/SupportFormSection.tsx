import React from 'react';
import { CheckCircle2, ChevronRight, HelpCircle, Loader2 } from 'lucide-react';
import type { PartnerSupportType, SupportType, TouristSupportType } from '../utils/supportReport';

export interface SupportFormValues {
  email: string;
  type: SupportType;
  message: string;
  relatedItemId?: string;
  relatedItemTitle?: string;
}

interface SupportTypeOption {
  id: SupportType;
  label: string;
}

interface SupportFormSectionProps {
  typeOptions: SupportTypeOption[];
  form: SupportFormValues;
  onChange: (patch: Partial<SupportFormValues>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onOpenFaq: () => void;
  loading?: boolean;
  success?: boolean;
  title?: string;
  subtitle?: string;
}

export default function SupportFormSection({
  typeOptions,
  form,
  onChange,
  onSubmit,
  onOpenFaq,
  loading = false,
  success = false,
  title = 'Поддержка',
  subtitle = 'Мы всегда на связи, чтобы помочь вам',
}: SupportFormSectionProps) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">{title}</h3>
            <p className="text-sm text-gray-500 font-medium">{subtitle}</p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col gap-1 max-w-sm">
          <span className="text-xs font-black text-gray-900">Часто задаваемые вопросы</span>
          <button
            type="button"
            onClick={onOpenFaq}
            className="text-blue-600 font-bold text-xs hover:underline inline-flex items-center gap-1 text-left"
          >
            Перейти в FAQ <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-green-50 text-green-700 rounded-2xl flex items-center gap-3 border border-green-100">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-bold">Ваше обращение успешно отправлено! Мы ответим вам в ближайшее время.</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        {form.relatedItemTitle && (
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
            <span className="block text-[10px] font-black text-amber-800 uppercase tracking-widest mb-1">
              Объект обращения
            </span>
            <p className="text-sm font-bold text-gray-900">{form.relatedItemTitle}</p>
            {form.relatedItemId && (
              <p className="text-[10px] text-gray-500 font-medium mt-0.5">ID: {form.relatedItemId}</p>
            )}
          </div>
        )}

        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
            Тип обращения
          </label>
          <div className={`grid grid-cols-1 gap-2 ${typeOptions.length > 3 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
            {typeOptions.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => onChange({ type: type.id as TouristSupportType & PartnerSupportType })}
                className={`px-4 py-3 rounded-xl text-xs font-bold border-2 transition-all ${
                  form.type === type.id
                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-gray-50 bg-gray-50 text-gray-400'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
            Ваш Email для ответа
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => onChange({ email: e.target.value })}
            required
            placeholder="example@mail.ru"
            className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
            Текст обращения
          </label>
          <textarea
            value={form.message}
            onChange={(e) => onChange({ message: e.target.value })}
            required
            placeholder="Опишите вашу проблему или задайте вопрос..."
            rows={5}
            className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium resize-none text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !form.message.trim()}
          className="w-full sm:w-auto px-12 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-wider transition-all active:scale-95 shadow-xl shadow-blue-500/10 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
        >
          {loading && <Loader2 className="w-5 h-5 animate-spin" />}
          Отправить
        </button>
      </form>
    </div>
  );
}
