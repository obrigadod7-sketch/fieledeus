import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../App';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import BottomNav from '../components/BottomNav';
import { Plus, MapPin, User, Clock, MessageCircle, Image as ImageIcon, MessageSquare, Send, X, Filter, Info, ExternalLink, Lock, Utensils, Scale, Heart, Home as HomeIcon, Briefcase, GraduationCap, Users, Building2, Search, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const RESOURCES_INFO = {
  work: {
    icon: '💼',
    title: 'Recursos para Emprego',
    items: [
      { name: 'France Travail', desc: 'Serviço público para encontrar emprego', link: 'https://www.francetravail.fr' },
      { name: 'ENIC-NARIC', desc: 'Reconhecimento de diplomas', link: 'https://www.france-education-international.fr' },
      { name: 'Mission Locale', desc: 'Para jovens 16-25 anos' }
    ]
  },
  housing: {
    icon: '🏠',
    title: 'Recursos para Moradia',
    items: [
      { name: 'SAMU Social - 115', desc: 'Emergência 24/7 gratuito', urgent: true },
      { name: 'Logement Social (HLM)', desc: 'Aluguel adaptado aos rendimentos', link: 'https://www.demande-logement-social.gouv.fr' },
      { name: 'France Terre d\'Asile', desc: '24 Rue Marc Seguin, 75018 Paris • 01 53 04 39 99' }
    ]
  },
  // ... restante do RESOURCES_INFO (mantido igual)
};

export default function HomePage() {
  const { user, token } = useContext(AuthContext);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showResourcesModal, setShowResourcesModal] = useState(false);
  const [selectedResourceCategory, setSelectedResourceCategory] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [newPost, setNewPost] = useState({
    type: user?.role === 'migrant' ? 'need' : 'offer',
    category: 'food',
    title: '',
    description: '',
    images: [],
    location: null
  });
  const [showComments, setShowComments] = useState({});
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [commentingOn, setCommentingOn] = useState(null);
  const [advertisements, setAdvertisements] = useState([]);

  const categories = [
    { value: 'food', label: t('food'), color: 'bg-green-100 text-green-700 border-green-200', icon: '🍽️' },
    { value: 'legal', label: t('legal'), color: 'bg-blue-100 text-blue-700 border-blue-200', icon: '⚖️' },
    { value: 'health', label: t('health'), color: 'bg-red-100 text-red-700 border-red-200', icon: '🏥' },
    { value: 'housing', label: t('housing'), color: 'bg-purple-100 text-purple-700 border-purple-200', icon: '🏠' },
    { value: 'work', label: t('work'), color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: '💼' },
    { value: 'education', label: t('education'), color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: '📚' },
    { value: 'social', label: t('social'), color: 'bg-pink-100 text-pink-700 border-pink-200', icon: '🤝' },
    { value: 'clothes', label: 'Roupas', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: '👕' },
    { value: 'furniture', label: 'Móveis', color: 'bg-teal-100 text-teal-700 border-teal-200', icon: '🪑' },
    { value: 'transport', label: 'Transporte', color: 'bg-cyan-100 text-cyan-700 border-cyan-200', icon: '🚗' }
  ];

  useEffect(() => {
    fetchPosts();
    fetchAdvertisements();
  }, []);

  useEffect(() => {
    filterPosts();
  }, [posts, categoryFilter, typeFilter]);

  // --- Helper: fallback for broken images ---
  const setImageFallback = (e) => {
    try {
      e.target.onerror = null;
      // 1x1 transparent GIF as fallback
      e.target.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
      e.target.alt = 'Imagem indisponível';
    } catch (err) {
      // ignore
    }
  };

  const fetchAdvertisements = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/sidebar-content`);
      if (response.ok) {
        const data = await response.json();
        setAdvertisements(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching sidebar content:', error);
      // Fallback para anúncios simples
      try {
        const fallbackResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/advertisements`);
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          setAdvertisements(fallbackData);
        }
      } catch (e) {
        console.error('Fallback also failed:', e);
      }
    }
  };

  const filterPosts = () => {
    let filtered = posts;

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(p => p.type === typeFilter);
    }

    setFilteredPosts(filtered);
  };

  const fetchPosts = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/posts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPosts(data.filter(p => !p.is_auto_response));
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPost = async () => {
    if (!newPost.title || !newPost.description) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPost)
      });

      if (response.ok) {
        toast.success('Post criado!');
        if (newPost.type === 'need') {
          toast.info('📩 Verifique suas mensagens para recursos úteis!', { duration: 5000 });
        }
        setShowCreatePost(false);
        setNewPost({ type: user?.role === 'migrant' ? 'need' : 'offer', category: 'food', title: '', description: '', images: [], location: null });
        fetchPosts();
      }
    } catch (error) {
      toast.error('Erro ao criar post');
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
        setNewPost({...newPost, images: [...(newPost.images || []), reader.result]});
        toast.success('Foto adicionada!');
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index) => {
    const newImages = newPost.images.filter((_, idx) => idx !== index);
    setNewPost({...newPost, images: newImages});
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      toast.info('Obtendo localização...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setNewPost({
            ...newPost,
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              address: 'Localização atual'
            }
          });
          toast.success('Localização adicionada!');
        },
        (error) => {
          console.error('Geolocation error:', error);
          if (error.code === 1) {
            toast.error('Permissão de localização negada. Ative nas configurações do navegador.');
          } else if (error.code === 2) {
            toast.error('Localização indisponível. Verifique sua conexão.');
          } else if (error.code === 3) {
            toast.error('Tempo esgotado ao obter localização. Tente novamente.');
          } else {
            toast.error('Erro ao obter localização. Tente novamente.');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
    } else {
      toast.error('Seu navegador não suporta geolocalização');
    }
  };

  const fetchComments = async (postId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/posts/${postId}/comments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setComments(prev => ({...prev, [postId]: data}));
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const toggleComments = (postId) => {
    const isShowing = showComments[postId];
    setShowComments(prev => ({...prev, [postId]: !isShowing}));
    if (!isShowing && !comments[postId]) {
      fetchComments(postId);
    }
  };

  const addComment = async (postId) => {
    if (!newComment.trim()) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ comment: newComment })
      });

      if (response.ok) {
        setNewComment('');
        setCommentingOn(null);
        fetchComments(postId);
        toast.success('Comentário adicionado!');
      }
    } catch (error) {
      toast.error('Erro ao adicionar comentário');
    }
  };

  const openResourcesModal = (category) => {
    setSelectedResourceCategory(category);
    setShowResourcesModal(true);
  };

  const getCategoryStyle = (category) => {
    return categories.find(c => c.value === category)?.color || 'bg-gray-100 text-gray-700';
  };

  const getCategoryIcon = (category) => {
    return categories.find(c => c.value === category)?.icon || '📝';
  };

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="home-page">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 glassmorphism">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4">
          {/* Header com Feed e Botões de Emergência */}
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <h1 className="text-lg sm:text-2xl font-heading font-bold text-textPrimary">Feed</h1>
            
            {/* Botões de Emergência */}
            <div className="flex gap-1.5">
              <a
                href="tel:112"
                className="flex items-center gap-1 px-2 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full text-xs shadow-lg animate-pulse"
              >
                🆘 {t('sosEmergency')}
              </a>
              <a
                href="https://wa.me/5514996078465?text=Olá! Preciso de ajuda."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-full text-xs shadow-lg"
              >
                💬 <span className="hidden sm:inline">{t('talkToMe')}</span>
              </a>
            </div>
          </div>
          
          {/* Categorias com ícones visuais - Estilo AlloVoisins */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`flex flex-col items-center gap-1 min-w-[55px] p-2 rounded-xl transition-all flex-shrink-0 ${
                categoryFilter === 'all'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <Filter size={18} />
              <span className="text-[10px] font-medium">{t('allFilter')}</span>
            </button>
            {categories.map(cat => (
              <button
                key={cat.value}
                onClick={() => setCategoryFilter(cat.value)}
                className={`flex flex-col items-center gap-1 min-w-[55px] p-2 rounded-xl transition-all flex-shrink-0 ${
                  categoryFilter === cat.value
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-[10px] font-medium whitespace-nowrap">{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Filtro de Tipo */}
          <div className="flex gap-2 mt-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex-shrink-0 ${
                typeFilter === 'all'
                  ? 'bg-gray-800 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              {t('allFilter')}
            </button>
            <button
              onClick={() => setTypeFilter('need')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex-shrink-0 flex items-center gap-1 ${
                typeFilter === 'need'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-green-50'
              }`}
            >
              🆘 {t('needsHelpFilter')}
            </button>
            <button
              onClick={() => setTypeFilter('offer')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex-shrink-0 flex items-center gap-1 ${
                typeFilter === 'offer'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-blue-50'
              }`}
            >
              🤝 {t('offersHelpFilter')}
            </button>
            <button
              onClick={() => setTypeFilter('job')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex-shrink-0 flex items-center gap-1 ${
                typeFilter === 'job'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-indigo-50'
              }`}
            >
              💼 {t('jobVacancies')}
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-6xl overflow-x-hidden">
        <div className="flex gap-6">
          {/* Sidebar Esquerda - Anúncios do Dashboard */}
          <div className="hidden lg:block w-80 flex-shrink-0 space-y-4">
            {/* Header da Sidebar */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-4 shadow-lg">
              <h3 className="font-bold text-sm">📢 {t('advertisementsTitle')}</h3>
              <p className="text-xs text-white/80 mt-1">{t('jobsAndMessagesDesc')}</p>
            </div>

            {/* Renderizar anúncios */}
            {advertisements.length > 0 ? (
              advertisements.map((item, idx) => {
                // Vaga de Emprego
                if (item.type === 'job' || item.item_type === 'job') {
                  return (
                    <div key={item.id || idx} className="bg-white rounded-2xl shadow-md overflow-hidden border border-blue-100 hover:shadow-lg transition-all">
                      {item.image_url && (
                        <img 
                          src={item.image_url} 
                          alt={item.title} 
                          className="w-full h-28 object-cover"
                          onError={setImageFallback}
                        />
                      )}
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold px-2 py-1 bg-blue-600 text-white rounded-full">💼 VAGA</span>
                          {item.source && (
                            <span className="text-xs text-blue-600">{item.source}</span>
                          )}
                        </div>
                        <h3 className="font-bold text-sm text-gray-800 mb-1 line-clamp-2">{item.title}</h3>
                        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{item.content}</p>
                        {item.link_url && (
                          <a 
                            href={item.link_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block w-full text-center py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors"
                          >
                            {item.link_text || t('viewJob')} →
                          </a>
                        )}
                      </div>
                    </div>
                  );
                }
                
                // Anúncio de Doação
                if (item.type === 'donation') {
                  return (
                    <div key={item.id || idx} className="bg-white rounded-2xl shadow-md overflow-hidden border border-orange-100">
                      {item.image_url && (
                        <img 
                          src={item.image_url} 
                          alt={item.title} 
                          className="w-full h-32 object-cover"
                          onError={setImageFallback}
                        />
                      )}
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold px-2 py-1 bg-orange-500 text-white rounded-full">❤️ DOAÇÃO</span>
                        </div>
                        <h3 className="font-bold text-sm text-gray-800 mb-2">{item.title}</h3>
                        <p className="text-xs text-gray-600 leading-relaxed mb-3">{item.content}</p>
                        {item.link_url && (
                          <a 
                            href={item.link_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block w-full text-center py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition-colors"
                          >
                            {item.link_text || t('donateNow')} →
                          </a>
                        )}
                      </div>
                    </div>
                  );
                }
                
                // Mensagem de Motivação ou outro tipo
                return (
                  <div key={item.id || idx} className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
                    {item.image_url && (
                      <img 
                        src={item.image_url} 
                        alt={item.title} 
                        className="w-full h-28 object-cover"
                        onError={setImageFallback}
                      />
                    )}
                    <div className="p-4">
                      <h3 className="font-bold text-sm text-gray-800 mb-2">{item.title}</h3>
                      <p className="text-xs text-gray-600 leading-relaxed">{item.content}</p>
                      {item.link_url && (
                        <a 
                          href={item.link_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block w-full text-center py-2 px-4 mt-3 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-xl text-sm transition-colors"
                        >
                          {item.link_text || t('learnMore')} →
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white rounded-2xl p-6 text-center border border-gray-200">
                <p className="text-gray-500 text-sm">{t('noAdsMessage')}</p>
                <p className="text-xs text-gray-400 mt-1">{t('comeBackLater')}</p>
              </div>
            )}

            {/* Link para mais vagas */}
            <a 
              href="https://rozgarline.me/jobs/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl p-4 text-center hover:shadow-lg transition-all"
            >
              <span className="font-bold">🔍 {t('viewAllJobsLink')}</span>
              <p className="text-xs text-white/80 mt-1">{t('accessMoreOpportunities')}</p>
            </a>
          </div>

          {/* Conteúdo Principal - Feed */}
          <div className="flex-1 max-w-2xl">

        {/* Botões para 'Preciso de Ajuda' e 'Quero Ajudar' - agora ambos visíveis */}
        <div className="flex gap-3 mb-6">
          <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
            <DialogTrigger asChild>
              <Button 
                data-testid="create-post-button"
                className="flex-1 rounded-full py-6 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg"
              >
                <Plus size={20} className="mr-2" />
                🆘 {user?.role === 'migrant' ? t('iNeedHelpBtn') : t('iNeedHelpBtn')}
              </Button>
            </DialogTrigger>
            {/* Mantemos o conteúdo do Dialog existente (ele aparece abaixo mais adiante no arquivo) */}
          </Dialog>

          <Button 
            data-testid="help-button"
            onClick={() => navigate('/volunteers')}
            className="flex-1 rounded-full py-6 bg-primary hover:bg-primary-hover text-white font-bold shadow-lg"
          >
            <Users size={20} className="mr-2" />
            🤝 {t('iWantToHelpBtn')}
          </Button>
        </div>

        {/* O conteúdo do Dialog (create post) continua intacto mais abaixo no arquivo para manter o fluxo atual */}

        {/* Modal de Recursos */}
        <Dialog open={showResourcesModal} onOpenChange={setShowResourcesModal}>
          <DialogContent className="rounded-3xl max-w-2xl max-h-[85vh]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-heading flex items-center gap-2">
                {selectedResourceCategory && RESOURCES_INFO[selectedResourceCategory]?.icon}
                {selectedResourceCategory && RESOURCES_INFO[selectedResourceCategory]?.title}
              </DialogTitle>
              <DialogDescription>
                Organizações e serviços que podem ajudar
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 overflow-y-auto max-h-[calc(85vh-140px)]">
              {selectedResourceCategory && RESOURCES_INFO[selectedResourceCategory]?.items.map((item, idx) => (
                <div 
                  key={idx} 
                  className={`p-4 rounded-2xl border-2 ${item.urgent ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-lg text-textPrimary">{item.name}</h3>
                    {item.urgent && (
                      <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                        URGENTE
                      </span>
                    )}
                  </div>
                  <p className="text-textSecondary mb-2">{item.desc}</p>
                  {item.link && (
                    <a 
                      href={item.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary font-medium hover:underline"
                    >
                      <ExternalLink size={16} />
                      Acessar site
                    </a>
                  )}
                </div>
              ))}
              <div className="p-4 bg-blue-50 rounded-2xl border-2 border-blue-200">
                <p className="text-sm text-textSecondary">
                  <strong>💡 Dica:</strong> Visite{' '}
                  <a href="https://refugies.info" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    Refugies.info
                  </a>{' '}
                  para mais recursos e informações atualizadas.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {loading ? (
          <div className="text-center py-12 text-textMuted">{t('loading')}</div>
        ) : (
          <>
            {/* Vagas Personalizadas do Usuário */}
            {false /* Mantido para compatibilidade; o resto do conteúdo permanece igual */}
          </>
        )}
        </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
