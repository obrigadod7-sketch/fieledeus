import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HandHeart, HeartHandshake, Globe, Shield, Award, Users } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function LandingPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const languages = [
    { code: 'pt', label: 'PT' },
    { code: 'fr', label: 'FR' },
    { code: 'en', label: 'EN' },
    { code: 'es', label: 'ES' }
  ];

  return (
    <div className="min-h-screen gradient-bg">
      <div className="absolute top-6 right-6 flex gap-2" data-testid="language-selector">
        {languages.map(lang => (
          <button
            key={lang.code}
            data-testid={`lang-${lang.code}`}
            onClick={() => i18n.changeLanguage(lang.code)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
              i18n.language === lang.code
                ? 'bg-primary text-white'
                : 'bg-white/70 text-gray-700 hover:bg-white'
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>

      <div className="container mx-auto px-4 pt-20 pb-12">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <div className="flex justify-center mb-8">
            <div className="p-6 bg-white/80 backdrop-blur-sm rounded-3xl shadow-card">
              <Globe size={64} className="text-primary" />
            </div>
          </div>

          <h1 
            className="text-5xl md:text-7xl font-heading font-bold text-textPrimary mb-6"
            data-testid="landing-title"
          >
            {t('welcome')}
          </h1>
          
          <p className="text-xl md:text-2xl text-textSecondary mb-12 max-w-2xl mx-auto leading-relaxed">
            {t('tagline')}
          </p>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div 
              className="bg-white rounded-3xl p-8 shadow-card card-hover cursor-pointer"
              onClick={() => navigate('/auth?role=migrant')}
              data-testid="need-help-card"
            >
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-green-100 rounded-2xl">
                  <HandHeart size={48} className="text-green-600" />
                </div>
              </div>
              <h2 className="text-2xl font-heading font-bold text-textPrimary mb-3">
                {t('needHelp')}
              </h2>
              <p className="text-textSecondary">
                {t('needHelpDesc')}
              </p>
            </div>

            <div 
              className="bg-white rounded-3xl p-8 shadow-card card-hover cursor-pointer"
              onClick={() => navigate('/auth?role=helper')}
              data-testid="want-to-help-card"
            >
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-orange-100 rounded-2xl">
                  <HeartHandshake size={48} className="text-primary" />
                </div>
              </div>
              <h2 className="text-2xl font-heading font-bold text-textPrimary mb-3">
                {t('wantToHelp')}
              </h2>
              <p className="text-textSecondary">
                {t('wantToHelpDesc')}
              </p>
            </div>
          </div>

          <div className="mt-12">
            <p className="text-textMuted mb-4">{t('alreadyAccount')}</p>
            <Button 
              data-testid="login-button"
              onClick={() => navigate('/auth')}
              variant="outline"
              className="rounded-full px-8 py-6 text-lg"
            >
              {t('login')}
            </Button>
          </div>
        </div>
      </div>

      {/* Seção para Voluntários Profissionais */}
      <div className="bg-gradient-to-br from-primary/10 to-secondary/10 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-primary/20 px-4 py-2 rounded-full mb-4">
                <Shield size={20} className="text-primary" />
                <span className="text-primary font-medium">{t('forProfessionals')}</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-textPrimary mb-4">
                {t('volunteerTitle')}
              </h2>
              <p className="text-lg text-textSecondary max-w-2xl mx-auto">
                {t('volunteerDesc')}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-10">
              <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Award size={28} className="text-blue-600" />
                </div>
                <h3 className="font-bold text-textPrimary mb-2">{t('verifiedProfile')}</h3>
                <p className="text-sm text-textSecondary">
                  {t('verifiedDesc')}
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users size={28} className="text-green-600" />
                </div>
                <h3 className="font-bold text-textPrimary mb-2">{t('targetedConnections')}</h3>
                <p className="text-sm text-textSecondary">
                  {t('targetedDesc')}
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
                <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <HeartHandshake size={28} className="text-purple-600" />
                </div>
                <h3 className="font-bold text-textPrimary mb-2">{t('impactMeasure')}</h3>
                <p className="text-sm text-textSecondary">
                  {t('impactDesc')}
                </p>
              </div>
            </div>

            <div className="text-center">
              <Button
                data-testid="volunteer-register-button"
                onClick={() => navigate('/volunteer-register')}
                className="rounded-full px-10 py-6 text-lg font-bold bg-primary hover:bg-primary-hover shadow-lg"
              >
                <Shield size={24} className="mr-2" />
                {t('registerVolunteer')}
              </Button>
              <p className="text-sm text-textMuted mt-4">
                Cadastro completo com validação de credenciais profissionais
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-textMuted text-sm">
            © 2025 Watizat - Plataforma de apoio a migrantes
          </p>
        </div>
      </div>
    </div>
  );
}
