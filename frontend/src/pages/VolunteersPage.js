import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../App';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import BottomNav from '../components/BottomNav';
import { MessageCircle, Plus, Check, Heart, Users, Sparkles, MapPin, Image as ImageIcon, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Imagens de pessoas felizes sendo ajudadas
const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&q=80', // Mãos unidas
  'https://images.unsplash.com/photo-1527525443983-6e60c75fff46?w=800&q=80', // Equipe unida
  'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&q=80', // Voluntários felizes
];

// Categorias principais (4 no grid)
const MAIN_CATEGORIES = [
  { value: 'housing', label: 'Moradia', icon: '🏠', color: 'from-purple-400 to-purple-600' },
  { value: 'work', label: 'Trabalho', icon: '💼', color: 'from-yellow-400 to-orange-500' },
  { value: 'food', label: 'Alimentação', icon: '🍽️', color: 'from-green-400 to-green-600' },
  { value: 'education', label: 'Educação', icon: '📚', color: 'from-blue-400 to-blue-600' }
];

// Todas as categorias
const ALL_CATEGORIES = [
  { value: 'social', label: 'Social', icon: '🤝' },
  { value: 'clothes', label: 'Roupas', icon: '👕' },
  { value: 'furniture', label: 'Móveis', icon: '🪑' },
  { value: 'transport', label: 'Transporte', icon: '🚗' },
  { value: 'food', label: 'Alimentação', icon: '🍽️' },
  { value: 'legal', label: 'Jurídico', icon: '⚖️' },
  { value: 'health', label: 'Saúde', icon: '🏥' },
  { value: 'housing', label: 'Moradia', icon: '🏠' },
  { value: 'work', label: 'Trabalho', icon: '💼' },
  { value: 'education', label: 'Educação', icon: '📚' }
];

