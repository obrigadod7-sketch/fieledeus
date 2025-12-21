import React from 'react';
import { MapPin, Navigation } from 'lucide-react';

export default function MapPreview({ location, size = 'medium' }) {
  if (!location || !location.lat || !location.lng) return null;

  const { lat, lng, address } = location;
  
  // URL do Google Maps para abrir
  const directUrl = `https://www.google.com/maps?q=${lat},${lng}`;

  return (
    <div className="w-full my-2">
      {/* Info da Localização - Compacto e Responsivo */}
      <div className="bg-gradient-to-r from-blue-50 to-sky-50 p-2 sm:p-3 rounded-xl border border-blue-200">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="bg-blue-100 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
              <MapPin size={14} className="sm:w-4 sm:h-4 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-xs text-gray-500">📍 Localização</p>
              <p className="text-xs sm:text-sm font-medium text-gray-800 truncate">
                {address || 'Localização compartilhada'}
              </p>
            </div>
          </div>
          <a
            href={directUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 bg-blue-600 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-full hover:bg-blue-700 text-[10px] sm:text-xs font-bold whitespace-nowrap transition-all shadow-sm flex-shrink-0"
          >
            <span className="hidden sm:inline">Ver no</span> Mapa
            <Navigation size={12} className="sm:w-3.5 sm:h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
