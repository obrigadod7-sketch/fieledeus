import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { Mail, Lock, User, ArrowRight, Send } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export default function AuthPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('migrant');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [location, setLocation] = useState(null);
  const [locationAddress, setLocationAddress] = useState('');
  const [showLocation, setShowLocation] = useState(false);
  const [professionalArea, setProfessionalArea] = useState('');
  const [specialties, setSpecialties] = useState('');
  const [availability, setAvailability] = useState('');
  const [experience, setExperience] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin
      ? { email, password }
      : {
          email,
          password,
          name,
          role,
          languages: ['pt', 'fr'],
          ...(role === 'migrant' && { need_categories: selectedCategories }),
          ...(role === 'helper' && {
            help_categories: selectedCategories,
            location: location ? { ...location, address: locationAddress } : null,
            show_location: showLocation
          }),
          ...(role === 'volunteer' && {
            professional_area: professionalArea,
            professional_specialties: specialties.split(',').map(s => s.trim()).filter(Boolean),
            availability,
            experience
          })
        };

    const controller = new AbortController();
    const timeoutMs = 8000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        toast.success(isLogin ? 'Login bem-sucedido!' : 'Conta criada com sucesso!');
        navigate('/home');
      } else {
        toast.error(data.detail || 'Erro ao autenticar');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        toast.error('Tempo esgotado ao conectar com o servidor. Tente novamente.');
      } else {
        toast.error('Erro de conexão');
        console.error('handleSubmit error:', error);
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const toggleAuthMode = () => setIsLogin(!isLogin);

  return (
    <div className="min-h-screen flex gradient-bg">
      {/* Esquerda: imagem + boas-vindas (desktop) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-8 lg:p-12">
        <div className="max-w-md w-full text-center space-y-8">
          <img
            src="/images/login-illustration.svg"
            alt="Ilustra\u00e7\u00e3o de boas-vindas"
            className="w-full max-w-lg mx-auto animate-fade-in"
            loading="lazy"
          />
          <div>
            <h1 className="text-3xl lg:text-4xl font-heading font-bold text-textPrimary mb-2">
              {t('welcome') || 'Bem-vindo de volta'}
            </h1>
            <p className="text-lg text-textSecondary">
              {t('tagline') || 'Conectando pessoas que precisam de ajuda com quem quer ajudar.'}
            </p>
          </div>
        </div>
      </div>

      {/* Direita: formul\u00e1rio de login/cadastro */}
      <div className="flex-1 lg:w-1/2 flex items-center justify-center p-4 lg:p-0">
        <div className="w-full max-w-md space-y-6">
          {/* Cabe\u00e7alho do formul\u00e1rio */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto mb-3">
              <User size={24} />
            </div>
            <h2 className="text-2xl font-heading font-bold text-textPrimary">
              {isLogin ? (t('login') || 'Entrar') : (t('register') || 'Criar conta')}
            </h2>
            <p className="text-textMuted">
              {isLogin
                ? 'Fa\u00e7a login para acessar sua conta e continuar.'
                : 'Preencha os dados abaixo para criar sua conta.'}
            </p>
          </div>

          {/* Formul\u00e1rio */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-textPrimary">
                    {t('name') || 'Nome completo'}
                  </Label>
                  <Input
                    id="name"
                    placeholder="Jo\u00e3o Silva"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="text-sm"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-textPrimary">
                {t('email') || 'E-mail'}
              </Label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-3 text-textMuted" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-textPrimary">
                {t('password') || 'Senha'}
              </Label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-3 text-textMuted" />
                <Input
                  id="password"
                  type="password"
                  placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pl-10 text-sm"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-lg font-semibold rounded-xl shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Send size={18} className="animate-spin" />
                  {t('loggingIn') || 'Entrando...'}
                </>
              ) : (
                <>
                  <ArrowRight size={18} />
                  {isLogin ? (t('login') || 'Entrar') : (t('register') || 'Criar conta')}
                </>
              )}
            </Button>
          </form>

          {/* Rodap\u00e9: alternar entre login e cadastro */}
          <div className="text-center mt-6">
            <p className="text-sm text-textMuted">
              {isLogin
                ? t('noAccount') || 'Não tem conta? Cadastre-se'
                : t('hasAccount') || 'Já tem conta? Entre'}
            </p>
            <button
              onClick={toggleAuthMode}
              className="text-primary font-medium text-sm hover:underline"
            >
              {isLogin ? (t('register') || 'Cadastre-se') : (t('login') || 'Entrar')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
