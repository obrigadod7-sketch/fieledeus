import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import { AuthContext } from '../App';
import { Button } from '../components/ui/button';
import BottomNav from '../components/BottomNav';
import { MapPin, Navigation, User, Phone, MessageCircle, Loader2, Filter, X, RefreshCw, Building2, Clock, ExternalLink, Sun, Moon, Target } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const HELP_CATEGORIES = [
  { value: 'all', label: 'Todas as categorias', icon: '🌐' },
  { value: 'jobs', label: '💼 Vagas de Emprego', icon: '💼' },
  { value: 'food', label: 'Alimentação', icon: '🍽️' },
  { value: 'legal', label: 'Jurídico', icon: '⚖️' },
  { value: 'health', label: 'Saúde', icon: '🏥' },
  { value: 'housing', label: 'Moradia', icon: '🏠' },
  { value: 'work', label: 'Emprego', icon: '💼' },
  { value: 'education', label: 'Educação', icon: '📚' },
  { value: 'social', label: 'Apoio Social', icon: '🤝' },
  { value: 'clothes', label: 'Roupas', icon: '👕' },
  { value: 'furniture', label: 'Móveis', icon: '🪑' },
  { value: 'transport', label: 'Transporte', icon: '🚗' }
];

const CATEGORY_COLORS = {
  food: 'bg-green-500',
  health: 'bg-red-500',
  legal: 'bg-blue-500',
  housing: 'bg-purple-500',
  clothes: 'bg-orange-500',
  social: 'bg-pink-500',
  education: 'bg-indigo-500',
  work: 'bg-yellow-500',
  jobs: 'bg-blue-600',
  furniture: 'bg-teal-500',
  transport: 'bg-cyan-500'
};

const CATEGORY_HEX = {
  food: '#22c55e',
  health: '#ef4444',
  legal: '#3b82f6',
  housing: '#a855f7',
  clothes: '#f97316',
  social: '#ec4899',
  education: '#6366f1',
  work: '#eab308',
  jobs: '#2563eb',
  furniture: '#14b8a6',
  transport: '#06b6d4'
};

// Função para verificar se é noite (entre 18h e 6h)
const isNightTime = () => {
  const hour = new Date().getHours();
  return hour >= 18 || hour < 6;
};

