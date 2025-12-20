import React, { useMemo } from 'react';
import { MapPin, ExternalLink, Navigation, Sun, Moon } from 'lucide-react';

// Função para verificar se é noite (entre 18h e 6h)
const isNightTime = () => {
  const hour = new Date().getHours();
  return hour >= 18 || hour < 6;
};

export default function MapPreview({ location, size = 'medium' }) {
  if (!location || !location.lat || !location.lng) return null;

  const { lat, lng, address } = location;
  const isNight = isNightTime();
  
  // URL do Google Maps para abrir
  const directUrl = `https://www.google.com/maps?q=${lat},${lng}`;
  const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
  
  const sizeClasses = {
    small: 'h-32',
    medium: 'h-48',
    large: 'h-64'
  };

  // Cores baseadas no modo dia/noite
  const colors = useMemo(() => ({
    background: isNight 
      ? 'from-slate-900 via-slate-800 to-indigo-900' 
      : 'from-blue-100 via-sky-50 to-blue-200',
    border: isNight ? 'border-blue-500/30' : 'border-blue-300/50',
    grid: isNight ? '#3b82f6' : '#2563eb',
    marker: isNight ? 'text-cyan-400' : 'text-blue-600',
    pulse: isNight ? 'border-cyan-500/30' : 'border-blue-500/30',
    infoBg: isNight 
      ? 'from-slate-800 to-slate-900' 
      : 'from-blue-50 to-sky-50',
    infoBorder: isNight ? 'border-blue-500/30' : 'border-blue-200',
    text: isNight ? 'text-white' : 'text-gray-800',
    textMuted: isNight ? 'text-gray-400' : 'text-gray-600',
  }), [isNight]);

  return (
    <div className="w-full space-y-2 my-3">
      {/* Mapa Visual Estilizado com modo dia/noite */}
      <div 
        className={`${sizeClasses[size] || sizeClasses.medium} rounded-2xl overflow-hidden border-2 ${colors.border} bg-gradient-to-br ${colors.background} relative group cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300`}
        onClick={() => window.open(directUrl, '_blank')}
      >
        {/* Padrão de ruas estilo Street View */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 200" preserveAspectRatio="none">
          {/* Ruas principais */}
          <rect x="0" y="60" width="300" height="6" fill={isNight ? '#1e40af' : '#93c5fd'} opacity="0.5" />
          <rect x="0" y="140" width="300" height="8" fill={isNight ? '#1e40af' : '#60a5fa'} opacity="0.6" />
          <rect x="80" y="0" width="5" height="200" fill={isNight ? '#1e40af' : '#93c5fd'} opacity="0.5" />
          <rect x="200" y="0" width="6" height="200" fill={isNight ? '#1e40af' : '#60a5fa'} opacity="0.6" />
          
          {/* Blocos de prédios */}
          <rect x="20" y="70" width="50" height="60" fill={isNight ? '#0f172a' : '#dbeafe'} rx="3" opacity="0.4" />
          <rect x="90" y="70" width="100" height="60" fill={isNight ? '#0f172a' : '#dbeafe'} rx="3" opacity="0.4" />
          <rect x="220" y="70" width="60" height="60" fill={isNight ? '#0f172a' : '#dbeafe'} rx="3" opacity="0.4" />
        </svg>

        {/* Efeito de iluminação noturna */}
        {isNight && (
          <>
            <div className="absolute top-[70px] left-[50px] w-2 h-2 bg-yellow-400 rounded-full blur-sm animate-pulse" />
            <div className="absolute top-[90px] left-[140px] w-2 h-2 bg-yellow-300 rounded-full blur-sm animate-pulse" style={{ animationDelay: '0.5s' }} />
            <div className="absolute top-[100px] left-[240px] w-2 h-2 bg-orange-400 rounded-full blur-sm animate-pulse" style={{ animationDelay: '1s' }} />
          </>
        )}
        
        {/* Círculos concêntricos simulando radar */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className={`absolute w-32 h-32 border-2 ${colors.pulse} rounded-full animate-ping`} style={{ animationDuration: '3s', left: '-64px', top: '-64px' }} />
          <div className={`absolute w-24 h-24 border-2 ${colors.pulse} rounded-full animate-ping`} style={{ animationDuration: '2s', left: '-48px', top: '-48px' }} />
          <div className={`absolute w-16 h-16 border-2 ${colors.pulse} rounded-full animate-ping`} style={{ animationDuration: '1.5s', left: '-32px', top: '-32px' }} />
        </div>
        
        {/* Marcador Principal */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="relative animate-bounce" style={{ animationDuration: '2s' }}>
            <MapPin size={48} className={`${colors.marker} drop-shadow-2xl`} fill="currentColor" strokeWidth={1.5} />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full" />
          </div>
        </div>
        
        {/* Overlay de hover */}
        <div className={`absolute inset-0 ${isNight ? 'bg-blue-500/0 group-hover:bg-blue-500/20' : 'bg-blue-500/0 group-hover:bg-blue-500/10'} flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300`}>
          <div className={`${isNight ? 'bg-slate-800' : 'bg-white'} rounded-full p-4 shadow-xl transform scale-0 group-hover:scale-100 transition-transform duration-300`}>
            <Navigation size={32} className="text-blue-500" />
          </div>
        </div>
        
        {/* Badge de coordenadas e modo */}
        <div className={`absolute top-3 right-3 ${isNight ? 'bg-slate-800/90' : 'bg-white/90'} backdrop-blur-sm px-3 py-1 rounded-full text-xs font-mono ${isNight ? 'text-cyan-400' : 'text-blue-600'} border ${colors.infoBorder} shadow-sm flex items-center gap-2`}>
          {isNight ? <Moon size={12} /> : <Sun size={12} />}
          {lat.toFixed(4)}°, {lng.toFixed(4)}°
        </div>
      </div>
      
      {/* Info da Localização */}
      <div className={`bg-gradient-to-r ${colors.infoBg} p-3 sm:p-4 rounded-xl border-2 ${colors.infoBorder}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`${isNight ? 'bg-blue-500/20' : 'bg-blue-100'} p-2 rounded-lg`}>
              <MapPin size={18} className="text-blue-500 flex-shrink-0" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs ${colors.textMuted}`}>📍 Localização</p>
              <p className={`text-sm font-medium ${colors.text} truncate`}>
                {address || 'Localização compartilhada'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href={streetViewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1 ${isNight ? 'bg-slate-700 text-blue-400 hover:bg-slate-600' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'} px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all`}
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={12} />
              <span className="hidden sm:inline">Street</span>
            </a>
            <a
              href={directUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-full hover:bg-blue-700 text-xs sm:text-sm font-bold whitespace-nowrap transition-all shadow-sm hover:shadow-md"
            >
              <span className="hidden sm:inline">Abrir</span> Mapa
              <Navigation size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
