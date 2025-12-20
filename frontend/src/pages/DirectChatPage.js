import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { ArrowLeft, Send, User, MapPin, Image as ImageIcon, Video, Paperclip, Lock, Phone, MessageCircle, Clock, CheckCheck, Check, MoreVertical, Info, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import MapPreview from '../components/MapPreview';

const CATEGORY_INFO = {
  food: { icon: '🍽️', label: 'Alimentação', color: 'bg-green-100 text-green-700' },
  legal: { icon: '⚖️', label: 'Jurídico', color: 'bg-blue-100 text-blue-700' },
  health: { icon: '🏥', label: 'Saúde', color: 'bg-red-100 text-red-700' },
  housing: { icon: '🏠', label: 'Moradia', color: 'bg-purple-100 text-purple-700' },
  work: { icon: '💼', label: 'Emprego', color: 'bg-yellow-100 text-yellow-700' },
  education: { icon: '📚', label: 'Educação', color: 'bg-indigo-100 text-indigo-700' },
  social: { icon: '🤝', label: 'Social', color: 'bg-pink-100 text-pink-700' },
  clothes: { icon: '👕', label: 'Roupas', color: 'bg-orange-100 text-orange-700' },
  furniture: { icon: '🪑', label: 'Móveis', color: 'bg-teal-100 text-teal-700' },
  transport: { icon: '🚗', label: 'Transporte', color: 'bg-cyan-100 text-cyan-700' }
};

export default function DirectChatPage() {
  const { userId } = useParams();
  const { user: currentUser, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [canChat, setCanChat] = useState(true);
  const [chatRestrictionReason, setChatRestrictionReason] = useState('');
  const messagesEndRef = useRef(null);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [userPosts, setUserPosts] = useState([]);
  const [showUserInfo, setShowUserInfo] = useState(false);

  useEffect(() => {
    fetchOtherUser();
    checkCanChat();
    fetchMessages();
    fetchUserPosts();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchOtherUser = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setOtherUser(data);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/posts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Filtrar posts do usuário com quem estamos conversando
        const posts = data.filter(p => p.user_id === userId);
        setUserPosts(posts);
      }
    } catch (error) {
      console.error('Error fetching user posts:', error);
    }
  };

  const checkCanChat = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/can-chat/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCanChat(data.can_chat);
        if (!data.can_chat) {
          setChatRestrictionReason(data.reason);
        }
      }
    } catch (error) {
      console.error('Error checking chat permission:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/messages/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (messageData = {}) => {
    if (!input.trim() && !messageData.location && !messageData.media) return;

    setSending(true);
    try {
      const payload = {
        to_user_id: userId,
        message: input || (messageData.location ? '📍 Localização compartilhada' : '📎 Mídia compartilhada'),
        ...messageData
      };

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setInput('');
        setShowMediaOptions(false);
        fetchMessages();
      } else {
        toast.error('Erro ao enviar mensagem');
      }
    } catch (error) {
      toast.error('Erro de conexão');
    } finally {
      setSending(false);
    }
  };

  const sendLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          sendMessage({
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          });
          toast.success('Localização enviada!');
        },
        () => toast.error('Erro ao obter localização')
      );
    }
  };

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10000000) {
        toast.error('Arquivo muito grande! Máximo 10MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        sendMessage({
          media: [reader.result],
          media_type: type
        });
        toast.success(`${type === 'image' ? 'Foto' : 'Vídeo'} enviado!`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getRoleLabel = (role) => {
    switch(role) {
      case 'volunteer': return '🤝 Voluntário';
      case 'migrant': return '🌍 Migrante';
      case 'helper': return '💪 Ajudante';
      case 'admin': return '👑 Admin';
      default: return role;
    }
  };

  const getCategoryInfo = (cat) => {
    return CATEGORY_INFO[cat] || { icon: '📝', label: cat, color: 'bg-gray-100 text-gray-700' };
  };

  // Agrupar mensagens por data
  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach(msg => {
      const date = new Date(msg.created_at).toLocaleDateString('pt-BR');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-blue-50 to-gray-50" data-testid="direct-chat-page">
      {/* Header melhorado */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0 z-10 shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/home')}
                className="p-2 hover:bg-white/20 rounded-full transition-all"
                data-testid="back-button"
              >
                <ArrowLeft size={24} />
              </button>
              {otherUser && (
                <div 
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => setShowUserInfo(!showUserInfo)}
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/50">
                      <User size={24} className="text-white" />
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                  </div>
                  <div>
                    <h1 className="text-lg font-bold" data-testid="other-user-name">
                      {otherUser.name}
                    </h1>
                    <p className="text-sm text-white/80">{getRoleLabel(otherUser.role)}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowUserInfo(!showUserInfo)}
                className="p-2 hover:bg-white/20 rounded-full transition-all"
              >
                <Info size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Painel de informações do usuário */}
      {showUserInfo && otherUser && (
        <div className="bg-white border-b shadow-sm animate-fade-in">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col gap-4">
              {/* Info básica */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <User size={32} className="text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-gray-800">{otherUser.name}</h2>
                  <p className="text-sm text-gray-500">{getRoleLabel(otherUser.role)}</p>
                  {otherUser.professional_area && (
                    <p className="text-sm text-blue-600">💼 {otherUser.professional_area}</p>
                  )}
                </div>
              </div>

              {/* Categorias de ajuda (se voluntário/helper) */}
              {otherUser.help_categories && otherUser.help_categories.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Oferece ajuda em:</p>
                  <div className="flex flex-wrap gap-2">
                    {otherUser.help_categories.map(cat => {
                      const info = getCategoryInfo(cat);
                      return (
                        <span key={cat} className={`px-3 py-1 rounded-full text-xs font-medium ${info.color}`}>
                          {info.icon} {info.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Posts/Solicitações do usuário */}
              {userPosts.length > 0 && (
                <div className="border-t pt-3">
                  <p className="text-xs text-gray-500 mb-2">
                    {otherUser.role === 'migrant' ? '📋 Solicitações de ajuda:' : '📋 Ofertas de ajuda:'}
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {userPosts.slice(0, 3).map(post => {
                      const catInfo = getCategoryInfo(post.category);
                      return (
                        <div key={post.id} className="p-3 bg-gray-50 rounded-xl border">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${catInfo.color}`}>
                              {catInfo.icon} {catInfo.label}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${post.type === 'need' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                              {post.type === 'need' ? 'Precisa' : 'Oferece'}
                            </span>
                          </div>
                          <p className="font-medium text-sm text-gray-800">{post.title}</p>
                          <p className="text-xs text-gray-500 line-clamp-2">{post.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Área de mensagens */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        <div className="max-w-3xl mx-auto space-y-4">
          {!canChat ? (
            <div className="text-center py-12" data-testid="chat-restricted">
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 max-w-md mx-auto">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock size={32} className="text-yellow-600" />
                </div>
                <h3 className="text-lg font-bold text-yellow-800 mb-2">Chat Restrito</h3>
                <p className="text-yellow-700 text-sm mb-4">
                  Você não pode conversar com este usuário porque não se comprometeu a ajudar nas categorias de necessidades que ele postou.
                </p>
                <p className="text-yellow-600 text-xs">
                  Para conversar, atualize seu perfil e adicione mais categorias de ajuda.
                </p>
                <Button
                  onClick={() => navigate('/profile')}
                  className="mt-4 rounded-full bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  Atualizar Perfil
                </Button>
              </div>
            </div>
          ) : loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Carregando mensagens...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12" data-testid="no-messages">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle size={40} className="text-blue-500" />
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Iniciar Conversa</h3>
              <p className="text-gray-500 mb-4">
                {otherUser?.role === 'migrant' 
                  ? 'Apresente-se e ofereça sua ajuda!'
                  : 'Descreva como você precisa de ajuda'
                }
              </p>
              {userPosts.length > 0 && userPosts[0].type === 'need' && (
                <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 max-w-md mx-auto text-left">
                  <p className="text-xs text-green-600 font-bold mb-2">📋 SOLICITAÇÃO DE AJUDA:</p>
                  <p className="font-bold text-green-800">{userPosts[0].title}</p>
                  <p className="text-sm text-green-700 mt-1">{userPosts[0].description}</p>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Mostrar solicitação original no topo se for conversa sobre ajuda */}
              {userPosts.length > 0 && userPosts[0].type === 'need' && messages.length < 5 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-4 mb-4">
                  <p className="text-xs text-green-600 font-bold mb-2 flex items-center gap-1">
                    <Info size={14} />
                    CONTEXTO DA CONVERSA - SOLICITAÇÃO DE AJUDA:
                  </p>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <User size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-green-800">{userPosts[0].title}</p>
                      <p className="text-sm text-green-700 mt-1">{userPosts[0].description}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(userPosts[0].categories || [userPosts[0].category]).map(cat => {
                          const info = getCategoryInfo(cat);
                          return (
                            <span key={cat} className={`px-2 py-1 rounded-full text-xs ${info.color}`}>
                              {info.icon} {info.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Mensagens agrupadas por data */}
              {Object.entries(messageGroups).map(([date, msgs]) => (
                <div key={date}>
                  {/* Separador de data */}
                  <div className="flex items-center justify-center my-4">
                    <div className="bg-gray-200 text-gray-600 text-xs px-4 py-1 rounded-full">
                      {date === new Date().toLocaleDateString('pt-BR') ? 'Hoje' : date}
                    </div>
                  </div>

                  {/* Mensagens do dia */}
                  {msgs.map((msg, idx) => {
                    const isCurrentUser = msg.from_user_id === currentUser.id;
                    return (
                      <div 
                        key={idx}
                        data-testid={`message-${isCurrentUser ? 'sent' : 'received'}`}
                        className={`flex gap-2 mb-3 animate-fade-in ${
                          isCurrentUser ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {!isCurrentUser && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                            <User size={16} className="text-white" />
                          </div>
                        )}
                        <div className={`max-w-[75%] ${
                          isCurrentUser 
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl rounded-br-md' 
                            : 'bg-white text-gray-800 rounded-2xl rounded-bl-md shadow-sm border'
                        }`}>
                          <div className="px-4 py-3">
                            {/* Localização */}
                            {msg.location && (
                              <div className={`mb-2 p-2 rounded-xl ${isCurrentUser ? 'bg-white/20' : 'bg-blue-50'}`}>
                                <MapPreview location={msg.location} size="small" />
                              </div>
                            )}
                            
                            {/* Mídia */}
                            {msg.media && msg.media.length > 0 && (
                              <div className="mb-2">
                                {msg.media_type === 'image' ? (
                                  <img 
                                    src={msg.media[0]} 
                                    alt="" 
                                    className="rounded-xl max-w-full max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => window.open(msg.media[0], '_blank')}
                                  />
                                ) : (
                                  <video src={msg.media[0]} controls className="rounded-xl max-w-full max-h-64" />
                                )}
                              </div>
                            )}
                            
                            {/* Texto da mensagem */}
                            <p className="leading-relaxed whitespace-pre-wrap text-sm">{msg.message}</p>
                            
                            {/* Hora e status */}
                            <div className={`flex items-center justify-end gap-1 mt-1 ${isCurrentUser ? 'text-white/70' : 'text-gray-400'}`}>
                              <span className="text-xs">
                                {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isCurrentUser && (
                                <CheckCheck size={14} className="text-white/70" />
                              )}
                            </div>
                          </div>
                        </div>
                        {isCurrentUser && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0 mt-1">
                            <User size={16} className="text-white" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Área de input melhorada */}
      {canChat && (
        <div className="border-t bg-white p-3 shadow-lg">
          <div className="max-w-3xl mx-auto">
            {showMediaOptions && (
              <div className="flex gap-2 mb-3 p-3 bg-gray-50 rounded-2xl animate-fade-in">
                <Button
                  data-testid="send-location-button"
                  onClick={sendLocation}
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl hover:bg-blue-50 hover:border-blue-300"
                >
                  <MapPin size={18} className="mr-2 text-blue-500" />
                  Localização
                </Button>
                <Button
                  data-testid="send-image-button"
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl hover:bg-green-50 hover:border-green-300"
                >
                  <ImageIcon size={18} className="mr-2 text-green-500" />
                  Foto
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'image')}
                  className="hidden"
                />
                <Button
                  data-testid="send-video-button"
                  onClick={() => videoInputRef.current?.click()}
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-xl hover:bg-purple-50 hover:border-purple-300"
                >
                  <Video size={18} className="mr-2 text-purple-500" />
                  Vídeo
                </Button>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleFileUpload(e, 'video')}
                  className="hidden"
                />
              </div>
            )}
            <div className="flex gap-2 items-end">
              <Button
                data-testid="toggle-media-button"
                onClick={() => setShowMediaOptions(!showMediaOptions)}
                variant="outline"
                className={`rounded-full w-11 h-11 p-0 flex-shrink-0 transition-all ${showMediaOptions ? 'bg-blue-100 border-blue-300' : ''}`}
              >
                <Paperclip size={20} className={showMediaOptions ? 'text-blue-600' : ''} />
              </Button>
              <div className="flex-1 relative">
                <Textarea
                  data-testid="message-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua mensagem..."
                  rows={1}
                  className="rounded-2xl resize-none pr-12 min-h-[44px] max-h-32"
                />
              </div>
              <Button
                data-testid="send-message-button"
                onClick={() => sendMessage()}
                disabled={sending || !input.trim()}
                className="rounded-full w-11 h-11 p-0 bg-blue-600 hover:bg-blue-700 flex-shrink-0 disabled:opacity-50"
              >
                {sending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send size={20} />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
