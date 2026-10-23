import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { AuthContext } from '../App';
import { CATEGORIES } from '../components/feed/feedConfig';
import { apiError } from '../lib/apiError';

const API = process.env.REACT_APP_BACKEND_URL;
const input = 'w-full rounded-xl border border-[#D9D1C6] bg-white px-4 py-3 text-[15px] focus:border-[#2A9D8F] focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20';

const Text = ({ label, required, ...props }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-semibold text-[#2C221E]">{required && <span className="text-[#E63946]">* </span>}{label}</span>
    <input className={input} {...props} />
  </label>
);

export default function AssociationRegisterPage() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ organization: '', responsible_name: '', email: '', password: '', phone: '', website: '', registration_number: '', address: '', city: '', description: '', help_categories: [] });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const toggle = (c) => setF((p) => ({ ...p, help_categories: p.help_categories.includes(c) ? p.help_categories.filter((x) => x !== c) : [...p.help_categories, c] }));

  const submit = async (e) => {
    e.preventDefault();
    if (f.password.length < 6) return toast.error('A senha deve ter pelo menos 6 caracteres');
    if (!f.help_categories.length) return toast.error('Escolha pelo menos uma área de atuação');
    setBusy(true);
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, name: f.organization, role: 'association', languages: ['pt', 'fr'] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(apiError(data.detail));
      login(data.token, data.user);
      toast.success('Associação cadastrada com sucesso!');
      navigate('/home');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] px-4 py-6" data-testid="association-register-page">
      <div className="mx-auto max-w-2xl">
        <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2 font-medium text-[#1F7A6F]" data-testid="association-back-btn"><ArrowLeft size={20} /> Voltar</button>
        <form onSubmit={submit} className="space-y-5 rounded-3xl bg-white p-6 shadow-lg sm:p-10">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E9F5F3]"><Building2 className="text-[#2A9D8F]" /></div>
            <h1 className="text-3xl font-bold text-[#2C221E]">Cadastrar associação</h1>
            <p className="mt-1 text-[#5C524B]">Sua associação aparece na hora para migrantes que precisam de apoio.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Text label="Nome da associação" required value={f.organization} onChange={set('organization')} data-testid="assoc-name-input" />
            <Text label="Nome do responsável" required value={f.responsible_name} onChange={set('responsible_name')} data-testid="assoc-responsible-input" />
            <Text label="E-mail" type="email" required value={f.email} onChange={set('email')} data-testid="assoc-email-input" />
            <Text label="Senha" type="password" required minLength={6} value={f.password} onChange={set('password')} placeholder="Mínimo 6 caracteres" data-testid="assoc-password-input" />
            <Text label="Telefone" value={f.phone} onChange={set('phone')} placeholder="+33 6 12 34 56 78" data-testid="assoc-phone-input" />
            <Text label="Site ou rede social" value={f.website} onChange={set('website')} placeholder="https://" data-testid="assoc-website-input" />
            <Text label="Endereço" value={f.address} onChange={set('address')} data-testid="assoc-address-input" />
            <Text label="Cidade" required value={f.city} onChange={set('city')} data-testid="assoc-city-input" />
            <Text label="Nº de registro (SIRET / RNA / CNPJ)" value={f.registration_number} onChange={set('registration_number')} data-testid="assoc-registration-input" />
          </div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-[#2C221E]">O que a associação faz</span>
            <textarea rows={4} value={f.description} onChange={set('description')} maxLength={1000} className={`${input} resize-none`} placeholder="Ex.: distribuição de alimentos às terças, orientação jurídica gratuita…" data-testid="assoc-description-input" />
          </label>
          <div>
            <p className="mb-2 text-sm font-semibold text-[#2C221E]"><span className="text-[#E63946]">* </span>Áreas de atuação</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CATEGORIES.map(({ value, label, icon: Icon }) => {
                const on = f.help_categories.includes(value);
                return (
                  <button type="button" key={value} onClick={() => toggle(value)} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${on ? 'border-[#2A9D8F] bg-[#2A9D8F] text-white' : 'border-[#D9D1C6] bg-white text-[#2C221E] hover:border-[#2A9D8F]'}`} data-testid={`assoc-category-${value}`}>
                    {on ? <Check size={15} /> : <Icon size={15} />} {label}
                  </button>
                );
              })}
            </div>
          </div>
          <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#264653] py-3.5 font-semibold text-white hover:bg-[#1d3640] disabled:opacity-60" data-testid="assoc-submit-btn">
            {busy && <Loader2 size={18} className="animate-spin" />} Cadastrar associação
          </button>
        </form>
      </div>
    </div>
  );
}
