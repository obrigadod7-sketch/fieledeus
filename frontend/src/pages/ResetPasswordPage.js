import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, KeyRound, Loader2, MailCheck } from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;
const input = 'w-full rounded-xl border border-[#D9D1C6] px-4 py-3 text-[15px] focus:border-[#2A9D8F] focus:outline-none';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const post = async (path, body) => {
    const res = await fetch(`${API}/api/auth/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Verifique os dados');
    return data;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (token && password !== confirm) return toast.error('As senhas não coincidem');
    setBusy(true);
    try {
      if (token) {
        await post('reset-password', { token, password });
        toast.success('Senha alterada! Faça login.');
        navigate('/auth');
      } else {
        await post('forgot-password', { email });
        setSent(true);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FDFBF7] p-4" data-testid="reset-password-page">
      <form onSubmit={submit} className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-lg">
        <button type="button" onClick={() => navigate('/auth')} className="absolute left-4 top-4 rounded-full p-2 hover:bg-[#F7F4EE]" data-testid="reset-back-btn"><ArrowLeft size={20} /></button>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#E9F5F3]">
          {sent ? <MailCheck className="text-[#2A9D8F]" /> : <KeyRound className="text-[#2A9D8F]" />}
        </div>
        <h1 className="mb-2 text-center text-2xl font-bold text-[#2C221E]">{token ? 'Criar nova senha' : 'Recuperar senha'}</h1>
        {sent ? (
          <p className="text-center text-[#5C524B]" data-testid="reset-sent-msg">Se o e-mail estiver cadastrado, você vai receber um link para criar uma nova senha. O link vale por 1 hora.</p>
        ) : (
          <div className="mt-5 space-y-4">
            {token ? (
              <>
                <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nova senha (mín. 6 caracteres)" className={input} data-testid="reset-password-input" />
                <input type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repita a nova senha" className={input} data-testid="reset-confirm-input" />
              </>
            ) : (
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Seu e-mail" className={input} data-testid="forgot-email-input" />
            )}
            <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#264653] py-3 font-semibold text-white disabled:opacity-60" data-testid="reset-submit-btn">
              {busy && <Loader2 size={18} className="animate-spin" />}{token ? 'Salvar nova senha' : 'Enviar link'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
