import React from 'react';
import { X, Star, Phone, Mail, Award, Compass, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { GuideProfile } from '../data/guideProfiles';

interface GuideProfileModalProps {
  profile: GuideProfile | null;
  onClose: () => void;
}

export default function GuideProfileModal({ profile, onClose }: GuideProfileModalProps) {
  return (
    <AnimatePresence>
      {profile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-black text-gray-900">Экскурсовод</h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                aria-label="Закрыть"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-black text-xl shrink-0 overflow-hidden border border-purple-50">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    profile.displayName.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-bold uppercase rounded-full border border-blue-100 flex items-center gap-1">
                      <Compass className="w-3 h-3" /> Профессиональный гид
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold uppercase rounded-full border border-emerald-100 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Проверен
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-gray-900 leading-tight">{profile.displayName}</h3>
                  {profile.companyName && (
                    <p className="text-sm font-bold text-purple-700 mt-0.5">{profile.companyName}</p>
                  )}
                  <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">
                    {profile.partnerType === 'company' ? 'Организация' : 'Частный гид'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl text-center min-w-[72px]">
                  <p className="text-[9px] text-gray-400 font-extrabold uppercase">Рейтинг</p>
                  <p className="text-xs font-black text-amber-500 flex items-center justify-center gap-0.5 mt-0.5">
                    <Star className="w-3 h-3 fill-amber-500" /> {profile.rating.toFixed(1)}
                  </p>
                </div>
                <div className="bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl text-center min-w-[90px]">
                  <p className="text-[9px] text-gray-400 font-extrabold uppercase">Опыт</p>
                  <p className="text-xs font-black text-blue-600 mt-0.5">{profile.experience}</p>
                </div>
                <div className="bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl text-center min-w-[90px]">
                  <p className="text-[9px] text-gray-400 font-extrabold uppercase">Туров</p>
                  <p className="text-xs font-black text-rose-500 mt-0.5">{profile.toursCount}</p>
                </div>
              </div>

              <p className="text-sm text-gray-600 font-medium leading-relaxed">{profile.bio}</p>

              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Языки</p>
                <div className="flex flex-wrap gap-2">
                  {profile.languages.map((lang) => (
                    <span
                      key={lang}
                      className="px-3 py-1 bg-purple-50 text-purple-800 text-xs font-bold rounded-lg border border-purple-100"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2 text-xs font-bold text-gray-700">
                <a href={`tel:${profile.phone}`} className="flex items-center gap-2 hover:text-purple-600 transition-colors">
                  <Phone className="w-4 h-4 text-purple-500 shrink-0" />
                  {profile.phone}
                </a>
                {profile.email && (
                  <a href={`mailto:${profile.email}`} className="flex items-center gap-2 hover:text-purple-600 transition-colors">
                    <Mail className="w-4 h-4 text-purple-500 shrink-0" />
                    {profile.email}
                  </a>
                )}
              </div>

              {profile.certificates.length > 0 && (
                <div>
                  <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-purple-600" />
                    Документы и аттестаты
                  </h4>
                  <ul className="space-y-2">
                    {profile.certificates.map((cert, i) => (
                      <li
                        key={`${cert.title}-${i}`}
                        className="text-[11px] font-semibold text-gray-600 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100"
                      >
                        {cert.title}
                        <span className="block text-[9px] text-gray-400 font-bold mt-0.5">от {cert.uploadDate}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