export default function VolunteersPage() {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [showModal, setShowModal] = useState(true);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [helpRequests, setHelpRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Estado para o formulário de oferta pública
  const [publicOffer, setPublicOffer] = useState({
    title: '',
    description: '',
    categories: [],
    location: null,
    images: []
  });

  // Rotacionar imagens de fundo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedCategories.length > 0) {
      fetchHelpRequests();
    } else {
      setHelpRequests([]);
    }
  }, [selectedCategories]);

  const fetchHelpRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/posts?type=need`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const filtered = data.filter(post => {
          const postCategories = post.categories || [post.category];
          return postCategories.some(cat => selectedCategories.includes(cat));
        });
        setHelpRequests(filtered);
      }
    } catch (error) {
      console.error('Error fetching help requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const getCategoryInfo = (categoryValue) => {
    return ALL_CATEGORIES.find(c => c.value === categoryValue) || { icon: '📝', label: categoryValue };
  };

  // Funções para o formulário de oferta pública
  const toggleOfferCategory = (category) => {
    if (publicOffer.categories.includes(category)) {
      setPublicOffer({...publicOffer, categories: publicOffer.categories.filter(c => c !== category)});
    } else {
      setPublicOffer({...publicOffer, categories: [...publicOffer.categories, category]});
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) {
        toast.error('Imagem muito grande! Máximo 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPublicOffer({...publicOffer, images: [...publicOffer.images, reader.result]});
        toast.success('Foto adicionada!');
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index) => {
    const newImages = publicOffer.images.filter((_, idx) => idx !== index);
    setPublicOffer({...publicOffer, images: newImages});
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      toast.info('Obtendo localização...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPublicOffer({
            ...publicOffer,
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              address: 'Localização atual'
            }
          });
          toast.success('Localização adicionada!');
        },
        (error) => {
          toast.error('Erro ao obter localização. Tente novamente.');
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    }
  };

  const submitPublicOffer = async () => {
    if (!publicOffer.title || !publicOffer.description) {
      toast.error('Preencha o título e a descrição');
      return;
    }
    if (publicOffer.categories.length === 0) {
      toast.error('Selecione pelo menos uma categoria');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'offer',
          category: publicOffer.categories[0],
          categories: publicOffer.categories,
          title: publicOffer.title,
          description: publicOffer.description,
          images: publicOffer.images,
          location: publicOffer.location
        })
      });

      if (response.ok) {
        toast.success('Oferta publicada com sucesso!');
        setShowOfferModal(false);
        setPublicOffer({ title: '', description: '', categories: [], location: null, images: [] });
        navigate('/home');
      } else {
        toast.error('Erro ao publicar oferta');
      }
    } catch (error) {
      toast.error('Erro ao publicar oferta');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20" data-testid="volunteers-page">
      {/* Hero Section com Imagem de Fundo */}
      <div className="relative h-64 overflow-hidden">
        {/* Imagem de fundo com transição */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
          style={{ 
            backgroundImage: `url(${HERO_IMAGES[currentImageIndex]})`,
          }}
        />
        {/* Overlay gradiente */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/60 to-primary/90" />
        
        {/* Conteúdo do Header */}
        <div className="relative z-10 h-full flex flex-col justify-center px-6 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-8 h-8 text-red-400 animate-pulse" />
            <h1 className="text-3xl font-bold">Quero Ajudar</h1>
          </div>
          <p className="text-white/90 text-lg">Sua ajuda transforma vidas</p>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2">
              <Users size={18} />
              <span className="text-sm font-medium">+500 pessoas ajudadas</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2">
              <Sparkles size={18} />
              <span className="text-sm font-medium">Faça a diferença</span>
            </div>
          </div>
        </div>

        {/* Indicadores de imagem */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {HERO_IMAGES.map((_, idx) => (
            <div 
              key={idx}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentImageIndex ? 'bg-white w-6' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Modal Quero Ajudar */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="rounded-3xl max-w-lg mx-4 max-h-[90vh] overflow-y-auto bg-white p-6">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Heart className="w-6 h-6 text-red-500" />
              Quero Ajudar
            </DialogTitle>
            <p className="text-sm text-gray-600 mt-1">
              Selecione as categorias em que você pode ajudar e veja as solicitações disponíveis.
            </p>
          </DialogHeader>

          {/* Imagem inspiradora no modal */}
          <div className="relative h-32 rounded-2xl overflow-hidden mb-4">
            <img 
              src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=600&q=80" 
              alt="Pessoas unidas"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
              <p className="text-white text-sm font-medium">Juntos somos mais fortes 💪</p>
            </div>
          </div>

          {/* Grid de 4 Categorias Principais */}
          <div className="grid grid-cols-2 gap-3">
            {MAIN_CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => toggleCategory(cat.value)}
                className={`relative p-4 rounded-xl border-2 transition-all text-left overflow-hidden ${
                  selectedCategories.includes(cat.value)
                    ? 'border-primary shadow-lg scale-105'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Background gradiente quando selecionado */}
                {selectedCategories.includes(cat.value) && (
                  <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-20`} />
                )}
                <div className="relative z-10">
                  <div className="text-3xl mb-2">{cat.icon}</div>
                  <div className="font-medium text-gray-800">{cat.label}</div>
                  {selectedCategories.includes(cat.value) && (
                    <Check size={16} className="absolute top-2 right-2 text-primary" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Indicador de categorias selecionadas */}
          {selectedCategories.length > 0 && (
            <div className="flex items-center gap-2 mt-4 p-3 bg-green-50 rounded-xl border border-green-200">
              <Check size={16} className="text-green-600" />
              <span className="text-sm text-green-700">
                {selectedCategories.length} {selectedCategories.length === 1 ? 'categoria selecionada' : 'categorias selecionadas'}
              </span>
              <div className="flex gap-1 ml-auto">
                {selectedCategories.map(cat => (
                  <span key={cat} className="text-lg">{getCategoryInfo(cat).icon}</span>
                ))}
              </div>
            </div>
          )}

          {/* Solicitações de Ajuda Disponíveis */}
          {selectedCategories.length > 0 && (
            <div className="mt-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200">
              <h3 className="font-bold text-green-800 mb-1 flex items-center gap-2">
                <Heart size={18} className="text-red-500" />
                Pessoas que precisam de você
              </h3>
              <p className="text-xs text-green-700 mb-4">
                Clique para conversar e oferecer sua ajuda
              </p>

              {loading ? (
                <div className="text-center py-4 text-gray-500">Carregando...</div>
              ) : helpRequests.length === 0 ? (
                <div className="text-center py-4">
                  <div className="text-4xl mb-2">🌟</div>
                  <p className="text-gray-600 text-sm">Nenhuma solicitação no momento</p>
                  <p className="text-gray-400 text-xs">Volte em breve!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {helpRequests.map(request => (
                    <div 
                      key={request.id}
                      onClick={() => navigate(`/direct-chat/${request.user_id}`)}
                      className="bg-white rounded-xl p-4 border border-green-200 cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]"
                    >
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-lg">
                            {request.user?.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-gray-800">
                              {request.user?.name || 'Usuário'}
                            </p>
                            <MessageCircle size={18} className="text-green-500" />
                          </div>
                          <span className="text-xs text-green-600 font-medium">Precisa de ajuda</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {request.description || request.title}
                      </p>
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {getCategoryInfo(request.category).icon} {getCategoryInfo(request.category).label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Opção de criar oferta pública */}
          <div 
            onClick={() => {
              setShowModal(false);
              navigate('/home');
            }}
            className="mt-4 p-4 border-2 border-dashed border-primary/30 rounded-xl text-center cursor-pointer hover:bg-primary/5 transition-all"
          >
            <div className="flex items-center justify-center gap-2 text-primary">
              <Plus size={18} />
              <span className="font-medium">Prefiro criar uma oferta pública</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Publique uma oferta para que pessoas te encontrem
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Conteúdo Principal */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Cards de inspiração */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="relative h-40 rounded-2xl overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&q=80" 
              alt="Voluntários"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
              <p className="text-white text-sm font-medium">Cada gesto conta ❤️</p>
            </div>
          </div>
          <div className="relative h-40 rounded-2xl overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1527525443983-6e60c75fff46?w=400&q=80" 
              alt="Equipe unida"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
              <p className="text-white text-sm font-medium">Juntos somos fortes 💪</p>
            </div>
          </div>
        </div>

        {/* Botão para reabrir modal */}
        <Button
          onClick={() => setShowModal(true)}
          className="w-full mb-6 rounded-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-6 shadow-lg"
        >
          <Heart size={20} className="mr-2" />
          Quero Ajudar Alguém
        </Button>

        {/* Lista de solicitações fora do modal */}
        {selectedCategories.length > 0 && helpRequests.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Heart size={20} className="text-red-500" />
              Pessoas que precisam de ajuda ({helpRequests.length})
            </h2>
            {helpRequests.map(request => (
              <div 
                key={request.id}
                className="bg-white rounded-2xl p-5 shadow-md hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      {request.user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{request.user?.name}</p>
                    <span className="text-xs text-green-600 font-medium">Precisa de ajuda</span>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{request.description || request.title}</p>
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-sm flex items-center gap-1">
                    {getCategoryInfo(request.category).icon} {getCategoryInfo(request.category).label}
                  </span>
                  <Button
                    onClick={() => navigate(`/direct-chat/${request.user_id}`)}
                    className="rounded-full bg-primary"
                  >
                    <MessageCircle size={16} className="mr-2" />
                    Ajudar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mensagem inspiradora */}
        <div className="mt-8 bg-gradient-to-br from-pink-50 to-rose-50 rounded-3xl p-6 text-center border border-pink-200">
          <div className="text-4xl mb-3">🌟</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Sua ajuda faz a diferença
          </h3>
          <p className="text-gray-600 text-sm max-w-md mx-auto">
            Cada pequeno gesto de bondade pode transformar a vida de alguém. 
            Obrigado por fazer parte dessa comunidade de pessoas incríveis!
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
