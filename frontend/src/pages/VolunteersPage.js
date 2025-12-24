import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import BottomNav from '../components/BottomNav';
import { MessageCircle, Plus, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Categorias de ajuda disponíveis
const HELP_CATEGORIES = [
  { value: 'social', label: 'Social', icon: '🤝' },
  { value: 'clothes', label: 'Roupa', icon: '👕' },
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
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [helpRequests, setHelpRequests] = useState([]);
  const [loading, setLoading] = useState(false);

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
        // Filtrar posts que correspondem às categorias selecionadas
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
    return HELP_CATEGORIES.find(c => c.value === categoryValue) || { icon: '📝', label: categoryValue };
  };

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="volunteers-page">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-secondary text-white py-6 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-2xl font-heading font-bold mb-2">🤝 Quero Ajudar</h1>
          <p className="text-sm text-white/90">Encontre pessoas que precisam da sua ajuda</p>
        </div>
      </div>

      {/* Modal Quero Ajudar */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="rounded-3xl max-w-lg mx-4 max-h-[85vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-2xl font-heading flex items-center gap-2">
              🤝 Quero Ajudar
            </DialogTitle>
            <p className="text-sm text-textSecondary mt-2">
              Selecione as categorias em que você pode ajudar e veja as solicitações disponíveis.
            </p>
          </DialogHeader>

          {/* Grid de Categorias Principais */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {HELP_CATEGORIES.slice(0, 4).map(cat => (
              <button
                key={cat.value}
                onClick={() => toggleCategory(cat.value)}
                className={`p-4 rounded-2xl border-2 transition-all text-left relative ${
                  selectedCategories.includes(cat.value)
                    ? 'bg-primary/10 border-primary shadow-md'
                    : 'bg-white border-gray-200 hover:border-primary/50'
                }`}
              >
                <div className="text-3xl mb-2">{cat.icon}</div>
                <div className="font-bold text-sm text-textPrimary">{cat.label}</div>
                {selectedCategories.includes(cat.value) && (
                  <div className="absolute top-2 right-2">
                    <Check size={16} className="text-primary" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Mais categorias em chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {HELP_CATEGORIES.slice(4).map(cat => (
              <button
                key={cat.value}
                onClick={() => toggleCategory(cat.value)}
                className={`px-3 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                  selectedCategories.includes(cat.value)
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-textSecondary hover:bg-gray-200'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Indicador de categorias selecionadas */}
          {selectedCategories.length > 0 && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 rounded-xl border border-green-200">
              <Check size={18} className="text-green-600" />
              <span className="text-sm font-medium text-green-700">
                {selectedCategories.length} {selectedCategories.length === 1 ? 'categoria selecionada' : 'categorias selecionadas'}:
              </span>
              <div className="flex gap-1">
                {selectedCategories.map(cat => (
                  <span key={cat} className="text-lg">{getCategoryInfo(cat).icon}</span>
                ))}
              </div>
            </div>
          )}

          {/* Solicitações de Ajuda - Apenas mensagem e botão para conversar */}
          {selectedCategories.length > 0 && (
            <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
              <h3 className="font-bold text-green-800 mb-2">
                📋 Solicitações de Ajuda Disponíveis
              </h3>
              <p className="text-xs text-green-700 mb-4">
                Pessoas que precisam de ajuda nas categorias que você selecionou.
              </p>

              {loading ? (
                <div className="text-center py-4 text-textMuted">Carregando...</div>
              ) : helpRequests.length === 0 ? (
                <div className="text-center py-4 text-textMuted">
                  Nenhuma solicitação encontrada.
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {helpRequests.map(request => (
                    <div 
                      key={request.id}
                      className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"
                    >
                      {/* Nome e Avatar */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold">
                            {request.user?.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-textPrimary">
                            {request.user?.name || 'Usuário'}
                          </p>
                          <span className="text-xs text-green-600">Precisa de ajuda</span>
                        </div>
                      </div>

                      {/* Mensagem do pedido de ajuda */}
                      <p className="text-sm text-textSecondary mb-3 leading-relaxed">
                        {request.description || request.title}
                      </p>

                      {/* Categoria */}
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-1 bg-gray-100 text-textSecondary text-xs rounded-full flex items-center gap-1">
                          {getCategoryInfo(request.category).icon}
                          {getCategoryInfo(request.category).label}
                        </span>

                        {/* Botão Conversar */}
                        <Button
                          onClick={() => navigate(`/direct-chat/${request.user_id}`)}
                          size="sm"
                          className="rounded-full bg-primary hover:bg-primary-hover text-white"
                        >
                          <MessageCircle size={16} className="mr-1" />
                          Conversar
                        </Button>
                      </div>
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
            className="mt-4 p-4 border-2 border-dashed border-primary/30 rounded-2xl text-center cursor-pointer hover:bg-primary/5 transition-all"
          >
            <div className="flex items-center justify-center gap-2 text-primary">
              <Plus size={20} />
              <span className="font-bold">Prefiro criar uma oferta pública</span>
            </div>
            <p className="text-xs text-textMuted mt-1">
              Uma oferta fica visível para todos que precisam de ajuda.
            </p>
          </div>

          {/* Botão Ver Todas */}
          <Button
            onClick={() => setShowModal(false)}
            variant="outline"
            className="w-full mt-4 rounded-full"
          >
            Ver todas as solicitações
          </Button>
        </DialogContent>
      </Dialog>

      {/* Conteúdo Principal */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Filtros de categoria */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
          <Button
            onClick={() => setShowModal(true)}
            className="rounded-full bg-primary text-white font-bold flex-shrink-0"
          >
            🤝 Quero Ajudar
          </Button>
          {HELP_CATEGORIES.slice(0, 5).map(cat => (
            <Button
              key={cat.value}
              onClick={() => toggleCategory(cat.value)}
              variant={selectedCategories.includes(cat.value) ? 'default' : 'outline'}
              size="sm"
              className={`rounded-full whitespace-nowrap flex-shrink-0 ${
                selectedCategories.includes(cat.value) ? 'bg-primary text-white' : ''
              }`}
            >
              <span className="mr-1">{cat.icon}</span>
              {cat.label}
            </Button>
          ))}
        </div>

        {/* Lista de solicitações */}
        {selectedCategories.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🤝</div>
            <h3 className="text-xl font-bold text-textPrimary mb-2">Selecione categorias para ajudar</h3>
            <p className="text-textMuted mb-6">
              Clique no botão "Quero Ajudar" para escolher como você pode ajudar.
            </p>
            <Button
              onClick={() => setShowModal(true)}
              className="rounded-full bg-primary text-white font-bold px-8"
            >
              🤝 Quero Ajudar
            </Button>
          </div>
        ) : loading ? (
          <div className="text-center py-12 text-textMuted">Carregando...</div>
        ) : helpRequests.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-textMuted text-lg">
              Nenhuma solicitação encontrada para essas categorias.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-textMuted">
              {helpRequests.length} {helpRequests.length === 1 ? 'pessoa precisa' : 'pessoas precisam'} de ajuda
            </p>
            
            {helpRequests.map((request) => {
              const catInfo = getCategoryInfo(request.category);
              return (
                <div 
                  key={request.id}
                  className="bg-white rounded-2xl p-5 shadow-card border border-gray-100"
                >
                  {/* Cabeçalho com nome */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {request.user?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-textPrimary">
                        {request.user?.name || 'Usuário'}
                      </p>
                      <span className="text-xs text-green-600 font-medium">Precisa de ajuda</span>
                    </div>
                    <span className="px-3 py-1 bg-gray-100 text-textSecondary text-xs rounded-full flex items-center gap-1">
                      {catInfo.icon} {catInfo.label}
                    </span>
                  </div>

                  {/* Mensagem */}
                  <p className="text-textSecondary mb-4 leading-relaxed">
                    {request.description || request.title}
                  </p>

                  {/* Botão Conversar */}
                  <Button
                    onClick={() => navigate(`/direct-chat/${request.user_id}`)}
                    className="w-full rounded-full bg-primary hover:bg-primary-hover text-white font-bold"
                  >
                    <MessageCircle size={18} className="mr-2" />
                    Conversar pelo Chat
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-6 text-center border-2 border-primary/20">
          <h3 className="text-lg font-heading font-bold text-textPrimary mb-2">
            🌟 Você é um profissional?
          </h3>
          <p className="text-textSecondary mb-4 text-sm">
            Cadastre-se como voluntário para oferecer ajuda especializada.
          </p>
          <Button
            onClick={() => navigate('/volunteer-register')}
            className="rounded-full px-6 font-bold bg-primary hover:bg-primary-hover"
          >
            Cadastrar como Voluntário
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
