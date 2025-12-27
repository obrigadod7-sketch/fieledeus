import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../App';
import BottomNav from '../components/BottomNav';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from 'sonner';
import {
  Home,
  Plus,
  MapPin,
  Calendar,
  Users,
  Heart,
  Star,
  MessageCircle,
  Filter,
  Search,
  Bed,
  Sofa,
  Building,
  Clock,
  CheckCircle,
  Shield,
  ChevronLeft,
  User,
  X,
  Camera
} from 'lucide-react';

export default function HousingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  
  // States
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterType, setFilterType] = useState('all'); // all, offer, need
  const [filterCity, setFilterCity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create listing states
  const [listingType, setListingType] = useState(''); // offer or need
  const [newListing, setNewListing] = useState({
    title: '',
    description: '',
    city: '',
    address: '',
    accommodation_type: 'room', // room, sofa, house, shared
    duration: 'temporary', // temporary, long_term, exchange
    max_guests: 1,
    amenities: [],
    pets_allowed: false,
    available_from: '',
    available_until: '',
    exchange_services: '', // For house-sitting exchange
    photos: []
  });

  const accommodationTypes = [
    { value: 'room', label: t('privateRoom'), icon: Bed },
    { value: 'sofa', label: t('sofaCouch'), icon: Sofa },
    { value: 'house', label: t('entireHouse'), icon: Building },
    { value: 'shared', label: t('sharedRoom'), icon: Users }
  ];

  const durationTypes = [
    { value: 'emergency', label: t('emergencyStay'), desc: '1-3 ' + t('days') },
    { value: 'temporary', label: t('temporaryStay'), desc: '1-4 ' + t('weeks') },
    { value: 'long_term', label: t('longTermStay'), desc: '1+ ' + t('months') },
    { value: 'exchange', label: t('exchangeStay'), desc: t('houseSittingExchange') }
  ];

  const amenitiesList = [
    { id: 'wifi', label: 'WiFi', icon: '📶' },
    { id: 'kitchen', label: t('kitchen'), icon: '🍳' },
    { id: 'washing', label: t('washingMachine'), icon: '🧺' },
    { id: 'heating', label: t('heating'), icon: '🔥' },
    { id: 'parking', label: t('parking'), icon: '🅿️' },
    { id: 'accessible', label: t('accessible'), icon: '♿' }
  ];

  useEffect(() => {
    fetchListings();
  }, [filterType, filterCity]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      let url = `${process.env.REACT_APP_BACKEND_URL}/api/housing?`;
      if (filterType !== 'all') url += `type=${filterType}&`;
      if (filterCity) url += `city=${filterCity}&`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setListings(data);
      }
    } catch (error) {
      console.error('Error fetching housing listings:', error);
      toast.error(t('errorLoadingListings'));
    } finally {
      setLoading(false);
    }
  };

  const createListing = async () => {
    if (!newListing.title || !newListing.city) {
      toast.error(t('fillRequiredFields'));
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/housing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newListing,
          listing_type: listingType
        })
      });

      if (response.ok) {
        toast.success(listingType === 'offer' ? t('housingOfferCreated') : t('housingRequestCreated'));
        setShowCreateModal(false);
        resetForm();
        fetchListings();
      } else {
        throw new Error('Failed to create listing');
      }
    } catch (error) {
      toast.error(t('errorCreatingListing'));
    }
  };

  const resetForm = () => {
    setListingType('');
    setNewListing({
      title: '',
      description: '',
      city: '',
      address: '',
      accommodation_type: 'room',
      duration: 'temporary',
      max_guests: 1,
      amenities: [],
      pets_allowed: false,
      available_from: '',
      available_until: '',
      exchange_services: '',
      photos: []
    });
  };

  const toggleAmenity = (amenityId) => {
    setNewListing(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter(a => a !== amenityId)
        : [...prev.amenities, amenityId]
    }));
  };

  const filteredListings = listings.filter(listing => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return listing.title?.toLowerCase().includes(query) ||
             listing.city?.toLowerCase().includes(query) ||
             listing.description?.toLowerCase().includes(query);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate('/home')} className="p-2 hover:bg-white/20 rounded-full">
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                🏠 {t('solidaryHousing')}
              </h1>
              <p className="text-sm text-white/80">{t('solidaryHousingDesc')}</p>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchHousingPlaceholder')}
              className="pl-10 rounded-full bg-white/90 border-0 h-12"
            />
          </div>
        </div>
      </div>

      {/* Stats Banner */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-around">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{listings.filter(l => l.listing_type === 'offer').length}</p>
            <p className="text-xs text-gray-600">{t('availableHomes')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{listings.filter(l => l.listing_type === 'need').length}</p>
            <p className="text-xs text-gray-600">{t('peopleSearching')}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{listings.filter(l => l.status === 'matched').length}</p>
            <p className="text-xs text-gray-600">{t('successfulMatches')}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              filterType === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {t('allFilter')}
          </button>
          <button
            onClick={() => setFilterType('offer')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
              filterType === 'offer'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            🏡 {t('offersHousing')}
          </button>
          <button
            onClick={() => setFilterType('need')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
              filterType === 'need'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            🔍 {t('needsHousing')}
          </button>
        </div>

        {/* City Filter */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
          {['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice'].map(city => (
            <button
              key={city}
              onClick={() => setFilterCity(filterCity === city ? '' : city)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                filterCity === city
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              📍 {city}
            </button>
          ))}
        </div>
      </div>

      {/* Listings Grid */}
      <div className="max-w-4xl mx-auto px-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <Home size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-700 mb-2">{t('noListingsYet')}</h3>
            <p className="text-sm text-gray-500 mb-4">{t('beFirstToOffer')}</p>
            <Button onClick={() => setShowCreateModal(true)} className="rounded-full">
              <Plus size={18} className="mr-2" />
              {t('createListing')}
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredListings.map((listing) => (
              <div
                key={listing.id}
                className={`bg-white rounded-2xl shadow-sm overflow-hidden border-2 transition-all hover:shadow-md ${
                  listing.listing_type === 'offer' 
                    ? 'border-green-100 hover:border-green-300' 
                    : 'border-orange-100 hover:border-orange-300'
                }`}
              >
                {/* Image/Header */}
                <div className={`h-32 relative ${
                  listing.listing_type === 'offer'
                    ? 'bg-gradient-to-br from-green-400 to-emerald-600'
                    : 'bg-gradient-to-br from-orange-400 to-red-500'
                }`}>
                  {listing.photos?.[0] ? (
                    <img 
                      src={listing.photos[0]} 
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {listing.listing_type === 'offer' ? (
                        <Home size={48} className="text-white/50" />
                      ) : (
                        <Search size={48} className="text-white/50" />
                      )}
                    </div>
                  )}
                  
                  {/* Badge */}
                  <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold ${
                    listing.listing_type === 'offer'
                      ? 'bg-green-500 text-white'
                      : 'bg-orange-500 text-white'
                  }`}>
                    {listing.listing_type === 'offer' ? t('offersHousing') : t('needsHousing')}
                  </div>

                  {/* Verified Badge */}
                  {listing.user?.verified && (
                    <div className="absolute top-3 right-3 bg-white/90 px-2 py-1 rounded-full flex items-center gap-1">
                      <Shield size={12} className="text-blue-600" />
                      <span className="text-xs font-medium text-blue-600">{t('verified')}</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-800 mb-1 line-clamp-1">{listing.title}</h3>
                  
                  <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                    <MapPin size={14} />
                    <span>{listing.city}</span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{listing.description}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                      {accommodationTypes.find(a => a.value === listing.accommodation_type)?.label || listing.accommodation_type}
                    </span>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs">
                      {durationTypes.find(d => d.value === listing.duration)?.label || listing.duration}
                    </span>
                    {listing.pets_allowed && (
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full text-xs">
                        🐾 {t('petsAllowed')}
                      </span>
                    )}
                  </div>

                  {/* User Info & Action */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <User size={16} className="text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{listing.user?.name}</p>
                        <div className="flex items-center gap-1">
                          <Star size={10} className="text-yellow-500 fill-yellow-500" />
                          <span className="text-xs text-gray-500">
                            {listing.user?.rating || '4.8'} ({listing.user?.reviews_count || 0})
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => navigate(`/direct-chat/${listing.user_id}`)}
                      className="rounded-full bg-blue-600 hover:bg-blue-700"
                    >
                      <MessageCircle size={14} className="mr-1" />
                      {t('contact')}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-40"
      >
        <Plus size={28} />
      </button>

      {/* Create Listing Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg mx-2 p-0 rounded-3xl overflow-hidden max-h-[90vh]">
          <div className="flex flex-col h-full max-h-[85vh]">
            
            {/* Step 1: Choose Type */}
            {!listingType && (
              <>
                <DialogHeader className="p-6 pb-4 border-b">
                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    🏠 {t('solidaryHousing')}
                  </DialogTitle>
                  <DialogDescription>
                    {t('whatWouldYouLikeToDo')}
                  </DialogDescription>
                </DialogHeader>

                <div className="p-6 space-y-4">
                  <button
                    onClick={() => setListingType('offer')}
                    className="w-full p-6 rounded-2xl border-2 border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-400 transition-all text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-green-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Home size={32} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-green-800">{t('offerHousing')}</h3>
                        <p className="text-sm text-green-600">{t('offerHousingDesc')}</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setListingType('need')}
                    className="w-full p-6 rounded-2xl border-2 border-orange-200 bg-orange-50 hover:bg-orange-100 hover:border-orange-400 transition-all text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Search size={32} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-orange-800">{t('needHousing')}</h3>
                        <p className="text-sm text-orange-600">{t('needHousingDesc')}</p>
                      </div>
                    </div>
                  </button>

                  {/* Exchange/House-sitting option */}
                  <button
                    onClick={() => {
                      setListingType('offer');
                      setNewListing(prev => ({...prev, duration: 'exchange'}));
                    }}
                    className="w-full p-6 rounded-2xl border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 hover:border-purple-400 transition-all text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Heart size={32} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-purple-800">{t('houseSitting')}</h3>
                        <p className="text-sm text-purple-600">{t('houseSittingDesc')}</p>
                      </div>
                    </div>
                  </button>
                </div>
              </>
            )}

            {/* Step 2: Create Listing Form */}
            {listingType && (
              <>
                <DialogHeader className="p-4 sm:p-6 pb-4 border-b">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setListingType('')}
                      className="p-2 hover:bg-gray-100 rounded-full"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <div>
                      <DialogTitle className="text-lg font-bold">
                        {listingType === 'offer' ? (
                          <span className="flex items-center gap-2">
                            🏡 {t('offerHousing')}
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            🔍 {t('needHousing')}
                          </span>
                        )}
                      </DialogTitle>
                      <DialogDescription className="text-sm">
                        {t('fillDetailsBelow')}
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                  {/* Title */}
                  <div>
                    <Label className="text-sm font-bold mb-2 block">✏️ {t('listingTitle')}</Label>
                    <Input
                      value={newListing.title}
                      onChange={(e) => setNewListing({...newListing, title: e.target.value})}
                      placeholder={listingType === 'offer' ? t('offerTitlePlaceholder') : t('needTitlePlaceholder')}
                      className="rounded-xl"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <Label className="text-sm font-bold mb-2 block">📍 {t('city')}</Label>
                    <Input
                      value={newListing.city}
                      onChange={(e) => setNewListing({...newListing, city: e.target.value})}
                      placeholder="Ex: Paris, Lyon, Marseille..."
                      className="rounded-xl"
                    />
                  </div>

                  {/* Accommodation Type */}
                  {listingType === 'offer' && (
                    <div>
                      <Label className="text-sm font-bold mb-2 block">🏠 {t('accommodationType')}</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {accommodationTypes.map(type => (
                          <button
                            key={type.value}
                            onClick={() => setNewListing({...newListing, accommodation_type: type.value})}
                            className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${
                              newListing.accommodation_type === type.value
                                ? 'bg-blue-50 border-blue-500 text-blue-700'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            <type.icon size={18} />
                            <span className="text-sm font-medium">{type.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Duration */}
                  <div>
                    <Label className="text-sm font-bold mb-2 block">⏱️ {t('duration')}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {durationTypes.map(dur => (
                        <button
                          key={dur.value}
                          onClick={() => setNewListing({...newListing, duration: dur.value})}
                          className={`p-3 rounded-xl border-2 transition-all text-left ${
                            newListing.duration === dur.value
                              ? 'bg-blue-50 border-blue-500'
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className="text-sm font-medium block">{dur.label}</span>
                          <span className="text-xs text-gray-500">{dur.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Exchange Services (if house-sitting) */}
                  {newListing.duration === 'exchange' && (
                    <div>
                      <Label className="text-sm font-bold mb-2 block">🤝 {t('exchangeServices')}</Label>
                      <Textarea
                        value={newListing.exchange_services}
                        onChange={(e) => setNewListing({...newListing, exchange_services: e.target.value})}
                        placeholder={t('exchangeServicesPlaceholder')}
                        className="rounded-xl"
                        rows={3}
                      />
                    </div>
                  )}

                  {/* Max Guests */}
                  {listingType === 'offer' && (
                    <div>
                      <Label className="text-sm font-bold mb-2 block">👥 {t('maxGuests')}</Label>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setNewListing({...newListing, max_guests: Math.max(1, newListing.max_guests - 1)})}
                          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold"
                        >
                          -
                        </button>
                        <span className="text-2xl font-bold w-12 text-center">{newListing.max_guests}</span>
                        <button
                          onClick={() => setNewListing({...newListing, max_guests: newListing.max_guests + 1})}
                          className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Amenities */}
                  {listingType === 'offer' && (
                    <div>
                      <Label className="text-sm font-bold mb-2 block">✨ {t('amenities')}</Label>
                      <div className="flex flex-wrap gap-2">
                        {amenitiesList.map(amenity => (
                          <button
                            key={amenity.id}
                            onClick={() => toggleAmenity(amenity.id)}
                            className={`px-3 py-2 rounded-full text-sm transition-all flex items-center gap-1 ${
                              newListing.amenities.includes(amenity.id)
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            <span>{amenity.icon}</span>
                            <span>{amenity.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pets Allowed */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🐾</span>
                      <span className="font-medium">{t('petsAllowed')}</span>
                    </div>
                    <button
                      onClick={() => setNewListing({...newListing, pets_allowed: !newListing.pets_allowed})}
                      className={`w-12 h-6 rounded-full transition-all ${
                        newListing.pets_allowed ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                        newListing.pets_allowed ? 'translate-x-6' : 'translate-x-1'
                      }`}></div>
                    </button>
                  </div>

                  {/* Description */}
                  <div>
                    <Label className="text-sm font-bold mb-2 block">📝 {t('description')}</Label>
                    <Textarea
                      value={newListing.description}
                      onChange={(e) => setNewListing({...newListing, description: e.target.value})}
                      placeholder={listingType === 'offer' ? t('offerDescPlaceholder') : t('needDescPlaceholder')}
                      className="rounded-xl"
                      rows={4}
                    />
                  </div>

                  {/* Submit Button */}
                  <Button 
                    onClick={createListing}
                    className={`w-full rounded-full py-6 text-base font-bold ${
                      listingType === 'offer'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-orange-600 hover:bg-orange-700'
                    }`}
                  >
                    {listingType === 'offer' ? (
                      <span className="flex items-center gap-2">
                        🏡 {t('publishOffer')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        🔍 {t('publishRequest')}
                      </span>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
