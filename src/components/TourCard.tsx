import React from 'react';
import { Heart, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useFavoriteActions } from '../hooks/useFavoriteActions';
import { MockItem } from '../data/mockData';
import ItemAddressLine from './ItemAddressLine';

const categoriesMap: Record<string, string> = {
  places: 'Места',
  excursions: 'Экскурсии',
  restaurants: 'Рестораны'
};

const TourCard: React.FC<{ item: MockItem; onOpen?: () => void }> = ({ item, onOpen }) => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const { toggle, isFavorite } = useFavoriteActions();

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/auth');
      return;
    }
    void toggle(item.id);
  };

  return (
    <div
      className={`bg-white rounded-[2rem] shadow-xl shadow-blue-500/5 border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 transition-all flex flex-col relative group ${onOpen ? 'cursor-pointer' : ''}`}
      onClick={onOpen}
      onKeyDown={onOpen ? (e) => e.key === 'Enter' && onOpen() : undefined}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
    >
      <button 
        onClick={handleLike}
        className="absolute top-4 right-4 p-3 rounded-2xl bg-white/80 backdrop-blur-md hover:bg-white transition-all z-10 shadow-lg"
        title={isFavorite(item.id) ? "Убрать из избранного" : "Добавить в избранное"}
      >
        <Heart className={`w-5 h-5 transition-colors ${isFavorite(item.id) ? 'fill-red-500 text-red-500' : 'text-gray-600 hover:text-red-500'}`} />
      </button>
      
      <div className="h-56 w-full overflow-hidden">
        <img 
          src={item.image} 
          alt={item.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
          referrerPolicy="no-referrer" 
        />
      </div>
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
              {categoriesMap[item.category]}
            </span>
            {item.price === 0 && (
              <span className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                Бесплатно
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-sm font-black text-gray-900 bg-gray-50 px-2 py-1 rounded-lg">
            <span className="text-yellow-400">★</span> {item.rating}
          </div>
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-2 leading-tight">{item.title}</h3>
        <ItemAddressLine item={item} className="mb-3" />
        <p className="text-sm text-gray-500 mb-6 line-clamp-2 font-medium leading-relaxed">{item.description}</p>
        
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Стоимость</p>
            <p className="font-black text-gray-900">
              {item.price === 0 ? 'Бесплатно' : `${item.price} ₽`}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center group-hover:translate-x-1 transition-transform shadow-lg shadow-blue-500/20">
            <MapPin className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourCard;
