import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import BottomNav from '../components/BottomNav';
import { MessageCircle, Plus, Check, Settings } from 'lucide-react';
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
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [userCategories, setUserCategories] = useState([]);
  const [helpRequests, setHelpRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Carregar categorias do perfil do usuário ao montar
  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Buscar solicitações quando as categorias do usuário forem carregadas
  useEffect(() => {
    if (userCategories.length > 0) {
      fetchHelpRequests();
    } else {
      setLoading(false);
    }
  }, [userCategories]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Pegar as categorias que o usuário escolheu no cadastro
        const categories = data.help_categories || [];
        setUserCategories(categories);
        
        // Se não tem categorias, mostrar modal para selecionar
        if (categories.length === 0) {
          setShowModal(true);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchHelpRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/posts?type=need`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Filtrar posts que correspondem às categorias do usuário
        const filtered = data.filter(post => {
          const postCategories = post.categories || [post.category];
          return postCategories.some(cat => userCategories.includes(cat));
        });
        setHelpRequests(filtered);
      }
    } catch (error) {
      console.error('Error fetching help requests:', error);
    } finally {
      setLoading(false);
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-heading font-bold mb-1">🤝 Quero Ajudar</h1>
              <p className="text-sm text-white/90">Pessoas que precisam da sua ajuda</p>
            </div>
            {/* Botão para editar categorias */}
            <Button
              onClick={() => navigate('/profile')}
              variant="outline"
              size="sm"
              className="rounded-full bg-white/20 border-white/30 text-white hover:bg-white/30"
            >
              <Settings size={16} className="mr-1" />
              Editar
            </Button>
          </div>
          
          {/* Mostrar categorias do usuário */}
          {userCategories.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs text-white/70">Você ajuda em:</span>
              {userCategories.map(cat => (
                <span 
                  key={cat}
                  className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium flex items-center gap-1"
                >
                  {getCategoryInfo(cat).icon} {getCategoryInfo(cat).label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal para usuários sem categorias */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="rounded-3xl max-w-lg mx-4">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-2xl font-heading flex items-center gap-2">
              🤝 Configure suas categorias
            </DialogTitle>
            <p className="text-sm text-textSecondary mt-2">
              Você ainda não escolheu em quais categorias quer ajudar. 
              Acesse seu perfil para selecionar.
            </p>
          </DialogHeader>

          <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>💡 Dica:</strong> No seu perfil você pode escolher categorias como Alimentação, Moradia, Transporte, etc.
            </p>
          </div>

          <Button
            onClick={() => {
              setShowModal(false);
              navigate('/profile');
            }}
            className="w-full rounded-full bg-primary hover:bg-primary-hover"
          >
            <Settings size={18} className="mr-2" />
            Ir para o Perfil
          </Button>

          <Button
            onClick={() => setShowModal(false)}
            variant="outline"
            className="w-full rounded-full mt-2"
          >
            Ver todas as solicitações mesmo assim
          </Button>
        </DialogContent>
      </Dialog>

      {/* Conteúdo Principal */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        
        {/* Lista de solicitações */}
        {loading ? (
          <div className="text-center py-12 text-textMuted">Carregando solicitações...</div>
        ) : userCategories.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚙️</div>
            <h3 className="text-xl font-bold text-textPrimary mb-2">Configure suas categorias</h3>
            <p className="text-textMuted mb-6">
              Para ver solicitações de ajuda, primeiro escolha em quais categorias você quer ajudar.
            </p>
            <Button
              onClick={() => navigate('/profile')}
              className="rounded-full bg-primary text-white font-bold px-8"
            >
              <Settings size={18} className="mr-2" />
              Configurar no Perfil
            </Button>
          </div>
        ) : helpRequests.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✨</div>
            <h3 className="text-xl font-bold text-textPrimary mb-2">Nenhuma solicitação no momento</h3>
            <p className="text-textMuted">
              Não há pessoas precisando de ajuda nas suas categorias agora. Volte mais tarde!
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