export default function NearbyHelpersPage() {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  
  const [myLocation, setMyLocation] = useState(null);
  const [nearbyHelpers, setNearbyHelpers] = useState([]);
  const [helpLocations, setHelpLocations] = useState([]);
  const [jobLocations, setJobLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedHelper, setSelectedHelper] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [radius, setRadius] = useState(10);
  const [viewMode, setViewMode] = useState('all');
  const [isNight, setIsNight] = useState(isNightTime());
  const [useLeaflet, setUseLeaflet] = useState(false);

  // Atualizar modo dia/noite a cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setIsNight(isNightTime());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Cores do tema - Interface clara, apenas mapa escuro à noite
  const themeColors = useMemo(() => ({
    background: 'bg-gray-50',
    header: 'from-blue-600 to-blue-700',
    card: 'bg-white border-gray-200',
    cardHover: 'hover:border-blue-400',
    text: 'text-gray-800',
    textMuted: 'text-gray-600',
    mapBg: 'from-blue-50 via-sky-100 to-blue-200',
    userMarker: 'bg-blue-500',
    userPulse: 'bg-blue-400/30',
  }), []);

  useEffect(() => {
    // Load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        setUseLeaflet(true);
        getMyLocation();
      };
      document.body.appendChild(script);
    } else {
      setUseLeaflet(true);
      getMyLocation();
    }
  }, []);

  useEffect(() => {
    if (myLocation) {
      fetchNearbyHelpers();
      fetchHelpLocations();
    }
  }, [myLocation, selectedCategory, radius]);

  useEffect(() => {
    if (myLocation && useLeaflet && window.L && mapRef.current) {
      initMap();
    }
  }, [myLocation, nearbyHelpers, helpLocations, viewMode, isNight, useLeaflet]);

  const getMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Seu navegador não suporta geolocalização');
      setMyLocation({ lat: 48.8566, lng: 2.3522 });
      return;
    }

    setLoadingLocation(true);
    
    toast.info('📍 Obtendo sua localização...', {
      description: 'Por favor, permita o acesso quando solicitado',
      duration: 4000
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMyLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLoadingLocation(false);
        toast.success('✅ Localização obtida!', {
          description: 'Buscando ajudantes próximos a você...'
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLoadingLocation(false);
        
        let errorMessage = 'Erro ao obter localização';
        let errorDescription = 'Usando Paris como localização padrão.';

        if (error.code === 1) {
          errorMessage = '🔒 Permissão de localização negada';
          errorDescription = 'Usando Paris como localização padrão.';
        }

        setMyLocation({ lat: 48.8566, lng: 2.3522 });
        
        toast.warning(errorMessage, {
          description: errorDescription,
          duration: 6000
        });
      },
      { 
        enableHighAccuracy: true, 
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  const fetchNearbyHelpers = async () => {
    if (!myLocation) return;
    
    setLoading(true);
    try {
      const categoryParam = selectedCategory !== 'all' ? `&category=${selectedCategory}` : '';
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/helpers-nearby?lat=${myLocation.lat}&lng=${myLocation.lng}&radius=${radius}${categoryParam}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setNearbyHelpers(data);
      }
    } catch (error) {
      console.error('Error fetching nearby helpers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHelpLocations = async () => {
    if (!myLocation) return;
    
    try {
      let url = `${process.env.REACT_APP_BACKEND_URL}/api/help-locations?lat=${myLocation.lat}&lng=${myLocation.lng}`;
      if (selectedCategory !== 'all') {
        url += `&category=${selectedCategory}`;
      }
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        const filtered = data.locations.filter(loc => loc.distance <= radius);
        setHelpLocations(filtered);
      }
    } catch (error) {
      console.error('Error fetching help locations:', error);
    }
  };

  const initMap = () => {
    if (!window.L || !mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    markersRef.current = [];

    const map = window.L.map(mapRef.current).setView([myLocation.lat, myLocation.lng], 13);
    mapInstanceRef.current = map;

    // Tile layer - SEMPRE TEMA CLARO para melhor visualização
    const tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    window.L.tileLayer(tileUrl, {
      attribution: '© OpenStreetMap contributors © CARTO'
    }).addTo(map);

    // Marcador da localização do usuário
    const myIcon = window.L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="position: relative;">
          <div style="position: absolute; width: 40px; height: 40px; background: rgba(59, 130, 246, 0.3); border-radius: 50%; animation: ping 2s infinite; left: -8px; top: -8px;"></div>
          <div style="background: #3b82f6; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><circle cx="12" cy="12" r="3"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2"/></svg>
          </div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    window.L.marker([myLocation.lat, myLocation.lng], { icon: myIcon })
      .addTo(map)
      .bindPopup(`<strong style="color: #3b82f6">📍 Você está aqui</strong>`);

    // Marcadores dos voluntários
    if (viewMode === 'all' || viewMode === 'helpers') {
      nearbyHelpers.forEach((helper, index) => {
        if (helper.location && helper.location.lat && helper.location.lng) {
          const helperIcon = window.L.divIcon({
            className: 'custom-marker',
            html: `
              <div style="background: linear-gradient(135deg, #f97316, #ea580c); width: 36px; height: 36px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4); display: flex; align-items: center; justify-content: center; font-size: 16px;">
                🤝
              </div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 18]
          });

          const marker = window.L.marker([helper.location.lat, helper.location.lng], { icon: helperIcon })
            .addTo(map);

          const categories = helper.help_categories?.map(cat => {
            const catInfo = HELP_CATEGORIES.find(c => c.value === cat);
            return catInfo ? catInfo.icon : '';
          }).join(' ') || '';

          marker.bindPopup(`
            <div style="text-align: center; min-width: 160px; padding: 8px; background: white; color: #1f2937;">
              <strong style="font-size: 14px;">${helper.name}</strong><br/>
              <span style="color: #6b7280; font-size: 11px;">
                ${helper.role === 'volunteer' ? '🤝 Voluntário Profissional' : '🤝 Ajudante'}
              </span><br/>
              <span style="font-size: 14px; margin: 4px 0; display: block;">${categories}</span>
              <span style="color: #22c55e; font-size: 12px; font-weight: bold;">📍 ${helper.distance} km</span>
            </div>
          `);

          marker.on('click', () => {
            setSelectedHelper(helper);
            setSelectedLocation(null);
          });

          markersRef.current.push(marker);
        }
      });
    }

    // Marcadores dos locais de ajuda
    if (viewMode === 'all' || viewMode === 'locations') {
      helpLocations.forEach((location, index) => {
        const colorClass = CATEGORY_COLORS[location.category] || 'bg-gray-500';
        const colorHex = CATEGORY_HEX[location.category] || '#6b7280';
        
        const locationIcon = window.L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="background: ${colorHex}; width: 36px; height: 36px; border-radius: 10px; border: 3px solid white; box-shadow: 0 4px 12px ${colorHex}66; display: flex; align-items: center; justify-content: center; font-size: 16px;">
              ${location.icon || '📍'}
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        const marker = window.L.marker([location.lat, location.lng], { icon: locationIcon })
          .addTo(map);

        marker.bindPopup(`
          <div style="text-align: center; min-width: 200px; padding: 8px; background: white; color: #1f2937;">
            <strong style="font-size: 13px;">${location.name}</strong><br/>
            <span style="color: #6b7280; font-size: 11px;">📍 ${location.address}</span><br/>
            ${location.phone ? `<span style="color: #6b7280; font-size: 11px;">📞 ${location.phone}</span><br/>` : ''}
            ${location.hours ? `<span style="color: #6b7280; font-size: 11px;">🕐 ${location.hours}</span><br/>` : ''}
            <span style="color: #22c55e; font-size: 12px; font-weight: bold;">📍 ${location.distance} km</span>
          </div>
        `);

        marker.on('click', () => {
          setSelectedLocation(location);
          setSelectedHelper(null);
        });

        markersRef.current.push(marker);
      });
    }

    // Círculo de raio
    window.L.circle([myLocation.lat, myLocation.lng], {
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.1,
      weight: 2,
      dashArray: '5, 10',
      radius: radius * 1000
    }).addTo(map);
  };

  const getCategoryInfo = (value) => {
    return HELP_CATEGORIES.find(c => c.value === value) || { icon: '📝', label: value };
  };

  const openGoogleMaps = (location) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`, '_blank');
  };

  const openStreetView = (location) => {
    window.open(`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${location.lat},${location.lng}`, '_blank');
  };

  const totalResults = (viewMode === 'all' ? nearbyHelpers.length + helpLocations.length : 
                       viewMode === 'helpers' ? nearbyHelpers.length : helpLocations.length);

  return (
    <div className={`min-h-screen pb-20 transition-colors duration-500 ${themeColors.background}`}>
      {/* Header */}
      <div className={`bg-gradient-to-r ${themeColors.header} text-white py-6 px-4 transition-colors duration-500`}>
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
              <MapPin size={28} />
              {t('nearbyHelp')}
            </h1>
          </div>
          <p className="text-white/80 text-sm">
            {t('findVolunteersNearby')}
          </p>
          
          {/* Botão de localização */}
          <div className="flex items-center gap-2 mt-3">
            <Button
              onClick={getMyLocation}
              disabled={loadingLocation}
              variant="outline"
              size="sm"
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            >
              {loadingLocation ? (
                <Loader2 size={14} className="mr-2 animate-spin" />
              ) : (
                <Target size={14} className="mr-2" />
              )}
              {myLocation ? 'Atualizar Localização' : 'Ativar Localização'}
            </Button>
            {myLocation && (
              <div className="text-xs text-white/80 flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Localização ativa
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-gray-200 border-b px-4 py-3 sticky top-0 z-10">
        <div className="container mx-auto max-w-4xl">
          {/* View Mode Toggle */}
          <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
            <button
              onClick={() => setViewMode('all')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                viewMode === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🌐 {t('all')}
            </button>
            <button
              onClick={() => setViewMode('helpers')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                viewMode === 'helpers' 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🤝 Voluntários ({nearbyHelpers.length})
            </button>
            <button
              onClick={() => setViewMode('locations')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                viewMode === 'locations' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🏢 Locais ({helpLocations.length})
            </button>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex-1 min-w-[200px]">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 border rounded-xl text-sm bg-white border-gray-300"
              >
                {HELP_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Raio:</span>
              <select
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="p-2 border rounded-xl text-sm bg-white border-gray-300"
              >
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={20}>20 km</option>
                <option value={50}>50 km</option>
                <option value={100}>100 km</option>
                <option value={500}>500 km</option>
              </select>
            </div>
            <Button
              onClick={() => {
                fetchNearbyHelpers();
                fetchHelpLocations();
              }}
              variant="outline"
              size="sm"
              className="rounded-xl"
            >
              <RefreshCw size={16} className="mr-1" />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-2 sm:px-4 py-4">
        {/* Map */}
        <div className="bg-white border-gray-200 rounded-2xl shadow-lg border overflow-hidden mb-4">
          {loadingLocation ? (
            <div className="h-[350px] sm:h-[400px] flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-2" />
                <p className="text-gray-600">Obtendo sua localização...</p>
              </div>
            </div>
          ) : (
            <div ref={mapRef} className="h-[350px] sm:h-[400px] w-full" style={{ minHeight: '350px' }} />
          )}
          
          {/* Map Legend */}
          <div className="p-3 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white shadow"></div>
                <span className="text-gray-600">Você</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 border-2 border-white shadow"></div>
                <span className="text-gray-600">Voluntários</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-lg bg-green-500 border-2 border-white shadow"></div>
                <span className="text-gray-600">Locais de Ajuda</span>
              </div>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-800">
              {loading ? 'Buscando...' : `${totalResults} resultado${totalResults !== 1 ? 's' : ''} encontrado${totalResults !== 1 ? 's' : ''}`}
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <Loader2 size={32} className="animate-spin text-blue-500 mx-auto" />
            </div>
          ) : totalResults === 0 ? (
            <div className="bg-white border-gray-200 rounded-2xl p-6 text-center border">
              <MapPin size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-600">Nenhum resultado encontrado nesta área</p>
              <p className="text-sm mt-1 text-gray-400">Tente aumentar o raio de busca</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {/* Help Locations */}
              {(viewMode === 'all' || viewMode === 'locations') && helpLocations.map(location => (
                <div
                  key={location.id}
                  className={`bg-white border-gray-200 rounded-2xl p-4 border-2 transition-all cursor-pointer ${
                    selectedLocation?.id === location.id 
                      ? 'border-blue-500 shadow-lg' 
                      : 'border-transparent hover:border-blue-400'
                  }`}
                  onClick={() => {
                    setSelectedLocation(location);
                    setSelectedHelper(null);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl ${CATEGORY_COLORS[location.category] || 'bg-gray-500'} bg-opacity-20`}
                    >
                      {location.icon || '📍'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm truncate text-gray-800">{location.name}</h3>
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full whitespace-nowrap">
                          {location.distance} km
                        </span>
                      </div>
                      <p className="text-xs mt-1 truncate text-gray-600">
                        📍 {location.address}
                      </p>
                      {location.hours && (
                        <p className="text-xs mt-0.5 truncate text-gray-600">
                          🕐 {location.hours}
                        </p>
                      )}
                      <span 
                        className={`inline-block text-xs px-2 py-0.5 rounded-full mt-2 ${CATEGORY_COLORS[location.category]} bg-opacity-20`}
                        style={{ color: CATEGORY_HEX[location.category] }}
                      >
                        {getCategoryInfo(location.category).icon} {getCategoryInfo(location.category).label}
                      </span>
                    </div>
                  </div>
                  
                  {selectedLocation?.id === location.id && (
                    <div className="mt-3 pt-3 border-t border-opacity-20 flex gap-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          openGoogleMaps(location);
                        }}
                        size="sm"
                        className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700"
                      >
                        <Navigation size={16} className="mr-1" />
                        Como Chegar
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          openStreetView(location);
                        }}
                        size="sm"
                        variant="outline"
                        className="rounded-xl border-blue-500 text-blue-600"
                      >
                        <ExternalLink size={16} className="mr-1" />
                        Street View
                      </Button>
                      {location.phone && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`tel:${location.phone}`);
                          }}
                          size="sm"
                          variant="outline"
                          className="rounded-xl"
                        >
                          <Phone size={16} />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Helpers */}
              {(viewMode === 'all' || viewMode === 'helpers') && nearbyHelpers.map(helper => (
                <div
                  key={helper.id}
                  className={`bg-white border-gray-200 rounded-2xl p-4 border-2 transition-all cursor-pointer ${
                    selectedHelper?.id === helper.id 
                      ? 'border-orange-500 shadow-lg' 
                      : 'border-transparent hover:border-blue-400'
                  }`}
                  onClick={() => {
                    setSelectedHelper(helper);
                    setSelectedLocation(null);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-lg">{helper.name?.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold truncate text-gray-800">{helper.name}</h3>
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                          {helper.distance} km
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {helper.role === 'volunteer' ? '🤝 Voluntário Profissional' : '🤝 Ajudante'}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {helper.help_categories?.slice(0, 4).map(cat => {
                          const catInfo = getCategoryInfo(cat);
                          return (
                            <span
                              key={cat}
                              className="text-xs px-2 py-1 rounded-full bg-gray-100"
                              title={catInfo.label}
                            >
                              {catInfo.icon} {catInfo.label}
                            </span>
                          );
                        })}
                        {helper.help_categories?.length > 4 && (
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100">
                            +{helper.help_categories.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {selectedHelper?.id === helper.id && (
                    <div className="mt-3 pt-3 border-t border-opacity-20 flex gap-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/direct-chat/${helper.id}`);
                        }}
                        size="sm"
                        className="flex-1 rounded-xl bg-orange-500 hover:bg-orange-600"
                      >
                        <MessageCircle size={16} className="mr-1" />
                        Conversar
                      </Button>
                      {helper.location && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            openStreetView(helper.location);
                          }}
                          size="sm"
                          variant="outline"
                          className="rounded-xl border-orange-500 text-orange-600"
                        >
                          <ExternalLink size={16} className="mr-1" />
                          Street View
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
